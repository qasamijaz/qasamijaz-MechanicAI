"""Single-host pilot quota store. SQLite transactions enforce limits across threads/processes.
This is a request-count ceiling, NOT a monetary spending cap.
"""
import sqlite3
from pathlib import Path
from datetime import datetime, timezone

class QuotaStore:
    def __init__(self, path, per_user_daily=30, global_daily=300):
        self.path = str(path)
        self.per_user_daily = per_user_daily
        self.global_daily = global_daily
        with self._connect() as db:
            db.execute("CREATE TABLE IF NOT EXISTS requests (day TEXT NOT NULL, user_id TEXT NOT NULL, count INTEGER NOT NULL, PRIMARY KEY(day,user_id))")

    def _connect(self):
        db = sqlite3.connect(self.path, timeout=10, isolation_level=None)
        db.execute("PRAGMA busy_timeout=10000")
        return db

    def reserve(self, user_id, day=None):
        if not isinstance(user_id, str) or not (1 <= len(user_id) <= 128):
            return False, "invalid_user"
        day = day or datetime.now(timezone.utc).date().isoformat()
        with self._connect() as db:
            try:
                db.execute("BEGIN IMMEDIATE")
                own = db.execute("SELECT count FROM requests WHERE day=? AND user_id=?", (day,user_id)).fetchone()
                total = db.execute("SELECT COALESCE(SUM(count),0) FROM requests WHERE day=?", (day,)).fetchone()[0]
                if (own and own[0] >= self.per_user_daily) or total >= self.global_daily:
                    db.execute("ROLLBACK")
                    return False, "quota_exceeded"
                db.execute("INSERT INTO requests(day,user_id,count) VALUES(?,?,1) ON CONFLICT(day,user_id) DO UPDATE SET count=count+1", (day,user_id))
                db.execute("COMMIT")
                return True, "ok"
            except Exception:
                db.execute("ROLLBACK")
                raise

    def usage(self, day=None):
        day = day or datetime.now(timezone.utc).date().isoformat()
        with self._connect() as db:
            return db.execute("SELECT COALESCE(SUM(count),0) FROM requests WHERE day=?", (day,)).fetchone()[0]
