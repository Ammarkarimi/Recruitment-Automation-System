import React, { useEffect, useRef, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Checkbox,
  Chip,
  Divider,
  FormControlLabel,
  Grid,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Paper,
  Stack,
  Typography,
} from "@mui/material";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import ErrorIcon from "@mui/icons-material/Error";
import HourglassEmptyIcon from "@mui/icons-material/HourglassEmpty";
import VideocamIcon from "@mui/icons-material/Videocam";
import { countFaces, loadFaceDetector } from "../../lib/faceDetector";

const isMobile = () => navigator.userAgentData?.mobile ?? /Mobi|Android|iPhone|iPad/i.test(navigator.userAgent);

function Check({ ok, pending, label, detail }) {
  return (
    <ListItem disableGutters>
      <ListItemIcon sx={{ minWidth: 36 }}>
        {pending ? <HourglassEmptyIcon color="disabled" /> : ok ? <CheckCircleIcon color="success" /> : <ErrorIcon color="error" />}
      </ListItemIcon>
      <ListItemText primary={label} secondary={detail} />
    </ListItem>
  );
}

function rules(info) {
  const p = info.proctoring || {};
  const list = [`You have ${info.duration_minutes} minutes once you start. The timer keeps running if you close the window.`];
  if (info.round.type === "aptitude") list.push("Your answers are saved automatically. You can move between questions and flag them for review.");
  if (info.round.type === "coding") list.push(`Write your solution in ${(info.languages || []).join(", ")}. Run against the sample tests, then submit; hidden tests decide your score.`);
  if (info.round.type === "interview") list.push("The AI interviewer will read each question aloud. Answer by speaking (your speech is transcribed) or by typing.");
  if (p.enabled !== false) {
    if (p.require_webcam) list.push("Your webcam must stay on. Periodic snapshots are taken for review.");
    if (p.detect_faces) list.push("Only you may be visible on camera, and you must stay in frame.");
    if (p.require_fullscreen) list.push("The test runs in full-screen mode. Exiting full screen is recorded as a violation.");
    if (p.detect_tab_switch) list.push("Do not switch tabs, open other windows or applications.");
    if (p.block_copy_paste) list.push("Copy, paste and right-click are disabled.");
    list.push("Use one screen only. Opening the test on another device or tab is not allowed.");
    if (p.max_violations) list.push(`After ${p.max_violations} violations the test is ended and submitted automatically.`);
  }
  return list;
}

