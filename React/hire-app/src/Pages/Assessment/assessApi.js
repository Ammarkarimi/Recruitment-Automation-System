import axios from "axios";
import { API_BASE } from "../../lib/api";

const client = axios.create({ baseURL: `${API_BASE}/api/assess` });

export const sessionKey = (token) => `assess_session_${token}`;

export function getSession(token) {
  try {
    return sessionStorage.getItem(sessionKey(token)) || "";
  } catch {
    return "";
  }
}

export function setSession(token, value) {
  try {
    sessionStorage.setItem(sessionKey(token), value);
  } catch {
    /* storage unavailable */
  }
}

/** Candidate API bound to one test link. */
export function assessApi(token) {
  const headers = () => ({ "X-Session-Token": getSession(token) });
  return {
    info: () => client.get(`/${token}`).then((r) => r.data),
    start: () => client.post(`/${token}/start`, {}, { headers: headers() }).then((r) => r.data),
    state: () => client.get(`/${token}/state`, { headers: headers() }).then((r) => r.data),
    answer: (key, answer) => client.post(`/${token}/answer`, { key, answer }, { headers: headers() }).then((r) => r.data),
    run: (payload) => client.post(`/${token}/run`, payload, { headers: headers() }).then((r) => r.data),
    events: (events) => client.post(`/${token}/events`, { events }, { headers: headers() }).then((r) => r.data),
    snapshot: (image, faces) => client.post(`/${token}/snapshot`, { image, faces }, { headers: headers() }).then((r) => r.data),
    heartbeat: () => client.post(`/${token}/heartbeat`, {}, { headers: headers() }).then((r) => r.data),
    submit: () => client.post(`/${token}/submit`, {}, { headers: headers() }).then((r) => r.data),
  };
}
