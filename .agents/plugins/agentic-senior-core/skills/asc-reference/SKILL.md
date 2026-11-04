---
name: asc-reference
description: >
  Trigger this skill when working on: REST APIs, GraphQL APIs, SQL queries, database indexing, transactions, migrations, Docker configs, CI/CD pipelines, Kubernetes manifests, or service resilience. Also trigger when the user says: "design this API", "optimize query", "database transaction", "set up Docker", "add retry logic", "add pagination", "handle errors", "set up CI", "kok lambat banget", "cara deploy ini". Also trigger when editing files matching: `Dockerfile`, `docker-compose.*`, `.github/workflows/*`, `*.sql`, or migration files.
---

# Domain Engineering Reference Router

Staff-grade architectural standards for APIs, databases, infrastructure, and distributed resilience. Enforces baseline invariants and routes deep domain guidance on demand.

---

## 1. The Core Engineering Floor

Every backend and infrastructure change must satisfy these baseline invariants:

1. **RFC 9457 Problem Details:** All API error responses must return structured JSON problem details with actionable error types and HTTP status codes.
2. **Bounded Reads:** Every list query or API endpoint must enforce pagination or explicit limits. Unbounded scans are forbidden.
3. **Idempotent Mutations:** Side-effect mutations must accept an `Idempotency-Key` header and return cached responses on repeat requests.
4. **ACID Transactions:** Any multi-table mutation or read-then-write sequence must run inside an explicit database transaction.
5. **No N+1 Queries:** Database queries inside loops are forbidden; use eager loading, joins, or batching (DataLoader).
6. **Precision Data Types:** Monetary amounts must use integer minor units (cents) or `NUMERIC(18, 4)`. Floating point (`FLOAT`/`DOUBLE`) for currency is banned.
7. **UTC Timestamps:** All dates and times must be stored in UTC (`TIMESTAMPTZ` or ISO-8601 strings).
8. **Reversible Migrations:** Schema changes require reversible migrations using Expand-and-Contract for zero-downtime evolution.
9. **Container Security:** Multi-stage Docker builds, non-root users (`USER node`/`USER 10001`), and zero baked credentials.
10. **Zero-Hang Timeouts:** Every outbound network call must specify explicit connection and read timeouts.
11. **Jittered Backoff:** Retries must use exponential backoff with full jitter and limit attempts to safe idempotent methods.

---

## 2. On-Demand Reference Library

Load these references only when working on that specific domain:

| Domain | Scope & Substance | Reference Path |
|---|---|---|
| **API Design** | REST semantics, cursor pagination, RFC 9457, GraphQL DataLoader, query complexity | [references/api.md](references/api.md) |
| **Database** | B-Tree indexing, N+1 prevention, row locking (`FOR UPDATE`), expand-and-contract | [references/database.md](references/database.md) |
| **Infrastructure** | Multi-stage Docker, non-root users, 12-factor env validation, liveness/readiness | [references/infrastructure.md](references/infrastructure.md) |
| **Resilience** | Timeouts, full jitter backoff, circuit breakers, hard vs soft dependency fallbacks | [references/resilience.md](references/resilience.md) |

---

## 3. Dependency Classification: Hard vs. Soft

Before writing integration code, classify external services:
- **Hard Dependency (Core Workflow):** Fail fast, roll back local database transactions, and return an RFC 9457 error to the caller.
- **Soft Dependency (Auxiliary/Enhancement):** Provide graceful fallback:
  1. *Stale Cache:* Return last-known-good cached state (`stale-while-revalidate`).
  2. *Static Safe Default:* Return empty collections or static safe placeholders.
  3. *Degraded Mode:* Isolate and disable the peripheral widget without breaking primary journeys.

---

## 4. Verification & Handoff Sweep

Before completing backend or infrastructure work:
1. Verify query execution plan (`EXPLAIN ANALYZE`) for newly introduced SQL queries.
2. Verify all outbound network calls have timeout parameters.
3. Validate startup configuration fails fast on missing environment variables.
4. Confirm migrations run cleanly in both `up` and `down` directions.
