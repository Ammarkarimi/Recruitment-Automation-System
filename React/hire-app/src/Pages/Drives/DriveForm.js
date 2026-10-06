import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Box,
  Button,
  Chip,
  CircularProgress,
  Grid,
  IconButton,
  Menu,
  MenuItem,
  Paper,
  Stack,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import ArrowUpwardIcon from "@mui/icons-material/ArrowUpward";
import ArrowDownwardIcon from "@mui/icons-material/ArrowDownward";
import DeleteIcon from "@mui/icons-material/DeleteOutline";
import AddIcon from "@mui/icons-material/Add";
import DescriptionIcon from "@mui/icons-material/Description";
import QuizIcon from "@mui/icons-material/Quiz";
import CodeIcon from "@mui/icons-material/Code";
import VideocamIcon from "@mui/icons-material/Videocam";
import { toast } from "react-toastify";
import api, { errorMessage } from "../../lib/api";
import { defaultsFor, useMeta } from "../../lib/MetaContext";
import { ROUND_LABELS } from "../../lib/format";
import PageHeader from "../../Components/PageHeader";
import RoundSettings from "./RoundSettings";

export const ROUND_ICONS = {
  resume_screening: <DescriptionIcon />,
  aptitude: <QuizIcon />,
  coding: <CodeIcon />,
  interview: <VideocamIcon />,
};

const ROUND_HELP = {
  resume_screening: "Scores uploaded resumes against the job description and required skills.",
  aptitude: "Timed MCQ test (quantitative, logical, verbal or technical) with proctoring.",
  coding: "Programming problems with hidden test cases, run in a sandbox.",
  interview: "Automated AI video interview, or a scheduled live interview with your panel.",
};

let tempId = 0;

