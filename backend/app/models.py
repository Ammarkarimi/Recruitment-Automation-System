from datetime import datetime, timezone

from .extensions import db


def utcnow():
    return datetime.now(timezone.utc).replace(tzinfo=None)


def iso(dt):
    return dt.isoformat(timespec="seconds") + "Z" if dt else None


ROUND_TYPES = ("resume_screening", "aptitude", "coding", "interview")
ASSESSMENT_TYPES = ("aptitude", "coding", "interview")

# Stage (candidate x round) lifecycle:
#   pending -> invited -> in_progress -> submitted -> passed | failed
#   invited -> expired (link not used before it expired)
STAGE_STATUSES = ("pending", "invited", "in_progress", "submitted", "expired", "passed", "failed")


class Company(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(200), nullable=False)
    created_at = db.Column(db.DateTime, default=utcnow)

    users = db.relationship("User", backref="company", lazy=True)


class User(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    company_id = db.Column(db.Integer, db.ForeignKey("company.id"), nullable=False, index=True)
    name = db.Column(db.String(200), nullable=False)
    email = db.Column(db.String(255), unique=True, nullable=False)
    password_hash = db.Column(db.String(255), nullable=False)
    role = db.Column(db.String(20), default="recruiter")  # admin | recruiter
    created_at = db.Column(db.DateTime, default=utcnow)

    def to_dict(self):
        return {
            "id": self.id,
            "name": self.name,
            "email": self.email,
            "role": self.role,
            "company": {"id": self.company.id, "name": self.company.name},
            "created_at": iso(self.created_at),
        }


class Drive(db.Model):
    """A hiring drive / job opening with its own pipeline of rounds."""

    id = db.Column(db.Integer, primary_key=True)
    company_id = db.Column(db.Integer, db.ForeignKey("company.id"), nullable=False, index=True)
    title = db.Column(db.String(255), nullable=False)
    description = db.Column(db.Text, default="")
    skills = db.Column(db.JSON, default=list)
    location = db.Column(db.String(255), default="")
    status = db.Column(db.String(20), default="active")  # draft | active | closed
    created_by = db.Column(db.Integer, db.ForeignKey("user.id"))
    created_at = db.Column(db.DateTime, default=utcnow)
    updated_at = db.Column(db.DateTime, default=utcnow, onupdate=utcnow)

    company = db.relationship("Company")
    rounds = db.relationship(
        "Round", backref="drive", order_by="Round.position", cascade="all, delete-orphan", lazy=True
    )
    candidates = db.relationship("Candidate", backref="drive", cascade="all, delete-orphan", lazy="dynamic")

    def to_dict(self, with_rounds=True):
        data = {
            "id": self.id,
            "title": self.title,
            "description": self.description,
            "skills": self.skills or [],
            "location": self.location,
            "status": self.status,
            "created_at": iso(self.created_at),
            "updated_at": iso(self.updated_at),
        }
        if with_rounds:
            data["rounds"] = [r.to_dict() for r in self.rounds]
        return data


class Round(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    drive_id = db.Column(db.Integer, db.ForeignKey("drive.id"), nullable=False, index=True)
    position = db.Column(db.Integer, nullable=False, default=0)
    type = db.Column(db.String(30), nullable=False)
    name = db.Column(db.String(200), nullable=False)
    config = db.Column(db.JSON, default=dict)
    created_at = db.Column(db.DateTime, default=utcnow)

    questions = db.relationship(
        "Question", backref="round", order_by="Question.position", cascade="all, delete-orphan", lazy=True
    )
    stages = db.relationship("Stage", backref="round", cascade="all, delete-orphan", lazy="dynamic")

    @property
    def is_assessment(self):
        return self.type in ASSESSMENT_TYPES

    def to_dict(self):
        return {
            "id": self.id,
            "drive_id": self.drive_id,
            "position": self.position,
            "type": self.type,
            "name": self.name,
            "config": self.config or {},
            "question_count": len(self.questions),
        }


class Question(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    round_id = db.Column(db.Integer, db.ForeignKey("round.id"), nullable=False, index=True)
    kind = db.Column(db.String(20), nullable=False)  # mcq | coding | interview
    text = db.Column(db.Text, nullable=False)
    options = db.Column(db.JSON, default=list)  # mcq: list of option strings
    # mcq: index of the correct option; interview: reference answer; coding: unused
    answer = db.Column(db.JSON)
    marks = db.Column(db.Float, default=1.0)
    difficulty = db.Column(db.String(20), default="medium")
    topic = db.Column(db.String(120), default="")
    # coding: {"title", "starter_code": {lang: code}, "test_cases": [{"input", "output", "hidden"}],
    #          "time_limit_sec"}
    meta = db.Column(db.JSON, default=dict)
    position = db.Column(db.Integer, default=0)
    created_at = db.Column(db.DateTime, default=utcnow)

    def to_dict(self):
        """Full representation for recruiters (includes answers and hidden tests)."""
        return {
            "id": self.id,
            "round_id": self.round_id,
            "kind": self.kind,
            "text": self.text,
            "options": self.options or [],
            "answer": self.answer,
            "marks": self.marks,
            "difficulty": self.difficulty,
            "topic": self.topic,
            "meta": self.meta or {},
            "position": self.position,
        }


class Candidate(db.Model):
    __table_args__ = (db.UniqueConstraint("drive_id", "email", name="uq_candidate_drive_email"),)

    id = db.Column(db.Integer, primary_key=True)
    drive_id = db.Column(db.Integer, db.ForeignKey("drive.id"), nullable=False, index=True)
    name = db.Column(db.String(255), nullable=False)
    email = db.Column(db.String(255), nullable=False)
    phone = db.Column(db.String(50), default="")
    extra = db.Column(db.JSON, default=dict)  # any extra spreadsheet columns
    resume_path = db.Column(db.String(500))
    resume_filename = db.Column(db.String(255))
    resume_text = db.Column(db.Text)
    status = db.Column(db.String(20), default="active")  # active | rejected | selected | withdrawn
    current_round_id = db.Column(db.Integer, db.ForeignKey("round.id", ondelete="SET NULL"))
    created_at = db.Column(db.DateTime, default=utcnow)

    stages = db.relationship("Stage", backref="candidate", cascade="all, delete-orphan", lazy=True)

    def to_dict(self, with_stages=True):
        data = {
            "id": self.id,
            "drive_id": self.drive_id,
            "name": self.name,
            "email": self.email,
            "phone": self.phone,
            "extra": self.extra or {},
            "has_resume": bool(self.resume_path),
            "resume_filename": self.resume_filename,
            "status": self.status,
            "current_round_id": self.current_round_id,
            "created_at": iso(self.created_at),
        }
        if with_stages:
            data["stages"] = {str(s.round_id): s.summary() for s in self.stages}
        return data


class Stage(db.Model):
    """A candidate's participation in one round."""

    __table_args__ = (db.UniqueConstraint("candidate_id", "round_id", name="uq_stage_candidate_round"),)

    id = db.Column(db.Integer, primary_key=True)
    candidate_id = db.Column(db.Integer, db.ForeignKey("candidate.id"), nullable=False, index=True)
    round_id = db.Column(db.Integer, db.ForeignKey("round.id"), nullable=False, index=True)
    status = db.Column(db.String(20), default="pending", index=True)

    score = db.Column(db.Float)
    max_score = db.Column(db.Float)
    percent = db.Column(db.Float)
    result = db.Column(db.JSON, default=dict)  # per-question grading breakdown

    token = db.Column(db.String(64), unique=True, index=True)
    token_expires_at = db.Column(db.DateTime)
    invited_at = db.Column(db.DateTime)
    invite_count = db.Column(db.Integer, default=0)

    started_at = db.Column(db.DateTime)
    deadline_at = db.Column(db.DateTime)
    submitted_at = db.Column(db.DateTime)
    session_hash = db.Column(db.String(64))
    last_seen_at = db.Column(db.DateTime)
    ip = db.Column(db.String(64))
    user_agent = db.Column(db.String(500))

    assignment = db.Column(db.JSON, default=list)  # questions served to this candidate, in order
    answers = db.Column(db.JSON, default=dict)
    run_count = db.Column(db.Integer, default=0)

    violations = db.Column(db.Integer, default=0)
    integrity = db.Column(db.Float, default=100.0)
    terminated = db.Column(db.Boolean, default=False)
    termination_reason = db.Column(db.String(255))

    decided_manually = db.Column(db.Boolean, default=False)
    notes = db.Column(db.Text, default="")
    scheduled_at = db.Column(db.DateTime)  # live interviews
    meeting_link = db.Column(db.String(500))
    updated_at = db.Column(db.DateTime, default=utcnow, onupdate=utcnow)

    events = db.relationship(
        "ProctorEvent", backref="stage", cascade="all, delete-orphan", lazy="dynamic", order_by="ProctorEvent.id"
    )
    snapshots = db.relationship(
        "Snapshot", backref="stage", cascade="all, delete-orphan", lazy="dynamic", order_by="Snapshot.id"
    )

    def summary(self):
        return {
            "id": self.id,
            "round_id": self.round_id,
            "status": self.status,
            "score": self.score,
            "max_score": self.max_score,
            "percent": self.percent,
            "violations": self.violations or 0,
            "integrity": self.integrity,
            "terminated": bool(self.terminated),
            "invited_at": iso(self.invited_at),
            "submitted_at": iso(self.submitted_at),
        }

    def to_dict(self):
        data = self.summary()
        data.update(
            {
                "candidate_id": self.candidate_id,
                "result": self.result or {},
                "token_expires_at": iso(self.token_expires_at),
                "invite_count": self.invite_count or 0,
                "started_at": iso(self.started_at),
                "deadline_at": iso(self.deadline_at),
                "last_seen_at": iso(self.last_seen_at),
                "ip": self.ip,
                "user_agent": self.user_agent,
                "termination_reason": self.termination_reason,
                "decided_manually": bool(self.decided_manually),
                "notes": self.notes or "",
                "scheduled_at": iso(self.scheduled_at),
                "meeting_link": self.meeting_link,
            }
        )
        return data


class ProctorEvent(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    stage_id = db.Column(db.Integer, db.ForeignKey("stage.id"), nullable=False, index=True)
    type = db.Column(db.String(50), nullable=False)
    severity = db.Column(db.String(10), default="low")  # info | low | medium | high
    detail = db.Column(db.String(500), default="")
    counted = db.Column(db.Boolean, default=False)  # counted towards the violation limit
    created_at = db.Column(db.DateTime, default=utcnow)

    def to_dict(self):
        return {
            "id": self.id,
            "type": self.type,
            "severity": self.severity,
            "detail": self.detail,
            "counted": self.counted,
            "created_at": iso(self.created_at),
        }


class Snapshot(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    stage_id = db.Column(db.Integer, db.ForeignKey("stage.id"), nullable=False, index=True)
    path = db.Column(db.String(500), nullable=False)
    faces = db.Column(db.Integer)
    flagged = db.Column(db.Boolean, default=False)
    created_at = db.Column(db.DateTime, default=utcnow)

    def to_dict(self):
        return {
            "id": self.id,
            "faces": self.faces,
            "flagged": self.flagged,
            "created_at": iso(self.created_at),
        }


class EmailLog(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    drive_id = db.Column(db.Integer, db.ForeignKey("drive.id"), index=True)
    candidate_id = db.Column(db.Integer, db.ForeignKey("candidate.id", ondelete="SET NULL"))
    stage_id = db.Column(db.Integer, db.ForeignKey("stage.id", ondelete="SET NULL"))
    kind = db.Column(db.String(20), default="invite")  # invite | result | custom
    to = db.Column(db.String(255), nullable=False)
    subject = db.Column(db.String(500), nullable=False)
    html = db.Column(db.Text)
    status = db.Column(db.String(20), default="queued")  # queued | sent | simulated | failed
    error = db.Column(db.String(1000))
    created_at = db.Column(db.DateTime, default=utcnow)
    sent_at = db.Column(db.DateTime)

    def to_dict(self):
        return {
            "id": self.id,
            "candidate_id": self.candidate_id,
            "stage_id": self.stage_id,
            "kind": self.kind,
            "to": self.to,
            "subject": self.subject,
            "status": self.status,
            "error": self.error,
            "created_at": iso(self.created_at),
            "sent_at": iso(self.sent_at),
        }
