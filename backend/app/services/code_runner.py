"""Executes candidate code against test cases.

Backends (CODE_RUNNER):
  local   - resource-limited subprocesses (CPU, memory, file size, process count; drops to `nobody` when running
            as root). This is NOT a security boundary against a determined attacker: run the backend in a
            dedicated, network-isolated container if you use it with untrusted candidates.
  judge0  - delegate to a Judge0 instance (JUDGE0_URL, optional JUDGE0_KEY). Recommended for production.
  disabled- coding rounds can't execute code.
"""

import json
import os
import resource
import shutil
import signal
import subprocess
import tempfile
import time
import urllib.request

from flask import current_app

OUTPUT_LIMIT = 4 * 1024 * 1024  # bytes a program may write
SHOWN_OUTPUT = 2000  # characters returned to the browser

LANGUAGES = {
    "python": {"label": "Python 3", "file": "main.py", "bin": "python3", "run": ["{bin}", "-I", "main.py"]},
    "javascript": {
        "label": "JavaScript (Node.js)",
        "file": "main.js",
        "bin": "node",
        "run": ["{bin}", "--max-old-space-size=256", "main.js"],
    },
    "cpp": {
        "label": "C++17",
        "file": "main.cpp",
        "bin": "g++",
        "compile": ["{bin}", "-O2", "-std=c++17", "-o", "main", "main.cpp"],
        "run": ["./main"],
    },
    "java": {
        "label": "Java",
        "file": "Main.java",
        "bin": "javac",
        "compile": ["{bin}", "-J-Xmx512m", "Main.java"],
        "run": ["{java}", "-Xmx256m", "-Xss64m", "-XX:+UseSerialGC", "-XX:-UsePerfData", "Main"],
    },
}
JUDGE0_IDS = {"python": 71, "javascript": 63, "cpp": 54, "java": 62}


def _binary(lang):
    spec = LANGUAGES[lang]
    path = shutil.which(spec["bin"])
    if lang == "java" and path and not shutil.which("java"):
        return None
    return path


def available_languages():
    mode = current_app.config["CODE_RUNNER"]
    if mode == "disabled":
        return []
    if mode == "judge0":
        return list(LANGUAGES)
    return [lang for lang in LANGUAGES if _binary(lang)]


def normalize(output):
    lines = (output or "").replace("\r\n", "\n").split("\n")
    return "\n".join(line.rstrip() for line in lines).strip()


def _limits(cpu_seconds, memory_mb):
    # Runs in the forked child after the uid switch; keep it to plain syscalls (no imports, no locks).
    def apply():
        resource.setrlimit(resource.RLIMIT_CPU, (cpu_seconds, cpu_seconds + 1))
        resource.setrlimit(resource.RLIMIT_FSIZE, (OUTPUT_LIMIT, OUTPUT_LIMIT))
        resource.setrlimit(resource.RLIMIT_CORE, (0, 0))
        if memory_mb:
            resource.setrlimit(resource.RLIMIT_AS, (memory_mb * 1024 * 1024,) * 2)
        if _DROP_PRIVILEGES:
            resource.setrlimit(resource.RLIMIT_NPROC, (256, 256))

    return apply


# When the server runs as root, candidate code runs as `nobody` so it can't read the app's files or database.
_DROP_PRIVILEGES = hasattr(os, "getuid") and os.getuid() == 0
_USER_ARGS = {"user": 65534, "group": 65534, "extra_groups": []} if _DROP_PRIVILEGES else {}


def _exec(cmd, sandbox, stdin_text, timeout, cpu, memory_mb):
    out_path = os.path.join(sandbox, ".stdout")
    err_path = os.path.join(sandbox, ".stderr")
    env = {"PATH": "/usr/local/bin:/usr/bin:/bin", "HOME": sandbox, "LANG": "C.UTF-8", "TMPDIR": sandbox}
    start = time.monotonic()
    with open(out_path, "wb") as out, open(err_path, "wb") as err:
        proc = subprocess.Popen(
            cmd,
            stdin=subprocess.PIPE,
            stdout=out,
            stderr=err,
            cwd=sandbox,
            env=env,
            start_new_session=True,
            preexec_fn=_limits(cpu, memory_mb),
            **_USER_ARGS,
        )
        timed_out = False
        try:
            proc.communicate((stdin_text or "").encode(), timeout=timeout)
        except subprocess.TimeoutExpired:
            timed_out = True
        except BrokenPipeError:
            pass
        finally:
            try:
                os.killpg(proc.pid, signal.SIGKILL)
            except (ProcessLookupError, PermissionError):
                pass
            proc.wait()
    elapsed = time.monotonic() - start
    with open(out_path, "rb") as fh:
        stdout = fh.read(OUTPUT_LIMIT).decode("utf-8", errors="replace")
    with open(err_path, "rb") as fh:
        stderr = fh.read(64 * 1024).decode("utf-8", errors="replace")
    rc = proc.returncode
    if timed_out or rc in (-signal.SIGXCPU, -signal.SIGKILL):
        status = "time_limit"
    elif rc == -signal.SIGXFSZ:
        status = "output_limit"
    elif rc != 0:
        status = "runtime_error"
    else:
        status = "ok"
    return {"status": status, "stdout": stdout, "stderr": stderr, "time": round(elapsed, 3)}


