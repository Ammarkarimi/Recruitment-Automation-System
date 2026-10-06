import React, { useCallback, useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import {
  Alert,
  Box,
  Chip,
  CircularProgress,
  Dialog,
  Grid,
  LinearProgress,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Typography,
} from "@mui/material";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import CancelIcon from "@mui/icons-material/Cancel";
import RemoveCircleOutlineIcon from "@mui/icons-material/RemoveCircleOutline";
import { toast } from "react-toastify";
import api, { blobUrl, errorMessage } from "../../lib/api";
import PageHeader from "../../Components/PageHeader";
import StatusChip from "../../Components/StatusChip";
import { fmtDate, pct } from "../../lib/format";
import StageActions from "./StageActions";

const SEVERITY_COLOR = { info: "default", low: "info", medium: "warning", high: "error" };

function Snapshot({ snap, onOpen }) {
  const [url, setUrl] = useState(null);
  useEffect(() => {
    let u;
    blobUrl(`/snapshots/${snap.id}`).then((x) => { u = x; setUrl(x); }).catch(() => {});
    return () => u && URL.revokeObjectURL(u);
  }, [snap.id]);
  return (
    <Box onClick={() => url && onOpen(url)} sx={{ cursor: "pointer", position: "relative", borderRadius: 1, overflow: "hidden", border: 2, borderColor: snap.flagged ? "error.main" : "divider" }}>
      {url ? <img src={url} alt="webcam snapshot" style={{ width: "100%", display: "block" }} /> : <Box sx={{ height: 90, bgcolor: "action.hover" }} />}
      <Box sx={{ position: "absolute", bottom: 0, left: 0, right: 0, bgcolor: "rgba(0,0,0,.55)", color: "#fff", fontSize: 11, px: 0.5 }}>
        {new Date(snap.created_at).toLocaleTimeString()} {snap.faces !== null && `· ${snap.faces} face${snap.faces === 1 ? "" : "s"}`}
      </Box>
    </Box>
  );
}

function ResultIcon({ correct }) {
  if (correct === true) return <CheckCircleIcon color="success" fontSize="small" />;
  if (correct === false) return <CancelIcon color="error" fontSize="small" />;
  return <RemoveCircleOutlineIcon color="disabled" fontSize="small" />;
}

function Answers({ type, result }) {
  const rows = result?.questions || [];
  if (!rows.length) return <Typography color="text.secondary">No answers graded yet.</Typography>;
  if (type === "aptitude") {
    return (
      <Table size="small">
        <TableHead>
          <TableRow><TableCell /><TableCell>Question</TableCell><TableCell>Answered</TableCell><TableCell>Correct answer</TableCell><TableCell align="right">Marks</TableCell></TableRow>
        </TableHead>
        <TableBody>
          {rows.map((r) => (
            <TableRow key={r.key}>
              <TableCell><ResultIcon correct={r.correct} /></TableCell>
              <TableCell>{r.text}</TableCell>
              <TableCell>{r.chosen ?? <i>skipped</i>}</TableCell>
              <TableCell>{r.correct_option}</TableCell>
              <TableCell align="right">{r.awarded}/{r.marks}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    );
  }
  if (type === "coding") {
    return rows.map((r) => (
      <Box key={r.key} sx={{ mb: 3 }}>
        <Stack direction="row" justifyContent="space-between" alignItems="center">
          <Typography fontWeight={700}>{r.title}</Typography>
          <Typography fontWeight={700}>{r.awarded}/{r.marks}</Typography>
        </Stack>
        <Typography variant="body2" color="text.secondary" gutterBottom>
          {r.language || "no language"} · {r.status === "graded" ? `${r.passed}/${r.total} test cases passed` : r.status.replace(/_/g, " ")}
        </Typography>
        {r.error && <Alert severity="error" sx={{ mb: 1, whiteSpace: "pre-wrap" }} className="mono">{r.error}</Alert>}
        {r.tests && (
          <Stack direction="row" gap={0.5} flexWrap="wrap" sx={{ mb: 1 }}>
            {r.tests.map((t, i) => <Chip key={i} size="small" label={`#${i + 1} ${t.status.replace(/_/g, " ")}`} color={t.status === "passed" ? "success" : "error"} variant="outlined" />)}
          </Stack>
        )}
        {r.code && <Box component="pre" className="mono" sx={{ bgcolor: "#0f172a", color: "#e2e8f0", p: 1.5, borderRadius: 1, overflow: "auto", maxHeight: 360, fontSize: 13 }}>{r.code}</Box>}
      </Box>
    ));
  }
  return rows.map((r, i) => (
    <Box key={r.key} sx={{ mb: 2.5 }}>
      <Stack direction="row" justifyContent="space-between" gap={2}>
        <Typography fontWeight={700}>Q{i + 1}. {r.text}</Typography>
        <Typography fontWeight={700} sx={{ whiteSpace: "nowrap" }}>{r.score10}/10</Typography>
      </Stack>
      <Typography variant="body2" sx={{ mt: 0.5, whiteSpace: "pre-wrap" }}>{r.answer || <i>No answer</i>}</Typography>
      {r.feedback && <Typography variant="caption" color="text.secondary">AI feedback: {r.feedback}</Typography>}
      {r.needs_review && <Typography variant="caption" color="warning.main" display="block">Scored automatically by keyword similarity; please review.</Typography>}
    </Box>
  ));
}

export default function StageReport() {
  const { stageId } = useParams();
  const [data, setData] = useState(null);
  const [zoom, setZoom] = useState(null);

  const load = useCallback(() => {
    api.get(`/stages/${stageId}`).then((res) => setData(res.data)).catch((err) => toast.error(errorMessage(err)));
  }, [stageId]);
  useEffect(() => {
    load();
  }, [load]);

  if (!data) return <CircularProgress />;
  const { stage: s, candidate: c, round: r, drive, events, snapshots } = data;
  const counted = events.filter((e) => e.counted);
  const byType = counted.reduce((acc, e) => ({ ...acc, [e.type]: (acc[e.type] || 0) + 1 }), {});
  const flagged = snapshots.filter((x) => x.flagged).length;

  return (
    <>
      <PageHeader
        title={`${c.name} · ${r.name}`}
        subtitle={c.email}
        crumbs={[{ label: "Drives", to: "/app" }, { label: drive.title, to: `/app/drives/${drive.id}?tab=candidates` }, { label: c.name, to: `/app/candidates/${c.id}` }, { label: r.name }]}
        actions={<StatusChip status={s.status} size="medium" />}
      />
      {s.terminated && <Alert severity="error" sx={{ mb: 2 }}>Test terminated: {s.termination_reason}</Alert>}
      <Grid container spacing={2}>
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 2, mb: 2 }}>
            <Typography variant="overline" color="text.secondary">Score</Typography>
            <Typography variant="h4" fontWeight={800}>{pct(s.percent)}</Typography>
            <Typography variant="body2" color="text.secondary">{s.score ?? "-"} / {s.max_score ?? "-"} marks</Typography>
            <Typography variant="overline" color="text.secondary" display="block" sx={{ mt: 2 }}>Integrity</Typography>
            <Stack direction="row" alignItems="center" gap={1}>
              <Typography variant="h5" fontWeight={800} color={s.integrity < 70 ? "error.main" : s.integrity < 90 ? "warning.main" : "success.main"}>{pct(s.integrity)}</Typography>
              <Typography variant="body2" color="text.secondary">{s.violations} counted violations</Typography>
            </Stack>
            <LinearProgress variant="determinate" value={s.integrity ?? 0} color={s.integrity < 70 ? "error" : s.integrity < 90 ? "warning" : "success"} sx={{ height: 8, borderRadius: 4, mt: 1 }} />
            <Stack direction="row" gap={0.5} flexWrap="wrap" sx={{ mt: 1.5 }}>
              {Object.entries(byType).map(([t, n]) => <Chip key={t} size="small" label={`${t.replace(/_/g, " ")} ×${n}`} color="warning" variant="outlined" />)}
              {flagged > 0 && <Chip size="small" label={`${flagged} flagged snapshots`} color="error" variant="outlined" />}
            </Stack>
            <Table size="small" sx={{ mt: 2 }}>
              <TableBody>
                <TableRow><TableCell>Started</TableCell><TableCell>{fmtDate(s.started_at)}</TableCell></TableRow>
                <TableRow><TableCell>Submitted</TableCell><TableCell>{fmtDate(s.submitted_at)}</TableCell></TableRow>
                <TableRow><TableCell>Deadline</TableCell><TableCell>{fmtDate(s.deadline_at)}</TableCell></TableRow>
                <TableRow><TableCell>IP address</TableCell><TableCell>{s.ip || "-"}</TableCell></TableRow>
                <TableRow><TableCell>Browser</TableCell><TableCell sx={{ fontSize: 12, wordBreak: "break-word" }}>{s.user_agent || "-"}</TableCell></TableRow>
              </TableBody>
            </Table>
          </Paper>
          <Paper sx={{ p: 2 }}>
            <Typography fontWeight={700} gutterBottom>Decision</Typography>
            <StageActions stage={s} round={r} onChange={load} />
          </Paper>
        </Grid>
        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 2, mb: 2 }}>
            <Typography fontWeight={700} gutterBottom>Webcam snapshots ({snapshots.length})</Typography>
            {snapshots.length ? (
              <Grid container spacing={1}>
                {snapshots.map((snap) => (
                  <Grid item xs={4} sm={3} lg={2} key={snap.id}><Snapshot snap={snap} onOpen={setZoom} /></Grid>
                ))}
              </Grid>
            ) : (
              <Typography color="text.secondary">No snapshots recorded.</Typography>
            )}
          </Paper>
          <Paper sx={{ p: 2, mb: 2 }}>
            <Typography fontWeight={700} gutterBottom>Answers</Typography>
            <Answers type={r.type} result={s.result} />
          </Paper>
          <Paper sx={{ p: 2 }}>
            <Typography fontWeight={700} gutterBottom>Proctoring timeline ({events.length} events)</Typography>
            <Table size="small">
              <TableBody>
                {events.map((e) => (
                  <TableRow key={e.id} sx={{ bgcolor: e.counted ? "rgba(237,108,2,0.06)" : undefined }}>
                    <TableCell sx={{ whiteSpace: "nowrap", width: 110 }}>{new Date(e.created_at).toLocaleTimeString()}</TableCell>
                    <TableCell sx={{ width: 160 }}><Chip size="small" label={e.type.replace(/_/g, " ")} color={SEVERITY_COLOR[e.severity]} variant={e.counted ? "filled" : "outlined"} /></TableCell>
                    <TableCell sx={{ fontSize: 13 }}>{e.detail}</TableCell>
                    <TableCell sx={{ width: 90, fontSize: 12, color: "text.secondary" }}>{e.counted ? "violation" : ""}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Paper>
        </Grid>
      </Grid>
      <Dialog open={Boolean(zoom)} onClose={() => setZoom(null)} maxWidth="md">
        {zoom && <img src={zoom} alt="snapshot" style={{ width: "100%", display: "block" }} />}
      </Dialog>
    </>
  );
}
