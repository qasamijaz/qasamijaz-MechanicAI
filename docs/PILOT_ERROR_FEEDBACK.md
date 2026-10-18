# Pilot failure feedback

The browser pilot now distinguishes expired login (401), capacity or
quota limits (429), and unavailable local inference (503). The UI
continues to show deterministic guidance rather than pretending the
AI model answered. Session expiry returns the invitation form.

Logout clears the browser-side CSRF immediately before attempting
the network request, avoiding accidental further AI calls while the
logout request is in flight. The server's HttpOnly cookie is cleared
when logout succeeds. If logout fails, the server session may remain
valid until expiry; this limitation must be reviewed before rollout.

Never display raw server error strings to end users. The pilot remains
disabled in the public build by default.
