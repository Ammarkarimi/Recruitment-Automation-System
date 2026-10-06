import React, { useEffect, useState } from "react";
import { Link as RouterLink } from "react-router-dom";
import { Box, Button, Card, CardActionArea, CardContent, Chip, CircularProgress, Grid, LinearProgress, Stack, Typography } from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import api, { errorMessage } from "../../lib/api";
import { toast } from "react-toastify";
import PageHeader from "../../Components/PageHeader";
import { ROUND_LABELS, fmtDate } from "../../lib/format";

function Stat({ label, value, color }) {
  return (
    <Box>
      <Typography variant="h6" fontWeight={700} color={color}>
        {value}
      </Typography>
      <Typography variant="caption" color="text.secondary">
        {label}
      </Typography>
    </Box>
  );
}

export default function Dashboard() {
  const [drives, setDrives] = useState(null);

  useEffect(() => {
    api
      .get("/drives")
      .then((res) => setDrives(res.data.drives))
      .catch((err) => {
        toast.error(errorMessage(err));
        setDrives([]);
      });
  }, []);

  return (
    <>
      <PageHeader
        title="Hiring drives"
        subtitle="Each drive has its own pipeline of rounds. Create one per job opening or campus drive."
        actions={
          <Button variant="contained" startIcon={<AddIcon />} component={RouterLink} to="/app/drives/new">
            New drive
          </Button>
        }
      />
      {drives === null ? (
        <CircularProgress />
      ) : drives.length === 0 ? (
        <Card sx={{ p: 5, textAlign: "center" }}>
          <Typography variant="h6" fontWeight={700}>
            No drives yet
          </Typography>
          <Typography color="text.secondary" sx={{ mb: 2 }}>
            Create a drive, choose the rounds you want (resume screening, aptitude, coding, interview), then import candidates from Excel.
          </Typography>
          <Button variant="contained" component={RouterLink} to="/app/drives/new">
            Create your first drive
          </Button>
        </Card>
      ) : (
        <Grid container spacing={2}>
          {drives.map((d) => {
            const total = d.stats.candidates || 0;
            const progressed = total ? ((d.stats.selected + d.stats.rejected) / total) * 100 : 0;
            return (
              <Grid item xs={12} md={6} lg={4} key={d.id}>
                <Card sx={{ height: "100%" }}>
                  <CardActionArea component={RouterLink} to={`/app/drives/${d.id}`} sx={{ height: "100%" }}>
                    <CardContent>
                      <Stack direction="row" justifyContent="space-between" alignItems="flex-start" sx={{ mb: 1 }}>
                        <Typography variant="h6" fontWeight={700} sx={{ pr: 1 }}>
                          {d.title}
                        </Typography>
                        <Chip size="small" label={d.status} color={d.status === "active" ? "success" : "default"} />
                      </Stack>
                      <Typography variant="caption" color="text.secondary">
                        Created {fmtDate(d.created_at)}
                      </Typography>
                      <Stack direction="row" gap={0.5} flexWrap="wrap" sx={{ my: 1.5 }}>
                        {d.rounds.map((r, i) => (
                          <Chip key={r.id} size="small" variant="outlined" label={`${i + 1}. ${r.name || ROUND_LABELS[r.type]}`} />
                        ))}
                      </Stack>
                      <Stack direction="row" gap={3} sx={{ mb: 1 }}>
                        <Stat label="Candidates" value={total} />
                        <Stat label="In progress" value={d.stats.active} color="primary.main" />
                        <Stat label="Selected" value={d.stats.selected} color="success.main" />
                        <Stat label="Rejected" value={d.stats.rejected} color="error.main" />
                      </Stack>
                      <LinearProgress variant="determinate" value={progressed} sx={{ height: 6, borderRadius: 3 }} />
                    </CardContent>
                  </CardActionArea>
                </Card>
              </Grid>
            );
          })}
        </Grid>
      )}
    </>
  );
}
