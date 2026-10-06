import React, { useEffect, useState } from "react";
import { Link as RouterLink } from "react-router-dom";
import { Button, Stack, TextField, Tooltip } from "@mui/material";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import CheckIcon from "@mui/icons-material/Check";
import CloseIcon from "@mui/icons-material/Close";
import AssessmentIcon from "@mui/icons-material/Assessment";
import { toast } from "react-toastify";
import api, { errorMessage } from "../../lib/api";
import { fromLocalInput, toLocalInput } from "../../lib/format";

/** Recruiter actions on one candidate's round: decide, schedule, score, copy link, reset. */
export default function StageActions({ stage, round, onChange, compact }) {
  const live = round.type === "interview" && round.config?.mode === "live";
  const [schedule, setSchedule] = useState({ scheduled_at: toLocalInput(stage.scheduled_at), meeting_link: stage.meeting_link || "" });
  const [score, setScore] = useState(stage.percent ?? "");
  const [notes, setNotes] = useState(stage.notes || "");
  const [link, setLink] = useState(null);

  useEffect(() => {
    setScore(stage.percent ?? "");
    setNotes(stage.notes || "");
  }, [stage.percent, stage.notes]);

  const call = async (fn, message) => {
    try {
      await fn();
      if (message) toast.success(message);
      onChange && onChange();
    } catch (err) {
      toast.error(errorMessage(err));
    }
  };

  const copyLink = async () => {
    try {
      const url = link || (await api.get(`/stages/${stage.id}`)).data.link;
      setLink(url);
      if (!url) return toast.info("No link yet - send the invitation first");
      await navigator.clipboard.writeText(url);
      toast.success("Test link copied");
    } catch (err) {
      toast.error(errorMessage(err));
    }
  };

  const decidable = !["in_progress"].includes(stage.status);
  return (
    <Stack gap={1.5}>
      {live && (
        <Stack direction={{ xs: "column", sm: "row" }} gap={1}>
          <TextField size="small" type="datetime-local" label="Interview slot" InputLabelProps={{ shrink: true }} value={schedule.scheduled_at} onChange={(e) => setSchedule({ ...schedule, scheduled_at: e.target.value })} />
          <TextField size="small" label="Meeting link" value={schedule.meeting_link} onChange={(e) => setSchedule({ ...schedule, meeting_link: e.target.value })} sx={{ flex: 1 }} />
          <Button
            variant="outlined"
            onClick={() => call(() => api.patch(`/stages/${stage.id}`, { scheduled_at: fromLocalInput(schedule.scheduled_at), meeting_link: schedule.meeting_link }), "Schedule saved")}
          >
            Save slot
          </Button>
        </Stack>
      )}
      {(live || round.type === "resume_screening" || ["submitted", "expired"].includes(stage.status)) && (
        <Stack direction="row" gap={1} alignItems="center">
          <TextField size="small" type="number" label={live ? "Interview score (%)" : "Override score (%)"} value={score} onChange={(e) => setScore(e.target.value)} sx={{ width: 180 }} />
          <Button onClick={() => call(() => api.patch(`/stages/${stage.id}`, { percent: score }), "Score saved")} disabled={score === "" || Number(score) === stage.percent}>
            Save score
          </Button>
        </Stack>
      )}
      {!compact && (
        <Stack direction="row" gap={1}>
          <TextField size="small" fullWidth multiline label="Notes for the team" value={notes} onChange={(e) => setNotes(e.target.value)} />
          <Button onClick={() => call(() => api.patch(`/stages/${stage.id}`, { notes }), "Notes saved")} disabled={notes === (stage.notes || "")}>Save</Button>
        </Stack>
      )}
      <Stack direction="row" gap={1} flexWrap="wrap">
        {stage.status !== "passed" && (
          <Button size="small" variant="contained" color="success" startIcon={<CheckIcon />} disabled={!decidable} onClick={() => call(() => api.post(`/stages/${stage.id}/decide`, { decision: "pass" }), "Moved to the next round")}>
            Pass
          </Button>
        )}
        {stage.status !== "failed" && (
          <Button size="small" variant="outlined" color="error" startIcon={<CloseIcon />} disabled={!decidable} onClick={() => call(() => api.post(`/stages/${stage.id}/decide`, { decision: "fail" }), "Candidate rejected")}>
            Reject
          </Button>
        )}
        {round.type !== "resume_screening" && (
          <>
            {compact && stage.status !== "pending" && (
              <Button size="small" startIcon={<AssessmentIcon />} component={RouterLink} to={`/app/stages/${stage.id}`}>
                Answers & proctoring report
              </Button>
            )}
            {["invited", "in_progress", "expired"].includes(stage.status) && (
              <Tooltip describeChild title="Copy the candidate's personal test link">
                <Button size="small" startIcon={<ContentCopyIcon />} onClick={copyLink}>Copy link</Button>
              </Tooltip>
            )}
            {stage.status === "pending" && (
              <Button size="small" onClick={() => call(() => api.post(`/rounds/${round.id}/invite`, { candidate_ids: [stage.candidate_id] }), "Invitation sent")}>
                Send invitation
              </Button>
            )}
            {stage.status === "in_progress" && (
              <Tooltip describeChild title="Allow the candidate to continue from another browser/device (e.g. after a crash)">
                <Button size="small" onClick={() => call(() => api.post(`/stages/${stage.id}/reset`, { mode: "unlock" }), "Session unlocked")}>Unlock session</Button>
              </Tooltip>
            )}
            {["invited", "in_progress", "submitted", "expired"].includes(stage.status) && !live && (
              <Tooltip describeChild title="Discard this attempt and email a fresh link">
                <Button size="small" color="warning" onClick={() => window.confirm("Discard this attempt and send a new link?") && call(() => api.post(`/stages/${stage.id}/reset`, { mode: "retake" }), "New attempt link sent")}>
                  Allow retake
                </Button>
              </Tooltip>
            )}
          </>
        )}
      </Stack>
    </Stack>
  );
}
