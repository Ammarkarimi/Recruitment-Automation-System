from flask import Blueprint, jsonify, request

from ..auth import get_round_or_404, login_required
from ..errors import ApiError
from ..extensions import db
from ..models import Question
from ..services import code_runner, llm, question_bank, spreadsheets

bp = Blueprint("questions", __name__, url_prefix="/api")


def _owned_question(question_id):
    q = db.session.get(Question, question_id)
    if not q:
        raise ApiError("Question not found", 404)
    get_round_or_404(q.round_id)
    return q


def _kind_for(round_):
    kind = question_bank.KIND_FOR_ROUND.get(round_.type)
    if not kind:
        raise ApiError("This round type has no question bank")
    return kind


def _apply(q, data):
    """Validate and copy question fields according to its kind."""
    text = (data.get("text") or "").strip()
    if not text:
        raise ApiError("Question text is required")
    q.text = text
    try:
        q.marks = float(data.get("marks", q.marks or 1) or 1)
    except (TypeError, ValueError):
        raise ApiError("Marks must be a number")
    if q.marks <= 0:
        raise ApiError("Marks must be positive")
    q.difficulty = (data.get("difficulty") or "medium")[:20]
    q.topic = (data.get("topic") or "")[:120]
    if q.kind == "mcq":
        options = [str(o).strip() for o in data.get("options") or [] if str(o).strip()]
        if len(options) < 2:
            raise ApiError("Add at least two options")
        try:
            answer = int(data.get("answer"))
        except (TypeError, ValueError):
            raise ApiError("Select the correct option")
        if not 0 <= answer < len(options):
            raise ApiError("Select the correct option")
        q.options, q.answer = options, answer
    elif q.kind == "coding":
        meta = data.get("meta") or {}
        tests = []
        for t in meta.get("test_cases") or []:
            if str(t.get("output", "")).strip() == "" and str(t.get("input", "")).strip() == "":
                continue
            tests.append({"input": str(t.get("input", "")), "output": str(t.get("output", "")),
                          "hidden": bool(t.get("hidden"))})
        if not tests:
            raise ApiError("Add at least one test case")
        if all(t["hidden"] for t in tests):
            raise ApiError("Keep at least one test case visible as a sample")
        starter = {k: str(v) for k, v in (meta.get("starter_code") or {}).items() if k in code_runner.LANGUAGES}
        q.meta = {
            "title": (meta.get("title") or text.split("\n")[0])[:120],
            "starter_code": starter or dict(question_bank.STARTER),
            "time_limit_sec": max(1, min(int(meta.get("time_limit_sec") or 2), 10)),
            "test_cases": tests,
        }
        q.answer = None
    else:
        q.answer = (data.get("answer") or "").strip() if isinstance(data.get("answer"), str) else ""


@bp.get("/rounds/<int:round_id>/questions")
@login_required
def list_questions(round_id):
    round_ = get_round_or_404(round_id)
    return jsonify({"round": round_.to_dict(), "drive_title": round_.drive.title,
                    "questions": [q.to_dict() for q in round_.questions], "ai_enabled": llm.available()})


def _next_position(round_):
    return max((q.position for q in round_.questions), default=-1) + 1


@bp.post("/rounds/<int:round_id>/questions")
@login_required
def create_question(round_id):
    round_ = get_round_or_404(round_id)
    q = Question(round_id=round_.id, kind=_kind_for(round_), position=_next_position(round_))
    _apply(q, request.get_json(silent=True) or {})
    db.session.add(q)
    db.session.commit()
    return jsonify({"question": q.to_dict()}), 201


@bp.put("/questions/<int:question_id>")
@login_required
def update_question(question_id):
    q = _owned_question(question_id)
    _apply(q, request.get_json(silent=True) or {})
    db.session.commit()
    return jsonify({"question": q.to_dict()})


@bp.delete("/questions/<int:question_id>")
@login_required
def delete_question(question_id):
    q = _owned_question(question_id)
    db.session.delete(q)
    db.session.commit()
    return jsonify({"ok": True})


def _bulk_add(round_, items):
    pos = _next_position(round_)
    kind = _kind_for(round_)
    for i, item in enumerate(items):
        db.session.add(Question(
            round_id=round_.id, kind=kind, position=pos + i, text=item["text"], options=item.get("options") or [],
            answer=item.get("answer"), marks=item.get("marks", 1), difficulty=item.get("difficulty", "medium"),
            topic=item.get("topic", ""), meta=item.get("meta") or {},
        ))
    db.session.commit()
    return len(items)


@bp.post("/rounds/<int:round_id>/questions/import")
@login_required
def import_questions(round_id):
    round_ = get_round_or_404(round_id)
    if _kind_for(round_) != "mcq":
        raise ApiError("Spreadsheet import is available for MCQ (aptitude) rounds")
    upload = request.files.get("file")
    if not upload:
        raise ApiError("Attach an Excel (.xlsx) or CSV file")
    items, errors = spreadsheets.parse_mcqs(upload.filename, upload.read())
    return jsonify({"created": _bulk_add(round_, items), "errors": errors})


@bp.post("/rounds/<int:round_id>/questions/samples")
@login_required
def add_samples(round_id):
    round_ = get_round_or_404(round_id)
    _kind_for(round_)
    existing = {q.text for q in round_.questions}
    items = [s for s in question_bank.samples_for(round_.type) if s["text"] not in existing]
    return jsonify({"created": _bulk_add(round_, items)})


@bp.post("/rounds/<int:round_id>/questions/generate")
@login_required
def generate_questions(round_id):
    round_ = get_round_or_404(round_id)
    data = request.get_json(silent=True) or {}
    if not llm.available():
        raise ApiError("AI generation needs GEMINI_API_KEY on the server. You can add sample questions instead.")
    count = max(1, min(int(data.get("count") or 10), 30))
    topic = (data.get("topic") or round_.drive.title).strip()
    if round_.type == "aptitude":
        items = llm.generate_mcqs(topic, count, data.get("difficulty") or "medium")
    elif round_.type == "interview":
        items = [{"text": g["text"], "answer": g["reference"], "marks": 10}
                 for g in llm.generate_interview_questions(f"{round_.drive.title}\n{round_.drive.description}\n{topic}", "", count)]
    else:
        raise ApiError("AI generation is available for aptitude and interview rounds")
    if not items:
        raise ApiError("The AI service didn't return usable questions. Try again.", 502)
    return jsonify({"created": _bulk_add(round_, items)})


@bp.post("/rounds/<int:round_id>/questions/try")
@login_required
def try_solution(round_id):
    """Let a recruiter run a reference solution against a coding question's test cases (including hidden)."""
    get_round_or_404(round_id)
    data = request.get_json(silent=True) or {}
    meta = data.get("meta") or {}
    tests = [t for t in meta.get("test_cases") or [] if str(t.get("input", "")) or str(t.get("output", ""))]
    if not tests:
        raise ApiError("Add test cases first")
    result = code_runner.run(data.get("language"), data.get("code") or "", tests, meta.get("time_limit_sec", 2))
    if result["compile_error"]:
        return jsonify(result)
    return jsonify({"compile_error": None, "tests": [
        {**r, "input": t.get("input", ""), "expected": t.get("output", ""), "stdout": r["stdout"][:2000],
         "stderr": r["stderr"][:2000]} for t, r in zip(tests, result["tests"])
    ]})
