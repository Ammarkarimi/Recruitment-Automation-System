import React, { useCallback, useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import {
  Box,
  Button,
  Card,
  CardContent,
  CircularProgress,
  Grid,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableRow,
  Typography,
} from "@mui/material";
import UploadIcon from "@mui/icons-material/Upload";
import { toast } from "react-toastify";
import api, { blobUrl, errorMessage } from "../../lib/api";
import PageHeader from "../../Components/PageHeader";
import StatusChip from "../../Components/StatusChip";
import { ROUND_LABELS, fmtDate, pct } from "../../lib/format";
import StageActions from "../Stage/StageActions";

export default function CandidateDetail() {
  const { candidateId } = useParams();
  const [data, setData] = useState(null);
  const [resumeUrl, setResumeUrl] = useState(null);
  const [drive, setDrive] = useState(null);

  const load = useCallback(async () => {
    try {
      const res = await api.get(`/candidates/${candidateId}`);
      setData(res.data);
      if (!drive) {
        const d = await api.get(`/drives/${res.data.candidate.drive_id}`);
        setDrive(d.data.drive);
      }
    } catch (err) {
      toast.error(errorMessage(err));
    }
  }, [candidateId, drive]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    let url;
    if (data?.candidate.has_resume) {
      blobUrl(`/candidates/${candidateId}/resume`).then((u) => { url = u; setResumeUrl(u); }).catch(() => {});
    }
    return () => url && URL.revokeObjectURL(url);
  }, [candidateId, data?.candidate.has_resume, data?.candidate.resume_filename]);

  const uploadResume = async (file) => {
    const fd = new FormData();
    fd.append("file", file);
    try {
      await api.post(`/candidates/${candidateId}/resume`, fd);
      toast.success("Resume uploaded");
      load();
    } catch (err) {
      toast.error(errorMessage(err));
    }
  };

  const setStatus = async (status) => {
    try {
      await api.patch(`/candidates/${candidateId}`, { status });
      load();
    } catch (err) {
      toast.error(errorMessage(err));
    }
  };

  if (!data || !drive) return <CircularProgress />;
  const { candidate: c } = data;
  const stagesByRound = Object.fromEntries(data.stages.map((s) => [s.round_id, s]));

  return (
    <>
      <PageHeader
        title={c.name}
        subtitle={`${c.email}${c.phone ? ` · ${c.phone}` : ""}`}
        crumbs={[{ label: "Drives", to: "/app" }, { label: drive.title, to: `/app/drives/${drive.id}?tab=candidates` }, { label: c.name }]}
        actions={
          <>
            <StatusChip status={c.status} size="medium" />
            {c.status === "active" && <Button onClick={() => setStatus("withdrawn")}>Mark withdrawn</Button>}
            {c.status === "withdrawn" && <Button onClick={() => setStatus("active")}>Reactivate</Button>}
          </>
        }
      />
      <Grid container spacing={2}>
        <Grid item xs={12} lg={7}>
          <Stack gap={2}>
            {drive.rounds.map((r, i) => {
              const s = stagesByRound[r.id];
              return (
                <Card key={r.id} sx={{ opacity: s ? 1 : 0.55 }}>
                  <CardContent>
                    <Stack direction="row" justifyContent="space-between" alignItems="center" gap={1} flexWrap="wrap">
                      <Box>
                        <Typography fontWeight={700}>
                          {i + 1}. {r.name}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {ROUND_LABELS[r.type]}
                        </Typography>
                      </Box>
                      {s ? <StatusChip status={s.status} size="medium" /> : <Typography variant="body2" color="text.secondary">Not reached</Typography>}
                    </Stack>
                    {s && (
                      <>
                        <Stack direction="row" gap={3} sx={{ my: 1.5 }} flexWrap="wrap">
                          <Box><Typography variant="caption" color="text.secondary">Score</Typography><Typography fontWeight={700}>{pct(s.percent)}</Typography></Box>
                          {r.type !== "resume_screening" && (
                            <>
                              <Box><Typography variant="caption" color="text.secondary">Integrity</Typography><Typography fontWeight={700} color={s.integrity < 70 ? "error.main" : "inherit"}>{s.started_at ? pct(s.integrity) : "-"}</Typography></Box>
                              <Box><Typography variant="caption" color="text.secondary">Violations</Typography><Typography fontWeight={700}>{s.violations}{s.terminated ? " (terminated)" : ""}</Typography></Box>
                              <Box><Typography variant="caption" color="text.secondary">Invited</Typography><Typography>{fmtDate(s.invited_at)}</Typography></Box>
                              <Box><Typography variant="caption" color="text.secondary">Submitted</Typography><Typography>{fmtDate(s.submitted_at)}</Typography></Box>
                            </>
                          )}
                        </Stack>
                        {r.type === "resume_screening" && s.result?.matched_skills && (
                          <Typography variant="body2" sx={{ mb: 1 }}>
                            Matched skills: <b>{s.result.matched_skills.join(", ") || "none"}</b>
                            {s.result.missing_skills?.length > 0 && <> · Missing: {s.result.missing_skills.join(", ")}</>}
                          </Typography>
                        )}
                        <StageActions stage={s} round={r} onChange={load} compact />
                      </>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </Stack>
        </Grid>
        <Grid item xs={12} lg={5}>
          <Paper sx={{ p: 2, mb: 2 }}>
            <Typography fontWeight={700} gutterBottom>Profile</Typography>
            <Table size="small">
              <TableBody>
                <TableRow><TableCell>Added</TableCell><TableCell>{fmtDate(c.created_at)}</TableCell></TableRow>
                {Object.entries(c.extra || {}).map(([k, v]) => (
                  <TableRow key={k}><TableCell>{k}</TableCell><TableCell>{String(v)}</TableCell></TableRow>
                ))}
              </TableBody>
            </Table>
          </Paper>
          <Paper sx={{ p: 2 }}>
            <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1 }}>
              <Typography fontWeight={700}>Resume {c.resume_filename ? `· ${c.resume_filename}` : ""}</Typography>
              <Button size="small" component="label" startIcon={<UploadIcon />}>
                {c.has_resume ? "Replace" : "Upload"}
                <input hidden type="file" accept=".pdf,.txt" onChange={(e) => e.target.files[0] && uploadResume(e.target.files[0])} />
              </Button>
            </Stack>
            {resumeUrl && c.resume_filename?.toLowerCase().endsWith(".pdf") ? (
              <iframe title="resume" src={resumeUrl} style={{ width: "100%", height: 640, border: 0 }} />
            ) : c.has_resume ? (
              <Typography component="pre" variant="body2" sx={{ whiteSpace: "pre-wrap", maxHeight: 640, overflow: "auto" }}>{data.resume_excerpt}</Typography>
            ) : (
              <Typography color="text.secondary">No resume uploaded.</Typography>
            )}
            {resumeUrl && (
              <Button size="small" onClick={() => window.open(resumeUrl, "_blank")}>
                Open in new tab
              </Button>
            )}
          </Paper>
        </Grid>
      </Grid>
    </>
  );
}
