"""Invite-only single-host pilot sessions.

Secrets and sessions never enter browser JavaScript. Uses persistent SQLite.
Do not run with multiple independent databases or without TLS reverse proxy.
"""
import hashlib
import hmac
import secrets
import sqlite3
from datetime import datetime, timedelta, timezone

def digest(value):
    return hashlib.sha256(value.encode("utf-8")).hexdigest()

class Sessions:
    def __init__(self, path, invite_hashes, ttl_hours=24):
        self.path = str(path)
        self.invite_hashes = frozenset(invite_hashes)
        self.ttl_hours = ttl_hours
        with self.connect() as db:
            db.execute("""CREATE TABLE IF NOT EXISTS sessions (
                token_hash TEXT PRIMARY KEY, user_id TEXT NOT NULL,
                csrf_hash TEXT NOT NULL, expires_at TEXT NOT NULL)""")

    def connect(self):
        db = sqlite3.connect(self.path, timeout=10)
        db.execute("PRAGMA busy_timeout=10000")
        return db

    def login(self, invite):
        if not isinstance(invite, str) or len(invite) > 256:
            return None
        hashed = digest(invite)
        if not any(hmac.compare_digest(hashed, allowed) for allowed in self.invite_hashes):
            return None
        # Stable pseudonymous user ID derived from invite, not client-controlled.
        user_id = hashed
        token = secrets.token_urlsafe(32)
        csrf = secrets.token_urlsafe(32)
        expiry = (datetime.now(timezone.utc) + timedelta(hours=self.ttl_hours)).isoformat()
        with self.connect() as db:
            db.execute("INSERT INTO sessions VALUES (?,?,?,?)",
                       (digest(token), user_id, digest(csrf), expiry))
        return {"token": token, "csrf": csrf, "expires_at": expiry}

    def verify(self, token, csrf):
        if not isinstance(token, str) or not isinstance(csrf, str) or len(token)>256 or len(csrf)>256:
            return None
        with self.connect() as db:
            row = db.execute("SELECT user_id,csrf_hash,expires_at FROM sessions WHERE token_hash=?",
                             (digest(token),)).fetchone()
        if not row or not hmac.compare_digest(row[1], digest(csrf)):
            return None
        if datetime.fromisoformat(row[2]) <= datetime.now(timezone.utc):
            return None
        return row[0]

    def revoke(self, token):
        if not isinstance(token, str):
            return
        with self.connect() as db:
            db.execute("DELETE FROM sessions WHERE token_hash=?", (digest(token),))
