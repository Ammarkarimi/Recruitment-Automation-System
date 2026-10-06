"""Default configuration for each round type and validation of recruiter-supplied config."""

import copy

from ..errors import ApiError
from ..models import ROUND_TYPES

DEFAULT_INVITE_SUBJECT = "{{company}}: {{round}} for {{drive}}"
DEFAULT_INVITE_BODY = """<p>Hi {{name}},</p>
<p>You have been invited to the <b>{{round}}</b> round for the <b>{{drive}}</b> position at {{company}}.</p>
<p>Duration: <b>{{duration}} minutes</b>. Your personal link is valid until <b>{{deadline}}</b>.</p>
<p style="text-align:center;margin:28px 0">
  <a href="{{link}}" style="background:#4f46e5;color:#fff;padding:12px 22px;border-radius:6px;text-decoration:none;font-weight:bold">Start {{round}}</a>
</p>
<p>Before you start:</p>
<ul>
  <li>Use a laptop/desktop with the latest Chrome, Edge or Firefox.</li>
  <li>Keep your webcam and microphone ready; the session is proctored.</li>
  <li>Do not switch tabs, exit full screen, or use other devices during the test.</li>
  <li>The link is personal. Do not share it.</li>
</ul>
<p>Good luck!<br>{{company}} Hiring Team</p>"""

DEFAULT_LIVE_INVITE_BODY = """<p>Hi {{name}},</p>
<p>Congratulations! You have been shortlisted for the <b>{{round}}</b> round for the <b>{{drive}}</b> position at {{company}}.</p>
<p>Scheduled at: <b>{{scheduled_at}}</b><br>Meeting link: <a href="{{meeting_link}}">{{meeting_link}}</a></p>
<p>Best regards,<br>{{company}} Hiring Team</p>"""

DEFAULT_PROCTORING = {
    "enabled": True,
    "require_webcam": True,
    "require_microphone": False,
    "require_fullscreen": True,
    "block_copy_paste": True,
    "detect_tab_switch": True,
    "detect_faces": True,
    "detect_noise": False,
    "snapshot_interval_sec": 30,
    # The test is terminated and auto-submitted once this many violations are recorded (0 = never).
    "max_violations": 5,
}

COMMON = {
    # How pass/fail is decided when the round is evaluated: score | top_n | manual
    "pass_mode": "score",
    "pass_score": 60,  # percent, for pass_mode=score
    "top_n": 10,  # for pass_mode=top_n
    "min_integrity": 0,  # candidates whose integrity score is below this fail (0 = off)
    "fail_on_termination": True,  # tests terminated by proctoring fail automatically
    "invite_next_on_pass": False,  # immediately email the next round's link to passing candidates
}

ASSESSMENT_COMMON = {
    "duration_minutes": 30,
    "num_questions": 0,  # 0 = all questions in the bank
    "shuffle_questions": True,
    "link_valid_hours": 72,
    "window_start": None,  # optional ISO datetime; the test can't be started before this
    "window_end": None,  # optional ISO datetime; hard end for everyone
    "instructions": "",
    "email_subject": DEFAULT_INVITE_SUBJECT,
    "email_body": DEFAULT_INVITE_BODY,
}

DEFAULTS = {
    "resume_screening": {
        **COMMON,
        "pass_score": 50,
        "required_skills": [],
        "skill_weight": 0.6,  # remainder goes to JD/resume text similarity
        "use_ai": False,
    },
    "aptitude": {
        **COMMON,
        **ASSESSMENT_COMMON,
        "duration_minutes": 30,
        "shuffle_options": True,
        "negative_marking": 0,  # fraction of marks deducted for a wrong answer, e.g. 0.25
        "proctoring": DEFAULT_PROCTORING,
    },
    "coding": {
        **COMMON,
        **ASSESSMENT_COMMON,
        "duration_minutes": 60,
        "languages": ["python", "javascript", "cpp", "java"],
        "max_runs_per_question": 50,
        "proctoring": {**DEFAULT_PROCTORING, "block_copy_paste": True},
    },
    "interview": {
        **COMMON,
        **ASSESSMENT_COMMON,
        "duration_minutes": 20,
        "mode": "ai",  # ai: automated video interview | live: scheduled with a human interviewer
        "personalized": True,  # with an AI key, generate questions from the resume + job description
        "seconds_per_question": 180,
        "proctoring": {**DEFAULT_PROCTORING, "require_microphone": True, "block_copy_paste": True},
    },
}

DEFAULT_NAMES = {
    "resume_screening": "Resume Screening",
    "aptitude": "Aptitude Test",
    "coding": "Coding Test",
    "interview": "AI Interview",
}


def default_config(round_type):
    if round_type not in DEFAULTS:
        raise ApiError(f"Unknown round type '{round_type}'. Use one of: {', '.join(ROUND_TYPES)}")
    return copy.deepcopy(DEFAULTS[round_type])


def merge_config(round_type, supplied=None, existing=None):
    """Overlay recruiter-supplied config on defaults, keeping only known keys."""
    config = default_config(round_type)
    for source in (existing or {}, supplied or {}):
        for key, value in source.items():
            if key not in config:
                continue
            if key == "proctoring" and isinstance(value, dict):
                config["proctoring"] = {
                    **config["proctoring"],
                    **{k: v for k, v in value.items() if k in DEFAULT_PROCTORING},
                }
            else:
                config[key] = value
    if round_type == "interview":
        # Swap the stock template when the interview mode changes, but keep a customised one.
        if config.get("mode") == "live" and config.get("email_body") == DEFAULT_INVITE_BODY:
            config["email_body"] = DEFAULT_LIVE_INVITE_BODY
        elif config.get("mode") == "ai" and config.get("email_body") == DEFAULT_LIVE_INVITE_BODY:
            config["email_body"] = DEFAULT_INVITE_BODY
    _validate(round_type, config)
    return config


def _num(config, key, lo, hi):
    try:
        value = float(config[key])
    except (TypeError, ValueError):
        raise ApiError(f"'{key}' must be a number")
    if not lo <= value <= hi:
        raise ApiError(f"'{key}' must be between {lo} and {hi}")
    config[key] = int(value) if value.is_integer() else value


def _validate(round_type, config):
    if config["pass_mode"] not in ("score", "top_n", "manual"):
        raise ApiError("pass_mode must be score, top_n or manual")
    _num(config, "pass_score", 0, 100)
    _num(config, "top_n", 1, 1_000_000)
    _num(config, "min_integrity", 0, 100)
    if round_type == "resume_screening":
        if not isinstance(config["required_skills"], list):
            raise ApiError("required_skills must be a list")
        _num(config, "skill_weight", 0, 1)
        return
    _num(config, "duration_minutes", 1, 600)
    _num(config, "num_questions", 0, 500)
    _num(config, "link_valid_hours", 1, 24 * 60)
    _num(config["proctoring"], "max_violations", 0, 1000)
    _num(config["proctoring"], "snapshot_interval_sec", 0, 3600)
    if round_type == "aptitude":
        _num(config, "negative_marking", 0, 1)
    if round_type == "coding":
        allowed = {"python", "javascript", "cpp", "java"}
        langs = [lang for lang in config["languages"] if lang in allowed]
        if not langs:
            raise ApiError("Select at least one programming language")
        config["languages"] = langs
    if round_type == "interview" and config["mode"] not in ("ai", "live"):
        raise ApiError("Interview mode must be 'ai' or 'live'")
