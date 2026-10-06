import React, { useEffect, useState } from "react";
import { Button, Dialog, DialogActions, DialogContent, DialogTitle, IconButton, MenuItem, Paper, Stack, Table, TableBody, TableCell, TableHead, TableRow, TextField } from "@mui/material";
import DeleteIcon from "@mui/icons-material/DeleteOutline";
import PersonAddIcon from "@mui/icons-material/PersonAdd";
import { toast } from "react-toastify";
import api, { errorMessage } from "../../lib/api";
import { useAuth } from "../../lib/AuthContext";
import PageHeader from "../../Components/PageHeader";
import { fmtDate } from "../../lib/format";

export default function Team() {
  const { user } = useAuth();
  const [users, setUsers] = useState([]);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", password: "", role: "recruiter" });

  const load = () => api.get("/team").then((res) => setUsers(res.data.users));
  useEffect(() => {
    load();
  }, []);

  const add = async () => {
    try {
      await api.post("/team", form);
      toast.success("Team member added. Share the password with them securely.");
      setOpen(false);
      setForm({ name: "", email: "", password: "", role: "recruiter" });
      load();
    } catch (err) {
      toast.error(errorMessage(err));
    }
  };

  const remove = async (u) => {
    if (!window.confirm(`Remove ${u.name}?`)) return;
    try {
      await api.delete(`/team/${u.id}`);
      load();
    } catch (err) {
      toast.error(errorMessage(err));
    }
  };

  const isAdmin = user?.role === "admin";
  return (
    <>
      <PageHeader
        title="Hiring team"
        subtitle="Everyone here can manage all drives of your company. Admins can add or remove members."
        actions={isAdmin && <Button variant="contained" startIcon={<PersonAddIcon />} onClick={() => setOpen(true)}>Add member</Button>}
      />
      <Paper>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Name</TableCell>
              <TableCell>Email</TableCell>
              <TableCell>Role</TableCell>
              <TableCell>Added</TableCell>
              <TableCell />
            </TableRow>
          </TableHead>
          <TableBody>
            {users.map((u) => (
              <TableRow key={u.id}>
                <TableCell>{u.name}</TableCell>
                <TableCell>{u.email}</TableCell>
                <TableCell sx={{ textTransform: "capitalize" }}>{u.role}</TableCell>
                <TableCell>{fmtDate(u.created_at)}</TableCell>
                <TableCell align="right">
                  {isAdmin && u.id !== user.id && (
                    <IconButton onClick={() => remove(u)}>
                      <DeleteIcon />
                    </IconButton>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Paper>
      <Dialog open={open} onClose={() => setOpen(false)} fullWidth maxWidth="xs">
        <DialogTitle>Add team member</DialogTitle>
        <DialogContent>
          <Stack gap={2} sx={{ mt: 1 }}>
            <TextField label="Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            <TextField label="Email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
            <TextField label="Temporary password" type="password" helperText="At least 8 characters" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
            <TextField select label="Role" value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}>
              <MenuItem value="recruiter">Recruiter</MenuItem>
              <MenuItem value="admin">Admin</MenuItem>
            </TextField>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={add}>Add</Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
