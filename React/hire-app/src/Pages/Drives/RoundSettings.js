import React from "react";
import {
  Alert,
  Box,
  Checkbox,
  Chip,
  Divider,
  FormControlLabel,
  FormGroup,
  Grid,
  MenuItem,
  Slider,
  Switch,
  TextField,
  Typography,
} from "@mui/material";
import { useMeta } from "../../lib/MetaContext";
import { fromLocalInput, toLocalInput } from "../../lib/format";

function Section({ title, children }) {
  return (
    <Box sx={{ mt: 2 }}>
      <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 1 }}>
        {title}
      </Typography>
      {children}
    </Box>
  );
}

function Toggle({ label, checked, onChange, disabled, help }) {
  return (
    <FormControlLabel
      control={<Switch checked={Boolean(checked)} onChange={(e) => onChange(e.target.checked)} disabled={disabled} />}
      label={
        <Box>
          <Typography variant="body2">{label}</Typography>
          {help && (
            <Typography variant="caption" color="text.secondary">
              {help}
            </Typography>
          )}
        </Box>
      }
      sx={{ alignItems: "flex-start", "& .MuiSwitch-root": { mt: -0.5 } }}
    />
  );
}

function Num({ label, value, onChange, min = 0, max, helperText, step = 1 }) {
  return (
    <TextField
      fullWidth
      size="small"
      type="number"
      label={label}
      value={value ?? ""}
      helperText={helperText}
      inputProps={{ min, max, step }}
      onChange={(e) => onChange(e.target.value === "" ? "" : Number(e.target.value))}
    />
  );
}

