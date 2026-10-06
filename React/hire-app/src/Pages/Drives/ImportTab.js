import React, { useRef, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Checkbox,
  FormControlLabel,
  Grid,
  List,
  ListItem,
  Paper,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import UploadFileIcon from "@mui/icons-material/UploadFile";
import DownloadIcon from "@mui/icons-material/Download";
import PersonAddIcon from "@mui/icons-material/PersonAdd";
import { toast } from "react-toastify";
import api, { download, errorMessage } from "../../lib/api";

function DropZone({ accept, multiple, onFiles, label, hint }) {
  const ref = useRef(null);
  const [over, setOver] = useState(false);
  return (
    <Box
      onClick={() => ref.current?.click()}
      onDragOver={(e) => { e.preventDefault(); setOver(true); }}
      onDragLeave={() => setOver(false)}
      onDrop={(e) => { e.preventDefault(); setOver(false); onFiles([...e.dataTransfer.files]); }}
      sx={{
        border: "2px dashed",
        borderColor: over ? "primary.main" : "divider",
        bgcolor: over ? "action.hover" : "transparent",
        borderRadius: 2,
        p: 3,
        textAlign: "center",
        cursor: "pointer",
      }}
    >
      <UploadFileIcon color="primary" sx={{ fontSize: 36 }} />
      <Typography fontWeight={600}>{label}</Typography>
      <Typography variant="caption" color="text.secondary">{hint}</Typography>
      <input ref={ref} type="file" hidden accept={accept} multiple={multiple} onChange={(e) => { onFiles([...e.target.files]); e.target.value = ""; }} />
    </Box>
  );
}

export default function ImportTab({ drive, reload }) {
  const [sheetResult, setSheetResult] = useState(null);
  const [resumeResult, setResumeResult] = useState(null);
  const [createMissing, setCreateMissing] = useState(false);
  const [busy, setBusy] = useState(false);
  const [single, setSingle] = useState({ name: "", email: "", phone: "" });

  const importSheet = async (files) => {
    if (!files.length) return;
    const fd = new FormData();
    fd.append("file", files[0]);
    setBusy(true);
    try {
      const res = await api.post(`/drives/${drive.id}/candidates/import`, fd);
      setSheetResult(res.data);
      toast.success(`${res.data.created} candidates added`);
      reload();
    } catch (err) {
      setSheetResult({ error: errorMessage(err), found_headers: err.response?.data?.found_headers });
    } finally {
      setBusy(false);
    }
  };

  const uploadResumes = async (files) => {
    if (!files.length) return;
    const fd = new FormData();
    files.forEach((f) => fd.append("files", f));
    fd.append("create_missing", String(createMissing));
    setBusy(true);
    try {
      const res = await api.post(`/drives/${drive.id}/resumes`, fd);
      setResumeResult(res.data);
      toast.success(`${res.data.matched} resumes attached`);
      reload();
    } catch (err) {
      toast.error(errorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  const addSingle = async (e) => {
    e.preventDefault();
    try {
      await api.post(`/drives/${drive.id}/candidates`, single);
      toast.success("Candidate added");
      setSingle({ name: "", email: "", phone: "" });
      reload();
    } catch (err) {
      toast.error(errorMessage(err));
    }
  };

  return (
    <Grid container spacing={2}>
      <Grid item xs={12} md={6}>
        <Paper sx={{ p: 3, height: "100%" }}>
          <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1 }}>
            <Typography variant="subtitle1" fontWeight={700}>1. Import candidates from Excel / CSV</Typography>
            <Button size="small" startIcon={<DownloadIcon />} onClick={() => download("/templates/candidates.xlsx", "candidates_template.xlsx")}>
              Template
            </Button>
          </Stack>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            The first row must be headers. An <b>Email</b> column is required; <b>Name</b> (or First/Last Name) and <b>Phone</b> are recognised automatically. Any other column (College, CGPA, Experience...) is kept on the candidate's profile. Duplicates are skipped.
          </Typography>
          <DropZone accept=".xlsx,.xlsm,.csv" onFiles={importSheet} label={busy ? "Uploading..." : "Drop the spreadsheet here or click to browse"} hint=".xlsx or .csv" />
          {sheetResult?.error && (
            <Alert severity="error" sx={{ mt: 2 }}>
              {sheetResult.error}
              {sheetResult.found_headers && <div>Headers found: {sheetResult.found_headers.join(", ")}</div>}
            </Alert>
          )}
          {sheetResult && !sheetResult.error && (
            <Alert severity={sheetResult.errors.length ? "warning" : "success"} sx={{ mt: 2 }}>
              Added <b>{sheetResult.created}</b> of {sheetResult.total_rows} rows.
              {sheetResult.duplicates.length > 0 && ` ${sheetResult.duplicates.length} already in this drive.`}
              {sheetResult.errors.length > 0 && (
                <List dense sx={{ maxHeight: 160, overflow: "auto" }}>
                  {sheetResult.errors.slice(0, 100).map((e) => (
                    <ListItem key={e.row} sx={{ py: 0 }}>Row {e.row}: {e.error}</ListItem>
                  ))}
                </List>
              )}
            </Alert>
          )}
          <Typography variant="subtitle2" fontWeight={700} sx={{ mt: 3, mb: 1 }}>Or add one candidate</Typography>
          <form onSubmit={addSingle}>
            <Stack direction={{ xs: "column", sm: "row" }} gap={1}>
              <TextField size="small" label="Name" value={single.name} onChange={(e) => setSingle({ ...single, name: e.target.value })} />
              <TextField size="small" label="Email" required type="email" value={single.email} onChange={(e) => setSingle({ ...single, email: e.target.value })} />
              <TextField size="small" label="Phone" value={single.phone} onChange={(e) => setSingle({ ...single, phone: e.target.value })} />
              <Button type="submit" variant="outlined" startIcon={<PersonAddIcon />}>Add</Button>
            </Stack>
          </form>
        </Paper>
      </Grid>
      <Grid item xs={12} md={6}>
        <Paper sx={{ p: 3, height: "100%" }}>
          <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 1 }}>2. Upload resumes (for resume screening)</Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Upload PDF/TXT resumes or a single ZIP containing all of them. Each resume is matched to a candidate by the email address written in it, or by the file name (e.g. <i>asha.verma@example.com.pdf</i> or <i>Asha_Verma.pdf</i>).
          </Typography>
          <FormControlLabel
            control={<Checkbox checked={createMissing} onChange={(e) => setCreateMissing(e.target.checked)} />}
            label="Create new candidates for resumes that don't match anyone (uses the email found in the resume)"
          />
          <DropZone accept=".pdf,.txt,.zip" multiple onFiles={uploadResumes} label={busy ? "Uploading..." : "Drop resumes or a ZIP here"} hint="PDF, TXT or ZIP · up to 50 MB per upload" />
          {resumeResult && (
            <Alert severity={resumeResult.unmatched.length ? "warning" : "success"} sx={{ mt: 2 }}>
              Attached {resumeResult.matched} resumes{resumeResult.created ? `, created ${resumeResult.created} new candidates` : ""}.
              {resumeResult.unmatched.length > 0 && (
                <Box sx={{ mt: 1 }}>
                  Couldn't match: {resumeResult.unmatched.slice(0, 30).join(", ")}
                  {resumeResult.unmatched.length > 30 && ` and ${resumeResult.unmatched.length - 30} more`}
                </Box>
              )}
            </Alert>
          )}
        </Paper>
      </Grid>
    </Grid>
  );
}
