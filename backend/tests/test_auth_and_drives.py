from conftest import import_candidates


def test_register_login_and_me(client, api):
    res = client.post("/api/auth/login", json={"email": "rita@acme.test", "password": "password123"})
    assert res.status_code == 200
    assert res.json["user"]["role"] == "admin"
    assert client.post("/api/auth/login", json={"email": "rita@acme.test", "password": "nope"}).status_code == 401
    assert api.get("/api/auth/me").json["user"]["company"]["name"] == "Acme Corp"
    assert client.get("/api/drives").status_code == 401


def test_team_members(api):
    res = api.post("/api/team", json={"name": "Tom", "email": "tom@acme.test", "password": "password123"})
    assert res.status_code == 201
    assert res.json["user"]["role"] == "recruiter"
    assert len(api.get("/api/team").json["users"]) == 2
    dup = api.post("/api/team", json={"name": "Tom", "email": "tom@acme.test", "password": "password123"})
    assert dup.status_code == 409


def test_create_drive_with_custom_rounds(api, make_drive):
    drive = make_drive(("resume_screening", "aptitude", "coding", "interview"),
                       aptitude={"duration_minutes": 45, "pass_score": 70, "proctoring": {"max_violations": 3}})
    types = [r["type"] for r in drive["rounds"]]
    assert types == ["resume_screening", "aptitude", "coding", "interview"]
    apt = drive["rounds"][1]
    assert apt["config"]["duration_minutes"] == 45
    assert apt["config"]["pass_score"] == 70
    assert apt["config"]["proctoring"]["max_violations"] == 3
    assert apt["config"]["proctoring"]["require_webcam"] is True  # default kept

    # Drop the coding round and rename the interview.
    rounds = [{"id": r["id"], "type": r["type"], "name": r["name"], "config": r["config"]} for r in drive["rounds"]]
    rounds = [r for r in rounds if r["type"] != "coding"]
    rounds[-1]["name"] = "Final Interview"
    res = api.put(f"/api/drives/{drive['id']}", json={"rounds": rounds})
    assert res.status_code == 200
    assert [r["name"] for r in res.json["drive"]["rounds"]][-1] == "Final Interview"
    assert len(res.json["drive"]["rounds"]) == 3


def test_invalid_round_config_rejected(api):
    res = api.post("/api/drives", json={"title": "X", "rounds": [{"type": "aptitude", "config": {"pass_score": 150}}]})
    assert res.status_code == 400
    res = api.post("/api/drives", json={"title": "X", "rounds": [{"type": "dance_off"}]})
    assert res.status_code == 400


def test_rounds_locked_after_candidates(api, make_drive):
    drive = make_drive(("aptitude", "coding"))
    import_candidates(api, drive["id"], [["Name", "Email"], ["A", "a@x.test"]])
    rounds = [{"id": r["id"], "type": r["type"]} for r in reversed(drive["rounds"])]
    assert api.put(f"/api/drives/{drive['id']}", json={"rounds": rounds}).status_code == 400
    first_only = [{"id": drive["rounds"][1]["id"], "type": "coding"}]
    assert api.put(f"/api/drives/{drive['id']}", json={"rounds": first_only}).status_code == 400
    # Appending a round is fine.
    appended = [{"id": r["id"], "type": r["type"]} for r in drive["rounds"]] + [{"type": "interview"}]
    assert api.put(f"/api/drives/{drive['id']}", json={"rounds": appended}).status_code == 200


def test_other_company_cannot_see_drive(client, api, make_drive):
    drive = make_drive()
    other = client.post("/api/auth/register", json={
        "company": "Other", "name": "Eve", "email": "eve@other.test", "password": "password123"
    }).json["token"]
    res = client.get(f"/api/drives/{drive['id']}", headers={"Authorization": f"Bearer {other}"})
    assert res.status_code == 404
