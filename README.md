# 🤖 Recruitment Automation System

An end-to-end hiring platform. A company's hiring team builds its own pipeline of rounds, imports candidates
from Excel, sends everyone a personal test link in one click, and candidates take **proctored** aptitude tests,
coding tests and AI interviews. Scores, cheating signals and pass/fail decisions all flow back to one dashboard.

**Flask** (backend API) + **React / MUI** (recruiter dashboard and candidate test app).

---
## 🎥 Demo Video
🔗 [Original prototype demo](https://drive.google.com/file/d/1RVsJ96t_CYDnzQ9Z_ZtRqtROlh0naSlq/view?usp=sharing)

---
## 🚀 Features

### For the hiring team
- **Company workspace & team**: register a company, add recruiters/admins.
- **Hiring drives with a custom pipeline**: per drive, add, remove, rename and reorder rounds:
  | Round | What it does |
  |---|---|
  | Resume Screening | Scores resumes against the job description + required skills (TF-IDF + skill coverage, optional AI score) |
  | Aptitude Test | Timed MCQ test, random question subset & option order per candidate, optional negative marking |
  | Coding Test | Problems with visible sample tests and hidden test cases, run in a sandbox (Python, JavaScript, C++, Java) |
  | Interview | **AI video interview** (questions spoken aloud, answers transcribed & scored) or **live** interview with a scheduled slot + meeting link |
- **Every round is configurable**: duration, number of questions, test window (open/close time), link validity,
  pass rule (cut-off %, top N, or manual), minimum integrity score, auto-fail on cheating, auto-invite to the next
  round, the invitation email template, and every proctoring check.
- **Bulk candidate import** from `.xlsx`/`.csv` (columns are auto-detected: Name / First+Last name, Email, Phone;
  any other column such as College or CGPA is kept). Duplicates and invalid rows are reported.
- **Bulk resume upload**: many PDFs or one ZIP; each resume is matched to its candidate by the email inside it or
  the file name, and can optionally create candidates.
- **Question banks**: write questions, import MCQs from Excel, start from built-in sample sets, or generate with AI.
  Coding problems include a "run my reference solution" check for your test cases.
- **Mass email**: one click emails every waiting candidate their personal link (rate-limited background sending,
  delivery log, retry failed). Bulk selection/rejection emails with templates.
- **Evaluate & advance**: apply the round's rule to all completed attempts; passing candidates move to the next
  round (and can be emailed immediately), the rest are rejected. Any decision can be overridden per candidate.
- **Proctoring report per attempt**: integrity score, violation timeline, webcam snapshot gallery (flagged when 0 or
  2+ faces), IP / browser, answer-by-answer grading, code submitted, interview transcripts.
- **Excel export** of the whole drive's results.

### For candidates
- Personal link (no account needed) → rules + system check (camera, mic, face, full screen, single display) → test.
- Autosave, resume after a browser crash (same tab), server-side timer with auto-submit.

### Proctoring / anti-cheating
| Check | How |
|---|---|
| Tab switching / other apps | `visibilitychange` + window blur (a burst counts once) |
| Full-screen enforcement | test is blocked behind an overlay until the candidate returns to full screen |
| Copy / cut / paste / right-click | blocked and recorded |
| Developer tools & shortcuts | F12, Ctrl+Shift+I/J/C, Ctrl+U/S/P blocked and recorded |
| Face detection | MediaPipe face detector in the browser: no face (≥5 s) or multiple faces |
| Webcam snapshots | every N seconds + immediately when multiple faces are seen |
| Camera / mic turned off | media track `ended` events |
| Background voices / noise | optional microphone level monitoring |
| Extra monitors | `screen.isExtended` (Chromium) |
| Second device / tab | one active session per attempt (session token); taking over a stale session is a violation |
| Network change | IP changes during the attempt are logged |
| Time limits | enforced on the server; late saves are rejected and the attempt is auto-submitted |
| Answer leakage | correct answers and hidden tests never reach the browser; each candidate gets a different question/option order |

Each counted violation lowers the integrity score; after the configured number of violations the test is
terminated and submitted automatically. Browser-based proctoring raises the cost of cheating but can't make it
impossible (e.g. a phone held off-camera). Snapshots and the timeline let your team review suspicious attempts.

---
## 📦 Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18, Material UI, React Router |
| Backend | Flask, SQLAlchemy (SQLite by default, PostgreSQL via `DATABASE_URL`), PyJWT |
| Files | openpyxl (Excel), pypdf (resumes) |
| Proctoring | Web APIs (MediaDevices, Fullscreen, Visibility), MediaPipe Tasks face detector (loaded from CDN) |
| Interview | Web Speech API (text-to-speech + speech-to-text) |
| AI (optional) | Google Gemini via `google-genai` — question generation, personalised interviews, answer & resume scoring |
| Email | SMTP (Gmail, SES, SendGrid, ...) |
| Code execution | Local resource-limited sandbox or [Judge0](https://judge0.com) |

Everything works without an AI key: built-in question banks and keyword-based scoring are used instead.

---
## ⚙️ Setup

### Prerequisites
- Python 3.10+
- Node.js 18+ and npm
- For local code execution: `python3`, and optionally `node`, `g++`, `javac`/`java` on the server

### 1. Backend (Flask API)
```bash
cd backend
python -m venv .venv
source .venv/bin/activate          # Windows: .venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env               # then edit it
python run.py                      # http://localhost:5000
```

### 2. Frontend (React)
```bash
cd React/hire-app
npm install
npm start                          # http://localhost:3000 (API calls are proxied to :5000)
```

Open http://localhost:3000, click **Get started**, create your company account and your first drive.

### Production
Build the frontend and let Flask serve it, so a single process hosts the whole app:
```bash
cd React/hire-app && npm run build
cd ../../backend && gunicorn -w 1 --threads 8 -b 0.0.0.0:5000 run:app
```
Set `FRONTEND_URL` to the public URL so the links in emails are correct. Use PostgreSQL (`DATABASE_URL`) and a
strong `SECRET_KEY`. If the frontend is hosted separately, set `REACT_APP_BACKEND_URL` when building it and add its
origin to `CORS_ORIGINS`.

---
## 🔐 Configuration (`backend/.env`)

| Variable | Purpose |
|---|---|
| `SECRET_KEY` | Signs login tokens. **Required in production** |
| `DATABASE_URL` | Default `sqlite:///instance/hiring.db`; e.g. `postgresql://user:pass@host/db` |
| `FRONTEND_URL` | Base URL used in candidate test links |
| `CORS_ORIGINS` | Comma-separated allowed origins |
| `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASSWORD`, `SMTP_USE_TLS`, `MAIL_FROM` | Email delivery. With no `SMTP_HOST`, emails are only logged ("simulated") and you can copy links from the dashboard |
| `MAIL_RATE_PER_MINUTE` | Throttle for bulk sends (default 60) |
| `GEMINI_API_KEY`, `GEMINI_MODEL` | Optional AI features |
| `CODE_RUNNER` | `local` (default), `judge0` or `disabled` |
| `JUDGE0_URL`, `JUDGE0_KEY` | Judge0 endpoint when `CODE_RUNNER=judge0` |

Gmail: enable 2-step verification and create an **App password** for `SMTP_PASSWORD`
(`SMTP_HOST=smtp.gmail.com`, `SMTP_PORT=587`). For large drives use a transactional email provider.

> **Code execution security.** `CODE_RUNNER=local` runs candidate code in a subprocess with CPU, memory, output and
> process limits, as the unprivileged `nobody` user when the server runs as root, and with the database and
> uploads readable only by the server. It does **not** block network access. Run it on a dedicated, network-isolated
> container, or use Judge0 in production.

Never commit `.env` files (they are git-ignored).

---
## 📄 Spreadsheet formats

**Candidates** (download the template from *Add / import candidates*):

| Name | Email | Phone | College | ... any other columns |
|---|---|---|---|---|

**MCQ questions** (template on the aptitude round's question bank page):

| Question | Option A | Option B | Option C | Option D | Answer | Marks | Topic | Difficulty |
|---|---|---|---|---|---|---|---|---|

`Answer` can be a letter (`B`), a number (`2`) or the option text.

---
## 🔁 Typical workflow
1. **Create a drive** → describe the job → keep/remove/reorder rounds and configure each one.
2. **Add questions** to each test round (your own, Excel import, samples, or AI).
3. **Import candidates** from Excel and upload resumes.
4. **Run screening** → **Evaluate & advance**.
5. **Email test links** to everyone waiting in the next round; candidates take the proctored test.
6. **Evaluate & advance** again (optionally auto-inviting to the next round) until the final round.
7. Review proctoring reports, override decisions, send selection/regret emails, **export results**.

---
## 🧪 Tests
```bash
cd backend
pip install -r requirements.txt
python -m pytest tests
```
The suite covers auth and multi-company isolation, round configuration, Excel/CSV import, resume matching and
screening, invitations, full test attempts, session locking, violation limits and termination, time-limit
auto-submit, link expiry and retakes, top-N/manual decisions, code execution in all four languages, coding and
interview grading, live interview scheduling and exports.

---
## 🗂 Project structure
```
backend/
  app/
    models.py            # Company, User, Drive, Round, Question, Candidate, Stage, ProctorEvent, Snapshot, EmailLog
    routes/              # auth, drives, candidates, questions, pipeline (recruiter) and assessment (candidate) APIs
    services/            # pipeline, grading, proctoring, code_runner, mailer, resumes, spreadsheets, llm, question_bank
  tests/
React/hire-app/src/
  Pages/Dashboard, Drives, Questions, Stage, Team   # recruiter app
  Pages/Assessment                                  # candidate test app (lobby, proctoring hook, test UIs)
samples/resumes/                                    # sample PDF resumes for trying the resume upload
```

---
## 👨‍💻 Developed By

**Mohammed Ammar Karimi**<br>
💼 [LinkedIn](https://www.linkedin.com/in/mohammed-ammar)<br>
🌐 [Website](https://ammarkarimi.vercel.app/)<br>
📫 [Email](mailto:ammarkarimi9898@gmail.com)<br>
