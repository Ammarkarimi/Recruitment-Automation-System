export const ROUND_LABELS = {
  resume_screening: "Resume Screening",
  aptitude: "Aptitude Test",
  coding: "Coding Test",
  interview: "Interview",
};

export const STATUS_COLORS = {
  pending: "default",
  invited: "info",
  in_progress: "warning",
  submitted: "secondary",
  expired: "default",
  passed: "success",
  failed: "error",
  active: "primary",
  selected: "success",
  rejected: "error",
  withdrawn: "default",
  sent: "success",
  simulated: "info",
  queued: "warning",
};

export function label(status) {
  return (status || "").replace(/_/g, " ").replace(/^\w/, (c) => c.toUpperCase());
}

export function fmtDate(iso) {
  if (!iso) return "-";
  return new Date(iso).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" });
}

export function pct(value) {
  return value === null || value === undefined ? "-" : `${Math.round(value * 10) / 10}%`;
}

/** ISO (UTC) -> value for <input type="datetime-local"> in local time */
export function toLocalInput(iso) {
  if (!iso) return "";
  const d = new Date(iso);
  const off = d.getTimezoneOffset();
  return new Date(d.getTime() - off * 60000).toISOString().slice(0, 16);
}

export function fromLocalInput(value) {
  return value ? new Date(value).toISOString() : null;
}
