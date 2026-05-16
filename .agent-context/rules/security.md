---
id_prefix: SEC
domain: security
priority: critical
scope: all-tasks
applies_to:
  - backend
  - frontend
  - fullstack
keywords:
  - security
  - sec
  - boundary
  - hard
  - rules
  - zero-trust
---

# Security Boundary

Use the security model and libraries already present in the project. If security tooling is unresolved, the LLM must recommend current, maintained options from official docs and OWASP-aligned guidance before implementation.

## SEC-001: Hard rules

1. validate and normalize all data crossing a trust boundary
2. never interpolate untrusted input into queries, shell commands, file paths, templates, logs, or HTML
3. never commit secrets, tokens, credentials, private keys, or production identifiers
4. never invent custom crypto, session, token, or password handling when maintained standards exist
5. enforce authorization at the server or trusted boundary, not only in UI state
6. return safe client-facing errors and keep sensitive detail in protected logs
7. document auth, permission, data exposure, rate-limit, and abuse assumptions before changing sensitive flows
8. apply least privilege to service accounts, API tokens, database users, background jobs, and operator/admin actions
9. retrieve secrets through environment, runtime secret injection, or the project's secret manager; do not store static secrets in source or plaintext config
10. keep `.env` and local secret files covered by `.gitignore`; commit only safe examples such as `.env.example`
11. treat transport encryption, secure cookies, and trusted proxy boundaries as deployment assumptions that must be documented when sensitive traffic is involved
12. when a public surface exists, record explicit decisions for: CORS allow-list (not `*` for credentialed requests), security headers (CSP, HSTS, `X-Content-Type-Options`, `Referrer-Policy`, `Permissions-Policy`), JWT pitfalls (algorithm pinning, expiration, refresh rotation, storage location), webhook signature verification with timing-safe compare, SSRF defense (egress allow-list or URL validation) when the server fetches user-supplied URLs, and per-resource authorization (not role-only) when records have owners

## SEC-002: Zero-trust API input rules

1. Treat body, query, params, headers, cookies, uploaded files, webhook payloads, and background job payloads as untrusted until validated.
2. Validate and normalize input at the outer boundary before it reaches service, use-case, repository, or domain logic.
3. Services should receive typed, already-validated values and still enforce domain invariants for security-sensitive rules.
4. Sanitization must match the sink: SQL, shell, file path, log, HTML, template, and URL contexts need different protections.
5. Authorization must be resource-aware when data ownership matters. Prefer row, tenant, account, organization, or resource-level checks over role-only checks for sensitive records.
6. For high-risk changes, check current framework security docs and record the relevant source or assumption in the implementation notes.
