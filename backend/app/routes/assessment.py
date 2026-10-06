"""Candidate-facing API. Authenticated by the personal link token plus a per-attempt session token, so one
attempt can only be active in one browser at a time."""

import hashlib
import secrets
import threading
import time
from datetime import timedelta

from flask import Blueprint, current_app, jsonify, request

from ..errors import ApiError
from ..extensions import db
from ..models import Question, iso, utcnow
from ..services import code_runner, pipeline, proctoring

bp = Blueprint("assessment", __name__, url_prefix="/api/assess")

_run_lock = threading.Lock()
_last_run = {}  # stage id -> monotonic time of the last code run
RUN_COOLDOWN_SECONDS = 3


def _hash(value):
    return hashlib.sha256(value.encode()).hexdigest()


def _client_ip():
    forwarded = request.headers.get("X-Forwarded-For", "")
    return (forwarded.split(",")[0].strip() if forwarded else request.remote_addr or "")[:64]


def _proctoring(stage):
    return (stage.round.config or {}).get("proctoring") or {}


def _remaining(stage):
    if not stage.deadline_at:
        return None
    return max(0, int((stage.deadline_at - utcnow()).total_seconds()))


def _info(stage):
    round_, cand = stage.round, stage.candidate
    config = round_.config or {}
    live = round_.type == "interview" and config.get("mode") == "live"
    status = stage.status
    if status in ("submitted", "passed", "failed"):
        status = "completed"
    if status == "invited" and stage.token_expires_at and stage.token_expires_at < utcnow() and not live:
        status = "expired"
    window_start = pipeline.parse_dt(config.get("window_start"))
    return {
        "candidate": {"name": cand.name, "email": cand.email},
        "company": round_.drive.company.name,
        "drive": round_.drive.title,
        "round": {"name": round_.name, "type": round_.type, "mode": config.get("mode", "ai") if round_.type == "interview" else None},
        "status": status,
        "terminated": bool(stage.terminated),
        "duration_minutes": config.get("duration_minutes"),
        "question_count": len(stage.assignment or []) or int(config.get("num_questions") or 0) or len(round_.questions),
        "instructions": config.get("instructions") or "",
        "proctoring": _proctoring(stage),
        "languages": config.get("languages") if round_.type == "coding" else None,
        "seconds_per_question": config.get("seconds_per_question") if round_.type == "interview" else None,
        "opens_at": iso(window_start) if window_start and window_start > utcnow() else None,
        "link_expires_at": iso(stage.token_expires_at),
        "scheduled_at": iso(stage.scheduled_at) if live else None,
        "meeting_link": stage.meeting_link if live else None,
    }


def _check_time(stage):
    """Auto-submit when the deadline (plus grace) has passed."""
    grace = timedelta(seconds=current_app.config["SUBMIT_GRACE_SECONDS"])
    if stage.status == "in_progress" and stage.deadline_at and utcnow() > stage.deadline_at + grace:
        pipeline.finalize(stage, "timeout")
        db.session.commit()
        raise ApiError("Time is up. Your answers were submitted automatically.", 410, finished=True)


def _session_stage(token):
    """Load the stage for an in-progress attempt and verify the session token."""
    stage = pipeline.validate_token(token)
    if stage.status != "in_progress":
        raise ApiError("This test is not in progress", 409, finished=stage.status in ("submitted", "passed", "failed"))
    session_token = request.headers.get("X-Session-Token", "")
    if not session_token or stage.session_hash != _hash(session_token):
        raise ApiError("This test is open in another browser or tab.", 409, session_conflict=True)
    _check_time(stage)
    stage.last_seen_at = utcnow()
    ip = _client_ip()
    if stage.ip and ip and ip != stage.ip:
        proctoring.record(stage, "ip_changed", f"{stage.ip} -> {ip}", _proctoring(stage))
        stage.ip = ip
    return stage


def _state(stage, session_token=None):
    data = {
        "info": _info(stage),
        "questions": pipeline.public_questions(stage),
        "answers": stage.answers or {},
        "remaining_seconds": _remaining(stage),
        "deadline_at": iso(stage.deadline_at),
        "violations": stage.violations or 0,
        "max_violations": int(_proctoring(stage).get("max_violations") or 0),
    }
    if session_token:
        data["session_token"] = session_token
    return data


