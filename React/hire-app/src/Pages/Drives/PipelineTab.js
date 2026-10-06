import React, { useState } from "react";
import { Link as RouterLink } from "react-router-dom";
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Checkbox,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControlLabel,
  Stack,
  Typography,
} from "@mui/material";
import SendIcon from "@mui/icons-material/Send";
import PlayArrowIcon from "@mui/icons-material/PlayArrow";
import GavelIcon from "@mui/icons-material/Gavel";
import ListAltIcon from "@mui/icons-material/ListAlt";
import StopCircleIcon from "@mui/icons-material/StopCircle";
import PeopleIcon from "@mui/icons-material/People";
import { toast } from "react-toastify";
import api, { errorMessage } from "../../lib/api";
import { ROUND_LABELS } from "../../lib/format";
import { ROUND_ICONS } from "./DriveForm";

const COUNT_LABELS = [
  ["pending", "Waiting", "default"],
  ["invited", "Invited", "info"],
  ["in_progress", "Taking test", "warning"],
  ["submitted", "Completed", "secondary"],
  ["expired", "Missed", "default"],
  ["passed", "Passed", "success"],
  ["failed", "Failed", "error"],
];

function describeRule(config) {
  if (config.pass_mode === "manual") return "Manual decision by the hiring team";
  if (config.pass_mode === "top_n") return `Top ${config.top_n} candidates pass`;
  return `Candidates scoring ${config.pass_score}% or more pass`;
}

