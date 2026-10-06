import logging
import os

from dotenv import load_dotenv
from flask import Flask, jsonify, send_from_directory
from flask_cors import CORS

load_dotenv(os.path.join(os.path.dirname(__file__), "..", ".env"))

from .config import Config  # noqa: E402  (reads env vars loaded above)
from .errors import register_error_handlers  # noqa: E402
from .extensions import db  # noqa: E402


def create_app(config_object=Config, **overrides):
    app = Flask(__name__, static_folder=None)  # "/static" belongs to the React build
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

    _serve_frontend(app)

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


def _serve_frontend(app):
    """Serve the built React app (npm run build) from Flask, so one process can host everything."""
    build_dir = app.config.get("FRONTEND_BUILD_DIR")
    if not build_dir or not os.path.isfile(os.path.join(build_dir, "index.html")):
        return

    @app.get("/", defaults={"path": ""})
    @app.get("/<path:path>")
    def spa(path):
        if path.startswith("api/"):
            return jsonify({"error": "Not found"}), 404
        if path and os.path.isfile(os.path.join(build_dir, path)):
            return send_from_directory(build_dir, path)
        return send_from_directory(build_dir, "index.html")
