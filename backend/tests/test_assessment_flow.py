from datetime import timedelta

from conftest import import_candidates

from app.extensions import db
from app.models import EmailLog, Question, Stage, utcnow


def _setup_aptitude(api, make_drive, n_candidates=1, **config):
    drive = make_drive(("aptitude", "interview"), aptitude={"num_questions": 5, **config})
    round_id = drive["rounds"][0]["id"]
    assert api.post(f"/api/rounds/{round_id}/questions/samples").json["created"] >= 5
    rows = [["Name", "Email"]] + [[f"Cand {i}", f"c{i}@x.test"] for i in range(n_candidates)]
    import_candidates(api, drive["id"], rows)
    return drive, round_id


def _token(app, email):
    with app.app_context():
        return Stage.query.join(Stage.candidate).filter_by(email=email).first().token


def _start(client, token, session=None):
    headers = {"X-Session-Token": session} if session else {}
    return client.post(f"/api/assess/{token}/start", headers=headers)


def test_invite_sends_personal_links(app, api, make_drive):
    drive, round_id = _setup_aptitude(api, make_drive, n_candidates=3)
    res = api.post(f"/api/rounds/{round_id}/invite", json={})
    assert res.json["invited"] == 3
    with app.app_context():
        logs = EmailLog.query.all()
        assert len(logs) == 3
        assert {e.status for e in logs} == {"simulated"}
        tokens = {s.token for s in Stage.query.all()}
        assert len(tokens) == 3 and None not in tokens
        assert all(f"/assess/{s.token}" in EmailLog.query.filter_by(stage_id=s.id).first().html for s in Stage.query.all())
    # Already invited candidates are skipped unless resending.
    assert api.post(f"/api/rounds/{round_id}/invite", json={}).json["invited"] == 0
    assert api.post(f"/api/rounds/{round_id}/invite", json={"resend": True, "candidate_ids": [1]}).json["invited"] == 1


def test_invite_requires_questions(api, make_drive):
    drive = make_drive(("aptitude",))
    import_candidates(api, drive["id"], [["Name", "Email"], ["A", "a@x.test"]])
    res = api.post(f"/api/rounds/{drive['rounds'][0]['id']}/invite", json={})
    assert res.status_code == 400


def test_full_aptitude_attempt_scores_and_hides_answers(app, client, api, make_drive):
    drive, round_id = _setup_aptitude(api, make_drive)
    api.post(f"/api/rounds/{round_id}/invite", json={})
    token = _token(app, "c0@x.test")

    info = client.get(f"/api/assess/{token}").json
    assert info["status"] == "invited" and info["round"]["type"] == "aptitude"
    assert info["proctoring"]["require_webcam"] is True

    res = _start(client, token)
    assert res.status_code == 200, res.json
    state = res.json
    session = state["session_token"]
    assert len(state["questions"]) == 5
    assert all("answer" not in q for q in state["questions"])

    # Answer everything correctly using the server-side shuffle mapping.
    with app.app_context():
        stage = Stage.query.filter_by(token=token).first()
        for item in stage.assignment:
            q = db.session.get(Question, item["qid"])
            shown = item["order"].index(q.answer)
            r = client.post(f"/api/assess/{token}/answer", json={"key": item["key"], "answer": {"choice": shown}},
                            headers={"X-Session-Token": session})
            assert r.status_code == 200, r.json

    # A second browser can't take over an active attempt.
    other = _start(client, token)
    assert other.status_code == 409 and other.json["session_conflict"]
    # Wrong session token is rejected for writes.
    assert client.post(f"/api/assess/{token}/submit", headers={"X-Session-Token": "bad"}).status_code == 409

    assert client.post(f"/api/assess/{token}/submit", headers={"X-Session-Token": session}).json["submitted"]
    assert _start(client, token).status_code == 409  # already completed
    assert client.get(f"/api/assess/{token}").json["status"] == "completed"

    with app.app_context():
        stage = Stage.query.filter_by(token=token).first()
        assert stage.status == "submitted" and stage.percent == 100.0

    res = api.post(f"/api/rounds/{round_id}/evaluate", json={"invite_next": True})
    # The interview round has no questions yet: decisions are saved and the invite problem is reported.
    assert res.json["passed"] == 1 and res.json["invited_next"] == 0
    assert "Add questions" in res.json["invite_error"]
    interview_id = drive["rounds"][1]["id"]
    api.post(f"/api/rounds/{interview_id}/questions/samples")
    assert api.post(f"/api/rounds/{interview_id}/invite", json={}).json["invited"] == 1


def test_violation_limit_terminates_attempt(app, client, api, make_drive):
    drive, round_id = _setup_aptitude(api, make_drive, proctoring={"max_violations": 3})
    api.post(f"/api/rounds/{round_id}/invite", json={})
    token = _token(app, "c0@x.test")
    session = _start(client, token).json["session_token"]
    h = {"X-Session-Token": session}

    r = client.post(f"/api/assess/{token}/events", json={"events": [{"type": "tab_hidden"}]}, headers=h)
    assert r.json == {"violations": 1, "max_violations": 3, "terminated": False}
    # blur fired together with the tab switch is coalesced
    r = client.post(f"/api/assess/{token}/events", json={"events": [{"type": "window_blur"}]}, headers=h)
    assert r.json["violations"] == 1
    r = client.post(f"/api/assess/{token}/events", json={"events": [{"type": "paste"}, {"type": "multiple_faces"}]},
                    headers=h)
    assert r.json["terminated"] is True and r.json["violations"] == 3

    with app.app_context():
        stage = Stage.query.filter_by(token=token).first()
        assert stage.status == "submitted" and stage.terminated
        assert stage.integrity < 100
    detail = api.get(f"/api/stages/{stage.id}").json
    assert any(e["type"] == "terminated" for e in detail["events"])

    res = api.post(f"/api/rounds/{round_id}/evaluate", json={})
    assert res.json["failed"] == 1  # terminated attempts fail automatically


