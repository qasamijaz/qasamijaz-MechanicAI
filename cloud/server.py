"""Small authenticated-to-provider proxy for a dedicated Hugging Face Docker Space.
Set HF_TOKEN as a private Space secret. Never put it in the static Vite app.
"""
import json
import hmac
import threading
import time
import os
import urllib.request
import urllib.error
from html.parser import HTMLParser
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer

MODEL = os.getenv("HF_CHAT_MODEL", "openai/gpt-oss-20b:cheapest")
ORIGIN = os.getenv("MECHANICAI_ALLOWED_ORIGIN", "https://qasammekai-mechanicai.hf.space")
MAX_BYTES = 16000
# Hard process-local cap; resets on restart and is NOT a substitute for provider spend limits.
MAX_REQUESTS = int(os.getenv("MECHANICAI_MAX_REQUESTS", "20"))
_lock = threading.Lock()
_requests = 0

SYSTEM = ("Du er MechanicAI, en hjælpsom dansk assistent til praktiske opgaver. "
          "Før en naturlig dialog, stil kun nødvendige opfølgende spørgsmål. "
          "Skeln mellem generel viden og verificeret dokumentation. "
          "Du har IKKE adgang til en verificeret manual i denne samtale. "
          "Opfind aldrig momentværdier, reservedelsplaceringer, modelmatch eller kilder. "
          "Ved risikable opgaver: vær tydelig om usikkerhed og sikkerhed.")

def make_messages(raw):
    if not isinstance(raw, list) or not raw or len(raw) > 10:
        raise ValueError("Forventede 1-10 samtalebeskeder.")
    messages = [{"role": "system", "content": SYSTEM}]
    for entry in raw:
        if not isinstance(entry, dict) or entry.get("role") not in ("user", "assistant"):
            raise ValueError("Ugyldig samtalebesked.")
        content = entry.get("content")
        if not isinstance(content, str) or not content.strip() or len(content) > 1000:
            raise ValueError("Ugyldigt beskedindhold.")
        messages.append({"role": entry["role"], "content": content})
    return messages

def reserve_request():
    global _requests
    with _lock:
        if _requests >= MAX_REQUESTS:
            return False
        _requests += 1
        return True

def complete(messages):
    token = os.getenv("HF_TOKEN")
    if not token:
        raise RuntimeError("HF_TOKEN er ikke konfigureret på serveren.")
    body = json.dumps({"model": MODEL, "messages": messages, "max_tokens": 350, "stream": False}).encode()
    request = urllib.request.Request("https://router.huggingface.co/v1/chat/completions",
                                     data=body, method="POST",
                                     headers={"Authorization": "Bearer " + token, "Content-Type": "application/json"})
    with urllib.request.urlopen(request, timeout=65) as result:
        payload = json.load(result)
    return payload["choices"][0]["message"]["content"]


# Read-only manufacturer catalogue discovery. No scraping of gated PDFs or inferred specifications.
MANUAL_CATALOGUE = "https://www.suzuki.nl/motoren/service/gebruikershandleidingen-motoren/"
class TextExtractor(HTMLParser):
    def __init__(self):
        super().__init__()
        self.parts = []
    def handle_data(self, data):
        self.parts.append(data)
