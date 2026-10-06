import io
import os

from flask import Blueprint, jsonify, request, send_file

from ..auth import get_drive_or_404, get_round_or_404, get_stage_or_404, login_required
from ..errors import ApiError
from ..extensions import db
from ..models import Candidate, EmailLog, ProctorEvent, Snapshot, Stage
from ..services import mailer, pipeline, resumes, spreadsheets
from .candidates import XLSX

bp = Blueprint("pipeline", __name__, url_prefix="/api")


@bp.post("/rounds/<int:round_id>/screen")
@login_required
def run_screening(round_id):
    round_ = get_round_or_404(round_id)
    if round_.type != "resume_screening":
        raise ApiError("Only resume screening rounds can be screened")
    stages = [s for s in round_.stages.filter(Stage.status.in_(["pending", "submitted"])).all()
              if s.candidate.status == "active"]
    results = resumes.screen(round_.drive, round_, [s.candidate for s in stages])
    now = pipeline.utcnow()
    for s in stages:
        res = results[s.candidate_id]
        s.score, s.max_score, s.percent = res["score"], 100.0, res["score"]
        s.result = res["detail"]
        s.status = "submitted"
        s.submitted_at = now
    db.session.commit()
    missing = sum(1 for s in stages if not s.candidate.resume_text)
    return jsonify({"screened": len(stages), "without_resume": missing})


def _target_stages(round_, data, default_statuses):
    ids = data.get("candidate_ids")
    query = round_.stages
    if ids:
        query = query.filter(Stage.candidate_id.in_(ids))
    else:
        query = query.filter(Stage.status.in_(default_statuses))
    return query.all()


@bp.post("/rounds/<int:round_id>/invite")
@login_required
def invite(round_id):
    round_ = get_round_or_404(round_id)
    data = request.get_json(silent=True) or {}
    pipeline.sweep(round_)
    resend = bool(data.get("resend"))
    stages = _target_stages(round_, data, ["pending", "expired"] if resend else ["pending"])
    invited, skipped = pipeline.invite(round_, stages, resend=resend)
    return jsonify({"invited": invited, "skipped": skipped})


@bp.post("/rounds/<int:round_id>/evaluate")
@login_required
def evaluate(round_id):
    round_ = get_round_or_404(round_id)
    data = request.get_json(silent=True) or {}
    return jsonify(pipeline.evaluate(round_, data.get("invite_next")))


@bp.post("/rounds/<int:round_id>/close")
@login_required
def close_attempts(round_id):
    """Force-submit every attempt still in progress (e.g. at the end of a scheduled exam)."""
    round_ = get_round_or_404(round_id)
    stages = round_.stages.filter(Stage.status == "in_progress").all()
    for s in stages:
        pipeline.finalize(s, "timeout")
    db.session.commit()
    return jsonify({"closed": len(stages)})


@bp.get("/stages/<int:stage_id>")
@login_required
def stage_detail(stage_id):
    stage = get_stage_or_404(stage_id)
    return jsonify({
        "stage": stage.to_dict(),
        "link": pipeline.invite_link(stage) if stage.token else None,
        "candidate": stage.candidate.to_dict(with_stages=False),
        "round": stage.round.to_dict(),
        "drive": {"id": stage.round.drive.id, "title": stage.round.drive.title},
        "events": [e.to_dict() for e in stage.events.order_by(ProctorEvent.id).all()],
        "snapshots": [s.to_dict() for s in stage.snapshots.order_by(Snapshot.id).all()],
    })


@bp.post("/stages/<int:stage_id>/decide")
@login_required
def decide(stage_id):
    stage = get_stage_or_404(stage_id)
    data = request.get_json(silent=True) or {}
    pipeline.decide(stage, data.get("decision"))
    db.session.commit()
    nxt = pipeline.next_round(stage.round)
    if data.get("decision") == "pass" and data.get("invite_next") and nxt and nxt.is_assessment:
        nxt_stage = Stage.query.filter_by(candidate_id=stage.candidate_id, round_id=nxt.id).first()
        pipeline.invite(nxt, [nxt_stage])
    return jsonify({"stage": stage.to_dict(), "candidate": stage.candidate.to_dict()})


@bp.patch("/stages/<int:stage_id>")
@login_required
def update_stage(stage_id):
    """Notes, live-interview scheduling and manual scores."""
    stage = get_stage_or_404(stage_id)
    data = request.get_json(silent=True) or {}
    if "notes" in data:
        stage.notes = (data["notes"] or "")[:5000]
    if "scheduled_at" in data:
        stage.scheduled_at = pipeline.parse_dt(data["scheduled_at"])
    if "meeting_link" in data:
        stage.meeting_link = (data["meeting_link"] or "").strip()[:500]
    if "percent" in data and data["percent"] not in (None, ""):
        try:
            pct = float(data["percent"])
        except (TypeError, ValueError):
            raise ApiError("Score must be a number")
        if not 0 <= pct <= 100:
            raise ApiError("Score must be between 0 and 100")
        if stage.status == "in_progress":
            raise ApiError("The candidate is still taking this test")
        stage.percent = pct
        stage.score, stage.max_score = pct, 100.0
        stage.decided_manually = True
        if stage.status in ("pending", "invited", "expired"):
            stage.status = "submitted"
            stage.submitted_at = pipeline.utcnow()
    db.session.commit()
    return jsonify({"stage": stage.to_dict()})


