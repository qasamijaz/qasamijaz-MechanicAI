"""Same-origin invite-only pilot API. Loopback only; TLS reverse proxy required externally.

Never enable on a public interface without reviewing proxy, login throttling and deployment.
"""
import hmac
import json
import os
import threading
import urllib.error
import urllib.request
from http import cookies
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from auth_store import Sessions
from quota_store import QuotaStore

HOST = "127.0.0.1"
MODEL = os.getenv("PILOT_MODEL", "qwen2.5:3b")
ORIGIN = os.getenv("PILOT_PUBLIC_ORIGIN", "")
DATA_DIR = Path(os.getenv("PILOT_DATA_DIR", "./pilot-data"))
INVITE_HASHES = [s.strip() for s in os.getenv("PILOT_INVITE_HASHES", "").split(",") if s.strip()]
SYSTEM = ("Du er en hjælpsom dansk assistent. Du har ikke verificerede manualer. "
          "Opfind ikke momentværdier, kilder eller modelspecifikke procedurer.")
AUTH = None
QUOTAS = None
MODEL_LOCK = threading.BoundedSemaphore(1)

def configure(data_dir=None, invite_hashes=None, per_user=30, global_limit=300):
    global AUTH, QUOTAS
    folder = Path(data_dir) if data_dir else DATA_DIR
    folder.mkdir(parents=True, exist_ok=True)
    AUTH = Sessions(folder / "sessions.sqlite", INVITE_HASHES if invite_hashes is None else invite_hashes)
    QUOTAS = QuotaStore(folder / "quotas.sqlite", per_user_daily=per_user, global_daily=global_limit)

def inference(messages):
    body = json.dumps({"model": MODEL, "messages": [{"role":"system","content":SYSTEM}] + messages,
                       "stream":False,"options":{"num_predict":256}}).encode()
    req = urllib.request.Request("http://127.0.0.1:11434/api/chat", data=body,
                                 headers={"Content-Type":"application/json"},method="POST")
    with urllib.request.urlopen(req, timeout=55) as response:
        result = json.load(response)
    answer = result.get("message", {}).get("content")
    if not isinstance(answer,str) or not answer.strip():
        raise ValueError("Empty model answer")
    return answer[:4000]

class Handler(BaseHTTPRequestHandler):
    def reply(self, status, data, cookie=None):
        body=json.dumps(data,ensure_ascii=False).encode()
        self.send_response(status)
        self.send_header("Content-Type","application/json; charset=utf-8")
        self.send_header("Cache-Control","no-store")
        self.send_header("X-Content-Type-Options","nosniff")
        self.send_header("Content-Length",str(len(body)))
        if cookie:
            self.send_header("Set-Cookie",cookie)
        self.end_headers()
        self.wfile.write(body)

    def origin_ok(self):
        return bool(ORIGIN and hmac.compare_digest(self.headers.get("Origin",""),ORIGIN))

    def session_token(self):
        try:
            jar=cookies.SimpleCookie()
            jar.load(self.headers.get("Cookie",""))
            return jar["mechanicai_session"].value if "mechanicai_session" in jar else ""
        except cookies.CookieError:
            return ""

    def read_body(self):
        if self.headers.get("Content-Type","").split(";")[0].strip().lower()!="application/json":
            raise ValueError("Invalid content type")
        size=int(self.headers.get("Content-Length","0"))
        if not 2<=size<=16000:
            raise ValueError("Invalid body size")
        value=json.loads(self.rfile.read(size))
        if not isinstance(value,dict):
            raise ValueError("Invalid JSON")
        return value

    def do_GET(self):
        if self.path=="/health":
            return self.reply(200,{"status":"ok","configured":AUTH is not None and QUOTAS is not None})
        return self.reply(404,{"error":"Not found"})

    def do_POST(self):
        if self.path not in ("/v1/login","/v1/logout","/v1/chat"):
            return self.reply(404,{"error":"Not found"})
        if not self.origin_ok():
            return self.reply(403,{"error":"Origin rejected"})
        if AUTH is None or QUOTAS is None:
            return self.reply(503,{"error":"Pilot not configured"})
        try:
            data=self.read_body()
        except (ValueError,TypeError,OverflowError):
            return self.reply(400,{"error":"Invalid request"})
        if self.path=="/v1/login":
            # Loopback only. Public deployment must add IP-based login throttling.
            login=AUTH.login(data.get("invite"))
            if not login:
                return self.reply(401,{"error":"Invalid invite"})
            cookie="mechanicai_session="+login["token"]+"; HttpOnly; Secure; SameSite=Strict; Path=/v1; Max-Age=86400"
            return self.reply(200,{"csrf":login["csrf"],"expires_at":login["expires_at"]},cookie)
        token=self.session_token()
        csrf=self.headers.get("X-CSRF-Token","")
        user=AUTH.verify(token,csrf)
        if not user:
            return self.reply(401,{"error":"Session expired or CSRF invalid"})
        if self.path=="/v1/logout":
            AUTH.revoke(token)
            return self.reply(200,{"status":"signed_out"},
                              "mechanicai_session=; HttpOnly; Secure; SameSite=Strict; Path=/v1; Max-Age=0")
        messages=data.get("messages")
        if not isinstance(messages,list) or not 1<=len(messages)<=10:
            return self.reply(400,{"error":"Invalid messages"})
        if any(not isinstance(m,dict) or m.get("role") not in ("user","assistant")
               or not isinstance(m.get("content"),str) or not 1<=len(m["content"])<=1000
               for m in messages):
            return self.reply(400,{"error":"Invalid messages"})
        if messages[-1]["role"]!="user":
            return self.reply(400,{"error":"Last message must be user"})
        if not MODEL_LOCK.acquire(blocking=False):
            return self.reply(429,{"error":"Model busy"})
        try:
            try:
                allowed,_=QUOTAS.reserve(user)
            except Exception:
                return self.reply(503,{"error":"Quota database unavailable"})
            if not allowed:
                return self.reply(429,{"error":"Daily quota exhausted"})
            try:
                answer=inference(messages)
            except Exception:
                return self.reply(503,{"error":"Local model unavailable"})
            return self.reply(200,{"reply":answer})
        finally:
            MODEL_LOCK.release()

if __name__=="__main__":
    if not ORIGIN.startswith("https://") or not INVITE_HASHES:
        raise SystemExit("Set PILOT_PUBLIC_ORIGIN (HTTPS) and PILOT_INVITE_HASHES")
    configure(per_user=int(os.getenv("PILOT_USER_DAILY","30")),
              global_limit=int(os.getenv("PILOT_GLOBAL_DAILY","300")))
    ThreadingHTTPServer((HOST,int(os.getenv("PILOT_PORT","8766"))),Handler).serve_forever()
