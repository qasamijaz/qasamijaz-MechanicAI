# Concurrent HTTP queue verification

`pilot/test_concurrent_http.py` exercises the real
`ThreadingHTTPServer` handler with a mocked local inference call.

The tests cover:
- one model request occupying the only inference slot
- another request timing out while waiting (HTTP 429)
- a third request rejected when the waiting queue is full
- no quota charged for rejected/expired waiting requests
- slot release after the first request completes
- subsequent successful model inference

Tests use synchronization events rather than paid services.
This is a concurrency regression gate, **not** a hardware capacity
benchmark. Real p95 latency, queue fairness and model quality remain
unmeasured.
