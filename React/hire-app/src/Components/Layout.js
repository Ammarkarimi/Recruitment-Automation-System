import React from "react";
import { Link as RouterLink, useLocation, useNavigate } from "react-router-dom";
import { AppBar, Avatar, Box, Button, Container, Toolbar, Tooltip, Typography } from "@mui/material";
import WorkOutlineIcon from "@mui/icons-material/WorkOutline";
import GroupIcon from "@mui/icons-material/Group";
import LogoutIcon from "@mui/icons-material/Logout";
import { useAuth } from "../lib/AuthContext";

export default function Layout({ children }) {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const nav = [
    { to: "/app", label: "Hiring drives", icon: <WorkOutlineIcon fontSize="small" />, active: pathname === "/app" || pathname.startsWith("/app/drives") },
    { to: "/app/team", label: "Team", icon: <GroupIcon fontSize="small" />, active: pathname.startsWith("/app/team") },
  ];
  return (
    <Box sx={{ minHeight: "100vh", bgcolor: "background.default" }}>
      <AppBar position="sticky" color="inherit" sx={{ borderBottom: "1px solid #e6e8f0", boxShadow: "none" }}>
        <Toolbar sx={{ gap: 2 }}>
          <Typography
            component={RouterLink}
            to="/app"
            variant="h6"
            sx={{ fontWeight: 800, color: "primary.main", textDecoration: "none", mr: 2 }}
          >
            HireFlow
          </Typography>
          {nav.map((n) => (
            <Button
              key={n.to}
              component={RouterLink}
              to={n.to}
              startIcon={n.icon}
              color={n.active ? "primary" : "inherit"}
              sx={{ fontWeight: n.active ? 700 : 500 }}
            >
              {n.label}
            </Button>
          ))}
          <Box sx={{ flexGrow: 1 }} />
          <Typography variant="body2" color="text.secondary" sx={{ display: { xs: "none", sm: "block" } }}>
            {user?.company?.name}
          </Typography>
          <Tooltip title={`${user?.name} (${user?.email})`}>
            <Avatar sx={{ width: 32, height: 32, bgcolor: "primary.main", fontSize: 14 }}>
              {(user?.name || "?").slice(0, 1).toUpperCase()}
            </Avatar>
          </Tooltip>
          <Tooltip title="Sign out">
            <Button
              color="inherit"
              onClick={() => {
                signOut();
                navigate("/login");
              }}
            >
              <LogoutIcon fontSize="small" />
            </Button>
          </Tooltip>
        </Toolbar>
      </AppBar>
      <Container maxWidth="xl" sx={{ py: 3 }}>
        {children}
      </Container>
    </Box>
  );
}
