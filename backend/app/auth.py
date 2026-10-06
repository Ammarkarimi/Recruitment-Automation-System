from datetime import timedelta
from functools import wraps

import jwt
from flask import current_app, g, request

from .errors import ApiError
from .extensions import db
from .models import Drive, User, utcnow


def issue_token(user):
    payload = {
        "sub": str(user.id),
        "cid": user.company_id,
        "exp": utcnow() + timedelta(hours=current_app.config["JWT_EXPIRES_HOURS"]),
    }
    return jwt.encode(payload, current_app.config["SECRET_KEY"], algorithm="HS256")


def _current_user():
    header = request.headers.get("Authorization", "")
    if not header.startswith("Bearer "):
        raise ApiError("Authentication required", 401)
    try:
        payload = jwt.decode(header[7:], current_app.config["SECRET_KEY"], algorithms=["HS256"])
    except jwt.ExpiredSignatureError:
        raise ApiError("Session expired, please log in again", 401)
    except jwt.InvalidTokenError:
        raise ApiError("Invalid token", 401)
    user = db.session.get(User, int(payload["sub"]))
    if not user:
        raise ApiError("User not found", 401)
    return user


def login_required(fn):
    @wraps(fn)
    def wrapper(*args, **kwargs):
        g.user = _current_user()
        return fn(*args, **kwargs)

    return wrapper


def admin_required(fn):
    @wraps(fn)
    def wrapper(*args, **kwargs):
        g.user = _current_user()
        if g.user.role != "admin":
            raise ApiError("Only company admins can do this", 403)
        return fn(*args, **kwargs)

    return wrapper


def get_drive_or_404(drive_id):
    """Fetch a drive that belongs to the logged-in user's company."""
    drive = db.session.get(Drive, drive_id)
    if not drive or drive.company_id != g.user.company_id:
        raise ApiError("Drive not found", 404)
    return drive


def get_round_or_404(round_id):
    from .models import Round

    round_ = db.session.get(Round, round_id)
    if not round_ or round_.drive.company_id != g.user.company_id:
        raise ApiError("Round not found", 404)
    return round_


def get_candidate_or_404(candidate_id):
    from .models import Candidate

    cand = db.session.get(Candidate, candidate_id)
    if not cand or cand.drive.company_id != g.user.company_id:
        raise ApiError("Candidate not found", 404)
    return cand


def get_stage_or_404(stage_id):
    from .models import Stage

    stage = db.session.get(Stage, stage_id)
    if not stage or stage.round.drive.company_id != g.user.company_id:
        raise ApiError("Not found", 404)
    return stage
