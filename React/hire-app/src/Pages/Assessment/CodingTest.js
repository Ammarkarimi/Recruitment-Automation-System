import React, { useState } from "react";
import { Alert, Box, Button, Chip, Grid, MenuItem, Paper, Stack, Tab, Tabs, TextField, Typography } from "@mui/material";
import PlayArrowIcon from "@mui/icons-material/PlayArrow";
import CodeEditor from "../../Components/CodeEditor";

const LANG_LABELS = { python: "Python 3", javascript: "JavaScript (Node)", cpp: "C++17", java: "Java (class Main)" };

function Results({ result }) {
  if (!result) return null;
  if (result.error) return <Alert severity="error">{result.error}</Alert>;
  if (result.compile_error) return <Alert severity="error" className="mono" sx={{ whiteSpace: "pre-wrap" }}>{result.compile_error}</Alert>;
  return (
    <Stack gap={1}>
      {result.tests.map((t, i) => (
        <Paper key={i} variant="outlined" sx={{ p: 1.5 }}>
          <Stack direction="row" gap={1} alignItems="center" sx={{ mb: 1 }}>
            <Typography fontWeight={700}>{result.custom ? "Custom input" : `Sample ${i + 1}`}</Typography>
            {!result.custom && <Chip size="small" color={t.passed ? "success" : "error"} label={t.status.replace(/_/g, " ")} />}
            {result.custom && t.status !== "wrong_answer" && t.status !== "passed" && <Chip size="small" color="error" label={t.status.replace(/_/g, " ")} />}
            <Typography variant="caption" color="text.secondary">{t.time}s</Typography>
          </Stack>
          <Grid container spacing={1} className="mono" sx={{ fontSize: 13 }}>
            <Grid item xs={12} md={result.custom ? 6 : 4}>
              <Typography variant="caption" color="text.secondary">Input</Typography>
              <Box component="pre" sx={{ m: 0, p: 1, bgcolor: "action.hover", borderRadius: 1, maxHeight: 140, overflow: "auto" }}>{t.input}</Box>
            </Grid>
            {!result.custom && (
              <Grid item xs={12} md={4}>
                <Typography variant="caption" color="text.secondary">Expected</Typography>
                <Box component="pre" sx={{ m: 0, p: 1, bgcolor: "action.hover", borderRadius: 1, maxHeight: 140, overflow: "auto" }}>{t.expected}</Box>
              </Grid>
            )}
            <Grid item xs={12} md={result.custom ? 6 : 4}>
              <Typography variant="caption" color="text.secondary">Your output</Typography>
              <Box component="pre" sx={{ m: 0, p: 1, bgcolor: "action.hover", borderRadius: 1, maxHeight: 140, overflow: "auto" }}>{t.stdout}</Box>
            </Grid>
          </Grid>
          {t.stderr && <Box component="pre" className="mono" sx={{ color: "error.main", fontSize: 12, whiteSpace: "pre-wrap", mt: 1, mb: 0 }}>{t.stderr}</Box>}
        </Paper>
      ))}
    </Stack>
  );
}

