import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import { Alert, Box, CircularProgress, Paper, Typography } from "@mui/material";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import EventIcon from "@mui/icons-material/Event";
import { assessApi, setSession } from "./assessApi";
import Lobby from "./Lobby";
import TestRunner from "./TestRunner";

function Centered({ children }) {
  return (
    <Box sx={{ minHeight: "100vh", display: "grid", placeItems: "center", bgcolor: "background.default", p: 2 }}>
      <Paper sx={{ p: 4, maxWidth: 560, width: "100%", textAlign: "center" }}>{children}</Paper>
    </Box>
  );
}

export function FinishedScreen({ info, message, terminated }) {
  return (
    <Centered>
      <CheckCircleIcon color={terminated ? "error" : "success"} sx={{ fontSize: 56, mb: 1 }} />
      <Typography variant="h5" fontWeight={700} gutterBottom>
        {terminated ? "Test ended" : "Thank you!"}
      </Typography>
      <Typography color="text.secondary">
        {message || `Your responses for ${info?.round?.name || "the test"} have been submitted.`}
      </Typography>
      <Typography color="text.secondary" sx={{ mt: 2 }}>
        The {info?.company || "hiring"} team will contact you by email about the next steps. You can close this window now.
      </Typography>
    </Centered>
  );
}

export default function AssessmentPage() {
  const { token } = useParams();
  const api = useMemo(() => assessApi(token), [token]);
  const [info, setInfo] = useState(null);
  const [error, setError] = useState(null);
  const [state, setState] = useState(null);
  const [stream, setStream] = useState(null);
  const [finished, setFinished] = useState(null);

  useEffect(() => {
    api.info().then(setInfo).catch((err) => setError(err.response?.data?.error || "Could not load the test. Check your internet connection."));
  }, [api]);

  // Release the camera when the test ends.
  useEffect(() => {
    if (finished && stream) stream.getTracks().forEach((t) => t.stop());
  }, [finished, stream]);

  const onStarted = useCallback(
    (data, mediaStream) => {
      setSession(token, data.session_token);
      setStream(mediaStream);
      setState(data);
    },
    [token]
  );

  const onFinished = useCallback((message, reason) => {
    if (document.fullscreenElement) document.exitFullscreen().catch(() => {});
    setFinished((prev) => prev || { message, reason });
  }, []);

  if (error) {
    return (
      <Centered>
        <Typography variant="h6" fontWeight={700} gutterBottom>Link unavailable</Typography>
        <Alert severity="error">{error}</Alert>
      </Centered>
    );
  }
  if (!info) {
    return (
      <Centered>
        <CircularProgress />
      </Centered>
    );
  }
  if (finished) {
    if (finished.reason === "conflict") {
      return (
        <Centered>
          <Typography variant="h6" fontWeight={700} gutterBottom>Test open elsewhere</Typography>
          <Alert severity="warning">{finished.message}</Alert>
        </Centered>
      );
    }
    return <FinishedScreen info={info} message={finished.message} terminated={finished.reason === "terminated"} />;
  }
  if (info.status === "completed") return <FinishedScreen info={info} terminated={info.terminated} message={info.terminated ? "This test was ended because of proctoring violations." : "You have already completed this test."} />;
  if (info.status === "expired") {
    return (
      <Centered>
        <Typography variant="h6" fontWeight={700} gutterBottom>This link has expired</Typography>
        <Typography color="text.secondary">Please contact the {info.company} hiring team if you need a new link.</Typography>
      </Centered>
    );
  }
  if (info.round.mode === "live") {
    return (
      <Centered>
        <EventIcon color="primary" sx={{ fontSize: 56 }} />
        <Typography variant="h5" fontWeight={700} gutterBottom>{info.round.name}</Typography>
        <Typography>Hi {info.candidate.name}, your interview for <b>{info.drive}</b> at {info.company} is scheduled for</Typography>
        <Typography variant="h6" sx={{ my: 1 }}>{info.scheduled_at ? new Date(info.scheduled_at).toLocaleString() : "a time to be confirmed"}</Typography>
        {info.meeting_link && (
          <Typography>
            Join here: <a href={info.meeting_link} target="_blank" rel="noreferrer">{info.meeting_link}</a>
          </Typography>
        )}
      </Centered>
    );
  }
  if (!state) return <Lobby info={info} api={api} onStarted={onStarted} onFinished={onFinished} />;
  return <TestRunner info={info} api={api} initial={state} stream={stream} onFinished={onFinished} />;
}
