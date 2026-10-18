#!/bin/sh
set -eu
if [ -z "${MECHANICAI_POC_INVITE:-}" ]; then
  echo "POC invitation not configured; refusing to start" >&2
  exit 1
fi
export MECHANICAI_AUTH_HASH="$(caddy hash-password --plaintext "$MECHANICAI_POC_INVITE")"
PORT=8767 python -u /app/server.py &
exec caddy run --config /app/Caddyfile --adapter caddyfile
