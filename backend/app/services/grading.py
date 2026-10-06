"""Scoring of submitted assessments."""

from ..extensions import db
from ..models import Question
from . import code_runner, llm
from .textsim import similarity, tokenize


def _questions(stage):
    ids = [item["qid"] for item in stage.assignment or [] if item.get("qid")]
    return {q.id: q for q in Question.query.filter(Question.id.in_(ids)).all()} if ids else {}


def grade_mcq(stage, config):
    questions = _questions(stage)
    answers = stage.answers or {}
    negative = float(config.get("negative_marking") or 0)
    total, max_total, rows = 0.0, 0.0, []
    for item in stage.assignment or []:
        q = questions.get(item.get("qid"))
        if not q:
            continue
        max_total += q.marks
        chosen = answers.get(item["key"], {}).get("choice")
        order = item.get("order") or list(range(len(q.options or [])))
        original = order[chosen] if isinstance(chosen, int) and 0 <= chosen < len(order) else None
        if original is None:
            awarded, correct = 0.0, None
        elif original == q.answer:
            awarded, correct = q.marks, True
        else:
            awarded, correct = -negative * q.marks, False
        total += awarded
        rows.append(
            {
                "key": item["key"],
                "question_id": q.id,
                "text": q.text,
                "chosen": (q.options or [])[original] if original is not None else None,
                "correct_option": (q.options or [])[q.answer] if isinstance(q.answer, int) and q.answer < len(q.options or []) else None,
                "correct": correct,
                "awarded": round(awarded, 2),
                "marks": q.marks,
                "topic": q.topic,
            }
        )
    return max(0.0, total), max_total, {"questions": rows}


def grade_coding(stage, config):
    questions = _questions(stage)
    answers = stage.answers or {}
    total, max_total, rows = 0.0, 0.0, []
    for item in stage.assignment or []:
        q = questions.get(item.get("qid"))
        if not q:
            continue
        max_total += q.marks
        ans = answers.get(item["key"]) or {}
        code, lang = ans.get("code") or "", ans.get("language") or ""
        tests = (q.meta or {}).get("test_cases") or []
        row = {"key": item["key"], "question_id": q.id, "title": (q.meta or {}).get("title") or q.text[:60],
               "language": lang, "code": code, "marks": q.marks, "passed": 0, "total": len(tests)}
        if not code.strip() or not tests:
            row.update({"awarded": 0.0, "status": "not_attempted" if not code.strip() else "no_tests"})
        else:
            res = code_runner.run(lang, code, tests, (q.meta or {}).get("time_limit_sec", 2))
            if res["compile_error"]:
                row.update({"awarded": 0.0, "status": "compile_error", "error": res["compile_error"][:2000]})
            else:
                passed = sum(1 for t in res["tests"] if t["passed"])
                awarded = q.marks * passed / len(tests)
                row.update({"awarded": round(awarded, 2), "passed": passed, "status": "graded",
                            "tests": [{"status": t["status"], "time": t["time"]} for t in res["tests"]]})
        total += row["awarded"]
        rows.append(row)
    return total, max_total, {"questions": rows}


def heuristic_interview_score(reference, answer):
    words = len(tokenize(answer))
    if words < 5:
        return 0.0
    length_factor = min(1.0, words / 40)
    if reference:
        coverage = min(1.0, similarity(reference, answer) / 0.3)
        return round(10 * (0.75 * coverage + 0.25 * length_factor), 2)
    return round(10 * 0.6 * length_factor, 2)


def grade_interview(stage, config):
    questions = _questions(stage)
    answers = stage.answers or {}
    total, max_total, rows = 0.0, 0.0, []
    use_ai = llm.available()
    for item in stage.assignment or []:
        q = questions.get(item.get("qid"))
        text = q.text if q else item.get("text", "")
        reference = (q.answer if q else item.get("reference")) or ""
        marks = q.marks if q else float(item.get("marks", 10))
        answer = ((answers.get(item["key"]) or {}).get("text") or "").strip()
        max_total += marks
        evaluation = llm.evaluate_answer(text, reference, answer) if (use_ai and answer) else None
        if evaluation:
            score10, method, feedback = evaluation["score"], "ai", evaluation["feedback"]
        else:
            score10, method, feedback = heuristic_interview_score(str(reference), answer), "heuristic", ""
        awarded = marks * score10 / 10
        total += awarded
        rows.append({"key": item["key"], "text": text, "answer": answer, "reference": reference,
                     "score10": score10, "awarded": round(awarded, 2), "marks": marks, "method": method,
                     "feedback": feedback, "needs_review": method == "heuristic"})
    return total, max_total, {"questions": rows}


GRADERS = {"aptitude": grade_mcq, "coding": grade_coding, "interview": grade_interview}


def grade(stage):
    round_ = stage.round
    score, max_score, result = GRADERS[round_.type](stage, round_.config or {})
    stage.score = round(score, 2)
    stage.max_score = round(max_score, 2)
    stage.percent = round(100 * score / max_score, 2) if max_score else 0.0
    stage.result = result
    db.session.flush()
