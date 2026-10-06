import axios from "axios";

export const API_BASE = (process.env.REACT_APP_BACKEND_URL || "").replace(/\/$/, "");

const api = axios.create({ baseURL: `${API_BASE}/api` });

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("hr_token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401 && localStorage.getItem("hr_token")) {
      localStorage.removeItem("hr_token");
      if (!window.location.pathname.startsWith("/login")) window.location.assign("/login");
    }
    return Promise.reject(err);
  }
);

export function errorMessage(err, fallback = "Something went wrong") {
  return err?.response?.data?.error || err?.message || fallback;
}

/** Download a file from an authenticated endpoint. */
export async function download(url, filename) {
  const res = await api.get(url, { responseType: "blob" });
  const href = URL.createObjectURL(res.data);
  const a = document.createElement("a");
  a.href = href;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(href), 1000);
}

/** Fetch an authenticated file and return an object URL (for <img>/<iframe>). */
export async function blobUrl(url) {
  const res = await api.get(url, { responseType: "blob" });
  return URL.createObjectURL(res.data);
}

export default api;
