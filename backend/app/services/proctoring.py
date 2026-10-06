"""Server-side handling of proctoring signals reported by the candidate's browser."""

import base64
import binascii
import os
import uuid
from datetime import timedelta

from flask import current_app

from ..extensions import db
from ..models import ProctorEvent, Snapshot, utcnow

# type: (severity, counts towards the violation limit, description)
EVENT_RULES = {
    "tab_hidden": ("high", True, "Switched tab or minimised the browser"),
    "window_blur": ("medium", True, "Moved focus to another window or application"),
    "fullscreen_exit": ("high", True, "Exited full-screen mode"),
    "copy": ("medium", True, "Tried to copy content"),
    "cut": ("medium", True, "Tried to cut content"),
    "paste": ("medium", True, "Tried to paste content"),
    "devtools": ("high", True, "Opened browser developer tools"),
    "multiple_faces": ("high", True, "More than one person detected on camera"),
    "no_face": ("medium", True, "Candidate not visible on camera"),
    "camera_off": ("high", True, "Camera was turned off or disconnected"),
    "mic_off": ("medium", True, "Microphone was turned off or disconnected"),
    "multiple_displays": ("medium", True, "An additional monitor is connected"),
    "new_session": ("high", True, "Test was resumed from a different browser/device"),
    "context_menu": ("low", False, "Right-click attempted"),
    "blocked_shortcut": ("low", False, "Blocked keyboard shortcut"),
    "noise": ("low", False, "Sustained background noise or speech"),
    "screen_resize": ("low", False, "Browser window resized"),
    "ip_changed": ("medium", False, "Network/IP address changed during the test"),
    "face_detection_unavailable": ("info", False, "Automatic face detection unavailable in this browser"),
    "started": ("info", False, "Test started"),
    "resumed": ("info", False, "Test resumed in the same browser"),
    "submitted": ("info", False, "Test submitted"),
    "auto_submitted": ("info", False, "Test auto-submitted"),
    "terminated": ("high", False, "Test terminated for repeated violations"),
}
SEVERITY_PENALTY = {"info": 0, "low": 2, "medium": 8, "high": 15}
# Leaving the tab usually fires blur + visibility + fullscreen events together; count such a burst once.
FOCUS_GROUP = {"tab_hidden", "window_blur", "fullscreen_exit"}
FOCUS_COALESCE_SECONDS = 3
REPEAT_COOLDOWN_SECONDS = {"no_face": 15, "multiple_faces": 15, "noise": 30, "multiple_displays": 300}
MAX_SNAPSHOT_BYTES = 600 * 1024


def _recently_counted(stage, types, seconds):
    since = utcnow() - timedelta(seconds=seconds)
    return (
        stage.events.filter(ProctorEvent.type.in_(list(types)), ProctorEvent.counted.is_(True))
        .filter(ProctorEvent.created_at >= since)
        .first()
        is not None
    )


def record(stage, event_type, detail="", proctoring=None):
    """Store an event; returns it. Updates violation count and integrity score."""
    proctoring = proctoring or {}
    severity, counts, description = EVENT_RULES.get(event_type, ("low", False, event_type))
    if not proctoring.get("enabled", True) and event_type not in ("new_session",):
        counts = False
    # Respect per-round toggles so disabled checks never penalise the candidate.
    toggles = {
        "tab_hidden": "detect_tab_switch",
        "window_blur": "detect_tab_switch",
        "fullscreen_exit": "require_fullscreen",
        "copy": "block_copy_paste",
        "cut": "block_copy_paste",
        "paste": "block_copy_paste",
        "multiple_faces": "detect_faces",
        "no_face": "detect_faces",
        "camera_off": "require_webcam",
        "mic_off": "require_microphone",
        "noise": "detect_noise",
    }
    if event_type in toggles and not proctoring.get(toggles[event_type], True):
        counts = False
    if counts and event_type in FOCUS_GROUP and _recently_counted(stage, FOCUS_GROUP, FOCUS_COALESCE_SECONDS):
        counts = False
    cooldown = REPEAT_COOLDOWN_SECONDS.get(event_type)
    if counts and cooldown and _recently_counted(stage, {event_type}, cooldown):
        counts = False

    event = ProctorEvent(
        stage_id=stage.id,
        type=event_type[:50],
        severity=severity,
        detail=(str(detail or description))[:500],
        counted=counts,
    )
    db.session.add(event)
    if counts:
        stage.violations = (stage.violations or 0) + 1
    stage.integrity = max(0.0, (stage.integrity if stage.integrity is not None else 100.0) - (SEVERITY_PENALTY[severity] if counts else 0))
    return event


def limit_reached(stage, proctoring):
    limit = int((proctoring or {}).get("max_violations") or 0)
    return bool((proctoring or {}).get("enabled", True)) and limit > 0 and (stage.violations or 0) >= limit


def save_snapshot(stage, data_url, faces=None):
    """Persist a webcam frame sent as a data URL (image/jpeg or image/png)."""
    if not isinstance(data_url, str) or "," not in data_url:
        return None
    header, b64 = data_url.split(",", 1)
    if header not in ("data:image/jpeg;base64", "data:image/png;base64", "data:image/webp;base64"):
        return None
    try:
        raw = base64.b64decode(b64, validate=True)
    except (binascii.Error, ValueError):
        return None
    if len(raw) > MAX_SNAPSHOT_BYTES:
        return None
    ext = header.split("/")[1].split(";")[0]
    folder = os.path.join(current_app.config["UPLOAD_DIR"], "snapshots", str(stage.id))
    os.makedirs(folder, exist_ok=True)
    path = os.path.join(folder, f"{utcnow():%Y%m%d%H%M%S}_{uuid.uuid4().hex[:6]}.{ext}")
    with open(os.open(path, os.O_WRONLY | os.O_CREAT | os.O_TRUNC, 0o600), "wb") as fh:
        fh.write(raw)
    try:
        faces = None if faces is None else int(faces)
    except (TypeError, ValueError):
        faces = None
    snap = Snapshot(stage_id=stage.id, path=path, faces=faces, flagged=faces is not None and faces != 1)
    db.session.add(snap)
    return snap
