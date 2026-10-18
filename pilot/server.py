"""Local-only pilot inference gateway. No external inference provider, no paid fallback.

Run explicitly with MECHANICAI_PILOT_KEY, MECHANICAI_PILOT_ORIGIN and local Ollama.
Bind localhost by default. For remote pilot use a reviewed TLS reverse proxy.
"""
import hmac
import json
import os
import urllib.request
import urllib.error
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from urllib.parse import urlsplit
from budget import Budget, Limits

BUDGET = Budget(Limits(
    requests_per_session=int(os.getenv("PILOT_REQUESTS_PER_SESSION", "30")),
    max_parallel=int(os.getenv("PILOT_MAX_PARALLEL", "1")),
))
MODEL = os.getenv("PILOT_MODEL", "qwen2.5:3b")
ORIGIN = os.getenv("MECHANICAI_PILOT_ORIGIN", "")
KEY = os.getenv("MECHANICAI_PILOT_KEY", "")
# Explicitly fixed to loopback. No arbitrary URL or paid-provider forwarding.
OLLAMA = "http://127.0.0.1:11434/api/chat"
SYSTEM = ("Du er en dansk, domæneuafhængig assistent til praktiske opgaver. "
          "Du har ikke adgang til verificerede manualer eller kamera. "
          "Opfind aldrig kilder, momentværdier, elektriske specifikationer eller "
          "præcis placering af komponenter. Bed om dokumentation ved usikkerhed.")

def infer(messages):
    payload = json.dumps({"model": MODEL, "messages": [{"role": "system", "content": SYSTEM}] + messages,
                          "stream": False, "options": {"num_predict": BUDGET.limits.max_output_tokens}}).encode()
    req = urllib.request.Request(OLLAMA, data=payload, headers={"Content-Type": "application/json"}, method="POST")
    with urllib.request.urlopen(req, timeout=55) as response:
        result = json.load(response)
    reply = result.get("message", {}).get("content")
    if not isinstance(reply, str) or not reply.strip():
        raise ValueError("Empty model reply")
    return reply[:4000]

class Handler(BaseHTTPRequestHandler):
    def respond(self, status, data):
        body = json.dumps(data, ensure_ascii=False).encode()
        self.send_response(status)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Cache-Control", "no-store")
        self.send_header("Content-Length", str(len(body)))
        if ORIGIN and self.headers.get("Origin") == ORIGIN:
            self.send_header("Access-Control-Allow-Origin", ORIGIN)
            self.send_header("Vary", "Origin")
        self.end_headers()
        self.wfile.write(body)

    def do_OPTIONS(self):
        if not ORIGIN or self.headers.get("Origin") != ORIGIN or self.path != "/v1/chat":
            return self.respond(403, {"error": "Origin rejected"})
        self.send_response(204)
        self.send_header("Access-Control-Allow-Origin", ORIGIN)
        self.send_header("Access-Control-Allow-Headers", "Content-Type, X-Pilot-Key, X-Pilot-Session")
        self.send_header("Access-Control-Allow-Methods", "POST, OPTIONS")
        self.end_headers()

    def do_GET(self):
        if self.path == "/health":
            return self.respond(200, {"status": "ok", "inference_enabled": bool(KEY and ORIGIN),
                                      "budget": BUDGET.snapshot()})
        return self.respond(404, {"error": "Not found"})

    def do_POST(self):
        if self.path != "/v1/chat":
            return self.respond(404, {"error": "Not found"})
        if not ORIGIN or self.headers.get("Origin") != ORIGIN:
            return self.respond(403, {"error": "Origin rejected"})
        if not KEY or not hmac.compare_digest(self.headers.get("X-Pilot-Key", ""), KEY):
            return self.respond(401, {"error": "Access denied"})
        try:
            size = int(self.headers.get("Content-Length", "0"))
            if size < 2 or size > 16000:
                return self.respond(413, {"error": "Request too large"})
            data = json.loads(self.rfile.read(size))
            messages = data.get("messages")
            session = self.headers.get("X-Pilot-Session", "")
            ok, reason = BUDGET.reserve(session, messages)
            if not ok:
                return self.respond(429 if reason in ("busy", "session_limit") else 400, {"error": reason})
            try:
                reply = infer(messages)
                return self.respond(200, {"reply": reply})
            finally:
                BUDGET.release()
        except (ValueError, TypeError, json.JSONDecodeError):
            return self.respond(400, {"error": "Invalid request"})
        except (urllib.error.URLError, TimeoutError, OSError):
            return self.respond(503, {"error": "Local model unavailable"})
        except Exception:
            return self.respond(503, {"error": "Inference failed"})

if __name__ == "__main__":
    if not KEY or len(KEY) < 24 or not ORIGIN.startswith("https://"):
        raise SystemExit("Set strong MECHANICAI_PILOT_KEY and HTTPS MECHANICAI_PILOT_ORIGIN")
    ThreadingHTTPServer(("127.0.0.1", int(os.getenv("PILOT_PORT", "8765"))), Handler).serve_forever()
