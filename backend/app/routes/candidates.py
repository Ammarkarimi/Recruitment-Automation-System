import io
import os

from flask import Blueprint, jsonify, request, send_file

from ..auth import get_candidate_or_404, get_drive_or_404, login_required
from ..errors import ApiError
from ..extensions import db
from ..models import Candidate, Stage
from ..services import pipeline, resumes, spreadsheets

bp = Blueprint("candidates", __name__, url_prefix="/api")

XLSX = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"


@bp.get("/templates/candidates.xlsx")
def candidate_template():
    return send_file(io.BytesIO(spreadsheets.candidate_template()), mimetype=XLSX, as_attachment=True,
                     download_name="candidates_template.xlsx")


@bp.get("/templates/mcqs.xlsx")
def mcq_template():
    return send_file(io.BytesIO(spreadsheets.mcq_template()), mimetype=XLSX, as_attachment=True,
                     download_name="mcq_questions_template.xlsx")


@bp.get("/drives/<int:drive_id>/candidates")
@login_required
def list_candidates(drive_id):
    drive = get_drive_or_404(drive_id)
    query = Candidate.query.filter_by(drive_id=drive.id)
    if request.args.get("status"):
        query = query.filter(Candidate.status == request.args["status"])
    if request.args.get("round_id"):
        query = query.filter(Candidate.current_round_id == int(request.args["round_id"]))
    if request.args.get("q"):
        like = f"%{request.args['q'].strip()}%"
        query = query.filter(db.or_(Candidate.name.ilike(like), Candidate.email.ilike(like)))
    candidates = query.order_by(Candidate.created_at, Candidate.id).all()
    return jsonify({"candidates": [c.to_dict() for c in candidates]})


def _add_candidates(drive, records):
    existing = {e for (e,) in db.session.query(Candidate.email).filter_by(drive_id=drive.id)}
    created, duplicates = [], []
    for rec in records:
        if rec["email"] in existing:
            duplicates.append(rec["email"])
            continue
        cand = Candidate(drive_id=drive.id, name=rec["name"][:255], email=rec["email"],
                         phone=rec.get("phone", "")[:50], extra=rec.get("extra") or {})
        db.session.add(cand)
        db.session.flush()
        pipeline.enter_pipeline(cand, drive)
        existing.add(rec["email"])
        created.append(cand)
    return created, duplicates


@bp.post("/drives/<int:drive_id>/candidates")
@login_required
def add_candidate(drive_id):
    drive = get_drive_or_404(drive_id)
    data = request.get_json(silent=True) or {}
    email = (data.get("email") or "").strip().lower()
    if not spreadsheets.EMAIL_RE.match(email):
        raise ApiError("A valid email is required")
    created, duplicates = _add_candidates(
        drive, [{"name": (data.get("name") or "").strip() or email.split("@")[0], "email": email,
                 "phone": (data.get("phone") or "").strip()}]
    )
    if duplicates:
        raise ApiError("This candidate is already in the drive", 409)
    db.session.commit()
    return jsonify({"candidate": created[0].to_dict()}), 201


@bp.post("/drives/<int:drive_id>/candidates/import")
@login_required
def import_candidates(drive_id):
    drive = get_drive_or_404(drive_id)
    upload = request.files.get("file")
    if not upload:
        raise ApiError("Attach an Excel (.xlsx) or CSV file")
    records, errors = spreadsheets.parse_candidates(upload.filename, upload.read())
    created, duplicates = _add_candidates(drive, records)
    db.session.commit()
    return jsonify({
        "created": len(created),
        "duplicates": duplicates,
        "errors": errors,
        "total_rows": len(records) + len(errors),
    })


