# Pilot invitation UI

MechanicHome now shows a password-style invitation form **only when**
`VITE_PILOT_AI_ENABLED=true`. Successful login stores CSRF only in
memory and uses a server-set HttpOnly session cookie. No invite is saved
to browser storage. Logout revokes the server session, cancels pending
AI calls, and clears the conversation.

When disabled (default), the form is hidden and the existing
rule-based assistant remains available. When enabled but not logged in,
the same deterministic fallback remains available.

**Do not enable publicly yet.** The loopback pilot gateway still
requires login rate limiting, TLS same-origin proxy configuration,
persistent storage, and manual pilot acceptance testing. Reloading the
page requires a fresh login because CSRF is intentionally memory-only.

The image attachment is local preview only and is NOT sent to AI.
