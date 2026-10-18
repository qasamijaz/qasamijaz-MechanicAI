#!/bin/sh
set -eu
echo "MECHANICAI_MODEL_SETUP_START"
ollama serve &
pid=$!
trap 'kill "$pid" 2>/dev/null || true' INT TERM
i=0
until ollama list >/dev/null 2>&1; do
  i=$((i+1))
  if [ "$i" -ge 60 ]; then
    echo "MECHANICAI_OLLAMA_START_TIMEOUT"
    exit 1
  fi
  sleep 1
done
if ollama show qwen2.5:0.5b >/dev/null 2>&1; then
  echo "MECHANICAI_MODEL_ALREADY_PRESENT"
else
  echo "MECHANICAI_MODEL_DOWNLOAD_START"
  ollama pull qwen2.5:0.5b
fi
echo "MECHANICAI_MODEL_READY"
wait "$pid"
