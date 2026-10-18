# Pilot 1: integrated same-origin HTTP gateway

The new `pilot/web_server.py` connects invite sessions, CSRF checks, SQLite
quotas, and localhost Ollama inference. It binds **127.0.0.1** only.

Routes:
- `POST /v1/login` with `{"invite":"..."}` returns CSRF and sets
  `Secure; HttpOnly; SameSite=Strict` session cookie.
- `POST /v1/chat` requires session cookie, `X-CSRF-Token`, matching
  `Origin`, and validated messages. Reserves per-user/global quota before inference.
- `POST /v1/logout` revokes session and clears cookie.
- `GET /health` exposes no secrets.

Browser adapter `pilot.js` now supports `pilotLogin`, `pilotLogout`
and `generatePilotReply`. The UI still needs an invitation form to call login;
the feature flag remains **OFF**. No secrets in browser build.

**Security gate:** This is a development gateway, not production-ready.
Login lacks brute-force throttling, and a trusted TLS reverse proxy,
durable persistent volume, tested session restoration, and full
end-to-end browser flow are still required. A request quota is not a
currency budget. Never publicly expose this loopback service without
review. Never deploy or activate paid inference automatically.

Run tests via GitHub Actions or:
`python -m unittest discover -s pilot -p 'test_*.py' -v`
