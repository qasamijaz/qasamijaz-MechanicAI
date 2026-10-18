# Bounded model queue – Pilot 1

The local pilot gateway now admits one active model request plus up
to three waiting requests by default. Waiting is capped at eight
seconds. Excess requests receive HTTP 429 with a clear error.

Environment overrides: `PILOT_MAX_WAITERS=3` and
`PILOT_WAIT_SECONDS=8`. Set zero waiters to restore immediate
busy rejection. A request reserves its daily quota only **after**
obtaining the model slot, so rejected queued requests do not spend
request quota. Failed inference after admission still consumes quota.

The queue is process-local, not FIFO-guaranteed and not distributed.
Do not scale to multiple workers and assume shared admission control.
A single model request may still take up to 55 seconds. Real-device
p95 latency and 429 rates must be measured before pilot deployment.

The feature remains off in the public browser. No paid API is used.
