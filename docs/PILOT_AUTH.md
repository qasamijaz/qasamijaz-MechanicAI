# Invite-only pilot session foundation

This module provides server-side persistent session tokens for an invite-only pilot.
The browser should receive an HttpOnly, Secure, SameSite=Strict session cookie and
a separate CSRF token after a successful invite exchange over HTTPS.

The invite code itself must not be embedded in JavaScript, source control, or
public links. Store only SHA-256 invite digests in server configuration.
Use a different high-entropy invite per tester; the digest is a pseudonymous
identity used for persistent per-user quotas.

`pilot/auth_store.py` and `pilot/quota_store.py` are independent tested
building blocks. **They are not yet connected to an HTTP login/chat route.**
The existing `pilot/server.py` remains localhost-only and requires a separate
developer key. The browser flag must remain OFF.

Before external access: implement and test login/logout, cookie and CSRF
handling, trusted proxy origin checks, brute-force protections, SQLite
persistent volume, quota reservation before inference, and a global
infrastructure cost cap. Explicitly validate failed/expired sessions.

No paid inference or public deployment is authorized.
