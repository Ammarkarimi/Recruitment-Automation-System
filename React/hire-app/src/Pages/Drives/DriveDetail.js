import React, { useCallback, useEffect, useState } from "react";
import { Link as RouterLink, useParams, useSearchParams } from "react-router-dom";
import { Alert, Box, Button, CircularProgress, Paper, Tab, Tabs } from "@mui/material";
import EditIcon from "@mui/icons-material/Edit";
import DownloadIcon from "@mui/icons-material/Download";
import { toast } from "react-toastify";
import api, { download, errorMessage } from "../../lib/api";
import { useMeta } from "../../lib/MetaContext";
import PageHeader from "../../Components/PageHeader";
import PipelineTab from "./PipelineTab";
import CandidatesTab from "./CandidatesTab";
import ImportTab from "./ImportTab";
import EmailsTab from "./EmailsTab";

const TABS = ["pipeline", "candidates", "import", "emails"];

export default function DriveDetail() {
  const { driveId } = useParams();
  const meta = useMeta();
  const [params, setParams] = useSearchParams();
  const tab = TABS.includes(params.get("tab")) ? params.get("tab") : "pipeline";
  const [drive, setDrive] = useState(null);
  const [candidates, setCandidates] = useState([]);

  const reload = useCallback(async () => {
    try {
      const [d, c] = await Promise.all([api.get(`/drives/${driveId}`), api.get(`/drives/${driveId}/candidates`)]);
      setDrive(d.data.drive);
      setCandidates(c.data.candidates);
    } catch (err) {
      toast.error(errorMessage(err));
    }
  }, [driveId]);

  useEffect(() => {
    reload();
  }, [reload]);

  const setTab = (value, extra = {}) => setParams({ tab: value, ...extra });

  if (!drive) return <CircularProgress />;

  return (
    <>
      <PageHeader
        title={drive.title}
        subtitle={`${drive.stats.candidates} candidates · ${drive.stats.active} in progress · ${drive.stats.selected} selected · ${drive.stats.rejected} rejected`}
        crumbs={[{ label: "Drives", to: "/app" }, { label: drive.title }]}
        actions={
          <>
            <Button startIcon={<DownloadIcon />} onClick={() => download(`/drives/${drive.id}/export`, `${drive.title}_results.xlsx`).catch((e) => toast.error(errorMessage(e)))}>
              Export results
            </Button>
            <Button startIcon={<EditIcon />} variant="outlined" component={RouterLink} to={`/app/drives/${drive.id}/edit`}>
              Edit drive & rounds
            </Button>
          </>
        }
      />
      {meta?.email_mode === "simulated" && (
        <Alert severity="info" sx={{ mb: 2 }}>
          Email delivery isn't configured on the server (SMTP_HOST), so invitations are logged instead of sent. You can copy each candidate's test link from their page.
        </Alert>
      )}
      <Paper sx={{ mb: 2 }}>
        <Tabs value={tab} onChange={(_, v) => setTab(v)} variant="scrollable">
          <Tab value="pipeline" label="Pipeline" />
          <Tab value="candidates" label={`Candidates (${candidates.length})`} />
          <Tab value="import" label="Add / import candidates" />
          <Tab value="emails" label="Emails" />
        </Tabs>
      </Paper>
      <Box>
        {tab === "pipeline" && <PipelineTab drive={drive} reload={reload} openCandidates={(roundId) => setTab("candidates", roundId ? { round: roundId } : {})} />}
        {tab === "candidates" && <CandidatesTab drive={drive} candidates={candidates} reload={reload} initialRound={params.get("round")} />}
        {tab === "import" && <ImportTab drive={drive} reload={reload} />}
        {tab === "emails" && <EmailsTab drive={drive} />}
      </Box>
    </>
  );
}
