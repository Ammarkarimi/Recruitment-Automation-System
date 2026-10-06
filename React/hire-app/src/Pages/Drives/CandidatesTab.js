import React, { useMemo, useState } from "react";
import { Link as RouterLink, useNavigate } from "react-router-dom";
import {
  Box,
  Button,
  Checkbox,
  Chip,
  InputAdornment,
  MenuItem,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TablePagination,
  TableRow,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import WarningAmberIcon from "@mui/icons-material/WarningAmber";
import DescriptionOutlinedIcon from "@mui/icons-material/DescriptionOutlined";
import { toast } from "react-toastify";
import api, { errorMessage } from "../../lib/api";
import StatusChip from "../../Components/StatusChip";
import { pct } from "../../lib/format";
import ComposeEmailDialog from "./ComposeEmailDialog";

export default function CandidatesTab({ drive, candidates, reload, initialRound }) {
  const navigate = useNavigate();
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("all");
  const [round, setRound] = useState(initialRound || "all");
  const [selected, setSelected] = useState([]);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(25);
  const [compose, setCompose] = useState(false);
  const [busy, setBusy] = useState(false);
  const roundsById = useMemo(() => Object.fromEntries(drive.rounds.map((r) => [String(r.id), r])), [drive.rounds]);

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return candidates.filter(
      (c) =>
        (status === "all" || c.status === status) &&
        (round === "all" || String(c.current_round_id) === String(round)) &&
        (!needle || c.name.toLowerCase().includes(needle) || c.email.includes(needle))
    );
  }, [candidates, q, status, round]);

  const pageRows = filtered.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);
  const toggle = (id) => setSelected((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]));
  const allOnPage = pageRows.length > 0 && pageRows.every((c) => selected.includes(c.id));
  const chosen = candidates.filter((c) => selected.includes(c.id));

  const bulk = async (fn, message) => {
    setBusy(true);
    try {
      const msg = await fn();
      toast.success(msg || message);
      setSelected([]);
      await reload();
    } catch (err) {
      toast.error(errorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  const inviteSelected = () =>
    bulk(async () => {
      const byRound = {};
      chosen.forEach((c) => {
        const r = roundsById[String(c.current_round_id)];
        if (r && r.type !== "resume_screening") (byRound[r.id] = byRound[r.id] || []).push(c.id);
      });
      let invited = 0;
      for (const [rid, ids] of Object.entries(byRound)) {
        const res = await api.post(`/rounds/${rid}/invite`, { candidate_ids: ids, resend: true });
        invited += res.data.invited;
      }
      return `Sent ${invited} test links`;
    });

  const decideSelected = (decision) =>
    bulk(async () => {
      let n = 0;
      for (const c of chosen) {
        const stage = c.stages[String(c.current_round_id)];
        if (stage && c.status === "active" && ["submitted", "expired", "invited", "pending"].includes(stage.status)) {
          await api.post(`/stages/${stage.id}/decide`, { decision });
          n += 1;
        }
      }
      return `${decision === "pass" ? "Passed" : "Rejected"} ${n} candidates in their current round`;
    });

  const removeSelected = () => {
    if (!window.confirm(`Delete ${chosen.length} candidates and all their test data?`)) return;
    bulk(async () => {
      const res = await api.post(`/drives/${drive.id}/candidates/delete`, { ids: selected });
      return `Deleted ${res.data.removed} candidates`;
    });
  };

  return (
    <Paper>
      <Stack direction={{ xs: "column", md: "row" }} gap={1.5} sx={{ p: 2 }} alignItems={{ md: "center" }}>
        <TextField
          size="small"
          placeholder="Search name or email"
          value={q}
          onChange={(e) => { setQ(e.target.value); setPage(0); }}
          InputProps={{ startAdornment: <InputAdornment position="start"><SearchIcon fontSize="small" /></InputAdornment> }}
          sx={{ minWidth: 240 }}
        />
        <TextField select size="small" label="Status" value={status} onChange={(e) => { setStatus(e.target.value); setPage(0); }} sx={{ minWidth: 140 }}>
          {["all", "active", "selected", "rejected", "withdrawn"].map((s) => (
            <MenuItem key={s} value={s}>{s === "all" ? "All" : s[0].toUpperCase() + s.slice(1)}</MenuItem>
          ))}
        </TextField>
        <TextField select size="small" label="Current round" value={round} onChange={(e) => { setRound(e.target.value); setPage(0); }} sx={{ minWidth: 180 }}>
          <MenuItem value="all">All rounds</MenuItem>
          {drive.rounds.map((r) => (
            <MenuItem key={r.id} value={String(r.id)}>{r.name}</MenuItem>
          ))}
        </TextField>
        <Box sx={{ flexGrow: 1 }} />
        {selected.length > 0 && (
          <Stack direction="row" gap={1} flexWrap="wrap" alignItems="center">
            <Typography variant="body2" fontWeight={600}>{selected.length} selected</Typography>
            <Button size="small" variant="contained" disabled={busy} onClick={inviteSelected}>Send test link</Button>
            <Button size="small" color="success" variant="outlined" disabled={busy} onClick={() => decideSelected("pass")}>Pass</Button>
            <Button size="small" color="error" variant="outlined" disabled={busy} onClick={() => decideSelected("fail")}>Reject</Button>
            <Button size="small" disabled={busy} onClick={() => setCompose(true)}>Email</Button>
            <Button size="small" color="error" disabled={busy} onClick={removeSelected}>Delete</Button>
          </Stack>
        )}
      </Stack>
      <TableContainer>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell padding="checkbox">
                <Checkbox
                  checked={allOnPage}
                  indeterminate={!allOnPage && pageRows.some((c) => selected.includes(c.id))}
                  onChange={() =>
                    setSelected((s) => (allOnPage ? s.filter((id) => !pageRows.some((c) => c.id === id)) : [...new Set([...s, ...pageRows.map((c) => c.id)])]))
                  }
                />
              </TableCell>
              <TableCell>Candidate</TableCell>
              <TableCell>Status</TableCell>
              {drive.rounds.map((r) => (
                <TableCell key={r.id} align="center">{r.name}</TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {pageRows.map((c) => (
              <TableRow key={c.id} hover selected={selected.includes(c.id)}>
                <TableCell padding="checkbox">
                  <Checkbox checked={selected.includes(c.id)} onChange={() => toggle(c.id)} />
                </TableCell>
                <TableCell sx={{ cursor: "pointer" }} onClick={() => navigate(`/app/candidates/${c.id}`)}>
                  <Stack direction="row" alignItems="center" gap={0.5}>
                    <Typography variant="body2" fontWeight={600}>{c.name}</Typography>
                    {c.has_resume && (
                      <Tooltip title="Resume uploaded"><DescriptionOutlinedIcon sx={{ fontSize: 16, color: "text.secondary" }} /></Tooltip>
                    )}
                  </Stack>
                  <Typography variant="caption" color="text.secondary">{c.email}</Typography>
                </TableCell>
                <TableCell>
                  <StatusChip status={c.status} />
                </TableCell>
                {drive.rounds.map((r) => {
                  const s = c.stages[String(r.id)];
                  if (!s) return <TableCell key={r.id} align="center" sx={{ color: "text.disabled" }}>—</TableCell>;
                  return (
                    <TableCell key={r.id} align="center">
                      <Stack alignItems="center" gap={0.25} component={s.status === "pending" ? "div" : RouterLink} to={`/app/stages/${s.id}`} sx={{ textDecoration: "none", color: "inherit" }}>
                        <StatusChip status={s.status} />
                        <Stack direction="row" gap={0.5} alignItems="center">
                          {s.percent !== null && <Typography variant="caption" fontWeight={600}>{pct(s.percent)}</Typography>}
                          {(s.violations > 0 || s.terminated) && (
                            <Tooltip title={`${s.violations} proctoring violations${s.terminated ? " - terminated" : ""} · integrity ${pct(s.integrity)}`}>
                              <Chip size="small" icon={<WarningAmberIcon />} label={s.violations} color={s.terminated ? "error" : "warning"} variant="outlined" sx={{ height: 20 }} />
                            </Tooltip>
                          )}
                        </Stack>
                      </Stack>
                    </TableCell>
                  );
                })}
              </TableRow>
            ))}
            {!pageRows.length && (
              <TableRow>
                <TableCell colSpan={3 + drive.rounds.length} align="center" sx={{ py: 5, color: "text.secondary" }}>
                  No candidates match.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>
      <TablePagination
        component="div"
        count={filtered.length}
        page={page}
        onPageChange={(_, p) => setPage(p)}
        rowsPerPage={rowsPerPage}
        onRowsPerPageChange={(e) => { setRowsPerPage(parseInt(e.target.value, 10)); setPage(0); }}
        rowsPerPageOptions={[25, 50, 100, 250]}
      />
      <ComposeEmailDialog open={compose} onClose={() => setCompose(false)} drive={drive} candidateIds={selected} />
    </Paper>
  );
}
