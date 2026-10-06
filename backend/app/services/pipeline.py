"""The hiring pipeline: moving candidates through rounds, inviting them, closing and evaluating rounds."""

import random
import secrets
from datetime import datetime, timedelta, timezone

from flask import current_app

from ..errors import ApiError
from ..extensions import db
from ..models import Candidate, Question, Round, Stage, utcnow
from . import grading, llm, mailer, proctoring


def parse_dt(value):
    """Parse an ISO datetime string into naive UTC (None passes through)."""
    if not value:
        return None
    if isinstance(value, datetime):
        dt = value
    else:
        try:
            dt = datetime.fromisoformat(str(value).replace("Z", "+00:00"))
        except ValueError:
            raise ApiError(f"Invalid date/time '{value}'")
    if dt.tzinfo:
        dt = dt.astimezone(timezone.utc).replace(tzinfo=None)
    return dt


def fmt_dt(dt):
    return dt.strftime("%d %b %Y, %H:%M UTC") if dt else "-"


def next_round(round_):
    rounds = round_.drive.rounds
    idx = rounds.index(round_)
    return rounds[idx + 1] if idx + 1 < len(rounds) else None


def ensure_stage(candidate, round_):
    stage = Stage.query.filter_by(candidate_id=candidate.id, round_id=round_.id).first()
    if not stage:
        stage = Stage(candidate_id=candidate.id, round_id=round_.id, status="pending", answers={}, assignment=[])
        db.session.add(stage)
        db.session.flush()
    return stage


def enter_pipeline(candidate, drive):
    if not drive.rounds:
        return None
    first = drive.rounds[0]
    candidate.current_round_id = first.id
    return ensure_stage(candidate, first)


# ---------------------------------------------------------------- invitations


def invite_link(stage):
    return f"{current_app.config['FRONTEND_URL']}/assess/{stage.token}"


def _context(stage):
    cand, round_ = stage.candidate, stage.round
    drive = round_.drive
    config = round_.config or {}
    return {
        "name": cand.name,
        "email": cand.email,
        "company": drive.company.name,
        "drive": drive.title,
        "round": round_.name,
        "duration": config.get("duration_minutes", ""),
        "deadline": fmt_dt(stage.token_expires_at),
        "link": invite_link(stage) if stage.token else "",
        "scheduled_at": fmt_dt(stage.scheduled_at),
        "meeting_link": stage.meeting_link or "",
    }


def invite(round_, stages, resend=False):
    """Issue personal links and queue invitation emails. Returns (invited, skipped[])."""
    if not round_.is_assessment:
        raise ApiError("Resume screening doesn't need invitations; run the screening instead")
    config = round_.config or {}
    live = round_.type == "interview" and config.get("mode") == "live"
    if not live and not round_.questions and not (round_.type == "interview" and llm.available() and config.get("personalized")):
        raise ApiError(f"Add questions to '{round_.name}' before inviting candidates")
    window_end = parse_dt(config.get("window_end"))
    if window_end and window_end <= utcnow():
        raise ApiError("This round's test window has already ended. Update the window in the round settings.")

    invited, skipped, emails = 0, [], []
    for stage in stages:
        cand = stage.candidate
        allowed = ("pending",) if not resend else ("pending", "invited", "expired")
        if cand.status != "active" or stage.status not in allowed:
            skipped.append({"candidate_id": cand.id, "email": cand.email, "reason": f"status is {stage.status}"})
            continue
        if live and not stage.scheduled_at:
            skipped.append({"candidate_id": cand.id, "email": cand.email, "reason": "no interview slot scheduled"})
            continue
        if not stage.token or resend:
            stage.token = secrets.token_urlsafe(24)
        expires = utcnow() + timedelta(hours=float(config.get("link_valid_hours", 72)))
        stage.token_expires_at = min(expires, window_end) if window_end else expires
        stage.status = "invited"
        stage.invited_at = utcnow()
        stage.invite_count = (stage.invite_count or 0) + 1
        subject, body = mailer.build_email(config.get("email_subject"), config.get("email_body"), _context(stage))
        emails.append(
            mailer.queue(cand.email, subject, body, "invite", round_.drive_id, cand.id, stage.id)
        )
        invited += 1
    db.session.commit()
    mailer.dispatch(emails)
    return invited, skipped


def send_custom(drive, candidates, subject_tpl, body_tpl, kind="custom"):
    emails = []
    for cand in candidates:
        ctx = {
            "name": cand.name,
            "email": cand.email,
            "company": drive.company.name,
            "drive": drive.title,
            "round": "",
            "status": cand.status,
        }
        subject, body = mailer.build_email(subject_tpl, body_tpl, ctx)
        emails.append(mailer.queue(cand.email, subject, body, kind, drive.id, cand.id))
    db.session.commit()
    mailer.dispatch(emails)
    return len(emails)


