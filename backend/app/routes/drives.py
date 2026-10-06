from flask import Blueprint, current_app, g, jsonify, request

from ..auth import get_drive_or_404, get_round_or_404, login_required
from ..errors import ApiError
from ..extensions import db
from ..models import ROUND_TYPES, Drive, Round
from ..services import code_runner, llm, pipeline
from ..services.round_config import DEFAULT_NAMES, default_config, merge_config

bp = Blueprint("drives", __name__, url_prefix="/api")


@bp.get("/meta")
@login_required
def meta():
    cfg = current_app.config
    return jsonify(
        {
            "round_types": [{"type": t, "name": DEFAULT_NAMES[t], "defaults": default_config(t)} for t in ROUND_TYPES],
            "languages": [
                {"id": k, "label": v["label"], "available": k in code_runner.available_languages()}
                for k, v in code_runner.LANGUAGES.items()
            ],
            "ai_enabled": llm.available(),
            "email_mode": "smtp" if cfg["SMTP_HOST"] else "simulated",
            "code_runner": cfg["CODE_RUNNER"],
            "frontend_url": cfg["FRONTEND_URL"],
        }
    )


def _clean_skills(value):
    if isinstance(value, str):
        value = value.split(",")
    if not isinstance(value, list):
        return []
    seen, out = set(), []
    for s in value:
        s = str(s).strip()
        if s and s.lower() not in seen:
            seen.add(s.lower())
            out.append(s[:80])
    return out


def _apply_drive_fields(drive, data):
    if "title" in data:
        drive.title = (data.get("title") or "").strip()
    if not drive.title:
        raise ApiError("Title is required")
    for field in ("description", "location"):
        if field in data:
            setattr(drive, field, (data.get(field) or "").strip())
    if "skills" in data:
        drive.skills = _clean_skills(data.get("skills"))
    if "status" in data:
        if data["status"] not in ("draft", "active", "closed"):
            raise ApiError("Invalid status")
        drive.status = data["status"]


def _sync_rounds(drive, rounds_data):
    """Create/update/delete/reorder rounds from the list sent by the round builder."""
    if not isinstance(rounds_data, list):
        raise ApiError("rounds must be a list")
    if not rounds_data:
        raise ApiError("Add at least one round")
    existing = {r.id: r for r in drive.rounds}
    has_candidates = drive.candidates.count() > 0
    keep, ordered = set(), []
    for item in rounds_data:
        rtype = item.get("type")
        if rtype not in ROUND_TYPES:
            raise ApiError(f"Unknown round type '{rtype}'")
        rid = item.get("id")
        if rid is not None:
            round_ = existing.get(rid)
            if not round_:
                raise ApiError(f"Round {rid} doesn't belong to this drive")
            if round_.type != rtype:
                raise ApiError("A round's type can't be changed; remove it and add a new one")
            round_.config = merge_config(rtype, item.get("config"), round_.config)
            keep.add(rid)
        else:
            round_ = Round(drive=drive, type=rtype, config=merge_config(rtype, item.get("config")))
            db.session.add(round_)
        round_.name = (item.get("name") or DEFAULT_NAMES[rtype]).strip()[:200]
        ordered.append(round_)
    removed = [r for rid, r in existing.items() if rid not in keep]
    for r in removed:
        if r.stages.count():
            raise ApiError(f"'{r.name}' already has candidates and can't be removed")
        drive.rounds.remove(r)  # delete-orphan cascade removes it
    if has_candidates:
        old_order = [r.id for r in drive.rounds if r.id in keep]
        new_order = [r.id for r in ordered if r.id in keep]
        if old_order != new_order:
            raise ApiError("Rounds can't be reordered after candidates were added")
        # New rounds may only be appended after the existing ones.
        seen_new = False
        for r in ordered:
            if r.id is None:
                seen_new = True
            elif seen_new:
                raise ApiError("New rounds can only be added after the existing ones once candidates exist")
    for pos, r in enumerate(ordered):
        r.position = pos
    db.session.flush()
    drive.rounds.sort(key=lambda r: r.position)


@bp.get("/drives")
@login_required
def list_drives():
    drives = Drive.query.filter_by(company_id=g.user.company_id).order_by(Drive.created_at.desc()).all()
    return jsonify({"drives": [{**d.to_dict(), "stats": pipeline.drive_stats(d)} for d in drives]})


@bp.post("/drives")
@login_required
def create_drive():
    data = request.get_json(silent=True) or {}
    drive = Drive(company_id=g.user.company_id, created_by=g.user.id, title="", skills=[])
    _apply_drive_fields(drive, data)
    db.session.add(drive)
    db.session.flush()
    _sync_rounds(drive, data.get("rounds") or [])
    db.session.commit()
    return jsonify({"drive": drive.to_dict()}), 201


@bp.get("/drives/<int:drive_id>")
@login_required
def get_drive(drive_id):
    drive = get_drive_or_404(drive_id)
    for r in drive.rounds:
        pipeline.sweep(r)
    return jsonify({"drive": {**drive.to_dict(), "stats": pipeline.drive_stats(drive)}})


@bp.put("/drives/<int:drive_id>")
@login_required
def update_drive(drive_id):
    drive = get_drive_or_404(drive_id)
    data = request.get_json(silent=True) or {}
    _apply_drive_fields(drive, data)
    if "rounds" in data:
        _sync_rounds(drive, data["rounds"])
    db.session.commit()
    return jsonify({"drive": drive.to_dict()})


@bp.delete("/drives/<int:drive_id>")
@login_required
def delete_drive(drive_id):
    drive = get_drive_or_404(drive_id)
    db.session.delete(drive)
    db.session.commit()
    return jsonify({"ok": True})


@bp.put("/rounds/<int:round_id>")
@login_required
def update_round(round_id):
    round_ = get_round_or_404(round_id)
    data = request.get_json(silent=True) or {}
    if "name" in data:
        round_.name = (data.get("name") or round_.name).strip()[:200]
    if "config" in data:
        round_.config = merge_config(round_.type, data["config"], round_.config)
    db.session.commit()
    return jsonify({"round": round_.to_dict()})
