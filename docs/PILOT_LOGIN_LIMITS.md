# Login attempt limits – pilot

The loopback same-origin gateway now uses a SQLite-backed, atomic
**global login-attempt ceiling**. Default: 12 login attempts per
15-minute UTC-aligned window. Every attempt consumes quota, including
invalid invitations. The counter survives process restarts on a
persistent volume and fails closed on database errors.

This is deliberately a simple single-host pilot safeguard, not a
public-grade brute-force solution. A single actor can exhaust the
global bucket and block legitimate testers. Before public launch,
add trusted-proxy client identification, per-source throttling, edge
rate limits, operational monitoring, and appropriate availability
tests. Never trust arbitrary X-Forwarded-For headers directly.

No model deployment, public network binding, or paid inference.