export default function PipelineTab({ drive, reload, openCandidates }) {
  const [busy, setBusy] = useState(null);
  const [evalRound, setEvalRound] = useState(null);
  const [inviteNext, setInviteNext] = useState(true);

  const act = async (key, fn, success) => {
    setBusy(key);
    try {
      const res = await fn();
      toast.success(success(res.data));
      if (res.data.invite_error) toast.warn(res.data.invite_error);
      await reload();
    } catch (err) {
      toast.error(errorMessage(err));
    } finally {
      setBusy(null);
    }
  };

  const evaluate = () => {
    const r = evalRound;
    setEvalRound(null);
    act(`eval${r.id}`, () => api.post(`/rounds/${r.id}/evaluate`, { invite_next: inviteNext }), (d) =>
      `${d.passed} passed, ${d.failed} failed${d.invited_next ? `, ${d.invited_next} invited to the next round` : ""}`
    );
  };

  if (!drive.stats.candidates) {
    return (
      <Alert severity="info" action={<Button onClick={() => openCandidates(null)}>View candidates</Button>}>
        No candidates yet. Use the "Add / import candidates" tab to upload an Excel sheet or resumes.
      </Alert>
    );
  }

  return (
    <Stack gap={2}>
      {drive.rounds.map((r, i) => {
        const c = drive.stats.rounds[String(r.id)] || {};
        const live = r.type === "interview" && r.config.mode === "live";
        const isTest = r.type !== "resume_screening";
        const next = drive.rounds[i + 1];
        return (
          <Card key={r.id}>
            <CardContent>
              <Stack direction={{ xs: "column", md: "row" }} gap={2} justifyContent="space-between">
                <Box sx={{ minWidth: 260 }}>
                  <Stack direction="row" alignItems="center" gap={1}>
                    <Chip label={`Round ${i + 1}`} size="small" color="primary" />
                    <Box sx={{ color: "primary.main", display: "flex" }}>{ROUND_ICONS[r.type]}</Box>
                    <Typography variant="h6" fontWeight={700}>
                      {r.name}
                    </Typography>
                  </Stack>
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                    {ROUND_LABELS[r.type]}
                    {isTest && !live ? ` · ${r.config.duration_minutes} min · ${r.question_count} questions in bank` : ""}
                    {live ? " · live with panel" : ""}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {describeRule(r.config)}
                    {next ? ` → ${next.name}` : " → Selected"}
                  </Typography>
                  {isTest && !live && r.question_count === 0 && (
                    <Alert severity="warning" sx={{ mt: 1, py: 0 }}>
                      Add questions before inviting candidates.
                    </Alert>
                  )}
                </Box>
                <Stack direction="row" gap={1} flexWrap="wrap" alignContent="flex-start" sx={{ flex: 1 }}>
                  {COUNT_LABELS.map(([k, labelText, color]) => (
                    <Box key={k} sx={{ textAlign: "center", minWidth: 76, p: 1, borderRadius: 2, bgcolor: c[k] ? "action.hover" : "transparent" }}>
                      <Typography variant="h6" fontWeight={700} color={!c[k] ? "text.disabled" : color === "default" ? "text.primary" : `${color}.main`}>
                        {c[k] || 0}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {labelText}
                      </Typography>
                    </Box>
                  ))}
                </Stack>
              </Stack>
              <Stack direction="row" gap={1} flexWrap="wrap" sx={{ mt: 2 }}>
                {r.type === "resume_screening" && (
                  <Button
                    variant="contained"
                    startIcon={<PlayArrowIcon />}
                    disabled={busy === `screen${r.id}` || !(c.pending || c.submitted)}
                    onClick={() => act(`screen${r.id}`, () => api.post(`/rounds/${r.id}/screen`), (d) => `Screened ${d.screened} resumes${d.without_resume ? ` (${d.without_resume} without a resume)` : ""}`)}
                  >
                    Run screening
                  </Button>
                )}
                {isTest && (
                  <>
                    {!live && (
                      <Button startIcon={<ListAltIcon />} variant="outlined" component={RouterLink} to={`/app/rounds/${r.id}/questions`}>
                        Question bank ({r.question_count})
                      </Button>
                    )}
                    <Button
                      variant="contained"
                      startIcon={<SendIcon />}
                      disabled={busy === `inv${r.id}` || !c.pending}
                      onClick={() => act(`inv${r.id}`, () => api.post(`/rounds/${r.id}/invite`, {}), (d) => `Invitations queued for ${d.invited} candidates${d.skipped.length ? ` (${d.skipped.length} skipped)` : ""}`)}
                    >
                      Email test link to waiting ({c.pending || 0})
                    </Button>
                    {Boolean(c.expired) && (
                      <Button
                        disabled={busy === `re${r.id}`}
                        onClick={() => act(`re${r.id}`, () => api.post(`/rounds/${r.id}/invite`, { resend: true }), (d) => `Re-sent ${d.invited} links`)}
                      >
                        Resend to missed ({c.expired || 0})
                      </Button>
                    )}
                    {Boolean(c.in_progress) && !live && (
                      <Button
                        color="warning"
                        startIcon={<StopCircleIcon />}
                        onClick={() => window.confirm("Force-submit every attempt that is still in progress?") && act(`close${r.id}`, () => api.post(`/rounds/${r.id}/close`), (d) => `Closed ${d.closed} attempts`)}
                      >
                        Close running tests
                      </Button>
                    )}
                  </>
                )}
                <Button
                  variant="outlined"
                  color="success"
                  startIcon={<GavelIcon />}
                  disabled={r.config.pass_mode === "manual" || !(c.submitted || c.expired) || busy === `eval${r.id}`}
                  onClick={() => {
                    setInviteNext(Boolean(r.config.invite_next_on_pass));
                    setEvalRound(r);
                  }}
                >
                  Evaluate & advance ({(c.submitted || 0) + (c.expired || 0)})
                </Button>
                <Button startIcon={<PeopleIcon />} onClick={() => openCandidates(r.id)}>
                  View candidates
                </Button>
              </Stack>
            </CardContent>
          </Card>
        );
      })}
      <Dialog open={Boolean(evalRound)} onClose={() => setEvalRound(null)}>
        <DialogTitle>Evaluate "{evalRound?.name}"</DialogTitle>
        <DialogContent>
          <Typography gutterBottom>{evalRound && describeRule(evalRound.config)}.</Typography>
          <Typography variant="body2" color="text.secondary" gutterBottom>
            Completed attempts are marked passed or failed. Candidates who missed their link fail
            {evalRound?.config.fail_on_termination ? "; tests terminated for cheating fail automatically" : ""}. Rejected candidates
            leave the pipeline; passing candidates move to the next round. You can override any decision from the candidate's page.
          </Typography>
          {evalRound && drive.rounds[drive.rounds.indexOf(evalRound) + 1]?.type !== "resume_screening" && drive.rounds[drive.rounds.indexOf(evalRound) + 1] && (
            <FormControlLabel
              control={<Checkbox checked={inviteNext} onChange={(e) => setInviteNext(e.target.checked)} />}
              label={`Email the "${drive.rounds[drive.rounds.indexOf(evalRound) + 1].name}" link to passing candidates now`}
            />
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEvalRound(null)}>Cancel</Button>
          <Button variant="contained" onClick={evaluate}>
            Evaluate
          </Button>
        </DialogActions>
      </Dialog>
    </Stack>
  );
}
