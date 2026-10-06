import React, { useCallback, useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import {
  Box,
  Button,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  MenuItem,
  Paper,
  Stack,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/DeleteOutline";
import AutoAwesomeIcon from "@mui/icons-material/AutoAwesome";
import LibraryAddIcon from "@mui/icons-material/LibraryAdd";
import UploadFileIcon from "@mui/icons-material/UploadFile";
import DownloadIcon from "@mui/icons-material/Download";
import { toast } from "react-toastify";
import api, { download, errorMessage } from "../../lib/api";
import PageHeader from "../../Components/PageHeader";
import QuestionEditor, { emptyQuestion } from "./QuestionEditor";

export default function QuestionBank() {
  const { roundId } = useParams();
  const [data, setData] = useState(null);
  const [editing, setEditing] = useState(null);
  const [gen, setGen] = useState(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(() => {
    api.get(`/rounds/${roundId}/questions`).then((res) => setData(res.data)).catch((err) => toast.error(errorMessage(err)));
  }, [roundId]);
  useEffect(() => {
    load();
  }, [load]);

  if (!data) return <CircularProgress />;
  const { round, questions } = data;
  const kind = { aptitude: "mcq", coding: "coding", interview: "interview" }[round.type];
  const totalMarks = questions.reduce((a, q) => a + q.marks, 0);

  const run = async (fn, message) => {
    setBusy(true);
    try {
      const res = await fn();
      toast.success(message(res.data));
      if (res.data.errors?.length) toast.warn(`${res.data.errors.length} rows skipped: ${res.data.errors.slice(0, 3).map((e) => `row ${e.row}`).join(", ")}`);
      load();
    } catch (err) {
      toast.error(errorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  const save = async (q) => {
    try {
      if (q.id) await api.put(`/questions/${q.id}`, q);
      else await api.post(`/rounds/${roundId}/questions`, q);
      setEditing(null);
      load();
    } catch (err) {
      toast.error(errorMessage(err));
    }
  };

  const importFile = (file) => {
    const fd = new FormData();
    fd.append("file", file);
    run(() => api.post(`/rounds/${roundId}/questions/import`, fd), (d) => `Imported ${d.created} questions`);
  };

  return (
    <>
      <PageHeader
        title={`${round.name} · Question bank`}
        subtitle={`${questions.length} questions · ${totalMarks} marks total · each candidate gets ${round.config.num_questions || "all"} question(s) in ${round.config.shuffle_questions ? "random" : "fixed"} order`}
        crumbs={[{ label: "Drives", to: "/app" }, { label: data.drive_title, to: `/app/drives/${round.drive_id}` }, { label: round.name }]}
        actions={
          <>
            {kind === "mcq" && (
              <>
                <Button startIcon={<DownloadIcon />} onClick={() => download("/templates/mcqs.xlsx", "mcq_questions_template.xlsx")}>Excel template</Button>
                <Button component="label" startIcon={<UploadFileIcon />} disabled={busy}>
                  Import Excel
                  <input hidden type="file" accept=".xlsx,.csv" onChange={(e) => { e.target.files[0] && importFile(e.target.files[0]); e.target.value = ""; }} />
                </Button>
              </>
            )}
            <Tooltip describeChild title="Adds a ready-made starter set you can edit">
              <Button startIcon={<LibraryAddIcon />} disabled={busy} onClick={() => run(() => api.post(`/rounds/${roundId}/questions/samples`), (d) => `Added ${d.created} sample questions`)}>
                Add sample questions
              </Button>
            </Tooltip>
            {kind !== "coding" && (
              <Tooltip describeChild title={data.ai_enabled ? "" : "Set GEMINI_API_KEY on the server to enable"}>
                <span>
                  <Button startIcon={<AutoAwesomeIcon />} disabled={!data.ai_enabled || busy} onClick={() => setGen({ topic: "", count: 10, difficulty: "medium" })}>
                    Generate with AI
                  </Button>
                </span>
              </Tooltip>
            )}
            <Button variant="contained" startIcon={<AddIcon />} onClick={() => setEditing(emptyQuestion(kind))}>
              Add question
            </Button>
          </>
        }
      />
      <Stack gap={1.5}>
        {questions.map((q, i) => (
          <Paper key={q.id} sx={{ p: 2 }}>
            <Stack direction="row" gap={2} alignItems="flex-start">
              <Chip label={i + 1} size="small" />
              <Box sx={{ flex: 1, minWidth: 0 }}>
                <Typography fontWeight={600} sx={{ whiteSpace: "pre-wrap" }}>
                  {q.kind === "coding" ? q.meta.title : q.text}
                </Typography>
                {q.kind === "mcq" && (
                  <Stack direction="row" gap={1} flexWrap="wrap" sx={{ mt: 1 }}>
                    {q.options.map((o, idx) => (
                      <Chip key={idx} size="small" label={`${String.fromCharCode(65 + idx)}. ${o}`} color={idx === q.answer ? "success" : "default"} variant={idx === q.answer ? "filled" : "outlined"} />
                    ))}
                  </Stack>
                )}
                {q.kind === "coding" && (
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                    {q.meta.test_cases?.length || 0} test cases ({(q.meta.test_cases || []).filter((t) => t.hidden).length} hidden) · {q.meta.time_limit_sec}s limit
                  </Typography>
                )}
                {q.kind === "interview" && q.answer && (
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                    Ideal answer covers: {q.answer}
                  </Typography>
                )}
                <Stack direction="row" gap={1} sx={{ mt: 1 }}>
                  <Chip size="small" variant="outlined" label={`${q.marks} marks`} />
                  {q.topic && <Chip size="small" variant="outlined" label={q.topic} />}
                  <Chip size="small" variant="outlined" label={q.difficulty} />
                </Stack>
              </Box>
              <IconButton onClick={() => setEditing(q)}><EditIcon /></IconButton>
              <IconButton onClick={() => window.confirm("Delete this question?") && api.delete(`/questions/${q.id}`).then(load).catch((e) => toast.error(errorMessage(e)))}>
                <DeleteIcon />
              </IconButton>
            </Stack>
          </Paper>
        ))}
        {!questions.length && (
          <Paper sx={{ p: 5, textAlign: "center" }}>
            <Typography color="text.secondary">
              No questions yet. Add your own, {kind === "mcq" ? "import an Excel sheet, " : ""}or start from the sample set.
            </Typography>
          </Paper>
        )}
      </Stack>
      {editing && <QuestionEditor question={editing} roundId={roundId} languages={round.config.languages} onClose={() => setEditing(null)} onSave={save} />}
      <Dialog open={Boolean(gen)} onClose={() => setGen(null)} fullWidth maxWidth="xs">
        <DialogTitle>Generate questions with AI</DialogTitle>
        <DialogContent>
          <Stack gap={2} sx={{ mt: 1 }}>
            <TextField label="Topic(s)" placeholder="e.g. percentages, time & work, Python basics" value={gen?.topic || ""} onChange={(e) => setGen({ ...gen, topic: e.target.value })} />
            <TextField label="How many" type="number" value={gen?.count || 10} onChange={(e) => setGen({ ...gen, count: Number(e.target.value) })} inputProps={{ min: 1, max: 30 }} />
            {kind === "mcq" && (
              <TextField select label="Difficulty" value={gen?.difficulty || "medium"} onChange={(e) => setGen({ ...gen, difficulty: e.target.value })}>
                {["easy", "medium", "hard"].map((d) => <MenuItem key={d} value={d}>{d}</MenuItem>)}
              </TextField>
            )}
            <Typography variant="caption" color="text.secondary">Generated questions are added to the bank. Review them before inviting candidates.</Typography>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setGen(null)}>Cancel</Button>
          <Button
            variant="contained"
            disabled={busy}
            onClick={() => {
              const payload = gen;
              setGen(null);
              run(() => api.post(`/rounds/${roundId}/questions/generate`, payload), (d) => `Generated ${d.created} questions`);
            }}
          >
            Generate
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
