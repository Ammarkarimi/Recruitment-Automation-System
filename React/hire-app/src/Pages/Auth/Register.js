import React, { useState } from "react";
import { Link as RouterLink, Navigate, useNavigate } from "react-router-dom";
import { Alert, Button, Link, Stack, TextField, Typography } from "@mui/material";
import api, { errorMessage } from "../../lib/api";
import { useAuth } from "../../lib/AuthContext";
import AuthShell from "./AuthShell";

export default function Register() {
  const { user, signIn } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ company: "", name: "", email: "", password: "" });
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  if (user) return <Navigate to="/app" replace />;
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      const res = await api.post("/auth/register", form);
      signIn(res.data.token, res.data.user);
      navigate("/app");
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <AuthShell title="Create your hiring workspace" subtitle="You'll be the admin and can invite your hiring team later.">
      <form onSubmit={submit}>
        <Stack gap={2}>
          {error && <Alert severity="error">{error}</Alert>}
          <TextField label="Company name" required value={form.company} onChange={set("company")} autoFocus />
          <TextField label="Your name" required value={form.name} onChange={set("name")} />
          <TextField label="Work email" type="email" required value={form.email} onChange={set("email")} />
          <TextField label="Password" type="password" required helperText="At least 8 characters" value={form.password} onChange={set("password")} />
          <Button type="submit" variant="contained" size="large" disabled={busy}>
            {busy ? "Creating..." : "Create account"}
          </Button>
          <Typography variant="body2" textAlign="center">
            Already registered?{" "}
            <Link component={RouterLink} to="/login">
              Sign in
            </Link>
          </Typography>
        </Stack>
      </form>
    </AuthShell>
  );
}