@bp.post("/stages/<int:stage_id>/reset")
@login_required
def reset_stage(stage_id):
    """unlock: let the candidate continue from another browser (keeps answers and the deadline).
    retake: wipe the attempt and send a fresh link."""
    stage = get_stage_or_404(stage_id)
    mode = (request.get_json(silent=True) or {}).get("mode", "unlock")
    if mode == "unlock":
        if stage.status != "in_progress":
            raise ApiError("Only an in-progress attempt can be unlocked")
        stage.session_hash = None
        stage.last_seen_at = None
    elif mode == "retake":
        if stage.status in ("passed", "failed"):
            raise ApiError("A decision was already made for this round")
        for attr, value in dict(status="pending", started_at=None, deadline_at=None, submitted_at=None,
                                session_hash=None, last_seen_at=None, assignment=[], answers={}, result={},
                                score=None, max_score=None, percent=None, violations=0, integrity=100.0,
                                terminated=False, termination_reason=None, run_count=0, token=None).items():
            setattr(stage, attr, value)
        ProctorEvent.query.filter_by(stage_id=stage.id).delete()
        for snap in stage.snapshots.all():
            if os.path.exists(snap.path):
                os.remove(snap.path)
            db.session.delete(snap)
        db.session.flush()
        pipeline.invite(stage.round, [stage])
    else:
        raise ApiError("mode must be 'unlock' or 'retake'")
    db.session.commit()
    return jsonify({"stage": stage.to_dict()})


@bp.get("/snapshots/<int:snapshot_id>")
@login_required
def snapshot_image(snapshot_id):
    snap = db.session.get(Snapshot, snapshot_id)
    if not snap:
        raise ApiError("Not found", 404)
    get_stage_or_404(snap.stage_id)
    if not os.path.exists(snap.path):
        raise ApiError("Image missing", 404)
    return send_file(snap.path)


@bp.post("/drives/<int:drive_id>/notify")
@login_required
def notify(drive_id):
    """Send a custom/result email to selected candidates or everyone with a given status."""
    drive = get_drive_or_404(drive_id)
    data = request.get_json(silent=True) or {}
    subject, body = (data.get("subject") or "").strip(), (data.get("body") or "").strip()
    if not subject or not body:
        raise ApiError("Subject and message are required")
    query = Candidate.query.filter_by(drive_id=drive.id)
    if data.get("candidate_ids"):
        query = query.filter(Candidate.id.in_(data["candidate_ids"]))
    elif data.get("status"):
        query = query.filter(Candidate.status == data["status"])
    else:
        raise ApiError("Choose candidates or a status")
    sent = pipeline.send_custom(drive, query.all(), subject, body.replace("\n", "<br>") if "<" not in body else body,
                                kind=data.get("kind") if data.get("kind") in ("result", "custom") else "custom")
    return jsonify({"queued": sent})


@bp.get("/drives/<int:drive_id>/emails")
@login_required
def email_log(drive_id):
    drive = get_drive_or_404(drive_id)
    logs = EmailLog.query.filter_by(drive_id=drive.id).order_by(EmailLog.id.desc()).limit(1000).all()
    counts = dict(db.session.query(EmailLog.status, db.func.count(EmailLog.id))
                  .filter(EmailLog.drive_id == drive.id).group_by(EmailLog.status).all())
    return jsonify({"emails": [e.to_dict() for e in logs], "counts": counts})


@bp.post("/drives/<int:drive_id>/emails/retry")
@login_required
def retry_emails(drive_id):
    drive = get_drive_or_404(drive_id)
    failed = EmailLog.query.filter(EmailLog.drive_id == drive.id, EmailLog.status.in_(["failed", "queued"])).all()
    for e in failed:
        e.status, e.error = "queued", None
    db.session.commit()
    mailer.dispatch(failed)
    return jsonify({"queued": len(failed)})


@bp.get("/drives/<int:drive_id>/export")
@login_required
def export(drive_id):
    drive = get_drive_or_404(drive_id)
    rounds = drive.rounds
    headers = ["Name", "Email", "Phone", "Overall status", "Current round"]
    for r in rounds:
        headers += [f"{r.name} - status", f"{r.name} - score %"]
        if r.is_assessment:
            headers += [f"{r.name} - integrity", f"{r.name} - violations"]
    names = {r.id: r.name for r in rounds}
    rows = []
    for cand in drive.candidates.order_by(Candidate.id).all():
        stages = {s.round_id: s for s in cand.stages}
        row = [cand.name, cand.email, cand.phone, cand.status, names.get(cand.current_round_id, "")]
        for r in rounds:
            s = stages.get(r.id)
            row += [s.status if s else "-", s.percent if s and s.percent is not None else ""]
            if r.is_assessment:
                row += [s.integrity if s and s.started_at else "", s.violations if s and s.started_at else ""]
        rows.append(row)
    data = spreadsheets.workbook_bytes([("Results", headers, rows)])
    safe = "".join(ch if ch.isalnum() else "_" for ch in drive.title)[:40] or "drive"
    return send_file(io.BytesIO(data), mimetype=XLSX, as_attachment=True, download_name=f"{safe}_results.xlsx")
