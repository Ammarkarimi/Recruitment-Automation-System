import io
import os
import sys

import pytest
from openpyxl import Workbook

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from app import create_app  # noqa: E402
from app.config import TestConfig  # noqa: E402
from app.extensions import db  # noqa: E402


@pytest.fixture
def app(tmp_path):
    app = create_app(TestConfig, UPLOAD_DIR=str(tmp_path / "uploads"))
    yield app
    with app.app_context():
        db.session.remove()
        db.drop_all()


@pytest.fixture
def client(app):
    return app.test_client()


class Api:
    def __init__(self, client):
        self.client = client
        self.token = None

    def _headers(self, extra=None):
        h = {"Authorization": f"Bearer {self.token}"} if self.token else {}
        h.update(extra or {})
        return h

    def get(self, url, **kw):
        return self.client.get(url, headers=self._headers(kw.pop("headers", None)), **kw)

    def post(self, url, json=None, **kw):
        return self.client.post(url, json=json, headers=self._headers(kw.pop("headers", None)), **kw)

    def put(self, url, json=None):
        return self.client.put(url, json=json, headers=self._headers())

    def patch(self, url, json=None):
        return self.client.patch(url, json=json, headers=self._headers())

    def delete(self, url):
        return self.client.delete(url, headers=self._headers())


@pytest.fixture
def api(client):
    a = Api(client)
    res = client.post("/api/auth/register", json={
        "company": "Acme Corp", "name": "Rita Recruiter", "email": "rita@acme.test", "password": "password123"
    })
    assert res.status_code == 201, res.json
    a.token = res.json["token"]
    return a


def xlsx(rows):
    wb = Workbook()
    ws = wb.active
    for row in rows:
        ws.append(row)
    buf = io.BytesIO()
    wb.save(buf)
    buf.seek(0)
    return buf


@pytest.fixture
def make_drive(api):
    def make(round_types=("aptitude",), **round_config):
        rounds = [{"type": t, "config": round_config.get(t, {})} for t in round_types]
        res = api.post("/api/drives", json={
            "title": "Backend Engineer",
            "description": "We need a Python developer with Flask, SQL and REST API experience.",
            "skills": ["Python", "Flask", "SQL", "Docker"],
            "rounds": rounds,
        })
        assert res.status_code == 201, res.json
        return res.json["drive"]

    return make


def import_candidates(api, drive_id, rows):
    file = xlsx(rows)
    return api.post(f"/api/drives/{drive_id}/candidates/import",
                    data={"file": (file, "candidates.xlsx")}, content_type="multipart/form-data")
