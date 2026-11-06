# Performance Budgets & Concurrency Benchmarking

Staff-grade guidelines for performance testing, latency budgets, and concurrency verification. Grounded in the principles of **Grafana k6**.

---

## 1. Latency Budgets & Percentiles

Averages mask performance degradation. A service with an average response time of $50\text{ms}$ can still have $10\%$ of users waiting over $1,500\text{ms}$. Performance must be budgeted and measured using **percentiles**:

| Metric | Target Standard | Operational Context |
|---|---|---|
| **Unit Logic Runtime** | $\le 5\text{ms}$ | Pure algorithms, mathematical transforms, string parsers. |
| **$p_{50}$ (Median Latency)** | $\le 50\text{ms}$ | Standard read operations with warm database index. |
| **$p_{95}$ (95th Percentile)** | $\le 150\text{ms}$ | 95 out of 100 requests must complete under this budget. |
| **$p_{99}$ (Worst-case Tail)** | $\le 300\text{ms}$ | Tail latency under concurrency and database lock contention. |
| **Error Rate Threshold** | Strictly $0.00\%$ | Zero 5xx errors or dropped socket connections under target load. |

---

## 2. Micro-Benchmark Concurrency Harness

For critical endpoints, verify concurrency resilience using a native script before handoff:

```javascript
import assert from 'node:assert/strict';

async function benchmarkEndpoint(url, concurrentRequests = 10, totalRequests = 50) {
  const durations = [];
  const runBatch = async () => {
    const start = performance.now();
    const res = await fetch(url);
    const duration = performance.now() - start;
    assert.equal(res.status, 200, `Expected 200, got ${res.status}`);
    durations.push(duration);
  };

  // Run in chunks of `concurrentRequests`
  for (let i = 0; i < totalRequests; i += concurrentRequests) {
    await Promise.all(Array.from({ length: concurrentRequests }, runBatch));
  }

  durations.sort((a, b) => a - b);
  const p50 = durations[Math.floor(durations.length * 0.50)];
  const p95 = durations[Math.floor(durations.length * 0.95)];

  console.log(`Benchmark: N=${totalRequests} | p50=${p50.toFixed(1)}ms | p95=${p95.toFixed(1)}ms`);
  assert.ok(p95 <= 150, `p95 exceeded budget: ${p95.toFixed(1)}ms > 150ms`);
}
```

---

## 3. Memory Leak & Garbage Collection Invariants

Under sustained request loops, memory footprint must reach a steady plateau rather than growing monotonically:

1. **Heap Growth Check**:
   - Record `process.memoryUsage().heapUsed` before iteration loop.
   - Run $1,000$ iterations of the business operation.
   - Trigger garbage collection (or sample at $N=1000$).
   - Assert heap growth is bounded ($\le 10\%$ increase from baseline).
2. **Common Culprits**:
   - Global event listeners (`emitter.on()`) attached inside request handlers without removal.
   - Unbounded in-memory caches or map accumulators without LRU eviction.
   - Retained references inside closures of unresolved promises.