def discover_manual(query):
    import re
    q = str(query or "").lower()
    if not re.search(r"gsx[\\s-]*s[\\s-]*1000[\\s-]*f", q) or "2019" not in q:
        return {"status":"model_unconfirmed","sources":[],"verified_procedure":False}
    req = urllib.request.Request(MANUAL_CATALOGUE, headers={"User-Agent":"MechanicAI-PoC/0.1 (manufacturer catalogue lookup)"})
    try:
        with urllib.request.urlopen(req, timeout=8) as response:
            if response.status != 200 or "text/html" not in response.headers.get("Content-Type",""):
                raise ValueError("Unexpected manufacturer response")
            raw = response.read(600000).decode("utf-8", errors="replace")
        parser = TextExtractor()
        parser.feed(raw)
        page = " ".join(" ".join(parser.parts).split())
        found = bool(re.search(r"GSX-S1000\\s*\\(F\\)\\s*2019", page, re.I))
        return {"status":"catalogue_match" if found else "not_found","sources":[{"title":"Suzuki Nederland – GSX-S1000(F) 2019", "url":MANUAL_CATALOGUE,"kind":"manufacturer_catalogue","content_verified":False}] if found else [],"verified_procedure":False}
    except (OSError,ValueError,UnicodeError):
        return {"status":"source_unavailable","sources":[],"verified_procedure":False}

class Handler(BaseHTTPRequestHandler):
    def respond(self, status, data):
        body = json.dumps(data, ensure_ascii=False).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(body)))
        self.send_header("Cache-Control", "no-store")
        self.send_header("Access-Control-Allow-Origin", ORIGIN)
        self.send_header("Vary", "Origin")
        self.end_headers()
        self.wfile.write(body)
    def do_OPTIONS(self):
        if self.path != "/chat" or self.headers.get("Origin") != ORIGIN:
            self.respond(403, {"error": "Origin not allowed"})
            return
        self.send_response(204)
        self.send_header("Access-Control-Allow-Origin", ORIGIN)
        self.send_header("Access-Control-Allow-Methods", "POST, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type, X-MechanicAI-Pilot-Key")
        self.end_headers()
    def do_GET(self):
        if self.path.startswith("/manual-discovery?"):
            from urllib.parse import urlsplit, parse_qs
            params = parse_qs(urlsplit(self.path).query)
            query = params.get("q", [""])[0][:180]
            self.respond(200, discover_manual(query))
            return
        self.respond(200 if self.path.split("?", 1)[0] == "/health" else 404,
                     {"status": "ok", "configured": bool(os.getenv("HF_TOKEN")), "enabled": os.getenv("MECHANICAI_CLOUD_ENABLED") == "true"} if self.path.split("?", 1)[0] == "/health" else {"error": "Not found"})
    def do_POST(self):
        if self.path != "/chat":
            self.respond(404, {"error": "Not found"})
            return
        if self.headers.get("Origin") != ORIGIN:
            self.respond(403, {"error": "Origin not allowed"})
            return
        pilot_key = os.getenv("MECHANICAI_PILOT_KEY", "")
        supplied_key = self.headers.get("X-MechanicAI-Pilot-Key", "")
        if not pilot_key or not hmac.compare_digest(supplied_key, pilot_key):
            self.respond(401, {"error": "PoC-adgangskode mangler eller er forkert."})
            return
        if os.getenv("MECHANICAI_CLOUD_ENABLED") != "true":
            self.respond(503, {"error": "Cloud-AI er endnu ikke aktiveret."})
            return
        try:
            length = int(self.headers.get("Content-Length", "0"))
            if length < 1 or length > MAX_BYTES:
                self.respond(413, {"error": "Request too large"})
                return
            data = json.loads(self.rfile.read(length))
            messages = make_messages(data.get("messages"))
            if not reserve_request():
                self.respond(429, {"error": "AI-testkvoten er opbrugt."})
                return
            reply = complete(messages)
            self.respond(200, {"reply": reply})
        except (ValueError, KeyError, TypeError):
            self.respond(400, {"error": "Ugyldig forespørgsel."})
        except urllib.error.HTTPError as exc:
            self.respond(502, {"error": "Hugging Face returnerede HTTP " + str(exc.code) + ". Kontrollér model og kvote."})
        except Exception:
            self.respond(503, {"error": "Cloud-AI er midlertidigt utilgængelig."})

if __name__ == "__main__":
    ThreadingHTTPServer(("0.0.0.0", int(os.getenv("PORT", "7860"))), Handler).serve_forever()