def _run_local(lang, code, tests, time_limit):
    spec = LANGUAGES[lang]
    binary = _binary(lang)
    if not binary:
        return {"compile_error": f"{spec['label']} is not installed on the server", "tests": []}
    subs = {"bin": binary, "java": shutil.which("java") or "java"}
    memory = None if lang in ("javascript", "java") else 512
    sandbox = tempfile.mkdtemp(prefix="run_")
    try:
        os.chmod(sandbox, 0o777)
        with open(os.path.join(sandbox, spec["file"]), "w", encoding="utf-8") as fh:
            fh.write(code)
        if spec.get("compile"):
            cmd = [part.format(**subs) for part in spec["compile"]]
            compiled = _exec(cmd, sandbox, "", timeout=30, cpu=30, memory_mb=None)
            if compiled["status"] != "ok":
                message = (compiled["stderr"] or compiled["stdout"] or compiled["status"])[-SHOWN_OUTPUT:]
                return {"compile_error": message, "tests": []}
        cmd = [part.format(**subs) for part in spec["run"]]
        results = []
        for test in tests:
            res = _exec(cmd, sandbox, test.get("input", ""), timeout=time_limit * 2 + 1, cpu=time_limit, memory_mb=memory)
            results.append(_judge(res, test))
        return {"compile_error": None, "tests": results}
    finally:
        shutil.rmtree(sandbox, ignore_errors=True)


def _judge(res, test):
    passed = res["status"] == "ok" and normalize(res["stdout"]) == normalize(test.get("output", ""))
    status = "passed" if passed else ("wrong_answer" if res["status"] == "ok" else res["status"])
    return {"passed": passed, "status": status, "stdout": res["stdout"], "stderr": res["stderr"], "time": res["time"]}


def _run_judge0(lang, code, tests, time_limit):
    cfg = current_app.config
    headers = {"Content-Type": "application/json"}
    if cfg["JUDGE0_KEY"]:
        headers["X-Auth-Token"] = cfg["JUDGE0_KEY"]
        headers["X-RapidAPI-Key"] = cfg["JUDGE0_KEY"]
    results = []
    for test in tests:
        body = json.dumps(
            {
                "source_code": code,
                "language_id": JUDGE0_IDS[lang],
                "stdin": test.get("input", ""),
                "cpu_time_limit": time_limit,
                "memory_limit": 262144,
            }
        ).encode()
        req = urllib.request.Request(
            f"{cfg['JUDGE0_URL']}/submissions?base64_encoded=false&wait=true", data=body, headers=headers
        )
        try:
            with urllib.request.urlopen(req, timeout=time_limit * 4 + 20) as resp:
                data = json.loads(resp.read().decode())
        except Exception as exc:
            return {"compile_error": f"Code execution service unavailable: {exc}", "tests": []}
        status_id = (data.get("status") or {}).get("id")
        if status_id == 6:
            return {"compile_error": (data.get("compile_output") or "Compilation failed")[-SHOWN_OUTPUT:], "tests": []}
        mapped = {3: "ok", 4: "ok", 5: "time_limit"}.get(status_id, "runtime_error")
        res = {"status": mapped, "stdout": data.get("stdout") or "", "stderr": data.get("stderr") or "",
               "time": float(data.get("time") or 0)}
        results.append(_judge(res, test))
    return {"compile_error": None, "tests": results}


def run(lang, code, tests, time_limit=2):
    """Run `code` against each test ({"input", "output"}). Returns {"compile_error", "tests": [...]}."""
    mode = current_app.config["CODE_RUNNER"]
    if lang not in LANGUAGES:
        return {"compile_error": f"Unsupported language '{lang}'", "tests": []}
    if mode == "disabled":
        return {"compile_error": "Code execution is disabled on this server", "tests": []}
    if len(code or "") > 100_000:
        return {"compile_error": "Code is too long (max 100 KB)", "tests": []}
    time_limit = max(1, min(int(time_limit or 2), 10))
    if mode == "judge0":
        return _run_judge0(lang, code, tests, time_limit)
    return _run_local(lang, code, tests, time_limit)


def public_view(result, tests):
    """Strip outputs of hidden tests before returning results to the candidate."""
    if result.get("compile_error"):
        return {"compile_error": result["compile_error"], "tests": []}
    out = []
    for test, res in zip(tests, result["tests"]):
        item = {"passed": res["passed"], "status": res["status"], "time": res["time"], "hidden": bool(test.get("hidden"))}
        if not test.get("hidden"):
            item.update(
                {
                    "input": test.get("input", "")[:SHOWN_OUTPUT],
                    "expected": test.get("output", "")[:SHOWN_OUTPUT],
                    "stdout": res["stdout"][:SHOWN_OUTPUT],
                    "stderr": res["stderr"][:SHOWN_OUTPUT],
                }
            )
        out.append(item)
    return {"compile_error": None, "tests": out}
