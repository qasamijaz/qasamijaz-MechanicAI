"""Persistent single-host invite-login rate limiting.

Counts ALL login attempts, including invalid invites. No client-controlled identity
is used to select the bucket. For pilot scale only; add trusted proxy/IP controls
and external edge throttling before public exposure.
"""
import sqlite3
from datetime import datetime, timezone

class LoginLimiter:
    def __init__(self,path,max_attempts=12,window_seconds=900):
        self.path=str(path)
        self.max_attempts=max_attempts
        self.window_seconds=window_seconds
        with self.connect() as db:
            db.execute("CREATE TABLE IF NOT EXISTS login_attempts (bucket INTEGER PRIMARY KEY, attempts INTEGER NOT NULL)")
    def connect(self):
        db=sqlite3.connect(self.path,timeout=10,isolation_level=None)
        db.execute("PRAGMA busy_timeout=10000")
        return db
    def reserve(self,now=None):
        if now is None:
            now=datetime.now(timezone.utc).timestamp()
        bucket=int(now)//self.window_seconds
        with self.connect() as db:
            try:
                db.execute("BEGIN IMMEDIATE")
                db.execute("DELETE FROM login_attempts WHERE bucket < ?",(bucket-2,))
                row=db.execute("SELECT attempts FROM login_attempts WHERE bucket=?",(bucket,)).fetchone()
                if row and row[0]>=self.max_attempts:
                    db.execute("ROLLBACK")
                    return False
                db.execute("INSERT INTO login_attempts(bucket,attempts) VALUES(?,1) ON CONFLICT(bucket) DO UPDATE SET attempts=attempts+1",(bucket,))
                db.execute("COMMIT")
                return True
            except Exception:
                db.execute("ROLLBACK")
                raise
