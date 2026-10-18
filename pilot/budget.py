"""Pure, fail-closed pilot request accounting. No billing provider and no API keys."""
from dataclasses import dataclass
from threading import Lock
from time import monotonic

@dataclass(frozen=True)
class Limits:
    requests_per_session: int = 30
    max_input_chars: int = 12000
    max_output_tokens: int = 256
    max_parallel: int = 1

class Budget:
    """Process-local pilot guard only; NOT sufficient for multi-worker production quotas."""
    def __init__(self, limits=Limits()):
        self.limits = limits
        self.lock = Lock()
        self.counts = {}
        self.inflight = 0
        self.total = 0

    def reserve(self, session_id, messages):
        if not isinstance(session_id, str) or not (8 <= len(session_id) <= 128) or not session_id.isascii() or not all(c.isalnum() or c in "-_" for c in session_id):
            return False, "invalid_session"
        if not isinstance(messages, list) or not (1 <= len(messages) <= 12):
            return False, "invalid_messages"
        if any(not isinstance(m, dict) or m.get("role") not in ("user", "assistant") or not isinstance(m.get("content"), str) for m in messages):
            return False, "invalid_messages"
        if sum(len(m["content"]) for m in messages) > self.limits.max_input_chars:
            return False, "input_too_large"
        with self.lock:
            if self.inflight >= self.limits.max_parallel:
                return False, "busy"
            if self.counts.get(session_id, 0) >= self.limits.requests_per_session:
                return False, "session_limit"
            self.counts[session_id] = self.counts.get(session_id, 0) + 1
            self.inflight += 1
            self.total += 1
        return True, "ok"

    def release(self):
        with self.lock:
            if self.inflight <= 0:
                raise RuntimeError("unbalanced release")
            self.inflight -= 1

    def snapshot(self):
        with self.lock:
            return {"requests": self.total, "inflight": self.inflight, "sessions": len(self.counts)}
