"""Templated bulk email over SMTP. Without SMTP settings emails are logged and marked 'simulated'."""

import html
import logging
import re
import smtplib
import ssl
import threading
import time
from email.message import EmailMessage
from email.utils import make_msgid

from flask import current_app

from ..extensions import db
from ..models import EmailLog, utcnow

log = logging.getLogger(__name__)

_PLACEHOLDER = re.compile(r"\{\{\s*(\w+)\s*\}\}")

WRAPPER = """<!DOCTYPE html><html><body style="margin:0;background:#f4f5fb;font-family:Arial,Helvetica,sans-serif;color:#1f2937">
<div style="max-width:600px;margin:0 auto;padding:24px">
<div style="background:#4f46e5;color:#fff;padding:18px 24px;border-radius:8px 8px 0 0;font-size:20px;font-weight:bold">{company}</div>
<div style="background:#fff;padding:24px;border-radius:0 0 8px 8px;line-height:1.6">{body}</div>
<p style="color:#9ca3af;font-size:12px;text-align:center">This is an automated message from the {company} hiring team.</p>
</div></body></html>"""


def render(template, context, escape=True):
    def sub(match):
        value = context.get(match.group(1), "")
        value = "" if value is None else str(value)
        return html.escape(value) if escape else value

    return _PLACEHOLDER.sub(sub, template or "")


def build_email(subject_tpl, body_tpl, context):
    subject = render(subject_tpl, context, escape=False).replace("\n", " ").strip()
    body = render(body_tpl, context)
    return subject, WRAPPER.format(company=html.escape(str(context.get("company", ""))), body=body)


def queue(to, subject, html_body, kind="invite", drive_id=None, candidate_id=None, stage_id=None):
    entry = EmailLog(
        to=to,
        subject=subject,
        html=html_body,
        kind=kind,
        drive_id=drive_id,
        candidate_id=candidate_id,
        stage_id=stage_id,
        status="queued",
    )
    db.session.add(entry)
    return entry


def _html_to_text(markup):
    text = re.sub(r"<(br|/p|/li|/div)[^>]*>", "\n", markup, flags=re.I)
    text = re.sub(r'<a [^>]*href="([^"]+)"[^>]*>(.*?)</a>', r"\2 (\1)", text, flags=re.I | re.S)
    text = re.sub(r"<[^>]+>", "", text)
    return html.unescape(re.sub(r"\n\s*\n+", "\n\n", text)).strip()


class _Sender:
    def __init__(self, config):
        self.config = config
        self.conn = None

    def __enter__(self):
        cfg = self.config
        if cfg["SMTP_HOST"]:
            if cfg["SMTP_USE_SSL"]:
                self.conn = smtplib.SMTP_SSL(cfg["SMTP_HOST"], cfg["SMTP_PORT"], timeout=30)
            else:
                self.conn = smtplib.SMTP(cfg["SMTP_HOST"], cfg["SMTP_PORT"], timeout=30)
                if cfg["SMTP_USE_TLS"]:
                    self.conn.starttls(context=ssl.create_default_context())
            if cfg["SMTP_USER"]:
                self.conn.login(cfg["SMTP_USER"], cfg["SMTP_PASSWORD"])
        return self

    def send(self, entry):
        if not self.conn:
            log.info("[email simulated] to=%s subject=%s", entry.to, entry.subject)
            return "simulated"
        msg = EmailMessage()
        msg["From"] = self.config["MAIL_FROM"]
        msg["To"] = entry.to
        msg["Subject"] = entry.subject
        msg["Message-ID"] = make_msgid()
        msg.set_content(_html_to_text(entry.html or ""))
        msg.add_alternative(entry.html or "", subtype="html")
        self.conn.send_message(msg)
        return "sent"

    def __exit__(self, *exc):
        if self.conn:
            try:
                self.conn.quit()
            except Exception:
                pass


def _deliver(ids):
    config = current_app.config
    rate = config["MAIL_RATE_PER_MINUTE"]
    delay = 60.0 / rate if rate else 0
    try:
        sender_ctx = _Sender(config).__enter__()
    except Exception as exc:
        log.error("SMTP connection failed: %s", exc)
        for entry in EmailLog.query.filter(EmailLog.id.in_(ids)).all():
            entry.status, entry.error = "failed", f"SMTP connection failed: {exc}"[:1000]
        db.session.commit()
        return
    try:
        for i, entry_id in enumerate(ids):
            entry = db.session.get(EmailLog, entry_id)
            if not entry or entry.status != "queued":
                continue
            try:
                entry.status = sender_ctx.send(entry)
                entry.sent_at = utcnow()
                entry.error = None
            except Exception as exc:
                entry.status, entry.error = "failed", str(exc)[:1000]
            db.session.commit()
            if delay and sender_ctx.conn and i < len(ids) - 1:
                time.sleep(delay)
    finally:
        sender_ctx.__exit__(None, None, None)


def dispatch(entries):
    """Send queued EmailLog rows (after the caller has committed them)."""
    ids = [e.id for e in entries]
    if not ids:
        return
    app = current_app._get_current_object()
    if not app.config["MAIL_ASYNC"]:
        _deliver(ids)
        return

    def run():
        with app.app_context():
            try:
                _deliver(ids)
            finally:
                db.session.remove()

    threading.Thread(target=run, name="mailer", daemon=True).start()
