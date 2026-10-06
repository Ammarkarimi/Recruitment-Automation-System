import re

from flask import Blueprint, g, jsonify, request
from werkzeug.security import check_password_hash, generate_password_hash

from ..auth import admin_required, issue_token, login_required
from ..errors import ApiError
from ..extensions import db
from ..models import Company, User

bp = Blueprint("auth", __name__, url_prefix="/api")

EMAIL_RE = re.compile(r"^[^@\s]+@[^@\s]+\.[^@\s]+$")


def _validate_user_fields(data):
    name = (data.get("name") or "").strip()
    email = (data.get("email") or "").strip().lower()
    password = data.get("password") or ""
    if not name:
        raise ApiError("Name is required")
    if not EMAIL_RE.match(email):
        raise ApiError("A valid email is required")
    if len(password) < 8:
        raise ApiError("Password must be at least 8 characters")
    if User.query.filter_by(email=email).first():
        raise ApiError("An account with this email already exists", 409)
    return name, email, password


@bp.post("/auth/register")
def register():
    data = request.get_json(silent=True) or {}
    company_name = (data.get("company") or "").strip()
    if not company_name:
        raise ApiError("Company name is required")
    name, email, password = _validate_user_fields(data)
    company = Company(name=company_name)
    db.session.add(company)
    db.session.flush()
    user = User(company_id=company.id, name=name, email=email,
                password_hash=generate_password_hash(password), role="admin")
    db.session.add(user)
    db.session.commit()
    return jsonify({"token": issue_token(user), "user": user.to_dict()}), 201


@bp.post("/auth/login")
def login():
    data = request.get_json(silent=True) or {}
    user = User.query.filter_by(email=(data.get("email") or "").strip().lower()).first()
    if not user or not check_password_hash(user.password_hash, data.get("password") or ""):
        raise ApiError("Incorrect email or password", 401)
    return jsonify({"token": issue_token(user), "user": user.to_dict()})


@bp.get("/auth/me")
@login_required
def me():
    return jsonify({"user": g.user.to_dict()})


@bp.get("/team")
@login_required
def team():
    users = User.query.filter_by(company_id=g.user.company_id).order_by(User.created_at).all()
    return jsonify({"users": [u.to_dict() for u in users]})


@bp.post("/team")
@admin_required
def add_member():
    data = request.get_json(silent=True) or {}
    name, email, password = _validate_user_fields(data)
    role = data.get("role") if data.get("role") in ("admin", "recruiter") else "recruiter"
    user = User(company_id=g.user.company_id, name=name, email=email,
                password_hash=generate_password_hash(password), role=role)
    db.session.add(user)
    db.session.commit()
    return jsonify({"user": user.to_dict()}), 201


@bp.delete("/team/<int:user_id>")
@admin_required
def remove_member(user_id):
    user = db.session.get(User, user_id)
    if not user or user.company_id != g.user.company_id:
        raise ApiError("User not found", 404)
    if user.id == g.user.id:
        raise ApiError("You can't remove yourself")
    db.session.delete(user)
    db.session.commit()
    return jsonify({"ok": True})
