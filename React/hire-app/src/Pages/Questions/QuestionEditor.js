import React, { useState } from "react";
import {
  Alert,
  Box,
  Button,
  Checkbox,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControlLabel,
  Grid,
  IconButton,
  MenuItem,
  Radio,
  Stack,
  Tab,
  Tabs,
  TextField,
  Typography,
} from "@mui/material";
import DeleteIcon from "@mui/icons-material/DeleteOutline";
import AddIcon from "@mui/icons-material/Add";
import PlayArrowIcon from "@mui/icons-material/PlayArrow";
import { toast } from "react-toastify";
import api, { errorMessage } from "../../lib/api";
import CodeEditor from "../../Components/CodeEditor";

const LANG_LABELS = { python: "Python", javascript: "JavaScript", cpp: "C++", java: "Java" };

export function emptyQuestion(kind) {
  if (kind === "mcq") return { kind, text: "", options: ["", "", "", ""], answer: 0, marks: 1, topic: "", difficulty: "medium" };
  if (kind === "coding")
    return { kind, text: "", marks: 10, topic: "Programming", difficulty: "medium", meta: { title: "", time_limit_sec: 2, starter_code: {}, test_cases: [{ input: "", output: "", hidden: false }] } };
  return { kind, text: "", answer: "", marks: 10, topic: "", difficulty: "medium" };
}

function CodingFields({ q, setQ, roundId, languages }) {
  const meta = q.meta;
  const setMeta = (patch) => setQ({ ...q, meta: { ...meta, ...patch } });
  const langs = languages?.length ? languages : Object.keys(LANG_LABELS);
  const [lang, setLang] = useState(langs[0]);
  const [trial, setTrial] = useState({ code: "", result: null, busy: false });
  const tests = meta.test_cases || [];
  const setTest = (i, patch) => setMeta({ test_cases: tests.map((t, idx) => (idx === i ? { ...t, ...patch } : t)) });

  const tryIt = async () => {
    setTrial({ ...trial, busy: true });
    try {
      const res = await api.post(`/rounds/${roundId}/questions/try`, { language: lang, code: trial.code, meta });
      setTrial({ ...trial, busy: false, result: res.data });
    } catch (err) {
      toast.error(errorMessage(err));
      setTrial({ ...trial, busy: false });
    }
  };

  return (
    <>
      <Grid container spacing={2}>
        <Grid item xs={12} sm={8}>
          <TextField fullWidth label="Problem title" value={meta.title} onChange={(e) => setMeta({ title: e.target.value })} />
        </Grid>
        <Grid item xs={12} sm={4}>
          <TextField fullWidth type="number" label="Time limit per test (s)" value={meta.time_limit_sec} inputProps={{ min: 1, max: 10 }} onChange={(e) => setMeta({ time_limit_sec: Number(e.target.value) })} />
        </Grid>
      </Grid>
      <Typography variant="subtitle2" fontWeight={700} sx={{ mt: 3, mb: 1 }}>
        Test cases <Typography component="span" variant="caption" color="text.secondary">(visible ones are shown as samples; hidden ones decide the score)</Typography>
      </Typography>
      {tests.map((t, i) => (
        <Stack key={i} direction={{ xs: "column", md: "row" }} gap={1} sx={{ mb: 1 }} alignItems={{ md: "flex-start" }}>
          <Chip label={`#${i + 1}`} size="small" sx={{ mt: 1 }} />
          <TextField className="mono" label="Input (stdin)" multiline minRows={2} fullWidth value={t.input} onChange={(e) => setTest(i, { input: e.target.value })} />
          <TextField className="mono" label="Expected output" multiline minRows={2} fullWidth value={t.output} onChange={(e) => setTest(i, { output: e.target.value })} />
          <FormControlLabel control={<Checkbox checked={t.hidden} onChange={(e) => setTest(i, { hidden: e.target.checked })} />} label="Hidden" />
          <IconButton onClick={() => setMeta({ test_cases: tests.filter((_, idx) => idx !== i) })}><DeleteIcon /></IconButton>
        </Stack>
      ))}
      <Button startIcon={<AddIcon />} onClick={() => setMeta({ test_cases: [...tests, { input: "", output: "", hidden: true }] })}>Add test case</Button>

      <Typography variant="subtitle2" fontWeight={700} sx={{ mt: 3 }}>Starter code & reference check</Typography>
      <Tabs value={lang} onChange={(_, v) => setLang(v)}>
        {langs.map((l) => <Tab key={l} value={l} label={LANG_LABELS[l]} />)}
      </Tabs>
      <Grid container spacing={2} sx={{ mt: 0.5 }}>
        <Grid item xs={12} md={6}>
          <Typography variant="caption" color="text.secondary">Starter code shown to candidates (optional)</Typography>
          <CodeEditor value={meta.starter_code?.[lang] || ""} onChange={(v) => setMeta({ starter_code: { ...meta.starter_code, [lang]: v } })} minHeight={220} />
        </Grid>
        <Grid item xs={12} md={6}>
          <Typography variant="caption" color="text.secondary">Paste a reference solution to verify your test cases (not saved)</Typography>
          <CodeEditor value={trial.code} onChange={(v) => setTrial({ ...trial, code: v })} minHeight={220} />
          <Button size="small" startIcon={<PlayArrowIcon />} onClick={tryIt} disabled={trial.busy || !trial.code.trim()} sx={{ mt: 1 }}>
            {trial.busy ? "Running..." : "Run against all tests"}
          </Button>
          {trial.result?.compile_error && <Alert severity="error" className="mono" sx={{ whiteSpace: "pre-wrap", mt: 1 }}>{trial.result.compile_error}</Alert>}
          {trial.result?.tests && (
            <Stack direction="row" gap={0.5} flexWrap="wrap" sx={{ mt: 1 }}>
              {trial.result.tests.map((t, i) => <Chip key={i} size="small" color={t.passed ? "success" : "error"} label={`#${i + 1} ${t.status.replace(/_/g, " ")}`} title={t.stderr || t.stdout} />)}
            </Stack>
          )}
        </Grid>
      </Grid>
    </>
  );
}