# ---------------------------------------------------------------- taking a test


def validate_token(token):
    stage = Stage.query.filter_by(token=token).first() if token else None
    if not stage:
        raise ApiError("This test link is invalid. Please use the latest link from your email.", 404)
    return stage


def build_assignment(stage):
    """Choose and order the questions this candidate gets (different order for each candidate)."""
    round_ = stage.round
    config = round_.config or {}
    rng = random.Random(secrets.randbits(64))
    items = []
    if round_.type == "interview" and config.get("personalized") and llm.available():
        count = int(config.get("num_questions") or 5)
        generated = llm.generate_interview_questions(
            f"{round_.drive.title}\n{round_.drive.description}", stage.candidate.resume_text, count
        )
        items = [{"key": f"g{i}", "text": g["text"], "reference": g["reference"], "marks": 10}
                 for i, g in enumerate(generated)]
    if not items:
        questions = list(round_.questions)
        if config.get("shuffle_questions", True):
            rng.shuffle(questions)
        n = int(config.get("num_questions") or 0)
        if n:
            questions = questions[:n]
        for q in questions:
            item = {"key": f"q{q.id}", "qid": q.id}
            if q.kind == "mcq":
                order = list(range(len(q.options or [])))
                if config.get("shuffle_options", True):
                    rng.shuffle(order)
                item["order"] = order
            items.append(item)
    if not items:
        raise ApiError("This test has no questions yet. Please contact the hiring team.", 409)
    return items


def public_questions(stage):
    """Questions as the candidate sees them: no answers, no hidden test cases, options in shuffled order."""
    ids = [i["qid"] for i in stage.assignment or [] if i.get("qid")]
    questions = {q.id: q for q in Question.query.filter(Question.id.in_(ids)).all()} if ids else {}
    out = []
    for idx, item in enumerate(stage.assignment or []):
        q = questions.get(item.get("qid"))
        if item.get("qid") and not q:
            continue
        entry = {"key": item["key"], "number": idx + 1}
        if not q:  # generated interview question
            entry.update({"kind": "interview", "text": item["text"], "marks": item.get("marks", 10)})
        elif q.kind == "mcq":
            entry.update({"kind": "mcq", "text": q.text, "marks": q.marks, "topic": q.topic,
                          "options": [q.options[i] for i in item.get("order") or range(len(q.options))]})
        elif q.kind == "coding":
            meta = q.meta or {}
            allowed = (stage.round.config or {}).get("languages") or []
            entry.update({
                "kind": "coding",
                "title": meta.get("title") or f"Problem {idx + 1}",
                "text": q.text,
                "marks": q.marks,
                "difficulty": q.difficulty,
                "time_limit_sec": meta.get("time_limit_sec", 2),
                "starter_code": {k: v for k, v in (meta.get("starter_code") or {}).items() if k in allowed},
                "samples": [{"input": t.get("input", ""), "output": t.get("output", "")}
                            for t in meta.get("test_cases") or [] if not t.get("hidden")],
                "hidden_tests": sum(1 for t in meta.get("test_cases") or [] if t.get("hidden")),
            })
        else:
            entry.update({"kind": "interview", "text": q.text, "marks": q.marks})
        out.append(entry)
    return out


def finalize(stage, reason="submitted"):
    """Close an in-progress attempt and grade it. Idempotent."""
    if stage.status != "in_progress":
        return stage
    stage.submitted_at = utcnow()
    if reason == "terminated":
        stage.terminated = True
        stage.termination_reason = stage.termination_reason or "Too many proctoring violations"
        proctoring.record(stage, "terminated", stage.termination_reason)
    else:
        proctoring.record(stage, "auto_submitted" if reason == "timeout" else "submitted",
                          "Time is up" if reason == "timeout" else "")
    grading.grade(stage)
    stage.status = "submitted"
    db.session.flush()
    return stage


def sweep(round_):
    """Auto-submit attempts whose time ran out and expire unused links."""
    now = utcnow()
    grace = timedelta(seconds=current_app.config["SUBMIT_GRACE_SECONDS"])
    changed = False
    for stage in round_.stages.filter(Stage.status == "in_progress", Stage.deadline_at < now - grace).all():
        finalize(stage, "timeout")
        changed = True
    for stage in round_.stages.filter(Stage.status == "invited", Stage.token_expires_at < now).all():
        if not (round_.type == "interview" and (round_.config or {}).get("mode") == "live"):
            stage.status = "expired"
            changed = True
    if changed:
        db.session.commit()


# ---------------------------------------------------------------- decisions


