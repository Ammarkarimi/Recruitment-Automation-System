import os

BASE_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))


def _bool(name, default=False):
    value = os.getenv(name)
    if value is None:
        return default
    return value.strip().lower() in ("1", "true", "yes", "on")


def _resolve(path):
    return path if os.path.isabs(path) else os.path.join(BASE_DIR, path)


def _database_url():
    url = os.getenv("DATABASE_URL", "sqlite:///instance/hiring.db")
    if url.startswith("sqlite:///") and not url.startswith("sqlite:////"):
        rel = url[len("sqlite:///"):]
        if rel != ":memory:":
            full = _resolve(rel)
            os.makedirs(os.path.dirname(full), exist_ok=True)
            return "sqlite:///" + full
    if url.startswith("postgres://"):
        url = "postgresql://" + url[len("postgres://"):]
    return url


class Config:
    SECRET_KEY = os.getenv("SECRET_KEY", "dev-secret-change-me")
    SQLALCHEMY_DATABASE_URI = _database_url()
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    MAX_CONTENT_LENGTH = int(os.getenv("MAX_UPLOAD_MB", "50")) * 1024 * 1024

    UPLOAD_DIR = _resolve(os.getenv("UPLOAD_DIR", "uploads"))
    FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:3000").rstrip("/")
    # If this folder contains a React production build, Flask serves it at "/".
    FRONTEND_BUILD_DIR = _resolve(os.getenv("FRONTEND_BUILD_DIR", "../React/hire-app/build"))
    CORS_ORIGINS = [o.strip() for o in os.getenv("CORS_ORIGINS", "http://localhost:3000").split(",") if o.strip()]
    JWT_EXPIRES_HOURS = int(os.getenv("JWT_EXPIRES_HOURS", "12"))

    SMTP_HOST = os.getenv("SMTP_HOST", "")
    SMTP_PORT = int(os.getenv("SMTP_PORT", "587"))
    SMTP_USER = os.getenv("SMTP_USER", "")
    SMTP_PASSWORD = os.getenv("SMTP_PASSWORD", "")
    SMTP_USE_TLS = _bool("SMTP_USE_TLS", True)
    SMTP_USE_SSL = _bool("SMTP_USE_SSL", False)
    MAIL_FROM = os.getenv("MAIL_FROM", os.getenv("SMTP_USER", "no-reply@hiring.local"))
    MAIL_RATE_PER_MINUTE = int(os.getenv("MAIL_RATE_PER_MINUTE", "60"))
    MAIL_ASYNC = _bool("MAIL_ASYNC", True)

    GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "")
    GEMINI_MODEL = os.getenv("GEMINI_MODEL", "gemini-2.5-flash")

    CODE_RUNNER = os.getenv("CODE_RUNNER", "local")
    JUDGE0_URL = os.getenv("JUDGE0_URL", "").rstrip("/")
    JUDGE0_KEY = os.getenv("JUDGE0_KEY", "")

    # Seconds of slack after a test's deadline during which in-flight saves are still accepted.
    SUBMIT_GRACE_SECONDS = int(os.getenv("SUBMIT_GRACE_SECONDS", "30"))
    # A test session with no heartbeat for this long may be resumed from another browser.
    SESSION_TAKEOVER_SECONDS = int(os.getenv("SESSION_TAKEOVER_SECONDS", "90"))


class TestConfig(Config):
    TESTING = True
    SECRET_KEY = "test-secret-key-that-is-long-enough-for-hs256"
    SQLALCHEMY_DATABASE_URI = "sqlite:///:memory:"
    MAIL_ASYNC = False
    SMTP_HOST = ""
    GEMINI_API_KEY = ""
    MAIL_RATE_PER_MINUTE = 0
