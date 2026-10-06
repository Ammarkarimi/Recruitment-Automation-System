import React, { useState } from "react";
import { Box, Button, Chip, FormControlLabel, Grid, Paper, Radio, RadioGroup, Stack, Typography } from "@mui/material";
import FlagIcon from "@mui/icons-material/Flag";
import OutlinedFlagIcon from "@mui/icons-material/OutlinedFlag";

export default function AptitudeTest({ questions, answers, save }) {
  const [index, setIndex] = useState(0);
  const q = questions[index];
  const a = answers[q.key] || {};
  const answeredCount = questions.filter((x) => answers[x.key]?.choice != null).length;

  const choose = (choice) => save(q.key, { choice, flagged: Boolean(a.flagged) });
  const toggleFlag = () => save(q.key, { choice: a.choice ?? null, flagged: !a.flagged });

  return (
    <Grid container spacing={2}>
      <Grid item xs={12} md={8} lg={9}>
        <Paper sx={{ p: { xs: 2, md: 4 }, minHeight: 420 }}>
          <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
            <Typography color="text.secondary" fontWeight={600}>
              Question {index + 1} of {questions.length}
              {q.topic && <Chip size="small" label={q.topic} sx={{ ml: 1 }} />}
            </Typography>
            <Stack direction="row" gap={1} alignItems="center">
              <Chip size="small" label={`${q.marks} mark${q.marks === 1 ? "" : "s"}`} variant="outlined" />
              <Button size="small" color="warning" startIcon={a.flagged ? <FlagIcon /> : <OutlinedFlagIcon />} onClick={toggleFlag}>
                {a.flagged ? "Flagged" : "Flag for review"}
              </Button>
            </Stack>
          </Stack>
          <Typography variant="h6" sx={{ mb: 3, whiteSpace: "pre-wrap" }}>{q.text}</Typography>
          <RadioGroup value={a.choice ?? ""} onChange={(e) => choose(Number(e.target.value))}>
            {q.options.map((opt, i) => (
              <Paper
                key={i}
                variant="outlined"
                sx={{ mb: 1.5, px: 2, py: 0.5, borderColor: a.choice === i ? "primary.main" : "divider", bgcolor: a.choice === i ? "rgba(79,70,229,0.06)" : "transparent" }}
              >
                <FormControlLabel value={i} control={<Radio />} label={<span><b>{String.fromCharCode(65 + i)}.</b> {opt}</span>} sx={{ width: "100%", m: 0 }} />
              </Paper>
            ))}
          </RadioGroup>
          <Stack direction="row" justifyContent="space-between" sx={{ mt: 3 }}>
            <Button disabled={index === 0} onClick={() => setIndex(index - 1)}>Previous</Button>
            <Stack direction="row" gap={1}>
              {a.choice != null && <Button color="inherit" onClick={() => save(q.key, { choice: null, flagged: Boolean(a.flagged) })}>Clear answer</Button>}
              <Button variant="contained" disabled={index === questions.length - 1} onClick={() => setIndex(index + 1)}>Save & next</Button>
            </Stack>
          </Stack>
        </Paper>
      </Grid>
      <Grid item xs={12} md={4} lg={3}>
        <Paper sx={{ p: 2, position: { md: "sticky" }, top: { md: 88 } }}>
          <Typography fontWeight={700} gutterBottom>Questions</Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>{answeredCount} of {questions.length} answered</Typography>
          <Box sx={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(40px, 1fr))", gap: 1 }}>
            {questions.map((x, i) => {
              const ans = answers[x.key];
              const done = ans?.choice != null;
              return (
                <Button
                  key={x.key}
                  size="small"
                  variant={i === index ? "contained" : done ? "contained" : "outlined"}
                  color={ans?.flagged ? "warning" : done && i !== index ? "success" : "primary"}
                  onClick={() => setIndex(i)}
                  sx={{ minWidth: 0, p: 0.75, fontWeight: 700 }}
                >
                  {i + 1}
                </Button>
              );
            })}
          </Box>
          <Stack direction="row" gap={1} sx={{ mt: 2 }} flexWrap="wrap">
            <Chip size="small" color="success" label="Answered" />
            <Chip size="small" color="warning" label="Flagged" />
            <Chip size="small" variant="outlined" label="Not answered" />
          </Stack>
        </Paper>
      </Grid>
    </Grid>
  );
}