def _advance(stage):
    cand = stage.candidate
    nxt = next_round(stage.round)
    if nxt:
        ensure_stage(cand, nxt)
        cand.current_round_id = nxt.id
        cand.status = "active"
    else:
        cand.current_round_id = stage.round_id
        cand.status = "selected"
    return nxt


def decide(stage, decision, manual=True):
    """Mark a stage passed/failed and move the candidate accordingly."""
    if decision not in ("pass", "fail"):
        raise ApiError("decision must be 'pass' or 'fail'")
    if stage.status in ("in_progress",):
        raise ApiError("The candidate is still taking this test")
    cand = stage.candidate
    nxt = next_round(stage.round)
    if stage.status == "passed" and decision == "fail" and nxt:
        later = Stage.query.filter_by(candidate_id=cand.id, round_id=nxt.id).first()
        if later and later.status != "pending":
            raise ApiError("The candidate has already progressed to the next round; reject them there instead")
        if later:
            db.session.delete(later)
    if stage.status == "failed" and decision == "pass" and cand.current_round_id != stage.round_id:
        raise ApiError("The candidate is in a different round now")
    stage.decided_manually = manual
    if decision == "pass":
        stage.status = "passed"
        _advance(stage)
    else:
        stage.status = "failed"
        cand.current_round_id = stage.round_id
        cand.status = "rejected"
    db.session.flush()
    return stage


def evaluate(round_, invite_next=None):
    """Apply the round's pass rule to all completed attempts. Returns a summary."""
    sweep(round_)
    config = round_.config or {}
    mode = config.get("pass_mode", "score")
    if mode == "manual":
        raise ApiError("This round uses manual decisions. Pass or fail candidates individually.")
    done = [s for s in round_.stages.filter(Stage.status.in_(["submitted", "expired"])).all()
            if s.candidate.status == "active"]
    eligible, failed = [], []
    for s in done:
        if s.status == "expired" or s.percent is None:
            failed.append(s)
        elif s.terminated and config.get("fail_on_termination", True):
            failed.append(s)
        elif config.get("min_integrity") and (s.integrity or 0) < float(config["min_integrity"]):
            failed.append(s)
        else:
            eligible.append(s)
    if mode == "top_n":
        eligible.sort(key=lambda s: (-(s.percent or 0), -(s.integrity or 0), s.submitted_at or utcnow()))
        n = int(config.get("top_n") or 0)
        # Candidates already passed in an earlier evaluation take up seats.
        already = round_.stages.filter(Stage.status == "passed").count()
        seats = max(0, n - already)
        passed, failed = eligible[:seats], failed + eligible[seats:]
    else:
        cutoff = float(config.get("pass_score", 60))
        passed = [s for s in eligible if (s.percent or 0) >= cutoff]
        failed += [s for s in eligible if (s.percent or 0) < cutoff]
    for s in passed:
        decide(s, "pass", manual=False)
    for s in failed:
        decide(s, "fail", manual=False)
    db.session.commit()

    summary = {"passed": len(passed), "failed": len(failed), "invited_next": 0}
    nxt = next_round(round_)
    should_invite = config.get("invite_next_on_pass") if invite_next is None else invite_next
    if should_invite and nxt and passed and nxt.is_assessment:
        stages = [Stage.query.filter_by(candidate_id=s.candidate_id, round_id=nxt.id).first() for s in passed]
        try:
            summary["invited_next"], _ = invite(nxt, [st for st in stages if st])
        except ApiError as exc:  # decisions are saved; tell the recruiter why invites weren't sent
            summary["invite_error"] = exc.message
    return summary


def round_counts(round_):
    counts = {k: 0 for k in ("pending", "invited", "in_progress", "submitted", "expired", "passed", "failed")}
    rows = db.session.query(Stage.status, db.func.count(Stage.id)).filter(Stage.round_id == round_.id).group_by(Stage.status)
    for status, n in rows:
        counts[status] = n
    counts["total"] = sum(counts.values())
    return counts


def drive_stats(drive):
    statuses = dict(
        db.session.query(Candidate.status, db.func.count(Candidate.id))
        .filter(Candidate.drive_id == drive.id)
        .group_by(Candidate.status)
        .all()
    )
    return {
        "candidates": sum(statuses.values()),
        "active": statuses.get("active", 0),
        "selected": statuses.get("selected", 0),
        "rejected": statuses.get("rejected", 0),
        "rounds": {str(r.id): round_counts(r) for r in drive.rounds},
    }


def get_round(drive, round_id):
    round_ = db.session.get(Round, round_id)
    if not round_ or round_.drive_id != drive.id:
        raise ApiError("Round not found", 404)
    return round_
