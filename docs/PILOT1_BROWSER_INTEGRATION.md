# Browser integration – Pilot 1

The conversation UI is wired to the pilot adapter **behind a default-off feature flag**.
Without the flag, existing deterministic conversation behavior is unchanged.

When VITE_PILOT_AI_ENABLED=true, the UI posts the last ten messages to the **same-origin** /v1/chat route with browser-managed cookies. No API key is embedded in JavaScript. The server must implement authenticated sessions, CSRF protection, persistent global and per-user quotas, and a measured hard cost ceiling before this flag can be enabled publicly.

The existing pilot/server.py is a **localhost-only developer gateway** requiring a pilot key and session header. It does NOT implement the browser's cookie-authenticated contract. Do not expose it or enable the feature flag yet.

The UI displays pending state, blocks duplicate send, cancels pending requests on new task/unmount, and falls back to the deterministic response on server failure. This fallback is not verified technical guidance.

Next: implement authenticated same-origin API, end-to-end browser tests, and deployment security review.