export default function DriveForm() {
  const { driveId } = useParams();
  const navigate = useNavigate();
  const meta = useMeta();
  const [loading, setLoading] = useState(Boolean(driveId));
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ title: "", description: "", skills: "", location: "", status: "active" });
  const [rounds, setRounds] = useState([]);
  const [expanded, setExpanded] = useState(null);
  const [menuAnchor, setMenuAnchor] = useState(null);

  useEffect(() => {
    if (!driveId) return;
    api
      .get(`/drives/${driveId}`)
      .then((res) => {
        const d = res.data.drive;
        setForm({ title: d.title, description: d.description, skills: (d.skills || []).join(", "), location: d.location, status: d.status });
        setRounds(d.rounds.map((r) => ({ ...r, key: `r${r.id}` })));
      })
      .catch((err) => toast.error(errorMessage(err)))
      .finally(() => setLoading(false));
  }, [driveId]);

  // Sensible default pipeline for new drives.
  useEffect(() => {
    if (driveId || !meta || rounds.length) return;
    setRounds(
      ["resume_screening", "aptitude", "coding", "interview"].map((type) => ({
        key: `n${++tempId}`,
        type,
        name: ROUND_LABELS[type] === "Interview" ? "AI Interview" : ROUND_LABELS[type],
        config: defaultsFor(meta, type),
      }))
    );
  }, [meta, driveId, rounds.length]);

  const addRound = (type) => {
    const key = `n${++tempId}`;
    setRounds([...rounds, { key, type, name: type === "interview" ? "AI Interview" : ROUND_LABELS[type], config: defaultsFor(meta, type) }]);
    setExpanded(key);
    setMenuAnchor(null);
  };

  const move = (i, dir) => {
    const next = [...rounds];
    const [r] = next.splice(i, 1);
    next.splice(i + dir, 0, r);
    setRounds(next);
  };

  const update = (i, patch) => setRounds(rounds.map((r, idx) => (idx === i ? { ...r, ...patch } : r)));

  const save = async () => {
    if (!form.title.trim()) return toast.error("Give the drive a title");
    if (!rounds.length) return toast.error("Add at least one round");
    setSaving(true);
    const payload = {
      ...form,
      skills: form.skills.split(",").map((s) => s.trim()).filter(Boolean),
      rounds: rounds.map((r) => ({ id: r.id, type: r.type, name: r.name, config: r.config })),
    };
    try {
      const res = driveId ? await api.put(`/drives/${driveId}`, payload) : await api.post("/drives", payload);
      toast.success(driveId ? "Drive updated" : "Drive created");
      navigate(`/app/drives/${res.data.drive.id}`);
    } catch (err) {
      toast.error(errorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  if (loading || !meta) return <CircularProgress />;

  return (
    <>
      <PageHeader
        title={driveId ? "Edit drive" : "New hiring drive"}
        subtitle="Describe the role, then build the pipeline: add, remove, reorder and configure each round."
        crumbs={[{ label: "Drives", to: "/app" }, { label: driveId ? form.title || "Drive" : "New" }]}
        actions={
          <>
            <Button onClick={() => navigate(-1)}>Cancel</Button>
            <Button variant="contained" onClick={save} disabled={saving}>
              {saving ? "Saving..." : "Save drive"}
            </Button>
          </>
        }
      />
      <Grid container spacing={3}>
        <Grid item xs={12} lg={4}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 2 }}>
              Job details
            </Typography>
            <Stack gap={2}>
              <TextField label="Job title / drive name" required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
              <TextField label="Location" value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} />
              <TextField
                label="Key skills"
                helperText="Comma separated, e.g. Python, SQL, React. Used for resume screening."
                value={form.skills}
                onChange={(e) => setForm({ ...form, skills: e.target.value })}
              />
              <TextField
                label="Job description"
                multiline
                minRows={8}
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
              />
              <TextField select label="Status" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
                <MenuItem value="active">Active</MenuItem>
                <MenuItem value="draft">Draft</MenuItem>
                <MenuItem value="closed">Closed</MenuItem>
              </TextField>
            </Stack>
          </Paper>
        </Grid>
        <Grid item xs={12} lg={8}>
          <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1.5 }}>
            <Typography variant="subtitle1" fontWeight={700}>
              Pipeline rounds ({rounds.length})
            </Typography>
            <Button variant="outlined" startIcon={<AddIcon />} onClick={(e) => setMenuAnchor(e.currentTarget)}>
              Add round
            </Button>
            <Menu anchorEl={menuAnchor} open={Boolean(menuAnchor)} onClose={() => setMenuAnchor(null)}>
              {Object.keys(ROUND_LABELS).map((t) => (
                <MenuItem key={t} onClick={() => addRound(t)} sx={{ maxWidth: 380, whiteSpace: "normal", alignItems: "flex-start", gap: 1.5, py: 1.2 }}>
                  {ROUND_ICONS[t]}
                  <Box>
                    <Typography fontWeight={600}>{ROUND_LABELS[t]}</Typography>
                    <Typography variant="caption" color="text.secondary">
                      {ROUND_HELP[t]}
                    </Typography>
                  </Box>
                </MenuItem>
              ))}
            </Menu>
          </Stack>
          {rounds.map((r, i) => (
            <Accordion key={r.key} expanded={expanded === r.key} onChange={() => setExpanded(expanded === r.key ? null : r.key)} disableGutters sx={{ mb: 1.5, borderRadius: 2, "&:before": { display: "none" } }}>
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Stack direction="row" alignItems="center" gap={1.5} sx={{ width: "100%", pr: 1 }}>
                  <Chip label={i + 1} size="small" color="primary" />
                  <Box sx={{ color: "primary.main", display: "flex" }}>{ROUND_ICONS[r.type]}</Box>
                  <Box sx={{ flexGrow: 1 }}>
                    <Typography fontWeight={600}>{r.name}</Typography>
                    <Typography variant="caption" color="text.secondary">
                      {ROUND_LABELS[r.type]}
                      {r.type !== "resume_screening" && r.config.mode !== "live" ? ` · ${r.config.duration_minutes} min` : ""}
                      {r.config.pass_mode === "score" ? ` · pass ≥ ${r.config.pass_score}%` : r.config.pass_mode === "top_n" ? ` · top ${r.config.top_n}` : " · manual decision"}
                      {r.config.proctoring?.enabled && r.config.mode !== "live" ? " · proctored" : ""}
                    </Typography>
                  </Box>
                  <Tooltip title="Move up">
                    <span>
                      <IconButton size="small" disabled={i === 0} onClick={(e) => { e.stopPropagation(); move(i, -1); }}>
                        <ArrowUpwardIcon fontSize="small" />
                      </IconButton>
                    </span>
                  </Tooltip>
                  <Tooltip title="Move down">
                    <span>
                      <IconButton size="small" disabled={i === rounds.length - 1} onClick={(e) => { e.stopPropagation(); move(i, 1); }}>
                        <ArrowDownwardIcon fontSize="small" />
                      </IconButton>
                    </span>
                  </Tooltip>
                  <Tooltip title="Remove round">
                    <IconButton size="small" onClick={(e) => { e.stopPropagation(); setRounds(rounds.filter((_, idx) => idx !== i)); }}>
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                </Stack>
              </AccordionSummary>
              <AccordionDetails>
                <TextField fullWidth size="small" label="Round name" value={r.name} onChange={(e) => update(i, { name: e.target.value })} />
                <RoundSettings type={r.type} config={r.config} onChange={(config) => update(i, { config })} />
              </AccordionDetails>
            </Accordion>
          ))}
          {!rounds.length && (
            <Paper sx={{ p: 4, textAlign: "center", color: "text.secondary" }}>No rounds yet. Click "Add round".</Paper>
          )}
        </Grid>
      </Grid>
    </>
  );
}
