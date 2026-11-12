# Concurrency Idempotency, Fault Injection & Resilience Testing

Verifies that distributed mutations, outbound dependencies, and resource pools fail safely under concurrent load and partial outages.

---

## 1. Concurrency & Idempotency Verification

Every side-effecting mutation (payments, ledger transfers, webhook consumers, ticket booking) must remain consistent under duplicate delivery and parallel requests.

### 1.1 Duplicate Delivery & `Idempotency-Key` Replay Test
```javascript
import assert from 'node:assert/strict';

const key = `idem-canary-${Date.now()}`;
const headers = { 'Content-Type': 'application/json', 'Idempotency-Key': key };
const body = JSON.stringify({ orderId: 'ord_canary_1', amountCents: 2500 });

// Fire two simultaneous requests with the identical Idempotency-Key
const [r1, r2] = await Promise.all([
  fetch('http://localhost:3000/api/v1/charges', { method: 'POST', headers, body }),
  fetch('http://localhost:3000/api/v1/charges', { method: 'POST', headers, body }),
]);

assert.equal(r1.status, 201);
assert.ok(r2.status === 200 || r2.status === 201);
assert.equal(await getChargeCountForOrder('ord_canary_1'), 1, 'Side effect executed more than once');
```

### 1.2 Webhook Out-of-Order & Replay Assertions
- Send webhook event `v2` before `v1` (out-of-order delivery) and assert monotonic version/timestamp guards reject stale state overwrites.
- Replay an identical signed webhook payload twice and assert once-only processing.

---

## 2. Fault Injection & Degraded-Mode Testing

Verify that failure handling in production code behaves as designed when external dependencies degrade (RFC 9457 for hard dependencies; graceful fallback for soft dependencies).

| Fault Scenario | Simulation Method | Required Observable Outcome |
|---|---|---|
| **Downstream Timeout** | Stub/proxy delays response $> \text{client timeout} + 50\text{ms}$. | Request aborts within configured timeout; pool slots freed; returns `504` or soft fallback without hanging event loop. |
| **Upstream 5xx Spike** | Mock external HTTP boundary returning HTTP `503` repeatedly. | Retries execute with bounded attempts (no infinite retry storm); circuit breaker opens after threshold and skips redundant calls. |
| **Dropped Connection / Partial JSON** | Destroy socket mid-response or return truncated JSON. | Catch parser/network error cleanly; return structured RFC 9457 error with zero leaked stack traces. |
| **Soft-Dependency Failure** | Disable recommendation/analytics/cache store during integration test. | Primary user journey (checkout, auth, read) still returns `200 OK` with degraded/static safe default. |

---

## 3. Connection Pool Exhaustion & Resource Leak Checks

Under sustained concurrent failure paths, database connections, file descriptors, and locks must always be released:

1. **Error-Path Release Test**: Force a domain validation or DB constraint error mid-transaction across $N = 2 \times \text{poolMax}$ sequential/concurrent requests.
2. **Pool Health Assertion**: Confirm the connection pool never deadlocks or throws `TimeoutError: acquiring connection`, proving `try/finally` rollback/release runs on every failure branch.