@bp.get("/<token>")
def info(token):
    stage = pipeline.validate_token(token)
    if stage.status == "in_progress":
        try:
            _check_time(stage)
        except ApiError:
            pass
    return jsonify(_info(stage))


@bp.post("/<token>/start")
def start(token):
    stage = pipeline.validate_token(token)
    round_ = stage.round
    config = round_.config or {}
    now = utcnow()
    if round_.type == "interview" and config.get("mode") == "live":
        raise ApiError("This is a live interview. Join using the meeting link at the scheduled time.")
    if stage.candidate.status != "active":
        raise ApiError("This application is no longer active.", 403)
    if stage.status in ("submitted", "passed", "failed"):
        raise ApiError("You have already completed this test.", 409, finished=True)
    if stage.status == "expired" or (stage.status == "invited" and stage.token_expires_at and stage.token_expires_at < now):
        raise ApiError("This link has expired. Please contact the hiring team.", 410)
    window_start = pipeline.parse_dt(config.get("window_start"))
    window_end = pipeline.parse_dt(config.get("window_end"))
    if window_start and now < window_start:
        raise ApiError("The test hasn't opened yet.", 403, opens_at=iso(window_start))
    if window_end and now >= window_end and stage.status != "in_progress":
        raise ApiError("The test window has closed.", 410)

    session_token = secrets.token_urlsafe(24)
    ip, ua = _client_ip(), (request.headers.get("User-Agent") or "")[:500]
    proctor_cfg = _proctoring(stage)
    if stage.status == "in_progress":
        _check_time(stage)
        supplied = request.headers.get("X-Session-Token", "")
        if supplied and stage.session_hash == _hash(supplied):
            session_token = supplied
            proctoring.record(stage, "resumed", "", proctor_cfg)
        else:
            idle = (now - stage.last_seen_at).total_seconds() if stage.last_seen_at else None
            if stage.session_hash and idle is not None and idle < current_app.config["SESSION_TAKEOVER_SECONDS"]:
                raise ApiError("This test is already open in another browser or device. Close it there first, "
                               "or wait a minute and try again.", 409, session_conflict=True)
            proctoring.record(stage, "new_session", f"Resumed from {ip} ({ua[:120]})", proctor_cfg)
            if proctoring.limit_reached(stage, proctor_cfg):
                stage.termination_reason = "Too many proctoring violations"
                pipeline.finalize(stage, "terminated")
                db.session.commit()
                raise ApiError("Your test was terminated due to repeated violations.", 409, finished=True)
    else:
        stage.assignment = pipeline.build_assignment(stage)
        stage.answers = {}
        stage.status = "in_progress"
        stage.started_at = now
        deadline = now + timedelta(minutes=float(config.get("duration_minutes") or 30))
        stage.deadline_at = min(deadline, window_end) if window_end else deadline
        stage.violations, stage.integrity = 0, 100.0
        stage.ip = ip
        db.session.flush()
        proctoring.record(stage, "started", f"{ip} | {ua[:200]}", proctor_cfg)
    stage.user_agent = ua
    stage.session_hash = _hash(session_token)
    stage.last_seen_at = now
    db.session.commit()
    return jsonify(_state(stage, session_token))


@bp.get("/<token>/state")
def state(token):
    stage = _session_stage(token)
    db.session.commit()
    return jsonify(_state(stage))


def _assignment_item(stage, key):
    for item in stage.assignment or []:
        if item["key"] == key:
            return item
    raise ApiError("Unknown question")


