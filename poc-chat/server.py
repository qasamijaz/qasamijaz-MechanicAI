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
          "Du er en voice-first guide: skriv korte, naturlige sætninger, som kan læses højt. "
          "Stil først ét nødvendigt afklarende spørgsmål. Giv derefter højst ét konkret arbejdstrin per svar og vent på brugerens bekræftelse eller kommandoen næste. "
          "Giv aldrig en hel nummereret procedure på én gang. Ved gentag gentager du kun det aktuelle trin. Ved stop stopper du vejledningen. "
          "Skeln mellem verificeret dokumentation og generel viden. "
          "Du har ingen verificerede manualer eller billeder i denne POC. "
          "Opfind aldrig modelspecifikke placeringer, reservedelsnumre, momentværdier, kilder eller sikkerhedsgodkendelser. "
          "Ved risikable opgaver skal du give klare sikkerhedsforbehold. "
          "Anbefal aldrig drikkevarebeholdere til spildolie; brug egnet lukket beholder og korrekt aflevering. "
          "Ingen billed-, 3D- eller manualadgang er tilsluttet, og du må ikke påstå at kunne se en komponent. "
          "Hvis brugeren ikke kan finde en komponent, eller gentager nej, skal du stoppe op og bede om verificeret dokumentation i stedet for at gætte videre. "
          "Foreslå ikke at løsne bolte eller afmontere dæksler for at lede efter en uidentificeret komponent.")
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

def task_context(raw):
    if not isinstance(raw, dict):
        return ''
    step = raw.get('step', 0)
    if type(step) is not int or not 0 <= step <= 99:
        step = 0
    def clean(value, limit):
        return value[:limit] if isinstance(value, str) else ''
    completed = raw.get('completed', [])
    if not isinstance(completed, list):
        completed = []
    completed = [clean(x, 180) for x in completed[-6:] if isinstance(x, str)]
    state = {'step': step, 'paused': raw.get('paused') is True, 'current': clean(raw.get('current'), 500), 'issue': clean(raw.get('issue'), 180), 'completed': completed}
    return 'Klientens foreløbige opgavestatus (brugerinput, ikke verificerede fakta): ' + json.dumps(state, ensure_ascii=False) + '. Brug denne kun som kontekst. Bekræft usikre trin og undgå at antage, at handlinger er sikkert udført.'

def safe_part_response(messages):
    """Guardrail for unverified mechanical component identification.

    A short deterministic response avoids model guesses when the user
    cannot identify a part and no verified visual evidence is present.
    """
    user_texts = [m["content"].lower().strip() for m in messages if m["role"] == "user"]
    if not user_texts:
        return None
    joined = " ".join(user_texts)
    mechanical = any(x in joined for x in ("bundprop", "olieprop", "aftapningsprop", "drain plug"))
    if not mechanical:
        return None
    last = user_texts[-1]
    cant_find = (last in ("nej", "nej.", "no", "nope", "kan ikke finde den", "jeg kan ikke finde den")
                 or any(x in last for x in ("hvilken bolt", "er det den", "kan ikke se", "kan ikke finde", "kan ikk finde", "fjerne dæksel", "tage dæksel af")))
    # Do not interrupt the initial question; use the safety gate when
    # the conversation has reached uncertain physical identification.
    already_guided = len(user_texts) >= 3
    if cant_find and (already_guided or "hvilken bolt" in last or "er det den" in last):
        return ("Stop her – løsne eller fjern ikke bolte eller dæksler på et gæt. "
                "Jeg kan ikke identificere bundproppen uden et verificeret diagram eller et billede, "
                "der kan sammenholdes med dokumentation for den præcise model og årgang. "
                "Kan du finde modelvarianten eller en officiel tegning fra manualen? "
                "Ellers bør en fagperson identificere den, før du fortsætter.")
    return None

def generate(messages, context=''):
    payload = json.dumps({"model": MODEL,
        "messages": [{"role": "system", "content": SYSTEM + (" " + context if context else "")}] + messages,
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
            body = json.loads(self.rfile.read(length))
            messages = validate_messages(body.get("messages"))
            context = task_context(body.get("task"))
        except (ValueError, TypeError, AttributeError, json.JSONDecodeError):
            return self.respond(400, {"error": "Ugyldig samtale."})
        safe_reply = safe_part_response(messages)
        if safe_reply:
            return self.respond(200, {"reply": safe_reply, "safety_stop": True})
        if not reserve():
            return self.respond(429, {"error": "POC-kvoten er brugt."})
        try:
            return self.respond(200, {"reply": generate(messages, context)})
        except (urllib.error.URLError, TimeoutError, ValueError, KeyError):
            return self.respond(502, {"error": "AI kunne ikke svare lige nu."})

if __name__ == "__main__":
    print("MechanicAI POC listening on configured PORT", flush=True)
    ThreadingHTTPServer(("0.0.0.0", int(os.environ.get("PORT", "8766"))), Handler).serve_forever()
