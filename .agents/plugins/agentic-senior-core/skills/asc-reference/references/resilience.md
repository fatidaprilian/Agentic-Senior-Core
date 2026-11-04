# Service Resilience: Timeouts, Backoff & Circuit Breakers

Distributed systems fail continuously. Resilience engineering ensures failures in one dependency do not cause cascading outages across the entire application ecosystem.

---

## 1. Network Timeouts: The Zero-Hang Rule

Every outbound network call (HTTP, RPC, database, cache) must specify an explicit timeout. A network call without a timeout will eventually hang indefinitely under socket partition, exhausting application worker threads.

- **Connection Timeout:** Time allowed to establish the TCP connection (e.g., 2,000ms).
- **Read Timeout:** Time allowed for the remote service to return the response body (e.g., 5,000ms).
- **Total Request Timeout:** Upper bound on the entire lifecycle (e.g., 8,000ms).

```typescript
// Enforced: Explicit timeout with AbortSignal
const controller = new AbortController();
const timeoutId = setTimeout(() => controller.abort(), 5000);

try {
  const response = await fetch('https://api.external.com/v1/rates', {
    signal: controller.signal,
  });
  return await response.json();
} finally {
  clearTimeout(timeoutId);
}
```

---

## 2. Exponential Backoff with Full Jitter

When a network operation fails transiently, retrying immediately floods the struggling service (the "thundering herd" problem).

### 2.1 The Full Jitter Formula
$$T = \text{random}(0, \min(T_{\max}, T_{\text{base}} \times 2^{\text{attempt}}))$$

```typescript
function calculateJitteredBackoff(attempt: number, baseMs = 100, maxMs = 5000): number {
  const exponential = Math.min(maxMs, baseMs * Math.pow(2, attempt));
  return Math.floor(Math.random() * exponential);
}
```

### 2.2 Retry Conditions
- **Only retry idempotent operations:** Safe to retry `GET`, `PUT`, `DELETE`, or requests carrying a verified `Idempotency-Key`.
- **Never retry non-idempotent `POST` requests without idempotency keys:** Retrying a non-idempotent payment charge will charge the customer twice.
- **Retry transient status codes only:** Retry `503 Service Unavailable`, `504 Gateway Timeout`, or network connection reset (`ECONNRESET`). Never retry client validation errors (`400`, `401`, `403`, `422`).

---

## 3. Circuit Breaker State Machine

Prevent a failing downstream dependency from bringing down upstream services by short-circuiting calls when the failure rate exceeds a threshold:

```
          ┌────────────────────────────────────────┐
          │                                        │
          ▼                                        │
    ┌───────────┐      Failure threshold reached   │ Probe succeeds
    │  CLOSED   │ ───────────────────────────────► │
    └───────────┘                                  │
          ▲                                        ▼
          │         Cooldown timer elapsed   ┌───────────┐
          │       ┌───────────────────────── │   OPEN    │
          │       ▼                          └───────────┘
    ┌───────────┐
    │ HALF-OPEN │ ───────────────────────────────► Trip on probe failure
    └───────────┘
```

1. **Closed (Normal):** Requests pass through. Metrics track consecutive failures.
2. **Open (Tripped):** When error rate exceeds threshold (e.g. 5 failures within 10s), the circuit trips. All calls fail fast immediately without making network calls.
3. **Half-Open (Trial):** After a cooldown period (e.g. 30s), a limited number of probe requests are allowed through. If successful, the circuit resets to Closed; if failing, it trips back to Open.

---

## 4. Hard vs. Soft Dependency Classification

Classify external dependencies into two categories before writing fallback code:

| Category | Definition | Operational Response |
|---|---|---|
| **Hard Dependency** | Core system cannot complete the transaction without it (e.g., Primary database for auth). | Fail fast, roll back local transactions, return structured RFC 9457 error with actionable explanation. |
| **Soft Dependency** | Secondary feature that enriches experience but is not critical to the core transaction (e.g., Recommendations, avatar image fetch). | Fall back to static safe defaults, stale cache (`stale-while-revalidate`), or degraded mode with zero disruption to the primary journey. |