@bp.post("/<token>/answer")
def answer(token):
    stage = _session_stage(token)
    data = request.get_json(silent=True) or {}
    key = data.get("key")
    item = _assignment_item(stage, key)
    value = data.get("answer") or {}
    kind = stage.round.type
    if kind == "aptitude":
        choice = value.get("choice")
        n_options = len(item.get("order") or [])
        if choice is not None and not (isinstance(choice, int) and 0 <= choice < n_options):
            raise ApiError("Invalid option")
        clean = {"choice": choice, "flagged": bool(value.get("flagged"))}
    elif kind == "coding":
        lang = value.get("language")
        if lang not in ((stage.round.config or {}).get("languages") or []):
            raise ApiError("Language not allowed for this test")
        clean = {"language": lang, "code": str(value.get("code") or "")[:100_000]}
    else:
        clean = {"text": str(value.get("text") or "")[:20_000],
                 "duration_sec": int(value.get("duration_sec") or 0)}
    answers = dict(stage.answers or {})
    answers[key] = {**clean, "saved_at": iso(utcnow())}
    stage.answers = answers
    db.session.commit()
    return jsonify({"saved": True, "remaining_seconds": _remaining(stage)})


@bp.post("/<token>/run")
def run_code(token):
    stage = _session_stage(token)
    if stage.round.type != "coding":
        raise ApiError("Not a coding test")
    data = request.get_json(silent=True) or {}
    item = _assignment_item(stage, data.get("key"))
    lang = data.get("language")
    if lang not in ((stage.round.config or {}).get("languages") or []):
        raise ApiError("Language not allowed for this test")
    limit = int((stage.round.config or {}).get("max_runs_per_question") or 50) * max(1, len(stage.assignment or []))
    if (stage.run_count or 0) >= limit:
        raise ApiError("You have used all code runs for this test", 429)
    with _run_lock:
        last = _last_run.get(stage.id, 0)
        if time.monotonic() - last < RUN_COOLDOWN_SECONDS:
            raise ApiError("Please wait a few seconds between runs", 429)
        _last_run[stage.id] = time.monotonic()
    question = db.session.get(Question, item["qid"])
    meta = question.meta or {}
    samples = [t for t in meta.get("test_cases") or [] if not t.get("hidden")]
    custom = data.get("custom_input")
    tests = [{"input": str(custom)[:20000], "output": ""}] if custom is not None else samples
    stage.run_count = (stage.run_count or 0) + 1
    db.session.commit()
    result = code_runner.run(lang, str(data.get("code") or ""), tests, meta.get("time_limit_sec", 2))
    view = code_runner.public_view(result, tests)
    if custom is not None and view["tests"]:
        view["tests"][0].pop("expected", None)
        view["custom"] = True
    return jsonify(view)


@bp.post("/<token>/events")
def events(token):
    stage = _session_stage(token)
    proctor_cfg = _proctoring(stage)
    batch = (request.get_json(silent=True) or {}).get("events") or []
    for ev in batch[:50]:
        etype = str(ev.get("type") or "")
        if etype in proctoring.EVENT_RULES and etype not in ("started", "submitted", "auto_submitted", "terminated",
                                                              "new_session", "resumed", "ip_changed"):
            proctoring.record(stage, etype, str(ev.get("detail") or "")[:500], proctor_cfg)
    terminated = False
    if proctoring.limit_reached(stage, proctor_cfg):
        stage.termination_reason = f"Reached the limit of {proctor_cfg.get('max_violations')} proctoring violations"
        pipeline.finalize(stage, "terminated")
        terminated = True
    db.session.commit()
    return jsonify({
        "violations": stage.violations or 0,
        "max_violations": int(proctor_cfg.get("max_violations") or 0),
        "terminated": terminated,
    })


@bp.post("/<token>/snapshot")
def snapshot(token):
    stage = _session_stage(token)
    data = request.get_json(silent=True) or {}
    snap = proctoring.save_snapshot(stage, data.get("image"), data.get("faces"))
    if not snap:
        raise ApiError("Invalid image")
    db.session.commit()
    return jsonify({"ok": True})


@bp.post("/<token>/heartbeat")
def heartbeat(token):
    stage = _session_stage(token)
    db.session.commit()
    return jsonify({"remaining_seconds": _remaining(stage), "violations": stage.violations or 0})


@bp.post("/<token>/submit")
def submit(token):
    stage = _session_stage(token)
    pipeline.finalize(stage, "submitted")
    db.session.commit()
    return jsonify({"submitted": True})
