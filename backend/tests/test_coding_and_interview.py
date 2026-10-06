import shutil

import pytest
from conftest import import_candidates

from app.models import Stage
from app.services import code_runner, grading

SUM_EVEN = {
    "python": "n=int(input())\nprint(sum(x for x in map(int,input().split()) if x%2==0))\n",
    "javascript": "const d=require('fs').readFileSync(0,'utf8').trim().split(/\\s+/).map(Number);"
                  "console.log(d.slice(1).filter(x=>x%2===0).reduce((a,b)=>a+b,0));\n",
    "cpp": "#include <bits/stdc++.h>\nint main(){long long n,x,s=0;std::cin>>n;while(n--){std::cin>>x;if(x%2==0)s+=x;}"
           "std::cout<<s<<std::endl;}\n",
    "java": "import java.util.*;\npublic class Main{public static void main(String[] a){Scanner sc=new Scanner(System.in);"
            "int n=sc.nextInt();long s=0;for(int i=0;i<n;i++){long x=sc.nextLong();if(x%2==0)s+=x;}"
            "System.out.println(s);}}\n",
}
TESTS = [{"input": "5\n1 2 3 4 5\n", "output": "6"}, {"input": "3\n-2 -4 3\n", "output": "-6"}]


@pytest.mark.parametrize("lang", list(SUM_EVEN))
def test_runner_languages(app, lang):
    binary = {"python": "python3", "javascript": "node", "cpp": "g++", "java": "javac"}[lang]
    if not shutil.which(binary):
        pytest.skip(f"{binary} not installed")
    with app.app_context():
        res = code_runner.run(lang, SUM_EVEN[lang], TESTS, 5)
    assert res["compile_error"] is None, res
    assert [t["passed"] for t in res["tests"]] == [True, True], res


def test_runner_failures(app):
    with app.app_context():
        wrong = code_runner.run("python", "print(1)", TESTS)
        assert [t["status"] for t in wrong["tests"]] == ["wrong_answer", "wrong_answer"]
        loop = code_runner.run("python", "while True: pass", TESTS[:1], 1)
        assert loop["tests"][0]["status"] == "time_limit"
        crash = code_runner.run("python", "raise SystemExit(3)", TESTS[:1])
        assert crash["tests"][0]["status"] == "runtime_error"
        if shutil.which("g++"):
            bad = code_runner.run("cpp", "int main( {", TESTS[:1])
            assert bad["compile_error"]


def test_coding_round_end_to_end(app, client, api, make_drive):
    drive = make_drive(("coding",), coding={"num_questions": 1, "languages": ["python"]})
    round_id = drive["rounds"][0]["id"]
    res = api.post(f"/api/rounds/{round_id}/questions", json={
        "text": "Sum the even numbers", "marks": 10,
        "meta": {"title": "Sum Even", "test_cases": [
            {"input": "5\n1 2 3 4 5\n", "output": "6", "hidden": False},
            {"input": "3\n2 2 2\n", "output": "6", "hidden": True},
            {"input": "1\n7\n", "output": "0", "hidden": True},
        ]},
    })
    assert res.status_code == 201, res.json
    import_candidates(api, drive["id"], [["Name", "Email"], ["Coder", "coder@x.test"]])
    api.post(f"/api/rounds/{round_id}/invite", json={})
    with app.app_context():
        token = Stage.query.first().token
    state = client.post(f"/api/assess/{token}/start").json
    h = {"X-Session-Token": state["session_token"]}
    q = state["questions"][0]
    assert q["kind"] == "coding" and len(q["samples"]) == 1 and q["hidden_tests"] == 2
    assert set(q["starter_code"]) == {"python"}

    run = client.post(f"/api/assess/{token}/run", json={"key": q["key"], "language": "python",
                                                      "code": SUM_EVEN["python"]}, headers=h).json
    assert run["tests"][0]["passed"] and run["tests"][0]["expected"] == "6"
    # Rapid re-runs are throttled
    assert client.post(f"/api/assess/{token}/run", json={"key": q["key"], "language": "python", "code": "print(6)"},
                       headers=h).status_code == 429
    # Disallowed language
    r = client.post(f"/api/assess/{token}/answer", json={"key": q["key"], "answer": {"language": "java", "code": ""}},
                    headers=h)
    assert r.status_code == 400

    # Hard-coding the sample output passes the visible test but not the hidden ones.
    client.post(f"/api/assess/{token}/answer", json={"key": q["key"], "answer": {"language": "python",
                                                                               "code": "print(6)"}}, headers=h)
    client.post(f"/api/assess/{token}/submit", headers=h)
    with app.app_context():
        stage = Stage.query.first()
        assert stage.result["questions"][0]["passed"] == 2  # "6" also matches the 2 2 2 case
        assert round(stage.percent, 1) == 66.7


