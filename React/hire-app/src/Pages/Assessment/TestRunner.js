import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  AppBar,
  Backdrop,
  Box,
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Paper,
  Toolbar,
  Tooltip,
  Typography,
} from "@mui/material";
import TimerIcon from "@mui/icons-material/Timer";
import WarningAmberIcon from "@mui/icons-material/WarningAmber";
import FullscreenIcon from "@mui/icons-material/Fullscreen";
import FaceIcon from "@mui/icons-material/Face";
import useProctoring from "./useProctoring";
import AptitudeTest from "./AptitudeTest";
import CodingTest from "./CodingTest";
import InterviewTest from "./InterviewTest";

function formatTime(sec) {
  const s = Math.max(0, Math.floor(sec));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const ss = String(s % 60).padStart(2, "0");
  return h ? `${h}:${String(m).padStart(2, "0")}:${ss}` : `${m}:${ss}`;
}

const FACE_LABEL = { ok: ["Face OK", "success"], none: ["No face", "error"], multiple: ["Multiple faces", "error"], loading: ["Face check...", "default"], unavailable: ["Face check off", "default"] };

export default function TestRunner({ info, api, initial, stream, onFinished }) {
  const videoRef = useRef(null);
  const [answers, setAnswers] = useState(initial.answers || {});
  const [deadline, setDeadline] = useState(() => Date.now() + (initial.remaining_seconds ?? 0) * 1000);
  const [remaining, setRemaining] = useState(initial.remaining_seconds ?? 0);
  const [confirmSubmit, setConfirmSubmit] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const submittedRef = useRef(false);

  const finish = useCallback(
    (message, reason = "done") => {
      submittedRef.current = true;
      onFinished(message, reason);
    },
    [onFinished]
  );

  const proctor = useProctoring({
    api,
    config: info.proctoring,
    active: true,
    videoRef,
    stream,
    onStatus: (res) => res.remaining_seconds != null && setDeadline(Date.now() + res.remaining_seconds * 1000),
    onFinished: finish,
  });
  const { setViolations } = proctor;
  useEffect(() => setViolations(initial.violations || 0), [initial.violations, setViolations]);

  // Callback ref so whichever <video> is mounted (corner preview or interview view) gets the stream.
  const attachVideo = useCallback(
    (el) => {
      videoRef.current = el;
      if (el && stream && el.srcObject !== stream) el.srcObject = stream;
    },
    [stream]
  );

  const handleError = useCallback(
    (err) => {
      const d = err?.response?.data;
      if (d?.finished) finish(d.error);
      else if (d?.session_conflict) finish(d.error, "conflict");
      return d?.error;
    },
    [finish]
  );

  // Answers are saved as the candidate works; debounced saves (code) wait in `pending`. Submitting first flushes
  // everything so no answer can lose the race against the submit request.
  const pending = useRef({});
  const inflight = useRef(new Set());

  const send = useCallback(
    (key, answer) => {
      const req = api
        .answer(key, answer)
        .catch(handleError)
        .finally(() => inflight.current.delete(req));
      inflight.current.add(req);
      return req;
    },
    [api, handleError]
  );

  const save = useCallback(
    (key, answer, { debounceMs = 0 } = {}) => {
      setAnswers((a) => ({ ...a, [key]: answer }));
      clearTimeout(pending.current[key]?.timer);
      delete pending.current[key];
      if (!debounceMs) return send(key, answer);
      pending.current[key] = {
        answer,
        timer: setTimeout(() => {
          delete pending.current[key];
          send(key, answer);
        }, debounceMs),
      };
      return undefined;
    },
    [send]
  );

  const flushSaves = useCallback(async () => {
    Object.entries(pending.current).forEach(([key, { answer, timer }]) => {
      clearTimeout(timer);
      send(key, answer);
    });
    pending.current = {};
    await Promise.allSettled([...inflight.current]);
  }, [send]);

  const submit = useCallback(
    async (auto = false) => {
      if (submittedRef.current) return;
      setSubmitting(true);
      try {
        await flushSaves();
        await api.submit();
        finish(auto ? "Time is up. Your answers were submitted automatically." : null);
      } catch (err) {
        if (!handleError(err)) setSubmitting(false);
      }
    },
    [api, finish, handleError, flushSaves]
  );

  // Countdown; auto-submit at zero.
  useEffect(() => {
    const t = setInterval(() => {
      const left = Math.round((deadline - Date.now()) / 1000);
      setRemaining(left);
      if (left <= 0) {
        clearInterval(t);
        submit(true);
      }
    }, 1000);
    return () => clearInterval(t);
  }, [deadline, submit]);

  const questions = initial.questions;
  const unanswered = questions.filter((q) => {
    const a = answers[q.key];
    if (!a) return true;
    if (q.kind === "mcq") return a.choice === null || a.choice === undefined;
    if (q.kind === "coding") return !(a.code || "").trim();
    return !(a.text || "").trim();
  }).length;

  const [faceText, faceColor] = FACE_LABEL[proctor.faceStatus] || [];
  const lowTime = remaining <= 300;
  const proctored = info.proctoring?.enabled !== false;

  return (
    <Box className={proctored && info.proctoring?.block_copy_paste && info.round.type === "aptitude" ? "no-select" : ""} sx={{ minHeight: "100vh", bgcolor: "background.default" }}>
      <AppBar position="sticky" color="inherit" sx={{ borderBottom: "1px solid #e6e8f0", boxShadow: "none" }}>
        <Toolbar sx={{ gap: 2 }}>
          <Box sx={{ flexGrow: 1, minWidth: 0 }}>
            <Typography fontWeight={700} noWrap>{info.round.name}</Typography>
            <Typography variant="caption" color="text.secondary" noWrap>{info.candidate.name} · {info.company}</Typography>
          </Box>
          {proctored && info.proctoring.detect_faces && faceText && <Chip size="small" icon={<FaceIcon />} label={faceText} color={faceColor} variant="outlined" />}
          {proctored && (
            <Tooltip describeChild title="Proctoring violations recorded">
              <Chip
                icon={<WarningAmberIcon />}
                label={`${proctor.violations}${proctor.maxViolations ? ` / ${proctor.maxViolations}` : ""}`}
                color={proctor.violations ? "warning" : "default"}
              />
            </Tooltip>
          )}
          <Chip icon={<TimerIcon />} label={formatTime(remaining)} color={lowTime ? "error" : "primary"} sx={{ fontWeight: 700, fontSize: 16, px: 1 }} />
          {info.round.type !== "interview" && (
            <Button variant="contained" color="success" onClick={() => setConfirmSubmit(true)} disabled={submitting}>
              Submit test
            </Button>
          )}
        </Toolbar>
      </AppBar>

      <Box sx={{ p: { xs: 1, md: 2 }, pb: info.round.type === "interview" ? 2 : 18 }}>
        {info.round.type === "aptitude" && <AptitudeTest questions={questions} answers={answers} save={save} />}
        {info.round.type === "coding" && <CodingTest questions={questions} answers={answers} save={save} api={api} languages={info.languages} onError={handleError} />}
        {info.round.type === "interview" && (
          <InterviewTest
            questions={questions}
            answers={answers}
            save={save}
            stream={stream}
            videoRef={attachVideo}
            secondsPerQuestion={info.seconds_per_question || 180}
            onDone={() => submit(false)}
            submitting={submitting}
          />
        )}
      </Box>

      {/* Webcam preview (also the source for face detection and snapshots). */}
      {info.round.type !== "interview" && stream && stream.getVideoTracks().length > 0 && (
        <Paper sx={{ position: "fixed", right: 16, bottom: 16, width: 150, overflow: "hidden", zIndex: 1200, borderRadius: 2 }}>
          <video ref={attachVideo} autoPlay playsInline muted style={{ width: "100%", display: "block", transform: "scaleX(-1)" }} />
        </Paper>
      )}

      <Dialog open={confirmSubmit} onClose={() => setConfirmSubmit(false)}>
        <DialogTitle>Submit your test?</DialogTitle>
        <DialogContent>
          <Typography>
            {unanswered ? `You have ${unanswered} unanswered question${unanswered > 1 ? "s" : ""}. ` : "All questions answered. "}
            You can't change your answers after submitting.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmSubmit(false)}>Keep working</Button>
          <Button variant="contained" color="success" disabled={submitting} onClick={() => submit(false)}>Submit</Button>
        </DialogActions>
      </Dialog>

      <Dialog open={Boolean(proctor.warning) && !proctor.fullscreenLost}>
        <DialogTitle sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <WarningAmberIcon color="warning" /> Proctoring warning
        </DialogTitle>
        <DialogContent>
          <Typography gutterBottom>{proctor.warning}</Typography>
          <Typography variant="body2" color="text.secondary">
            This has been recorded{proctor.maxViolations ? ` (${proctor.violations} of ${proctor.maxViolations} allowed violations). Reaching the limit ends your test automatically.` : "."}
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button variant="contained" onClick={proctor.clearWarning}>I understand</Button>
        </DialogActions>
      </Dialog>

      <Backdrop open={proctored && proctor.fullscreenLost} sx={{ zIndex: 2000, bgcolor: "rgba(15,23,42,0.96)", color: "#fff", flexDirection: "column", gap: 2, textAlign: "center", p: 3 }}>
        <FullscreenIcon sx={{ fontSize: 64 }} />
        <Typography variant="h5" fontWeight={700}>Full-screen mode is required</Typography>
        <Typography>Leaving full screen was recorded as a violation. Return to full screen to continue your test.</Typography>
        <Button variant="contained" size="large" onClick={() => { proctor.requestFullscreen(); proctor.clearWarning(); }}>
          Return to full screen
        </Button>
      </Backdrop>
    </Box>
  );
}
