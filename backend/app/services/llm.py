"""Optional Gemini integration. Every caller has a non-AI fallback, so the platform works without a key."""

import json
import logging
import re

from flask import current_app

log = logging.getLogger(__name__)


def available():
    return bool(current_app.config.get("GEMINI_API_KEY"))


def _client():
    from google import genai  # imported lazily: optional dependency

    return genai.Client(api_key=current_app.config["GEMINI_API_KEY"])


def _parse_json(text):
    text = (text or "").strip()
    fenced = re.search(r"```(?:json)?\s*(.*?)```", text, re.S)
    if fenced:
        text = fenced.group(1).strip()
    return json.loads(text)


def generate_json(prompt):
    """Ask the model for JSON. Returns the parsed object, or None on any failure."""
    if not available():
        return None
    try:
        response = _client().models.generate_content(
            model=current_app.config["GEMINI_MODEL"],
            contents=prompt,
            config={"response_mime_type": "application/json", "temperature": 0.7},
        )
        return _parse_json(response.text)
    except Exception as exc:  # network errors, quota, malformed output...
        log.warning("Gemini request failed: %s", exc)
        return None


def generate_mcqs(topic, count, difficulty="medium"):
    data = generate_json(
        f"Generate {count} multiple-choice aptitude/technical questions on: {topic}. Difficulty: {difficulty}.\n"
        'Return a JSON array of objects with keys "question" (string), "options" (array of exactly 4 strings), '
        '"answer" (0-based index of the correct option), "topic" (short string). Questions must be unambiguous '
        "and have exactly one correct option."
    )
    out = []
    for item in data if isinstance(data, list) else []:
        try:
            options = [str(o) for o in item["options"]][:6]
            answer = int(item["answer"])
            if len(options) >= 2 and 0 <= answer < len(options) and str(item["question"]).strip():
                out.append(
                    {
                        "text": str(item["question"]).strip(),
                        "options": options,
                        "answer": answer,
                        "topic": str(item.get("topic") or topic)[:120],
                        "difficulty": difficulty,
                    }
                )
        except (KeyError, TypeError, ValueError):
            continue
    return out


def generate_interview_questions(job_text, resume_text, count):
    data = generate_json(
        "You are a technical interviewer. Based on the job description and the candidate's resume, write "
        f"{count} interview questions mixing technical depth on the candidate's listed projects/skills and one "
        "behavioural question.\n"
        'Return a JSON array of objects with keys "question" and "reference_answer" (what a strong answer covers, '
        "2-4 sentences).\n\n"
        f"JOB DESCRIPTION:\n{job_text[:4000]}\n\nRESUME:\n{(resume_text or 'Not provided')[:6000]}"
    )
    out = []
    for item in data if isinstance(data, list) else []:
        if isinstance(item, dict) and str(item.get("question", "")).strip():
            out.append({"text": str(item["question"]).strip(), "reference": str(item.get("reference_answer", ""))})
    return out[:count]


def evaluate_answer(question, reference, answer):
    data = generate_json(
        "Grade the candidate's interview answer from 0 to 10 for correctness, depth and clarity. Be strict; an "
        "empty, off-topic or evasive answer scores 0-2.\n"
        'Return JSON: {"score": number, "feedback": "one or two sentences"}.\n\n'
        f"QUESTION: {question}\nWHAT A GOOD ANSWER COVERS: {reference or 'n/a'}\nCANDIDATE ANSWER: {answer[:5000]}"
    )
    try:
        score = max(0.0, min(10.0, float(data["score"])))
        return {"score": score, "feedback": str(data.get("feedback", ""))[:1000]}
    except (TypeError, KeyError, ValueError):
        return None


def score_resume(job_text, resume_text):
    data = generate_json(
        "Rate how well this resume fits the job from 0 to 100. Consider skills, experience and education.\n"
        'Return JSON: {"score": number, "summary": "two sentences"}.\n\n'
        f"JOB:\n{job_text[:4000]}\n\nRESUME:\n{resume_text[:8000]}"
    )
    try:
        return {"score": max(0.0, min(100.0, float(data["score"]))), "summary": str(data.get("summary", ""))}
    except (TypeError, KeyError, ValueError):
        return None