function Problem({ q, answer, save, api, languages, onError }) {
  const initialLang = answer?.language && languages.includes(answer.language) ? answer.language : languages[0];
  const [lang, setLang] = useState(initialLang);
  const [codes, setCodes] = useState(() => ({ ...q.starter_code, ...(answer?.code ? { [initialLang]: answer.code } : {}) }));
  const [result, setResult] = useState(null);
  const [running, setRunning] = useState(false);
  const [custom, setCustom] = useState("");
  const [useCustom, setUseCustom] = useState(false);
  const code = codes[lang] ?? "";

  // Autosave shortly after typing stops (flushed immediately on submit).
  const change = (value) => {
    setCodes({ ...codes, [lang]: value });
    save(q.key, { language: lang, code: value }, { debounceMs: 1500 });
  };

  const switchLanguage = (next) => {
    setLang(next);
    save(q.key, { language: next, code: codes[next] ?? "" });
  };

  const run = async () => {
    setRunning(true);
    save(q.key, { language: lang, code });
    try {
      const payload = { key: q.key, language: lang, code };
      if (useCustom) payload.custom_input = custom;
      setResult(await api.run(payload));
    } catch (err) {
      setResult({ error: onError(err) || "Could not run the code" });
    } finally {
      setRunning(false);
    }
  };

  return (
    <Grid container spacing={2}>
      <Grid item xs={12} md={5}>
        <Paper sx={{ p: 2.5, height: { md: "calc(100vh - 170px)" }, overflow: "auto" }}>
          <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1 }}>
            <Typography variant="h6" fontWeight={700}>{q.title}</Typography>
            <Chip size="small" label={`${q.marks} marks`} />
          </Stack>
          <Stack direction="row" gap={1} sx={{ mb: 2 }}>
            <Chip size="small" variant="outlined" label={q.difficulty} />
            <Chip size="small" variant="outlined" label={`${q.time_limit_sec}s per test`} />
            <Chip size="small" variant="outlined" label={`${q.hidden_tests} hidden tests`} />
          </Stack>
          <pre className="problem">{q.text}</pre>
          {q.samples.map((s, i) => (
            <Box key={i} sx={{ mt: 2 }}>
              <Typography variant="subtitle2" fontWeight={700}>Sample {i + 1}</Typography>
              <Grid container spacing={1} className="mono" sx={{ fontSize: 13 }}>
                <Grid item xs={6}>
                  <Typography variant="caption" color="text.secondary">Input</Typography>
                  <Box component="pre" sx={{ m: 0, p: 1, bgcolor: "action.hover", borderRadius: 1, overflow: "auto" }}>{s.input}</Box>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="caption" color="text.secondary">Output</Typography>
                  <Box component="pre" sx={{ m: 0, p: 1, bgcolor: "action.hover", borderRadius: 1, overflow: "auto" }}>{s.output}</Box>
                </Grid>
              </Grid>
            </Box>
          ))}
        </Paper>
      </Grid>
      <Grid item xs={12} md={7}>
        <Paper sx={{ p: 2 }}>
          <Stack direction="row" gap={1} alignItems="center" sx={{ mb: 1 }}>
            <TextField select size="small" label="Language" value={lang} onChange={(e) => switchLanguage(e.target.value)} sx={{ minWidth: 200 }}>
              {languages.map((l) => <MenuItem key={l} value={l}>{LANG_LABELS[l] || l}</MenuItem>)}
            </TextField>
            <Typography variant="caption" color="text.secondary" sx={{ flexGrow: 1 }}>Saved automatically</Typography>
            <Button size="small" onClick={() => setUseCustom(!useCustom)}>{useCustom ? "Use sample tests" : "Custom input"}</Button>
            <Button variant="contained" startIcon={<PlayArrowIcon />} onClick={run} disabled={running}>
              {running ? "Running..." : "Run"}
            </Button>
          </Stack>
          <CodeEditor value={code} onChange={change} minHeight={380} />
          {useCustom && (
            <TextField className="mono" fullWidth multiline minRows={3} label="Custom input (stdin)" value={custom} onChange={(e) => setCustom(e.target.value)} sx={{ mt: 1 }} />
          )}
          <Box sx={{ mt: 2 }}>
            <Results result={result} />
          </Box>
        </Paper>
      </Grid>
    </Grid>
  );
}

export default function CodingTest({ questions, answers, save, api, languages, onError }) {
  const [index, setIndex] = useState(0);
  return (
    <>
      {questions.length > 1 && (
        <Paper sx={{ mb: 2 }}>
          <Tabs value={index} onChange={(_, v) => setIndex(v)} variant="scrollable">
            {questions.map((q, i) => (
              <Tab key={q.key} value={i} label={`${i + 1}. ${q.title}${answers[q.key]?.code?.trim() ? " ✓" : ""}`} />
            ))}
          </Tabs>
        </Paper>
      )}
      {questions.map((q, i) => (
        <Box key={q.key} sx={{ display: i === index ? "block" : "none" }}>
          <Problem q={q} answer={answers[q.key]} save={save} api={api} languages={languages || []} onError={onError} />
        </Box>
      ))}
    </>
  );
}
