import React from "react";
import { Navigate, useRoutes } from "react-router-dom";
import { Box, CircularProgress } from "@mui/material";
import LandingPage from "../Pages/LandingPage/LandingPage";
import Login from "../Pages/Auth/Login";
import Register from "../Pages/Auth/Register";
import Dashboard from "../Pages/Dashboard/Dashboard";
import DriveForm from "../Pages/Drives/DriveForm";
import DriveDetail from "../Pages/Drives/DriveDetail";
import QuestionBank from "../Pages/Questions/QuestionBank";
import StageReport from "../Pages/Stage/StageReport";
import CandidateDetail from "../Pages/Drives/CandidateDetail";
import Team from "../Pages/Team/Team";
import AssessmentPage from "../Pages/Assessment/AssessmentPage";
import Layout from "../Components/Layout";
import { useAuth } from "../lib/AuthContext";
import { MetaProvider } from "../lib/MetaContext";

function RequireAuth({ children }) {
  const { user, loading } = useAuth();
  if (loading) {
    return (
      <Box sx={{ display: "grid", placeItems: "center", height: "100vh" }}>
        <CircularProgress />
      </Box>
    );
  }
  if (!user) return <Navigate to="/login" replace />;
  return (
    <MetaProvider>
      <Layout>{children}</Layout>
    </MetaProvider>
  );
}

export default function MainRoutes() {
  return useRoutes([
    { path: "/", element: <LandingPage /> },
    { path: "/login", element: <Login /> },
    { path: "/register", element: <Register /> },
    { path: "/assess/:token", element: <AssessmentPage /> },
    { path: "/app", element: <RequireAuth><Dashboard /></RequireAuth> },
    { path: "/app/drives/new", element: <RequireAuth><DriveForm /></RequireAuth> },
    { path: "/app/drives/:driveId/edit", element: <RequireAuth><DriveForm /></RequireAuth> },
    { path: "/app/drives/:driveId", element: <RequireAuth><DriveDetail /></RequireAuth> },
    { path: "/app/rounds/:roundId/questions", element: <RequireAuth><QuestionBank /></RequireAuth> },
    { path: "/app/stages/:stageId", element: <RequireAuth><StageReport /></RequireAuth> },
    { path: "/app/candidates/:candidateId", element: <RequireAuth><CandidateDetail /></RequireAuth> },
    { path: "/app/team", element: <RequireAuth><Team /></RequireAuth> },
    { path: "*", element: <Navigate to="/" replace /> },
  ]);
}
