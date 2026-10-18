# Pilot 1 end-to-end HTTP contract test

`pilot/test_pilot_e2e.py` starts the real loopback HTTP handler and
exercises invite login, cookie issuance, CSRF and origin rejection,
model reply delivery, SQLite quota persistence after gateway
reconfiguration, quota exhaustion, logout, invalid messages, and
model-unavailable errors.

Only `inference()` is mocked. No paid service, network deployment,
Ollama download, or production data is used.

GitHub Actions runs the suite through Python unittest discovery.

**What it does not prove:** browser/Safari compatibility, HTTPS
reverse-proxy behavior, actual Ollama latency/quality, memory/CPU
requirements, persistent volume deployment, or currency spending caps.
These need separate manual or infrastructure-specific acceptance tests.
