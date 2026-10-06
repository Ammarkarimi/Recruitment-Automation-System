"""Resume storage, text extraction and screening."""

import io
import os
import re
import uuid
import zipfile

from flask import current_app
from werkzeug.utils import secure_filename

from . import llm
from .textsim import find_skills, similarity_to_many

EMAIL_RE = re.compile(r"[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}")
ALLOWED_EXT = {".pdf", ".txt"}
MAX_FILES_IN_ZIP = 2000


def extract_text(filename, data):
    ext = os.path.splitext(filename)[1].lower()
    if ext == ".txt":
        return data.decode("utf-8", errors="ignore")
    if ext == ".pdf":
        from pypdf import PdfReader

        try:
            reader = PdfReader(io.BytesIO(data))
            return "\n".join((page.extract_text() or "") for page in reader.pages)
        except Exception:  # corrupt / encrypted PDFs
            return ""
    return ""


def extract_emails(text):
    return [e.lower().rstrip(".") for e in EMAIL_RE.findall(text or "")]


def iter_uploaded_files(files):
    """Yield (filename, bytes) for uploaded resumes, expanding .zip archives."""
    for storage in files:
        name = storage.filename or ""
        ext = os.path.splitext(name)[1].lower()
        data = storage.read()
        if ext == ".zip":
            try:
                archive = zipfile.ZipFile(io.BytesIO(data))
            except zipfile.BadZipFile:
                continue
            members = [m for m in archive.infolist() if not m.is_dir()][:MAX_FILES_IN_ZIP]
            for member in members:
                inner = os.path.basename(member.filename)
                if os.path.splitext(inner)[1].lower() in ALLOWED_EXT and not inner.startswith("."):
                    if member.file_size > current_app.config["MAX_CONTENT_LENGTH"]:
                        continue
                    yield inner, archive.read(member)
        elif ext in ALLOWED_EXT:
            yield name, data


def save_resume(drive_id, filename, data):
    folder = os.path.join(current_app.config["UPLOAD_DIR"], "resumes", str(drive_id))
    os.makedirs(folder, exist_ok=True)
    safe = secure_filename(filename) or "resume.pdf"
    path = os.path.join(folder, f"{uuid.uuid4().hex[:10]}_{safe}")
    with open(os.open(path, os.O_WRONLY | os.O_CREAT | os.O_TRUNC, 0o600), "wb") as fh:
        fh.write(data)
    return path


def match_candidate(filename, text, candidates_by_email, candidates):
    """Find which candidate a resume belongs to: by email inside the resume, then by the file name."""
    for email in extract_emails(text):
        if email in candidates_by_email:
            return candidates_by_email[email]
    stem = os.path.splitext(filename)[0].lower()
    for email, cand in candidates_by_email.items():
        if email in stem or email.split("@")[0] in re.split(r"[^a-z0-9._-]+", stem):
            return cand
    stem_tokens = set(re.split(r"[^a-z]+", stem)) - {""}
    best, best_hits = None, 0
    for cand in candidates:
        name_tokens = {t for t in re.split(r"[^a-z]+", cand.name.lower()) if len(t) > 1}
        hits = len(name_tokens & stem_tokens)
        if name_tokens and hits == len(name_tokens) and hits > best_hits:
            best, best_hits = cand, hits
    return best


def guess_name(filename, text):
    for line in (text or "").splitlines():
        line = line.strip()
        if 2 <= len(line.split()) <= 4 and re.fullmatch(r"[A-Za-z .'-]+", line):
            return line.title()
    stem = re.sub(r"(?i)resume|cv|final|updated|[_\-\d()]+", " ", os.path.splitext(filename)[0])
    stem = " ".join(stem.split())
    return stem.title() or "Unknown"


def screen(drive, round_, candidates):
    """Score candidates' resumes against the job description and the required skills (0-100)."""
    config = round_.config or {}
    skills = config.get("required_skills") or drive.skills or []
    skill_weight = float(config.get("skill_weight", 0.6)) if skills else 0.0
    jd = "\n".join([drive.title or "", drive.description or "", " ".join(skills)])
    with_text = [c for c in candidates if (c.resume_text or "").strip()]
    sims = similarity_to_many(jd, [c.resume_text for c in with_text]) if with_text else []
    sim_by_id = {c.id: s for c, s in zip(with_text, sims)}
    use_ai = bool(config.get("use_ai")) and llm.available()

    results = {}
    for cand in candidates:
        text = cand.resume_text or ""
        if not text.strip():
            results[cand.id] = {"score": 0.0, "detail": {"reason": "No readable resume uploaded"}}
            continue
        sim = sim_by_id.get(cand.id, 0.0)
        # Raw TF-IDF cosine between a JD and a resume rarely exceeds ~0.4; rescale to 0..1.
        sim_scaled = min(1.0, sim / 0.4)
        matched, missing = find_skills(text, skills)
        coverage = len(matched) / len(skills) if skills else 0.0
        score = 100 * (skill_weight * coverage + (1 - skill_weight) * sim_scaled)
        detail = {
            "similarity": round(sim, 4),
            "skill_coverage": round(coverage, 4),
            "matched_skills": matched,
            "missing_skills": missing,
            "method": "tfidf+skills",
        }
        if use_ai:
            ai = llm.score_resume(jd, text)
            if ai:
                detail.update({"ai_score": ai["score"], "ai_summary": ai.get("summary", ""), "method": "ai+tfidf"})
                score = 0.5 * score + 0.5 * ai["score"]
        results[cand.id] = {"score": round(score, 2), "detail": detail}
    return results
