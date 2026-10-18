# Pilot 1: low-cost AI foundation (isolated)

Status: foundation only. No model is deployed, no paid inference enabled, no app integration enabled.

## Decisions
- Keep existing mobile web UI, browser speech recognition and synthesis, PDF and 3D demo.
- Do not route any pilot request to Hugging Face paid inference automatically.
- Model-independent `generatePilotReply` transport is opt-in via `VITE_PILOT_AI_ENABLED=true` and HTTPS `VITE_PILOT_AI_URL`. Do not set these until a reviewed authenticated backend exists.
- `pilot/budget.py` is a fail-closed single-process accounting primitive; it is not a production quota service. Never expose a public inference endpoint with client-provided session IDs as the only authentication.
- Future backend must enforce authenticated identity, global spend ceiling, per-user quotas, concurrency, request timeouts, token caps, and non-retention defaults.
- Pilot target is <= DKK 500/month, NOT a verified price or deployment budget. Measure idle costs, requests, latency and concurrency before launch.

## Acceptance gates before enabling inference
1. Verify self-hosted model license and Danish conversational quality.
2. Add server-side authenticated `/v1/chat` endpoint, with persistent per-user/global quotas and no paid fallback.
3. Wire pilot adapter into conversation UI behind explicit feature flag; preserve deterministic fallback.
4. Verify manual evidence and safety gates remain separate from model prose.
5. Run tests, measure CPU/GPU usage, and obtain explicit approval for hosting expense.
6. No merge, deploy, or billing enablement without approval.

## Local test
`cd pilot && python -m unittest test_budget.py`
