import { useCallback, useEffect, useRef, useState } from "react";
import { countFaces, loadFaceDetector } from "../../lib/faceDetector";

// Mirrors the server's rules: these count towards the violation limit (when the related check is enabled).
const COUNTED = {
  tab_hidden: "You switched tabs or minimised the browser.",
  window_blur: "You moved focus to another window or application.",
  fullscreen_exit: "You exited full-screen mode.",
  copy: "Copying is not allowed during the test.",
  cut: "Cutting text is not allowed during the test.",
  paste: "Pasting is not allowed during the test.",
  devtools: "Developer tools are not allowed.",
  multiple_faces: "More than one person was detected on camera.",
  no_face: "We can't see you on camera. Stay in front of the webcam.",
  camera_off: "Your camera was turned off or disconnected.",
  mic_off: "Your microphone was turned off or disconnected.",
  multiple_displays: "An additional monitor was detected. Disconnect it.",
};

const FACE_CHECK_MS = 1000;
const NO_FACE_CHECKS = 5; // ~5 s without a face
const MULTI_FACE_CHECKS = 2;
const NOISE_RMS = 0.12;

export function captureFrame(video, width = 320) {
  if (!video || !video.videoWidth) return null;
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = Math.round((video.videoHeight / video.videoWidth) * width);
  canvas.getContext("2d").drawImage(video, 0, 0, canvas.width, canvas.height);
  return canvas.toDataURL("image/jpeg", 0.6);
}

/**
 * Browser-side proctoring: watches focus, full screen, clipboard, shortcuts, camera/mic and faces, reports events to
 * the server (which owns the violation count) and periodically uploads webcam snapshots.
 */
