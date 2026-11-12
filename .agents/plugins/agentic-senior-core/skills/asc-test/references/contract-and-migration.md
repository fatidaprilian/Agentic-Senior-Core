# API Contract & Database Migration Testing

Verifies producer-consumer schema compatibility across service boundaries and guarantees reversible, lock-safe database migrations.

---

## 1. API Schema & Consumer Contract Verification

Unit tests with mocked HTTP responses hide breaking API drift between producers and consumers. Verify boundary contracts directly:

### 1.1 Breaking Change Detection Rules
A schema or endpoint update breaks consumers if it introduces any of the following without versioning:
- **Request Tightening:** Adding a new required request field, narrowing an enum, or adding stricter validation to an existing field.
- **Response Weakening:** Removing or renaming a response property, changing a field's type (e.g., `number` $\to$ `string`), or returning an undocumented HTTP status code.

### 1.2 Tool-First Contract Execution
Detect installed contract/schema tools before writing manual JSON assertions:

| Contract Strategy | Detection / Command | Target Use Case |
|---|---|---|
| **OpenAPI / Schema Diff** | `ascx npx oasdiff breaking base.yaml revision.yaml` | Catch breaking REST contract regressions before merge. |
| **Consumer-Driven (Pact)** | `ascx npm test -- --grep pact` (or `pact-verifier`) | Verify consumer expectations against provider responses independently without spinning up full E2E stacks. |
| **Runtime Schema Assertion** | Validate real handler responses against Zod / JSON Schema / OpenAPI validator inside integration tests. | Ensures implementation matches published API documentation. |

---

## 2. Database Migration Round-Trip Protocol

Never sign off on schema migrations by running `migrate up` once. Every schema migration must prove clean forward execution, seed compatibility, and zero-error rollback.

### 2.1 The 5-Step Round-Trip Test (`up -> seed -> query -> down -> up`)
Run inside an isolated test database or transaction-capable container:

```
┌────────────┐    ┌────────────┐    ┌────────────┐    ┌────────────┐    ┌────────────┐
│ 1. UP      │ ─► │ 2. SEED    │ ─► │ 3. ASSERT  │ ─► │ 4. DOWN    │ ─► │ 5. RE-UP   │
└────────────┘    └────────────┘    └────────────┘    └────────────┘    └────────────┘
Apply new         Insert canary     Run critical      Execute down      Re-apply up
migration         domain rows       SELECT/JOINs      rollback cleanly  (idempotency)
```

1. **Apply (`up`)**: Verify exit code 0 with zero lock-timeout errors.
2. **Seed & Invariants**: Insert canary rows exercising new `NOT NULL`, `FOREIGN KEY`, `CHECK`, and unique constraints.
3. **Query Execution**: Verify critical application queries use expected indexes (`EXPLAIN` check on large tables).
4. **Rollback (`down`)**: Execute the down migration; assert clean removal without orphaned constraints or data-type casting failures.
5. **Re-Apply (`up`)**: Re-run `up` to verify zero leftover artifacts block re-application.

### 2.2 Zero-Downtime Expand-and-Contract Verification
When renaming or dropping columns in production systems, assert backward compatibility:
- Old application code (still running during rolling deployment) continues passing integration queries against the **Expand** migration before old columns are dropped in **Contract**.

