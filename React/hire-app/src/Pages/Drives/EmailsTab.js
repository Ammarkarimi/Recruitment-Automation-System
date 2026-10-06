import React, { useCallback, useEffect, useState } from "react";
import { Button, Chip, Paper, Stack, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Tooltip, Typography } from "@mui/material";
import RefreshIcon from "@mui/icons-material/Refresh";
import SendIcon from "@mui/icons-material/Send";
import { toast } from "react-toastify";
import api, { errorMessage } from "../../lib/api";
import StatusChip from "../../Components/StatusChip";
import { fmtDate } from "../../lib/format";
import ComposeEmailDialog from "./ComposeEmailDialog";

export default function EmailsTab({ drive }) {
  const [data, setData] = useState({ emails: [], counts: {} });
  const [compose, setCompose] = useState(false);

  const load = useCallback(() => {
    api.get(`/drives/${drive.id}/emails`).then((res) => setData(res.data)).catch((err) => toast.error(errorMessage(err)));
  }, [drive.id]);

  useEffect(() => {
    load();
    const t = setInterval(load, 10000); // bulk sends progress in the background
    return () => clearInterval(t);
  }, [load]);

  const retry = async () => {
    try {
      const res = await api.post(`/drives/${drive.id}/emails/retry`);
      toast.success(`Retrying ${res.data.queued} emails`);
      load();
    } catch (err) {
      toast.error(errorMessage(err));
    }
  };

  const { counts } = data;
  return (
    <Paper>
      <Stack direction="row" gap={1} alignItems="center" sx={{ p: 2 }} flexWrap="wrap">
        {Object.entries(counts).map(([k, v]) => (
          <Chip key={k} label={`${k}: ${v}`} color={{ sent: "success", failed: "error", queued: "warning", simulated: "info" }[k] || "default"} />
        ))}
        {!Object.keys(counts).length && <Typography color="text.secondary">No emails sent yet.</Typography>}
        <Stack direction="row" gap={1} sx={{ ml: "auto" }}>
          {Boolean(counts.failed) && (
            <Button startIcon={<RefreshIcon />} onClick={retry}>Retry failed</Button>
          )}
          <Button variant="contained" startIcon={<SendIcon />} onClick={() => setCompose(true)}>Compose bulk email</Button>
        </Stack>
      </Stack>
      <TableContainer sx={{ maxHeight: 600 }}>
        <Table size="small" stickyHeader>
          <TableHead>
            <TableRow>
              <TableCell>To</TableCell>
              <TableCell>Subject</TableCell>
              <TableCell>Type</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Queued</TableCell>
              <TableCell>Sent</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {data.emails.map((e) => (
              <TableRow key={e.id}>
                <TableCell>{e.to}</TableCell>
                <TableCell>{e.subject}</TableCell>
                <TableCell sx={{ textTransform: "capitalize" }}>{e.kind}</TableCell>
                <TableCell>
                  <Tooltip title={e.error || ""}>
                    <span><StatusChip status={e.status} /></span>
                  </Tooltip>
                </TableCell>
                <TableCell>{fmtDate(e.created_at)}</TableCell>
                <TableCell>{fmtDate(e.sent_at)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
      <ComposeEmailDialog open={compose} onClose={() => { setCompose(false); load(); }} drive={drive} />
    </Paper>
  );
}