export default function QuestionEditor({ question, onClose, onSave, roundId, languages }) {
  const [q, setQ] = useState(JSON.parse(JSON.stringify(question)));
  const kind = q.kind;

  return (
    <Dialog open onClose={onClose} fullWidth maxWidth={kind === "coding" ? "lg" : "sm"}>
      <DialogTitle>{q.id ? "Edit question" : "New question"}</DialogTitle>
      <DialogContent>
        <Stack gap={2} sx={{ mt: 1 }}>
          {kind === "coding" && <CodingFields q={q} setQ={setQ} roundId={roundId} languages={languages} />}
          <TextField
            label={kind === "coding" ? "Problem statement (input/output format, constraints, examples)" : "Question"}
            multiline
            minRows={kind === "coding" ? 8 : 2}
            value={q.text}
            onChange={(e) => setQ({ ...q, text: e.target.value })}
          />
          {kind === "mcq" && (
            <Box>
              <Typography variant="caption" color="text.secondary">Options - select the correct one</Typography>
              {q.options.map((o, i) => (
                <Stack key={i} direction="row" alignItems="center" gap={1} sx={{ mt: 1 }}>
                  <Radio checked={q.answer === i} onChange={() => setQ({ ...q, answer: i })} />
                  <TextField size="small" fullWidth label={`Option ${String.fromCharCode(65 + i)}`} value={o} onChange={(e) => setQ({ ...q, options: q.options.map((x, idx) => (idx === i ? e.target.value : x)) })} />
                  <IconButton disabled={q.options.length <= 2} onClick={() => setQ({ ...q, options: q.options.filter((_, idx) => idx !== i), answer: q.answer === i ? 0 : q.answer > i ? q.answer - 1 : q.answer })}>
                    <DeleteIcon />
                  </IconButton>
                </Stack>
              ))}
              {q.options.length < 6 && <Button startIcon={<AddIcon />} onClick={() => setQ({ ...q, options: [...q.options, ""] })} sx={{ mt: 1 }}>Add option</Button>}
            </Box>
          )}
          {kind === "interview" && (
            <TextField
              label="What a good answer covers (used for automatic scoring)"
              multiline
              minRows={3}
              value={q.answer || ""}
              onChange={(e) => setQ({ ...q, answer: e.target.value })}
            />
          )}
          <Stack direction="row" gap={2}>
            <TextField type="number" label="Marks" value={q.marks} onChange={(e) => setQ({ ...q, marks: Number(e.target.value) })} sx={{ width: 120 }} />
            <TextField label="Topic / section" value={q.topic} onChange={(e) => setQ({ ...q, topic: e.target.value })} sx={{ flex: 1 }} />
            <TextField select label="Difficulty" value={q.difficulty} onChange={(e) => setQ({ ...q, difficulty: e.target.value })} sx={{ width: 140 }}>
              {["easy", "medium", "hard"].map((d) => <MenuItem key={d} value={d}>{d}</MenuItem>)}
            </TextField>
          </Stack>
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button variant="contained" onClick={() => onSave(q)}>Save</Button>
      </DialogActions>
    </Dialog>
  );
}
