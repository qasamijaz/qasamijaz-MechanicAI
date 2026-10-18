# Pilot 1 – local model gateway

This is a **local-only**, explicitly opt-in proof of concept. It does not deploy, start, or pay for a model.

Requirements: Python 3.10+, Ollama installed separately, and a **locally downloaded** model compatible with `PILOT_MODEL`.

Example (local testing only):

```sh
ollama pull qwen2.5:3b
export MECHANICAI_PILOT_KEY="replace-with-a-strong-random-secret-at-least-24-chars"
export MECHANICAI_PILOT_ORIGIN="https://your-approved-test-origin.example"
export PILOT_MODEL="qwen2.5:3b"
python pilot/server.py
```

The gateway binds to 127.0.0.1:8765, only forwards to 127.0.0.1:11434 (Ollama), and has no paid-provider fallback. It requires origin and key headers plus a session identifier. Its per-session quotas are process-local; clients can spoof session identifiers, so **do not publish it on the internet**. The static browser must never embed the pilot secret. To run remote trials, implement real identity, persistent/global quotas, secure reverse proxy, secrets management, and measured hosting costs first.

Run unit tests without downloading a model: `cd pilot && python -m unittest test_budget test_server`.

Security limitations: process-local counters reset on restart, no global billing cap, no user database, no rate limit per IP, and no TLS on loopback. Model output is not verified technical documentation.
