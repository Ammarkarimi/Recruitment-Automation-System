import logging
import os

from dotenv import load_dotenv
from flask import Flask, jsonify
from flask_cors import CORS

load_dotenv(os.path.join(os.path.dirname(__file__), "..", ".env"))

from .config import Config  # noqa: E402  (reads env vars loaded above)
from .errors import register_error_handlers  # noqa: E402
from .extensions import db  # noqa: E402


def create_app(config_object=Config, **overrides):
    app = Flask(__name__)
    app.config.from_object(config_object)
    app.config.update(overrides)
    os.makedirs(app.config["UPLOAD_DIR"], exist_ok=True)
    logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(name)s: %(message)s")

    if not app.config.get("TESTING") and app.config["SECRET_KEY"] == "dev-secret-change-me":
        app.logger.warning("SECRET_KEY is not set - using an insecure development key")

    db.init_app(app)
    CORS(app, resources={r"/api/*": {"origins": app.config["CORS_ORIGINS"]}},
         expose_headers=["Content-Disposition"])
    register_error_handlers(app)

    from .routes import assessment, auth_routes, candidates, drives, pipeline_routes, questions

    for module in (auth_routes, drives, candidates, questions, pipeline_routes, assessment):
        app.register_blueprint(module.bp)

    @app.get("/api/health")
    def health():
        return jsonify({"status": "ok"})

    with app.app_context():
        db.create_all()
    _restrict_permissions(app)

    return app


def _restrict_permissions(app):
    """Keep the SQLite database and uploads private to the server's user (candidate code runs as `nobody`)."""
    uri = app.config["SQLALCHEMY_DATABASE_URI"]
    paths = [app.config["UPLOAD_DIR"]]
    if uri.startswith("sqlite:///") and ":memory:" not in uri:
        paths.append(uri[len("sqlite:///"):])
    for path in paths:
        try:
            os.chmod(path, 0o700 if os.path.isdir(path) else 0o600)
        except OSError:
            pass
