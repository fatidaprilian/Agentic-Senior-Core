# Contract Boundaries, Type Rigor & Error Integrity

Universal rules for protecting module boundaries, preventing data over-posting (MITRE CWE-915), eliminating swallowed failures (MITRE CWE-390), and writing human-by-design operational errors.

---

## 1. Boundary Isolation & DTO Separation (CWE-915)

Never bind untrusted external payloads directly to persistence entities or expose raw database models in public responses:

- **Explicit Request & Response DTOs:** Separate incoming command/query schemas from internal ORM/database models and outgoing response projections.
- **Strict Allowlists:** Validate and map only explicitly permitted fields at the transport boundary. Reject unknown or protected fields (`isAdmin`, `role`, `tenantId`, `balance`, `createdAt`) before domain execution to eliminate mass-assignment vulnerabilities.
- **Zero Type Escape Hatches:** Ban unchecked type casts and dynamic bypasses (`any`, `as unknown as`, `dynamic`, unvalidated dictionary indexing) at trust boundaries. Parse external JSON, query parameters, and environment configs through typed schema validators that fail fast at entry.

---

## 2. Error Integrity & Root-Cause Preservation (CWE-390)

Failures must never be disguised as healthy states:

1. **Ban Empty Catch Blocks:** Every caught exception must either trigger a documented fallback strategy, log structured error context and recover cleanly, or re-throw.
2. **Ban Failure Masking:** Never catch an exception only to return `null`, an empty list `[]`, `false`, or HTTP `200 OK` unless the function explicitly models an optional soft dependency with degraded-mode telemetry.
3. **Preserve Error Cause Chains:** When catching and throwing a domain-level error, attach the original underlying error (`cause` / `InnerException` / `from err`) so operational root causes are never truncated in logs.
4. **Structured Context & Correlation:** Emit key-value logs containing `correlationId`/`requestId`, operation name, and safe domain identifiers—never raw credentials, auth headers, or PII.

---

## 3. Human-by-Design Error Messages (Microsoft & Google Style Guides)

Operational error messages returned to users must follow active plain language rather than machine diagnostics:

| Requirement | Anti-Pattern | Human-by-Design Standard |
|---|---|---|
| **Three-Part Structure** | `"Error 500: Invalid operation."` | State (1) what failed, (2) the operational effect, and (3) the next concrete action (`"Could not save the work order because the unit ID was not found. Verify the serial number and try again."`). |
| **Zero Stack Trace Leaks** | `"NullReferenceException at Service.cs:142"` | Keep internal stack traces, SQL errors, and file paths strictly inside server logs; return safe structured problem details (RFC 9457) externally. |
| **Objective, Non-Blaming Tone** | `"You entered bad input! Sorry!!"` | State system requirements objectively without blaming the user, and omit hollow apologies for third-party or network connectivity outages. |
| **No Alarmist Titles** | `"FATAL SYSTEM ERROR"` | Lead directly with the specific resource or constraint that blocked completion. |
