import io

from conftest import import_candidates, xlsx


def test_excel_import_maps_columns_and_reports_errors(api, make_drive):
    drive = make_drive(("resume_screening", "aptitude"))
    res = import_candidates(api, drive["id"], [
        ["Full Name", "E-mail ID", "Mobile Number", "College", "CGPA"],
        ["Asha Verma", "Asha@Example.com", 9876543210, "ABC Tech", 8.4],
        ["Rahul Mehta", "rahul@example.com", "9123456780", "XYZ Univ", 7.9],
        ["Dup", "asha@example.com", "", "", ""],
        ["Bad", "not-an-email", "", "", ""],
    ])
    assert res.status_code == 200, res.json
    assert res.json["created"] == 2
    assert len(res.json["errors"]) == 2
    cands = api.get(f"/api/drives/{drive['id']}/candidates").json["candidates"]
    asha = next(c for c in cands if c["email"] == "asha@example.com")
    assert asha["phone"] == "9876543210"
    assert asha["extra"]["College"] == "ABC Tech"
    first_round = drive["rounds"][0]["id"]
    assert asha["current_round_id"] == first_round
    assert asha["stages"][str(first_round)]["status"] == "pending"

    # Re-importing the same file adds nobody new.
    again = import_candidates(api, drive["id"], [["Name", "Email"], ["Asha", "asha@example.com"]])
    assert again.json["created"] == 0 and again.json["duplicates"] == ["asha@example.com"]


def test_csv_import_with_first_last_name(api, make_drive):
    drive = make_drive()
    csv_data = io.BytesIO(b"First Name,Last Name,Email\nJane,Doe,jane@x.test\n")
    res = api.post(f"/api/drives/{drive['id']}/candidates/import", data={"file": (csv_data, "list.csv")},
                   content_type="multipart/form-data")
    assert res.json["created"] == 1
    assert api.get(f"/api/drives/{drive['id']}/candidates").json["candidates"][0]["name"] == "Jane Doe"


def test_missing_email_column(api, make_drive):
    drive = make_drive()
    res = import_candidates(api, drive["id"], [["Name", "Phone"], ["A", "1"]])
    assert res.status_code == 400
    assert "email" in res.json["error"].lower()


def test_resume_upload_screening_and_advance(api, make_drive):
    drive = make_drive(("resume_screening", "aptitude"), resume_screening={"pass_score": 40})
    import_candidates(api, drive["id"], [["Name", "Email"], ["Strong Fit", "strong@x.test"], ["Weak Fit", "weak@x.test"],
                                         ["No Resume", "none@x.test"]])
    strong = b"Strong Fit strong@x.test\nPython developer. Built REST API services with Flask and SQL. Docker."
    weak = b"Weak Fit\nContact: weak@x.test\nGraphic designer skilled in Photoshop and illustration."
    res = api.post(f"/api/drives/{drive['id']}/resumes", data={
        "files": [(io.BytesIO(strong), "strong.txt"), (io.BytesIO(weak), "cv_weak.txt"),
                  (io.BytesIO(b"random person r@nowhere.test"), "other.txt")],
    }, content_type="multipart/form-data")
    assert res.json["matched"] == 2
    assert res.json["unmatched"] == ["other.txt"]

    screening, aptitude = drive["rounds"][0]["id"], drive["rounds"][1]["id"]
    res = api.post(f"/api/rounds/{screening}/screen")
    assert res.json == {"screened": 3, "without_resume": 1}
    cands = {c["email"]: c for c in api.get(f"/api/drives/{drive['id']}/candidates").json["candidates"]}
    s_strong = cands["strong@x.test"]["stages"][str(screening)]
    s_weak = cands["weak@x.test"]["stages"][str(screening)]
    assert s_strong["percent"] > 60 > s_weak["percent"]

    res = api.post(f"/api/rounds/{screening}/evaluate", json={})
    assert res.json["passed"] == 1 and res.json["failed"] == 2
    cands = {c["email"]: c for c in api.get(f"/api/drives/{drive['id']}/candidates").json["candidates"]}
    assert cands["strong@x.test"]["current_round_id"] == aptitude
    assert cands["strong@x.test"]["stages"][str(aptitude)]["status"] == "pending"
    assert cands["weak@x.test"]["status"] == "rejected"


def test_resume_upload_creates_candidates(api, make_drive):
    drive = make_drive(("resume_screening",))
    res = api.post(f"/api/drives/{drive['id']}/resumes", data={
        "files": [(io.BytesIO(b"John Smith\njohn.smith@mail.test\nJava developer"), "John_Smith_Resume.txt")],
        "create_missing": "true",
    }, content_type="multipart/form-data")
    assert res.json["created"] == 1
    cand = api.get(f"/api/drives/{drive['id']}/candidates").json["candidates"][0]
    assert cand["email"] == "john.smith@mail.test" and cand["name"] == "John Smith" and cand["has_resume"]


def test_mcq_import_and_templates(api, make_drive):
    drive = make_drive()
    round_id = drive["rounds"][0]["id"]
    file = xlsx([
        ["Question", "Option A", "Option B", "Option C", "Option D", "Answer", "Marks"],
        ["2+2?", "3", "4", "5", "6", "B", 2],
        ["Capital of France?", "Paris", "Rome", "", "", "Paris", ""],
        ["Broken", "x", "", "", "", "A", ""],
    ])
    res = api.post(f"/api/rounds/{round_id}/questions/import", data={"file": (file, "q.xlsx")},
                   content_type="multipart/form-data")
    assert res.json["created"] == 2 and len(res.json["errors"]) == 1
    qs = api.get(f"/api/rounds/{round_id}/questions").json["questions"]
    assert qs[0]["answer"] == 1 and qs[0]["marks"] == 2
    assert qs[1]["options"] == ["Paris", "Rome"] and qs[1]["answer"] == 0
    assert api.get("/api/templates/candidates.xlsx").status_code == 200
    assert api.get("/api/templates/mcqs.xlsx").status_code == 200
