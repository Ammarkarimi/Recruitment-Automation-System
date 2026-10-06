import React, { useEffect, useState } from "react";
import { Button, Dialog, DialogActions, DialogContent, DialogTitle, MenuItem, Stack, TextField, Typography } from "@mui/material";
import { toast } from "react-toastify";
import api, { errorMessage } from "../../lib/api";

const TEMPLATES = {
  selected: {
    subject: "Congratulations from {{company}}!",
    body: "Hi {{name}},\n\nWe're delighted to let you know that you have been selected for the {{drive}} role at {{company}}. Our team will reach out shortly with the next steps.\n\nBest regards,\n{{company}} Hiring Team",
  },
  rejected: {
    subject: "Your application for {{drive}} at {{company}}",
    body: "Hi {{name}},\n\nThank you for the time you invested in our hiring process for {{drive}}. After careful consideration we won't be moving forward with your application this time.\n\nWe wish you the very best.\n{{company}} Hiring Team",
  },
  custom: { subject: "", body: "Hi {{name}},\n\n" },
};

/** Bulk email to selected candidates (candidateIds) or to everyone with a status. */
export default function ComposeEmailDialog({ open, onClose, drive, candidateIds = [] }) {
  const [audience, setAudience] = useState(candidateIds.length ? "selected_ids" : "selected");
  const [template, setTemplate] = useState("custom");
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState(TEMPLATES.custom.body);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (open) setAudience(candidateIds.length ? "selected_ids" : "selected");
  }, [open, candidateIds.length]);

  const applyTemplate = (t) => {
    setTemplate(t);
    setSubject(TEMPLATES[t].subject);
    setBody(TEMPLATES[t].body);
  };

  const send = async () => {
    setBusy(true);
    try {
      const payload = { subject, body, kind: template === "custom" ? "custom" : "result" };
      if (audience === "selected_ids") payload.candidate_ids = candidateIds;
      else payload.status = audience;
      const res = await api.post(`/drives/${drive.id}/notify`, payload);
      toast.success(`${res.data.queued} emails queued`);
      onClose();
    } catch (err) {
      toast.error(errorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>Send email</DialogTitle>
      <DialogContent>
        <Stack gap={2} sx={{ mt: 1 }}>
          <TextField select label="Recipients" value={audience} onChange={(e) => setAudience(e.target.value)}>
            {candidateIds.length > 0 && <MenuItem value="selected_ids">{candidateIds.length} selected candidates</MenuItem>}
            <MenuItem value="selected">Everyone selected (passed all rounds)</MenuItem>
            <MenuItem value="rejected">Everyone rejected</MenuItem>
            <MenuItem value="active">Everyone still in the pipeline</MenuItem>
          </TextField>
          <TextField select label="Template" value={template} onChange={(e) => applyTemplate(e.target.value)}>
            <MenuItem value="custom">Blank</MenuItem>
            <MenuItem value="selected">Offer / selection</MenuItem>
            <MenuItem value="rejected">Regret / rejection</MenuItem>
          </TextField>
          <TextField label="Subject" value={subject} onChange={(e) => setSubject(e.target.value)} />
          <TextField label="Message" multiline minRows={8} value={body} onChange={(e) => setBody(e.target.value)} />
          <Typography variant="caption" color="text.secondary">
            Placeholders: {"{{name}} {{email}} {{company}} {{drive}}"}. Each candidate receives an individual email.
          </Typography>
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button variant="contained" onClick={send} disabled={busy || !subject.trim() || !body.trim()}>
          Send
        </Button>
      </DialogActions>
    </Dialog>
  );
}
