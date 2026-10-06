import React from "react";
import { Chip } from "@mui/material";
import { STATUS_COLORS, label } from "../lib/format";

export default function StatusChip({ status, size = "small", ...rest }) {
  if (!status) return null;
  return <Chip size={size} label={label(status)} color={STATUS_COLORS[status] || "default"} variant={status === "pending" ? "outlined" : "filled"} {...rest} />;
}
