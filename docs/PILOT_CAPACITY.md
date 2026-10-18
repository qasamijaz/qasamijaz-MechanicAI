# Pilot concurrency and capacity gate

The pilot currently uses a single nonblocking model semaphore.
Requests that arrive while the slot is occupied receive HTTP 429.
This is deliberate fail-fast protection against uncontrolled model
work, but it is **not** acceptable workshop UX under simultaneous
usage without queueing, retry hints and capacity measurement.

Run a free deterministic contention simulation:

```sh
python pilot/load_simulation.py --clients 10 --seconds 0.1 --slots 1
```

This measures simulated acceptance and busy rejection behavior only.
It is **not** a benchmark of actual inference, hardware, memory,
latency, concurrent sessions, or cost. Compare against real local
Ollama benchmark results before selecting a deployment machine.

Pilot acceptance criteria to validate on hardware:
- record cold/warm response times and p50/p95 for a representative set
- check 1, 2, 5 and 10 concurrent clients
- record busy/429 rate and any retry strategy
- measure CPU/RAM and fixed hosting charges
- ensure request quota and infrastructure cost controls stay active

No paid API, external endpoint, or production deployment is used.