def test_recruiter_can_try_reference_solution(api, make_drive):
    drive = make_drive(("coding",))
    res = api.post(f"/api/rounds/{drive['rounds'][0]['id']}/questions/try", json={
        "language": "python", "code": SUM_EVEN["python"], "meta": {"test_cases": TESTS},
    })
    assert all(t["passed"] for t in res.json["tests"])


def test_interview_heuristic_scoring(app):
    ref = "A process has its own memory space; threads share the memory of their process and are cheaper."
    good = ("A process is an independent program with its own memory space and resources, while threads run inside "
            "a process and share its memory, so they are cheaper to create but need synchronisation.")
    with app.app_context():
        assert grading.heuristic_interview_score(ref, "I don't know") == 0
        assert grading.heuristic_interview_score(ref, good) > grading.heuristic_interview_score(ref, "Threads are fast things in computers that run.")


def test_interview_round_flow(app, client, api, make_drive):
    drive = make_drive(("interview",), interview={"num_questions": 2, "shuffle_questions": False})
    round_id = drive["rounds"][0]["id"]
    api.post(f"/api/rounds/{round_id}/questions/samples")
    import_candidates(api, drive["id"], [["Name", "Email"], ["Talker", "talk@x.test"]])
    api.post(f"/api/rounds/{round_id}/invite", json={})
    with app.app_context():
        token = Stage.query.first().token
    info = client.get(f"/api/assess/{token}").json
    assert info["proctoring"]["require_microphone"] is True
    state = client.post(f"/api/assess/{token}/start").json
    h = {"X-Session-Token": state["session_token"]}
    assert [q["kind"] for q in state["questions"]] == ["interview", "interview"]
    first = state["questions"][0]
    client.post(f"/api/assess/{token}/answer", json={"key": first["key"], "answer": {
        "text": "In my final year project I built a recruitment platform; my role was the backend. The hardest "
                "challenge was scaling the resume parser, which I solved with a queue and caching, cutting time by 60%."}},
        headers=h)
    client.post(f"/api/assess/{token}/submit", headers=h)
    with app.app_context():
        stage = Stage.query.first()
        rows = stage.result["questions"]
        assert rows[0]["score10"] > 0 and rows[1]["score10"] == 0
        assert rows[0]["needs_review"] is True


def test_live_interview_scheduling(app, api, make_drive):
    drive = make_drive(("interview",), interview={"mode": "live"})
    round_id = drive["rounds"][0]["id"]
    assert "Meeting link" in drive["rounds"][0]["config"]["email_body"]
    import_candidates(api, drive["id"], [["Name", "Email"], ["Live", "live@x.test"]])
    with app.app_context():
        stage_id = Stage.query.first().id
    res = api.post(f"/api/rounds/{round_id}/invite", json={})
    assert res.json["invited"] == 0 and res.json["skipped"][0]["reason"] == "no interview slot scheduled"
    api.patch(f"/api/stages/{stage_id}", json={"scheduled_at": "2030-01-01T10:00:00Z", "meeting_link": "https://meet.example/abc"})
    assert api.post(f"/api/rounds/{round_id}/invite", json={}).json["invited"] == 1
    # Interviewer records a score, then the round is evaluated.
    api.patch(f"/api/stages/{stage_id}", json={"percent": 82})
    assert api.post(f"/api/rounds/{round_id}/evaluate", json={}).json["passed"] == 1
    cand = api.get(f"/api/drives/{drive['id']}/candidates").json["candidates"][0]
    assert cand["status"] == "selected"
