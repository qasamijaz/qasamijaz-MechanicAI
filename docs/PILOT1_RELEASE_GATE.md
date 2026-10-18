# Pilot 1 release gate

The pull request must remain draft until both GitHub Actions jobs pass:

1. `test-and-build`: existing frontend tests and production build.
2. `pilot-python-tests`: Python budget, gateway, and SQLite quota tests.

All tests run without model downloads or paid API credentials.

**Current deployment gate:** local Ollama gateway and browser adapter use intentionally different authentication contracts. Do not enable `VITE_PILOT_AI_ENABLED` on a public deployment. A trusted same-origin session-authenticated API with CSRF defense and durable quota integration must be implemented and tested first.

The SQLite quota is a request-count limit, not a monetary cap. A DKK 500/month goal requires measured hosting and a separate infrastructure budget control.

No automatic deployment, merge or payment activation is authorized by this PR.