def test_disabled_checks_do_not_count(app, client, api, make_drive):
    drive, round_id = _setup_aptitude(api, make_drive, proctoring={"block_copy_paste": False, "max_violations": 2})
    api.post(f"/api/rounds/{round_id}/invite", json={})
    token = _token(app, "c0@x.test")
    session = _start(client, token).json["session_token"]
    r = client.post(f"/api/assess/{token}/events", json={"events": [{"type": "paste"}, {"type": "copy"}]},
                    headers={"X-Session-Token": session})
    assert r.json["violations"] == 0


def test_time_limit_auto_submits(app, client, api, make_drive):
    drive, round_id = _setup_aptitude(api, make_drive)
    api.post(f"/api/rounds/{round_id}/invite", json={})
    token = _token(app, "c0@x.test")
    session = _start(client, token).json["session_token"]
    with app.app_context():
        stage = Stage.query.filter_by(token=token).first()
        stage.deadline_at = utcnow() - timedelta(minutes=5)
        db.session.commit()
    r = client.post(f"/api/assess/{token}/answer", json={"key": "x", "answer": {}}, headers={"X-Session-Token": session})
    assert r.status_code == 410 and r.json["finished"]
    with app.app_context():
        assert Stage.query.filter_by(token=token).first().status == "submitted"


def test_stale_session_can_resume_with_violation(app, client, api, make_drive):
    drive, round_id = _setup_aptitude(api, make_drive)
    api.post(f"/api/rounds/{round_id}/invite", json={})
    token = _token(app, "c0@x.test")
    _start(client, token)
    with app.app_context():
        stage = Stage.query.filter_by(token=token).first()
        stage.last_seen_at = utcnow() - timedelta(minutes=10)
        db.session.commit()
    res = _start(client, token)
    assert res.status_code == 200 and res.json["violations"] == 1


def test_expired_link_and_retake(app, client, api, make_drive):
    drive, round_id = _setup_aptitude(api, make_drive)
    api.post(f"/api/rounds/{round_id}/invite", json={})
    token = _token(app, "c0@x.test")
    with app.app_context():
        stage = Stage.query.filter_by(token=token).first()
        stage.token_expires_at = utcnow() - timedelta(hours=1)
        db.session.commit()
        stage_id = stage.id
    assert _start(client, token).status_code == 410
    api.get(f"/api/drives/{drive['id']}")  # sweeps expired links
    with app.app_context():
        assert db.session.get(Stage, stage_id).status == "expired"
    res = api.post(f"/api/stages/{stage_id}/reset", json={"mode": "retake"})
    assert res.status_code == 200 and res.json["stage"]["status"] == "invited"
    new_token = _token(app, "c0@x.test")
    assert new_token != token and _start(client, new_token).status_code == 200


def test_top_n_and_manual_decisions(app, client, api, make_drive):
    drive, round_id = _setup_aptitude(api, make_drive, n_candidates=3, pass_mode="top_n", top_n=1)
    api.post(f"/api/rounds/{round_id}/invite", json={})
    for i, n_correct in enumerate([1, 4, 2]):
        token = _token(app, f"c{i}@x.test")
        session = _start(client, token).json["session_token"]
        with app.app_context():
            stage = Stage.query.filter_by(token=token).first()
            for item in stage.assignment[:n_correct]:
                q = db.session.get(Question, item["qid"])
                client.post(f"/api/assess/{token}/answer", json={"key": item["key"], "answer": {"choice": item["order"].index(q.answer)}},
                            headers={"X-Session-Token": session})
        client.post(f"/api/assess/{token}/submit", headers={"X-Session-Token": session})
    res = api.post(f"/api/rounds/{round_id}/evaluate", json={})
    assert res.json["passed"] == 1 and res.json["failed"] == 2
    cands = {c["email"]: c for c in api.get(f"/api/drives/{drive['id']}/candidates").json["candidates"]}
    assert cands["c1@x.test"]["status"] == "active"
    assert cands["c1@x.test"]["current_round_id"] == drive["rounds"][1]["id"]
    # Recruiter overrides: bring back c2.
    stage_id = cands["c2@x.test"]["stages"][str(round_id)]["id"]
    res = api.post(f"/api/stages/{stage_id}/decide", json={"decision": "pass"})
    assert res.status_code == 200 and res.json["candidate"]["status"] == "active"


def test_export_report(api, make_drive):
    drive, _ = _setup_aptitude(api, make_drive, n_candidates=2)
    res = api.get(f"/api/drives/{drive['id']}/export")
    assert res.status_code == 200
    assert res.data[:2] == b"PK"


def test_snapshot_upload(app, client, api, make_drive):
    drive, round_id = _setup_aptitude(api, make_drive)
    api.post(f"/api/rounds/{round_id}/invite", json={})
    token = _token(app, "c0@x.test")
    session = _start(client, token).json["session_token"]
    png = ("data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==")
    h = {"X-Session-Token": session}
    assert client.post(f"/api/assess/{token}/snapshot", json={"image": png, "faces": 2}, headers=h).status_code == 200
    assert client.post(f"/api/assess/{token}/snapshot", json={"image": "data:text/html;base64,PGI+"}, headers=h).status_code == 400
    with app.app_context():
        stage = Stage.query.filter_by(token=token).first()
        snap = stage.snapshots.first()
        assert snap.flagged
    assert api.get(f"/api/snapshots/{snap.id}").status_code == 200
