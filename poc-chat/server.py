"""Isolated, invitation-only MechanicAI conversation POC.
No OpenAI key is ever sent to the browser. Not deployed automatically.
"""
import hmac
import json
import os
import threading
import urllib.error
import urllib.request
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.parse import urlsplit

HTML = Path(__file__).with_name("index.html")
MODEL = os.environ.get("MECHANICAI_MODEL", "gpt-4o-mini")
API_KEY = os.environ.get("OPENAI_API_KEY", "")
INVITE = os.environ.get("MECHANICAI_POC_INVITE", "")
MAX_CALLS = min(int(os.environ.get("MECHANICAI_MAX_CALLS", "20")), 30)
MAX_INPUT_CHARS = 1200
SYSTEM = ("Du er MechanicAI, en hjælpsom dansk assistent til mekanik, gør-det-selv og andre praktiske opgaver. "
          "Tal naturligt og kort, hjælp ét trin ad gangen, og stil relevante opklarende spørgsmål. "
          "Skeln mellem verificeret dokumentation og generel viden. "
          "Du har ingen verificerede manualer eller billeder i denne POC. "
          "Opfind aldrig modelspecifikke placeringer, reservedelsnumre, momentværdier, kilder eller sikkerhedsgodkendelser. "
          "Ved risikable opgaver skal du give klare sikkerhedsforbehold.")
_lock = threading.Lock()
_reserved = 0

def validate_messages(messages):
    if not isinstance(messages, list) or not 1 <= len(messages) <= 10:
        raise ValueError("Send 1-10 samtalebeskeder.")
    validated = []
    for entry in messages:
        if not isinstance(entry, dict) or entry.get("role") not in ("user", "assistant"):
            raise ValueError("Ugyldig afsender.")
        content = entry.get("content")
        if not isinstance(content, str) or not 0 < len(content.strip()) <= MAX_INPUT_CHARS:
            raise ValueError("Ugyldigt beskedindhold.")
        validated.append({"role": entry["role"], "content": content.strip()})
    if validated[-1]["role"] != "user":
        raise ValueError("Sidste besked skal komme fra brugeren.")
    return validated

def reserve():
    global _reserved
    with _lock:
        if _reserved >= MAX_CALLS:
            return False
        _reserved += 1
        return True

def generate(messages):
    payload = json.dumps({"model": MODEL,
        "messages": [{"role": "system", "content": SYSTEM}] + messages,
        "max_tokens": 450}, ensure_ascii=False).encode()
    request = urllib.request.Request("https://api.openai.com/v1/chat/completions", data=payload,
        headers={"Authorization": "Bearer " + API_KEY, "Content-Type": "application/json"},
        method="POST")
    with urllib.request.urlopen(request, timeout=60) as response:
        result = json.load(response)
    reply = result.get("choices", [{}])[0].get("message", {}).get("content")
    if not isinstance(reply, str) or not reply.strip():
        raise ValueError("AI returnerede ikke et svar.")
    return reply.strip()

class Handler(BaseHTTPRequestHandler):
    def respond(self, status, data):
        body = json.dumps(data, ensure_ascii=False).encode()
        self.send_response(status)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Cache-Control", "no-store")
        self.send_header("X-Content-Type-Options", "nosniff")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def do_GET(self):
        if urlsplit(self.path).path == "/health":
            return self.respond(200, {"ok": True, "ai_configured": bool(API_KEY and INVITE), "requests_reserved": _reserved, "max_calls": MAX_CALLS})
        if urlsplit(self.path).path != "/":
            return self.respond(404, {"error": "Ikke fundet"})
        page = HTML.read_bytes()
        self.send_response(200)
        self.send_header("Content-Type", "text/html; charset=utf-8")
        self.send_header("Cache-Control", "no-store")
        self.send_header("Content-Security-Policy", "default-src 'self'; script-src 'unsafe-inline'; style-src 'unsafe-inline'; connect-src 'self'; base-uri 'none'; object-src 'none'; frame-ancestors 'none'")
        self.send_header("Content-Length", str(len(page)))
        self.end_headers()
        self.wfile.write(page)

    def do_POST(self):
        if urlsplit(self.path).path != "/api/chat":
            return self.respond(404, {"error": "Ikke fundet"})
        if not INVITE or not hmac.compare_digest(self.headers.get("X-MechanicAI-Invite", ""), INVITE):
            return self.respond(401, {"error": "Ugyldig POC-adgangskode."})
        if not API_KEY:
            return self.respond(503, {"error": "AI er endnu ikke aktiveret."})
        # Browser-only pilot: reject cross-origin requests. Requires HTTPS and access gate for Internet deployment.
        if self.headers.get("Origin") and self.headers["Origin"].rstrip("/") != os.environ.get("MECHANICAI_POC_ORIGIN", "").strip().strip('"\'').rstrip("/"):
            return self.respond(403, {"error": "Ugyldig oprindelse."})
        try:
            length = int(self.headers.get("Content-Length", "0"))
            if length < 2 or length > 16000:
                return self.respond(413, {"error": "For stor forespørgsel."})
            messages = validate_messages(json.loads(self.rfile.read(length)).get("messages"))
        except (ValueError, TypeError, AttributeError, json.JSONDecodeError):
            return self.respond(400, {"error": "Ugyldig samtale."})
        if not reserve():
            return self.respond(429, {"error": "POC-kvoten er brugt."})
        try:
            return self.respond(200, {"reply": generate(messages)})
        except (urllib.error.URLError, TimeoutError, ValueError, KeyError):
            return self.respond(502, {"error": "AI kunne ikke svare lige nu."})

if __name__ == "__main__":
    print("MechanicAI POC listening on configured PORT", flush=True)
    ThreadingHTTPServer(("0.0.0.0", int(os.environ.get("PORT", "8766"))), Handler).serve_forever()
