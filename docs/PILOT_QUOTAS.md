# Pilot quotas: SQLite single-host foundation

`pilot/quota_store.py` adds a transactional SQLite request quota shared across threads and processes on **one host with persistent storage**.

- Counts by trusted server-side user ID, never a client-provided session string.
- Separate per-user and global UTC-day ceilings.
- Atomic reservations using BEGIN IMMEDIATE; reservations are counted even if inference fails (fail-closed).
- Limits are request counts, **not a DKK spending ceiling**.
- No model hosting, provider call, authentication, or deployment is enabled by this module.
- The local `pilot/server.py` is **not yet integrated** with this store and remains developer-only. Public use requires an authenticated same-origin gateway and verified user identity.
- SQLite on ephemeral containers resets on restart. For production, use persistent storage and a reviewed backup/retention policy.
- No guarantee of distributed consistency across hosts. Do not deploy multiple replicas against independent SQLite databases.
- Set a hard infrastructure spend limit independently before enabling any paid resources.

Run: `cd pilot && python -m unittest test_budget test_server test_quota_store`
