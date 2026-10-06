import React, { useCallback, useEffect, useRef, useState } from "react";
import { Alert, Avatar, Box, Button, Chip, Grid, LinearProgress, Paper, Stack, TextField, Typography } from "@mui/material";
import MicIcon from "@mui/icons-material/Mic";
import MicOffIcon from "@mui/icons-material/MicOff";
import VolumeUpIcon from "@mui/icons-material/VolumeUp";
import SmartToyIcon from "@mui/icons-material/SmartToy";

const Recognition = window.SpeechRecognition || window.webkitSpeechRecognition;

function speak(text, onEnd) {
  if (!window.speechSynthesis) {
    onEnd();
    return;
  }
  let done = false;
  const finish = () => {
    if (done) return;
    done = true;
    clearTimeout(fallback);
    onEnd();
  };
  // Some browsers never fire `end` (no voices installed, long utterances); don't leave the candidate stuck.
  const fallback = setTimeout(finish, (text.split(/\s+/).length / 2.2 + 3) * 1000);
  window.speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(text);
  u.rate = 0.95;
  u.onend = finish;
  u.onerror = finish;
  window.speechSynthesis.speak(u);
}

export default function InterviewTest({ questions, answers, save, stream, videoRef, secondsPerQuestion, onDone, submitting }) {
  const firstOpen = Math.max(0, questions.findIndex((q) => !(answers[q.key]?.text || "").trim()));
  const [index, setIndex] = useState(firstOpen);
  const [phase, setPhase] = useState("intro"); // intro | asking | answering
  const [text, setText] = useState("");
  const [interim, setInterim] = useState("");
  const [listening, setListening] = useState(false);
  const [left, setLeft] = useState(secondsPerQuestion);
  const recRef = useRef(null);
  const wantListening = useRef(false);
  const startedAt = useRef(0);
  const q = questions[index];
  const last = index === questions.length - 1;

  const stopListening = useCallback(() => {
    wantListening.current = false;
    try {
      recRef.current?.stop();
    } catch {
      /* not started */
    }
    setListening(false);
    setInterim("");
  }, []);

  const startListening = useCallback(() => {
    if (!Recognition) return;
    const rec = new Recognition();
    rec.lang = "en-US";
    rec.continuous = true;
    rec.interimResults = true;
    rec.onresult = (e) => {
      let finalText = "";
      let interimText = "";
      for (let i = e.resultIndex; i < e.results.length; i++) {
        if (e.results[i].isFinal) finalText += e.results[i][0].transcript;
        else interimText += e.results[i][0].transcript;
      }
      if (finalText) setText((t) => (t ? `${t} ${finalText.trim()}` : finalText.trim()));
      setInterim(interimText);
    };
    // Browsers stop recognition after silence; keep it running while the candidate is answering.
    rec.onend = () => {
      if (wantListening.current) {
        try {
          rec.start();
        } catch {
          setListening(false);
        }
      } else setListening(false);
    };
    rec.onerror = (e) => {
      if (e.error === "not-allowed" || e.error === "service-not-allowed") {
        wantListening.current = false;
        setListening(false);
      }
    };
    recRef.current = rec;
    wantListening.current = true;
    try {
      rec.start();
      setListening(true);
    } catch {
      setListening(false);
    }
  }, []);

  const ask = useCallback(
    (i) => {
      setPhase("asking");
      setText(answers[questions[i].key]?.text || "");
      speak(`Question ${i + 1}. ${questions[i].text}`, () => {
        setPhase("answering");
        setLeft(secondsPerQuestion);
        startedAt.current = Date.now();
        startListening();
      });
    },
    [answers, questions, secondsPerQuestion, startListening]
  );

  const next = useCallback(() => {
    stopListening();
    window.speechSynthesis?.cancel();
    const finalText = `${text} ${interim}`.trim();
    save(q.key, { text: finalText, duration_sec: Math.round((Date.now() - startedAt.current) / 1000) });
    if (last) {
      setPhase("done");
      onDone();
    } else {
      setIndex(index + 1);
      ask(index + 1);
    }
  }, [stopListening, text, interim, save, q, last, onDone, index, ask]);

  // Per-question countdown.
  useEffect(() => {
    if (phase !== "answering") return undefined;
    const t = setInterval(() => setLeft((s) => s - 1), 1000);
    return () => clearInterval(t);
  }, [phase, index]);

  useEffect(() => {
    if (phase === "answering" && left <= 0) next();
  }, [left, phase, next]);

  useEffect(
    () => () => {
      wantListening.current = false;
      try {
        recRef.current?.stop();
      } catch {
        /* ignore */
      }
      window.speechSynthesis?.cancel();
    },
    []
  );

  const hasVideo = stream && stream.getVideoTracks().length > 0;
  return (
    <Grid container spacing={2}>
      <Grid item xs={12} md={6}>
        <Paper sx={{ overflow: "hidden", bgcolor: "#0f172a", aspectRatio: "4 / 3", position: "relative", display: "grid", placeItems: "center" }}>
          {hasVideo ? (
            <video ref={videoRef} autoPlay playsInline muted style={{ width: "100%", height: "100%", objectFit: "cover", transform: "scaleX(-1)" }} />
          ) : (
            <Typography color="#94a3b8">Camera off</Typography>
          )}
          <Chip
            icon={listening ? <MicIcon /> : <MicOffIcon />}
            label={listening ? "Listening..." : "Mic idle"}
            color={listening ? "error" : "default"}
            sx={{ position: "absolute", top: 12, left: 12, bgcolor: listening ? undefined : "rgba(255,255,255,0.8)" }}
          />
        </Paper>
      </Grid>
      <Grid item xs={12} md={6}>
        <Paper sx={{ p: 3, minHeight: "100%" }}>
          <Stack direction="row" gap={2} alignItems="center" sx={{ mb: 2 }}>
            <Avatar sx={{ bgcolor: "primary.main", width: 56, height: 56 }}>
              <SmartToyIcon fontSize="large" />
            </Avatar>
            <Box>
              <Typography fontWeight={700}>AI Interviewer</Typography>
              <Typography variant="caption" color="text.secondary">
                Question {Math.min(index + 1, questions.length)} of {questions.length}
              </Typography>
            </Box>
            {phase === "asking" && <Chip icon={<VolumeUpIcon />} label="Speaking" color="primary" sx={{ ml: "auto" }} />}
          </Stack>
          <LinearProgress variant="determinate" value={(index / questions.length) * 100} sx={{ mb: 3, height: 6, borderRadius: 3 }} />

          {phase === "intro" ? (
            <Box>
              <Typography variant="h6" gutterBottom>Ready when you are</Typography>
              <Typography color="text.secondary" gutterBottom>
                I'll read each question aloud. When I finish, start speaking - your answer is transcribed live and you can correct it by typing. You have
                about {Math.round(secondsPerQuestion / 60)} minute(s) per question. Click "Next question" when you're done.
              </Typography>
              {!Recognition && <Alert severity="info" sx={{ my: 2 }}>Speech-to-text isn't supported in this browser. Please type your answers.</Alert>}
              <Button variant="contained" size="large" onClick={() => ask(index)} sx={{ mt: 2 }}>
                {index > 0 ? "Continue interview" : "Begin interview"}
              </Button>
            </Box>
          ) : phase === "done" ? (
            <Typography>{submitting ? "Submitting your interview..." : "Interview complete."}</Typography>
          ) : (
            <Box>
              <Typography variant="h6" sx={{ mb: 2, whiteSpace: "pre-wrap" }}>{q.text}</Typography>
              <TextField
                fullWidth
                multiline
                minRows={7}
                label={phase === "asking" ? "Wait for the question to finish..." : "Your answer"}
                value={interim ? `${text} ${interim}`.trim() : text}
                onChange={(e) => {
                  setInterim("");
                  setText(e.target.value);
                }}
                disabled={phase === "asking"}
              />
              <Stack direction="row" alignItems="center" gap={1} sx={{ mt: 2 }}>
                {phase === "answering" && Recognition && (
                  <Button startIcon={listening ? <MicOffIcon /> : <MicIcon />} onClick={listening ? stopListening : startListening}>
                    {listening ? "Pause mic" : "Resume mic"}
                  </Button>
                )}
                <Button
                  size="small"
                  disabled={phase === "asking"}
                  onClick={() => {
                    // Pause transcription so the spoken question isn't captured as the answer.
                    const resume = listening;
                    stopListening();
                    speak(q.text, () => resume && startListening());
                  }}
                >
                  Repeat question
                </Button>
                <Typography variant="body2" color={left <= 15 ? "error.main" : "text.secondary"} sx={{ ml: "auto" }}>
                  {phase === "answering" ? `${Math.floor(left / 60)}:${String(Math.max(0, left) % 60).padStart(2, "0")} left` : ""}
                </Typography>
                <Button variant="contained" onClick={next} disabled={phase !== "answering" || submitting}>
                  {last ? "Finish interview" : "Next question"}
                </Button>
              </Stack>
            </Box>
          )}
        </Paper>
      </Grid>
    </Grid>
  );
}