export default function Lobby({ info, api, onStarted, onFinished }) {
  const p = info.proctoring || {};
  const proctored = p.enabled !== false;
  const needVideo = proctored && p.require_webcam;
  const needAudio = (proctored && (p.require_microphone || p.detect_noise)) || info.round.type === "interview";
  const needFullscreen = proctored && p.require_fullscreen;
  const videoRef = useRef(null);
  const [stream, setStream] = useState(null);
  const [mediaError, setMediaError] = useState("");
  const [faces, setFaces] = useState(proctored && p.detect_faces ? "loading" : "off");
  const [agree, setAgree] = useState(false);
  const [starting, setStarting] = useState(false);
  const [error, setError] = useState("");
  const [now, setNow] = useState(Date.now());
  const [faceCheckSince, setFaceCheckSince] = useState(null);
  const opensAt = info.opens_at ? new Date(info.opens_at).getTime() : null;
  const mobileBlocked = (needVideo || needFullscreen) && isMobile();

  useEffect(() => {
    if (!opensAt && !faceCheckSince) return undefined;
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, [opensAt, faceCheckSince]);

  useEffect(() => {
    if (videoRef.current && stream) videoRef.current.srcObject = stream;
  }, [stream]);

  // Live face check in the preview.
  useEffect(() => {
    if (!stream || faces === "off" || !needVideo) return undefined;
    let timer;
    let cancelled = false;
    loadFaceDetector()
      .then((detector) => {
        if (cancelled) return;
        setFaceCheckSince(Date.now());
        timer = setInterval(() => {
          const n = countFaces(detector, videoRef.current);
          if (n !== null) setFaces(n);
        }, 700);
      })
      .catch(() => !cancelled && setFaces("unavailable"));
    return () => {
      cancelled = true;
      clearInterval(timer);
    };
  }, [stream, needVideo, faces === "off"]); // eslint-disable-line react-hooks/exhaustive-deps

  const enableDevices = async () => {
    setMediaError("");
    try {
      const s = await navigator.mediaDevices.getUserMedia({
        video: needVideo ? { width: { ideal: 640 }, height: { ideal: 480 }, facingMode: "user" } : false,
        audio: needAudio ? { echoCancellation: true, noiseSuppression: true } : false,
      });
      setStream(s);
    } catch (err) {
      setMediaError(
        err.name === "NotAllowedError"
          ? "Permission denied. Allow camera/microphone access in your browser's address bar and try again."
          : `Couldn't access your camera/microphone (${err.name}). Close other apps using it and try again.`
      );
    }
  };

  const devicesOk = !(needVideo || needAudio) || Boolean(stream);
  // If the check can't confirm a face for a while (poor camera/lighting) let the candidate continue; the attempt
  // is still monitored and flagged during the test.
  const faceCheckTimedOut = Boolean(faceCheckSince) && now - faceCheckSince > 20000 && faces !== 1;
  const facesOk = faces === "off" || faces === "unavailable" || faces === 1 || !needVideo || faceCheckTimedOut;
  const notOpenYet = opensAt && now < opensAt;
  const canStart = devicesOk && facesOk && agree && !notOpenYet && !mobileBlocked && !starting;

  const start = async () => {
    setStarting(true);
    setError("");
    try {
      if (needFullscreen && document.documentElement.requestFullscreen) {
        await document.documentElement.requestFullscreen().catch(() => {});
      }
      const data = await api.start();
      onStarted(data, stream);
    } catch (err) {
      const d = err.response?.data || {};
      if (document.fullscreenElement) document.exitFullscreen().catch(() => {});
      if (d.finished) onFinished(d.error, "done");
      else setError(d.error || "Could not start the test. Check your connection and try again.");
      setStarting(false);
    }
  };

  const faceText =
    faces === "loading" ? "Loading face detection..." : faces === "unavailable" ? "Automatic face detection isn't available; snapshots will be reviewed manually." : faces === 1 ? "Face detected" : faces === 0 ? "No face detected - sit in front of the camera with good lighting" : `${faces} faces detected - only you should be visible`;

  return (
    <Box sx={{ minHeight: "100vh", bgcolor: "background.default", py: 4, px: 2 }}>
      <Paper sx={{ maxWidth: 1100, mx: "auto", p: { xs: 2, md: 4 } }}>
        <Typography variant="overline" color="primary" fontWeight={700}>{info.company} · {info.drive}</Typography>
        <Typography variant="h4" fontWeight={800}>{info.round.name}</Typography>
        <Stack direction="row" gap={1} sx={{ my: 1.5 }} flexWrap="wrap">
          <Chip label={`${info.duration_minutes} minutes`} />
          {info.question_count > 0 && <Chip label={`${info.question_count} questions`} />}
          {proctored && <Chip color="warning" label="Proctored" />}
        </Stack>
        <Typography color="text.secondary">Hi {info.candidate.name}. Please read the rules and complete the system check before you begin.</Typography>
        {info.status === "in_progress" && <Alert severity="info" sx={{ mt: 2 }}>You have already started this test. You can resume it; the timer has kept running.</Alert>}
        {mobileBlocked && <Alert severity="error" sx={{ mt: 2 }}>This test must be taken on a laptop or desktop computer with a webcam.</Alert>}
        <Divider sx={{ my: 3 }} />
        <Grid container spacing={4}>
          <Grid item xs={12} md={6}>
            <Typography variant="h6" fontWeight={700} gutterBottom>Rules</Typography>
            <List dense>
              {rules(info).map((r, i) => (
                <ListItem key={i} disableGutters sx={{ alignItems: "flex-start" }}>
                  <ListItemIcon sx={{ minWidth: 28, mt: 0.5 }}><Typography fontWeight={700} color="primary">{i + 1}.</Typography></ListItemIcon>
                  <ListItemText primary={r} />
                </ListItem>
              ))}
            </List>
            {info.instructions && (
              <Alert severity="info" sx={{ whiteSpace: "pre-wrap" }}>{info.instructions}</Alert>
            )}
          </Grid>
          <Grid item xs={12} md={6}>
            <Typography variant="h6" fontWeight={700} gutterBottom>System check</Typography>
            {(needVideo || needAudio) && (
              <Box sx={{ mb: 2 }}>
                {needVideo && (
                  <Box sx={{ bgcolor: "#111", borderRadius: 2, overflow: "hidden", aspectRatio: "4 / 3", display: "grid", placeItems: "center", mb: 1 }}>
                    {stream ? (
                      <video ref={videoRef} autoPlay playsInline muted style={{ width: "100%", height: "100%", objectFit: "cover", transform: "scaleX(-1)" }} />
                    ) : (
                      <VideocamIcon sx={{ color: "#555", fontSize: 64 }} />
                    )}
                  </Box>
                )}
                {!stream && (
                  <Button variant="outlined" onClick={enableDevices} fullWidth>
                    Allow {needVideo ? "camera" : ""}{needVideo && needAudio ? " & " : ""}{needAudio ? "microphone" : ""}
                  </Button>
                )}
                {mediaError && <Alert severity="error" sx={{ mt: 1 }}>{mediaError}</Alert>}
              </Box>
            )}
            <List dense>
              {needVideo && <Check ok={Boolean(stream?.getVideoTracks().length)} pending={!stream} label="Camera" />}
              {needAudio && <Check ok={Boolean(stream?.getAudioTracks().length)} pending={!stream} label="Microphone" />}
              {needVideo && faces !== "off" && <Check ok={facesOk} pending={!stream || faces === "loading"} label="Face check" detail={stream ? faceText : ""} />}
              {needFullscreen && <Check ok={Boolean(document.fullscreenEnabled)} label="Full-screen support" detail={document.fullscreenEnabled ? "" : "Your browser doesn't support full screen. Use Chrome, Edge or Firefox."} />}
              {proctored && <Check ok={!window.screen?.isExtended} label="Single display" detail={window.screen?.isExtended ? "Disconnect additional monitors before starting." : ""} />}
              {info.round.type === "interview" && (
                <Check
                  ok={Boolean(window.SpeechRecognition || window.webkitSpeechRecognition)}
                  label="Speech-to-text"
                  detail={window.SpeechRecognition || window.webkitSpeechRecognition ? "Your spoken answers will be transcribed." : "Not supported in this browser - you can type your answers. Chrome or Edge recommended."}
                />
              )}
            </List>
            {proctored && (
              <FormControlLabel
                sx={{ mt: 1 }}
                control={<Checkbox checked={agree} onChange={(e) => setAgree(e.target.checked)} />}
                label="I agree to be monitored via webcam/microphone during this test and confirm I will not use unfair means."
              />
            )}
            {!proctored && (
              <FormControlLabel control={<Checkbox checked={agree} onChange={(e) => setAgree(e.target.checked)} />} label="I have read the rules and I'm ready to begin." />
            )}
            {faceCheckTimedOut && (
              <Alert severity="warning" sx={{ mt: 1 }}>
                We couldn't confirm your face. You may continue, but make sure you are clearly visible - this attempt will be reviewed.
              </Alert>
            )}
            {error && <Alert severity="error" sx={{ mt: 1 }}>{error}</Alert>}
            <Button variant="contained" size="large" fullWidth sx={{ mt: 2 }} disabled={!canStart} onClick={start}>
              {notOpenYet
                ? `Opens in ${Math.ceil((opensAt - now) / 60000)} min`
                : starting
                ? "Starting..."
                : info.status === "in_progress"
                ? "Resume test"
                : "Start test"}
            </Button>
          </Grid>
        </Grid>
      </Paper>
    </Box>
  );
}