export default function RoundSettings({ type, config, onChange }) {
  const meta = useMeta();
  const set = (key) => (value) => onChange({ ...config, [key]: value });
  const setP = (key) => (value) => onChange({ ...config, proctoring: { ...config.proctoring, [key]: value } });
  const p = config.proctoring || {};
  const assessment = type !== "resume_screening";
  const live = type === "interview" && config.mode === "live";

  return (
    <Box>
      {type === "resume_screening" && (
        <Section title="Screening criteria">
          <TextField
            fullWidth
            size="small"
            label="Required skills (comma separated)"
            helperText="Leave empty to use the drive's skills. Resumes are scored on skill coverage + similarity to the job description."
            value={(config.required_skills || []).join(", ")}
            onChange={(e) => set("required_skills")(e.target.value.split(",").map((s) => s.trimStart()))}
            onBlur={(e) => set("required_skills")(e.target.value.split(",").map((s) => s.trim()).filter(Boolean))}
          />
          <Box sx={{ px: 1, mt: 2 }}>
            <Typography variant="body2" gutterBottom>
              Weight of skills vs. text similarity: {Math.round((config.skill_weight ?? 0.6) * 100)}% skills
            </Typography>
            <Slider min={0} max={1} step={0.05} value={config.skill_weight ?? 0.6} onChange={(_, v) => set("skill_weight")(v)} />
          </Box>
          <Toggle
            label="Also score with AI"
            checked={config.use_ai}
            onChange={set("use_ai")}
            disabled={!meta?.ai_enabled}
            help={meta?.ai_enabled ? "Blends an AI fit score with the keyword score." : "Set GEMINI_API_KEY on the server to enable."}
          />
        </Section>
      )}

      {type === "interview" && (
        <Section title="Interview format">
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <TextField select fullWidth size="small" label="Mode" value={config.mode || "ai"} onChange={(e) => set("mode")(e.target.value)}>
                <MenuItem value="ai">AI video interview (automated, proctored)</MenuItem>
                <MenuItem value="live">Live interview with a panel (scheduled)</MenuItem>
              </TextField>
            </Grid>
            {!live && (
              <Grid item xs={12} sm={6}>
                <Num label="Seconds per question" value={config.seconds_per_question} onChange={set("seconds_per_question")} min={30} />
              </Grid>
            )}
          </Grid>
          {!live && (
            <Toggle
              label="Personalise questions from resume + job description"
              checked={config.personalized}
              onChange={set("personalized")}
              disabled={!meta?.ai_enabled}
              help={meta?.ai_enabled ? "Falls back to the question bank if generation fails." : "Needs GEMINI_API_KEY; the question bank is used otherwise."}
            />
          )}
          {live && (
            <Alert severity="info" sx={{ mt: 1 }}>
              Schedule a slot and meeting link for each candidate from the candidate's page, then send invites. Interviewers enter a score (0-100) after the interview.
            </Alert>
          )}
        </Section>
      )}

      {assessment && !live && (
        <Section title="Test settings">
          <Grid container spacing={2}>
            <Grid item xs={6} sm={3}>
              <Num label="Duration (minutes)" value={config.duration_minutes} onChange={set("duration_minutes")} min={1} />
            </Grid>
            <Grid item xs={6} sm={3}>
              <Num label="Questions per candidate" helperText="0 = all in bank" value={config.num_questions} onChange={set("num_questions")} />
            </Grid>
            <Grid item xs={6} sm={3}>
              <Num label="Link valid for (hours)" value={config.link_valid_hours} onChange={set("link_valid_hours")} min={1} />
            </Grid>
            {type === "aptitude" && (
              <Grid item xs={6} sm={3}>
                <Num label="Negative marking" helperText="Fraction, e.g. 0.25" step={0.05} max={1} value={config.negative_marking} onChange={set("negative_marking")} />
              </Grid>
            )}
            {type === "coding" && (
              <Grid item xs={6} sm={3}>
                <Num label="Code runs per question" value={config.max_runs_per_question} onChange={set("max_runs_per_question")} min={1} />
              </Grid>
            )}
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                size="small"
                type="datetime-local"
                label="Window opens (optional)"
                InputLabelProps={{ shrink: true }}
                value={toLocalInput(config.window_start)}
                onChange={(e) => set("window_start")(fromLocalInput(e.target.value))}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                size="small"
                type="datetime-local"
                label="Window closes (optional)"
                InputLabelProps={{ shrink: true }}
                value={toLocalInput(config.window_end)}
                onChange={(e) => set("window_end")(fromLocalInput(e.target.value))}
              />
            </Grid>
          </Grid>
          <FormGroup row sx={{ mt: 1 }}>
            <Toggle label="Shuffle question order per candidate" checked={config.shuffle_questions} onChange={set("shuffle_questions")} />
            {type === "aptitude" && <Toggle label="Shuffle options" checked={config.shuffle_options} onChange={set("shuffle_options")} />}
          </FormGroup>
          {type === "coding" && (
            <Box sx={{ mt: 1 }}>
              <Typography variant="body2" gutterBottom>
                Allowed languages
              </Typography>
              <FormGroup row>
                {(meta?.languages || []).map((l) => (
                  <FormControlLabel
                    key={l.id}
                    control={
                      <Checkbox
                        checked={(config.languages || []).includes(l.id)}
                        onChange={(e) =>
                          set("languages")(e.target.checked ? [...(config.languages || []), l.id] : (config.languages || []).filter((x) => x !== l.id))
                        }
                      />
                    }
                    label={
                      <span>
                        {l.label} {!l.available && <Chip size="small" label="not installed on server" sx={{ ml: 0.5 }} />}
                      </span>
                    }
                  />
                ))}
              </FormGroup>
            </Box>
          )}
          <TextField
            fullWidth
            multiline
            minRows={2}
            size="small"
            sx={{ mt: 2 }}
            label="Instructions shown to candidates (optional)"
            value={config.instructions || ""}
            onChange={(e) => set("instructions")(e.target.value)}
          />
        </Section>
      )}

      {assessment && !live && (
        <Section title="Proctoring (anti-cheating)">
          <Toggle label="Enable proctoring" checked={p.enabled} onChange={setP("enabled")} />
          {p.enabled && (
            <>
              <Grid container>
                {[
                  ["require_webcam", "Require webcam", "Camera must stay on; periodic snapshots are saved for review."],
                  ["detect_faces", "Face detection", "Flags when no face or more than one face is visible."],
                  ["require_microphone", "Require microphone", "Mic must stay connected."],
                  ["detect_noise", "Detect background talking/noise", "Low-severity flag, not counted towards the limit."],
                  ["require_fullscreen", "Force full screen", "Leaving full screen is a violation."],
                  ["detect_tab_switch", "Detect tab / window switching", "Switching tabs or apps is a violation."],
                  ["block_copy_paste", "Block copy, paste & right-click", "Attempts are blocked and recorded."],
                ].map(([key, labelText, help]) => (
                  <Grid item xs={12} md={6} key={key}>
                    <Toggle label={labelText} help={help} checked={p[key]} onChange={setP(key)} />
                  </Grid>
                ))}
              </Grid>
              <Grid container spacing={2} sx={{ mt: 0.5 }}>
                <Grid item xs={6} sm={4}>
                  <Num label="Terminate after N violations" helperText="0 = never terminate" value={p.max_violations} onChange={setP("max_violations")} />
                </Grid>
                <Grid item xs={6} sm={4}>
                  <Num label="Snapshot every (seconds)" helperText="0 = no snapshots" value={p.snapshot_interval_sec} onChange={setP("snapshot_interval_sec")} />
                </Grid>
              </Grid>
            </>
          )}
        </Section>
      )}

      <Divider sx={{ my: 2 }} />
      <Section title="Who moves to the next round?">
        <Grid container spacing={2}>
          <Grid item xs={12} sm={4}>
            <TextField select fullWidth size="small" label="Decision rule" value={config.pass_mode || "score"} onChange={(e) => set("pass_mode")(e.target.value)}>
              <MenuItem value="score">Everyone above a cut-off score</MenuItem>
              <MenuItem value="top_n">Top N candidates</MenuItem>
              <MenuItem value="manual">Manual decision by the team</MenuItem>
            </TextField>
          </Grid>
          {config.pass_mode === "score" && (
            <Grid item xs={6} sm={4}>
              <Num label="Cut-off score (%)" value={config.pass_score} onChange={set("pass_score")} max={100} />
            </Grid>
          )}
          {config.pass_mode === "top_n" && (
            <Grid item xs={6} sm={4}>
              <Num label="Number of candidates to pass" value={config.top_n} onChange={set("top_n")} min={1} />
            </Grid>
          )}
          {assessment && !live && (
            <Grid item xs={6} sm={4}>
              <Num label="Minimum integrity score" helperText="0 = ignore" value={config.min_integrity} onChange={set("min_integrity")} max={100} />
            </Grid>
          )}
        </Grid>
        <FormGroup sx={{ mt: 1 }}>
          {assessment && !live && (
            <Toggle label="Fail candidates whose test was terminated for cheating" checked={config.fail_on_termination} onChange={set("fail_on_termination")} />
          )}
          <Toggle
            label="Automatically email the next round's link to candidates who pass"
            checked={config.invite_next_on_pass}
            onChange={set("invite_next_on_pass")}
          />
        </FormGroup>
      </Section>

      {assessment && (
        <Section title="Invitation email">
          <TextField fullWidth size="small" label="Subject" value={config.email_subject || ""} onChange={(e) => set("email_subject")(e.target.value)} />
          <TextField
            fullWidth
            multiline
            minRows={5}
            size="small"
            sx={{ mt: 2 }}
            className="mono"
            label="Body (HTML)"
            value={config.email_body || ""}
            onChange={(e) => set("email_body")(e.target.value)}
            helperText={`Placeholders: {{name}} {{email}} {{company}} {{drive}} {{round}} {{link}} {{deadline}} {{duration}}${live ? " {{scheduled_at}} {{meeting_link}}" : ""}`}
          />
        </Section>
      )}
    </Box>
  );
}