@bp.post("/drives/<int:drive_id>/resumes")
@login_required
def upload_resumes(drive_id):
    """Bulk upload resumes (PDF/TXT or a ZIP of them). Each is matched to a candidate by the email inside it
    or by file name. With create_missing=true, unmatched resumes that contain an email create new candidates."""
    drive = get_drive_or_404(drive_id)
    files = request.files.getlist("files")
    if not files:
        raise ApiError("Attach one or more resume files")
    create_missing = request.form.get("create_missing", "false").lower() == "true"
    candidates = Candidate.query.filter_by(drive_id=drive.id).all()
    by_email = {c.email: c for c in candidates}
    matched, created, unmatched = 0, 0, []
    for filename, data in resumes.iter_uploaded_files(files):
        text = resumes.extract_text(filename, data)
        cand = resumes.match_candidate(filename, text, by_email, candidates)
        if not cand and create_missing:
            emails = resumes.extract_emails(text)
            if emails:
                new, _ = _add_candidates(drive, [{"name": resumes.guess_name(filename, text), "email": emails[0]}])
                if new:
                    cand = new[0]
                    by_email[cand.email] = cand
                    candidates.append(cand)
                    created += 1
        if not cand:
            unmatched.append(filename)
            continue
        if cand.resume_path and os.path.exists(cand.resume_path):
            os.remove(cand.resume_path)
        cand.resume_path = resumes.save_resume(drive.id, filename, data)
        cand.resume_filename = filename
        cand.resume_text = text
        matched += 1
    db.session.commit()
    return jsonify({"matched": matched, "created": created, "unmatched": unmatched})


@bp.post("/candidates/<int:candidate_id>/resume")
@login_required
def upload_single_resume(candidate_id):
    cand = get_candidate_or_404(candidate_id)
    upload = request.files.get("file")
    if not upload or os.path.splitext(upload.filename or "")[1].lower() not in resumes.ALLOWED_EXT:
        raise ApiError("Attach a PDF or TXT resume")
    data = upload.read()
    if cand.resume_path and os.path.exists(cand.resume_path):
        os.remove(cand.resume_path)
    cand.resume_path = resumes.save_resume(cand.drive_id, upload.filename, data)
    cand.resume_filename = upload.filename
    cand.resume_text = resumes.extract_text(upload.filename, data)
    db.session.commit()
    return jsonify({"candidate": cand.to_dict()})


@bp.get("/candidates/<int:candidate_id>")
@login_required
def get_candidate(candidate_id):
    cand = get_candidate_or_404(candidate_id)
    stages = Stage.query.filter_by(candidate_id=cand.id).all()
    return jsonify({
        "candidate": cand.to_dict(with_stages=False),
        "stages": [{**s.to_dict(), "round_name": s.round.name, "round_type": s.round.type} for s in stages],
        "resume_excerpt": (cand.resume_text or "")[:3000],
    })


@bp.get("/candidates/<int:candidate_id>/resume")
@login_required
def download_resume(candidate_id):
    cand = get_candidate_or_404(candidate_id)
    if not cand.resume_path or not os.path.exists(cand.resume_path):
        raise ApiError("No resume uploaded", 404)
    return send_file(cand.resume_path, download_name=cand.resume_filename or "resume.pdf")


@bp.patch("/candidates/<int:candidate_id>")
@login_required
def update_candidate(candidate_id):
    cand = get_candidate_or_404(candidate_id)
    data = request.get_json(silent=True) or {}
    if "name" in data and (data["name"] or "").strip():
        cand.name = data["name"].strip()[:255]
    if "phone" in data:
        cand.phone = (data["phone"] or "").strip()[:50]
    if "status" in data:
        if data["status"] not in ("active", "withdrawn"):
            raise ApiError("Use pass/fail on a round to select or reject; status can be 'active' or 'withdrawn'")
        cand.status = data["status"]
    db.session.commit()
    return jsonify({"candidate": cand.to_dict()})


@bp.post("/drives/<int:drive_id>/candidates/delete")
@login_required
def delete_candidates(drive_id):
    drive = get_drive_or_404(drive_id)
    ids = (request.get_json(silent=True) or {}).get("ids") or []
    removed = 0
    for cand in Candidate.query.filter(Candidate.drive_id == drive.id, Candidate.id.in_(ids)).all():
        if cand.resume_path and os.path.exists(cand.resume_path):
            os.remove(cand.resume_path)
        db.session.delete(cand)
        removed += 1
    db.session.commit()
    return jsonify({"removed": removed})
