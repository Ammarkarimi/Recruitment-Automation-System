from flask import jsonify


class ApiError(Exception):
    def __init__(self, message, status=400, **extra):
        super().__init__(message)
        self.message = message
        self.status = status
        self.extra = extra


def register_error_handlers(app):
    @app.errorhandler(ApiError)
    def handle_api_error(err):
        return jsonify({"error": err.message, **err.extra}), err.status

    @app.errorhandler(404)
    def not_found(_):
        return jsonify({"error": "Not found"}), 404

    @app.errorhandler(405)
    def method_not_allowed(_):
        return jsonify({"error": "Method not allowed"}), 405

    @app.errorhandler(413)
    def too_large(_):
        return jsonify({"error": "Upload is too large"}), 413

    @app.errorhandler(500)
    def server_error(_):
        return jsonify({"error": "Internal server error"}), 500