export default function useProctoring({ api, config, active, videoRef, stream, onStatus, onFinished }) {
  const cfg = config || {};
  const enabled = active && cfg.enabled !== false;
  const [violations, setViolations] = useState(0);
  const [maxViolations, setMaxViolations] = useState(cfg.max_violations || 0);
  const [warning, setWarning] = useState(null);
  const [fullscreenLost, setFullscreenLost] = useState(false);
  const [faceStatus, setFaceStatus] = useState(cfg.detect_faces ? "loading" : "off");

  const queue = useRef([]);
  const flushing = useRef(false);
  const lastFaces = useRef(null);
  const callbacks = useRef({ onStatus, onFinished });
  callbacks.current = { onStatus, onFinished };

  const handleError = useCallback((err) => {
    const data = err?.response?.data;
    if (data?.finished || err?.response?.status === 410) callbacks.current.onFinished?.(data?.error);
    if (data?.session_conflict) callbacks.current.onFinished?.(data.error, "conflict");
  }, []);

  const flush = useCallback(async () => {
    if (flushing.current || !queue.current.length) return;
    flushing.current = true;
    const batch = queue.current.splice(0, 50);
    try {
      const res = await api.events(batch);
      setViolations(res.violations);
      setMaxViolations(res.max_violations);
      if (res.terminated) callbacks.current.onFinished?.("Your test was terminated because of repeated proctoring violations.", "terminated");
    } catch (err) {
      if (!err.response) queue.current.unshift(...batch.slice(0, 50)); // network blip: retry later
      handleError(err);
    } finally {
      flushing.current = false;
    }
  }, [api, handleError]);

  const report = useCallback(
    (type, detail = "") => {
      if (!enabled) return;
      queue.current.push({ type, detail });
      if (COUNTED[type]) {
        setWarning(COUNTED[type]);
        flush();
      }
    },
    [enabled, flush]
  );

  const snapshot = useCallback(() => {
    const image = captureFrame(videoRef.current);
    if (image) api.snapshot(image, lastFaces.current).catch(handleError);
  }, [api, videoRef, handleError]);

  // Focus, visibility, full screen, clipboard and keyboard.
  useEffect(() => {
    if (!enabled) return undefined;
    const onVisibility = () => document.hidden && cfg.detect_tab_switch !== false && report("tab_hidden");
    let blurTimer;
    const onBlur = () => {
      if (cfg.detect_tab_switch === false) return;
      blurTimer = setTimeout(() => !document.hidden && !document.hasFocus() && report("window_blur"), 300);
    };
    const onFullscreen = () => {
      if (!cfg.require_fullscreen) return;
      const lost = !document.fullscreenElement;
      setFullscreenLost(lost);
      if (lost) report("fullscreen_exit");
    };
    const onClipboard = (e) => {
      if (!cfg.block_copy_paste) return;
      e.preventDefault();
      report(e.type);
    };
    const onContext = (e) => {
      if (!cfg.block_copy_paste) return;
      e.preventDefault();
      report("context_menu");
    };
    const onKey = (e) => {
      const k = (e.key || "").toLowerCase();
      const mod = e.ctrlKey || e.metaKey;
      if (k === "f12" || (mod && e.shiftKey && ["i", "j", "c"].includes(k)) || (e.metaKey && e.altKey && ["i", "j", "c"].includes(k))) {
        e.preventDefault();
        report("devtools", `Pressed ${e.key}`);
      } else if (mod && ["u", "s", "p"].includes(k)) {
        e.preventDefault();
        report("blocked_shortcut", `Ctrl+${k.toUpperCase()}`);
      }
    };
    const onKeyUp = (e) => e.key === "PrintScreen" && report("blocked_shortcut", "PrintScreen");
    const onUnload = (e) => {
      e.preventDefault();
      e.returnValue = "";
    };
    document.addEventListener("visibilitychange", onVisibility);
    window.addEventListener("blur", onBlur);
    document.addEventListener("fullscreenchange", onFullscreen);
    ["copy", "cut", "paste"].forEach((t) => document.addEventListener(t, onClipboard, true));
    document.addEventListener("contextmenu", onContext, true);
    document.addEventListener("keydown", onKey, true);
    document.addEventListener("keyup", onKeyUp, true);
    window.addEventListener("beforeunload", onUnload);
    if (cfg.require_fullscreen) setFullscreenLost(!document.fullscreenElement);
    if (window.screen?.isExtended) report("multiple_displays");
    return () => {
      clearTimeout(blurTimer);
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("blur", onBlur);
      document.removeEventListener("fullscreenchange", onFullscreen);
      ["copy", "cut", "paste"].forEach((t) => document.removeEventListener(t, onClipboard, true));
      document.removeEventListener("contextmenu", onContext, true);
      document.removeEventListener("keydown", onKey, true);
      document.removeEventListener("keyup", onKeyUp, true);
      window.removeEventListener("beforeunload", onUnload);
    };
  }, [enabled, cfg.detect_tab_switch, cfg.require_fullscreen, cfg.block_copy_paste, report]);

  // Camera / microphone disconnects.
  useEffect(() => {
    if (!enabled || !stream) return undefined;
    const tracks = [];
    const watch = (track, type) => {
      const handler = () => report(type, `${track.kind} track ${track.readyState}`);
      track.addEventListener("ended", handler);
      tracks.push([track, handler]);
    };
    if (cfg.require_webcam) stream.getVideoTracks().forEach((t) => watch(t, "camera_off"));
    if (cfg.require_microphone) stream.getAudioTracks().forEach((t) => watch(t, "mic_off"));
    return () => tracks.forEach(([t, h]) => t.removeEventListener("ended", h));
  }, [enabled, stream, cfg.require_webcam, cfg.require_microphone, report]);

  // Face detection.
  useEffect(() => {
    if (!enabled || !cfg.detect_faces || !stream) return undefined;
    let cancelled = false;
    let timer;
    let none = 0;
    let multi = 0;
    let state = "ok";
    loadFaceDetector()
      .then((detector) => {
        if (cancelled) return;
        setFaceStatus("ok");
        timer = setInterval(() => {
          const n = countFaces(detector, videoRef.current);
          if (n === null) return;
          lastFaces.current = n;
          none = n === 0 ? none + 1 : 0;
          multi = n > 1 ? multi + 1 : 0;
          let next = "ok";
          if (none >= NO_FACE_CHECKS) next = "none";
          if (multi >= MULTI_FACE_CHECKS) next = "multiple";
          if (next !== state) {
            state = next;
            setFaceStatus(next);
            if (next === "none") report("no_face");
            if (next === "multiple") {
              report("multiple_faces", `${n} faces detected`);
              snapshot();
            }
          }
        }, FACE_CHECK_MS);
      })
      .catch(() => {
        if (cancelled) return;
        setFaceStatus("unavailable");
        report("face_detection_unavailable");
      });
    return () => {
      cancelled = true;
      clearInterval(timer);
    };
  }, [enabled, cfg.detect_faces, stream, videoRef, report, snapshot]);

  // Periodic snapshots.
  useEffect(() => {
    const every = Number(cfg.snapshot_interval_sec || 0);
    if (!enabled || !cfg.require_webcam || !stream || !every) return undefined;
    const first = setTimeout(snapshot, 3000);
    const timer = setInterval(snapshot, every * 1000);
    return () => {
      clearTimeout(first);
      clearInterval(timer);
    };
  }, [enabled, cfg.require_webcam, cfg.snapshot_interval_sec, stream, snapshot]);

  // Background noise / other voices.
  useEffect(() => {
    if (!enabled || !cfg.detect_noise || !stream || !stream.getAudioTracks().length) return undefined;
    const Ctx = window.AudioContext || window.webkitAudioContext;
    if (!Ctx) return undefined;
    const ctx = new Ctx();
    const analyser = ctx.createAnalyser();
    analyser.fftSize = 1024;
    ctx.createMediaStreamSource(stream).connect(analyser);
    const buf = new Float32Array(analyser.fftSize);
    let loud = 0;
    const timer = setInterval(() => {
      analyser.getFloatTimeDomainData(buf);
      const rms = Math.sqrt(buf.reduce((a, v) => a + v * v, 0) / buf.length);
      loud = rms > NOISE_RMS ? loud + 1 : 0;
      if (loud === 6) report("noise", `Sustained sound level ${rms.toFixed(2)}`);
    }, 500);
    return () => {
      clearInterval(timer);
      ctx.close().catch(() => {});
    };
  }, [enabled, cfg.detect_noise, stream, report]);

  // Flush queued low-severity events and keep the server-side session alive.
  useEffect(() => {
    if (!active) return undefined;
    const flusher = setInterval(flush, 4000);
    const beat = setInterval(() => {
      api
        .heartbeat()
        .then((res) => {
          setViolations(res.violations);
          callbacks.current.onStatus?.(res);
        })
        .catch(handleError);
    }, 20000);
    return () => {
      clearInterval(flusher);
      clearInterval(beat);
      flush();
    };
  }, [active, api, flush, handleError]);

  const requestFullscreen = useCallback(() => document.documentElement.requestFullscreen?.().catch(() => {}), []);

  return {
    violations,
    setViolations,
    maxViolations,
    warning,
    clearWarning: () => setWarning(null),
    fullscreenLost,
    requestFullscreen,
    faceStatus,
    report,
  };
}
