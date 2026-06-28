# Audit Skill

Security and architecture audit. Deeper than review, focused on finding vulnerabilities and structural anti-patterns.

## Audit Scope

1. **Trust boundaries**: Every point where external input enters the system. Validate that inputs are sanitized, normalized, and rejected when invalid.
2. **Authentication and authorization**: Verify auth checks exist on every endpoint. Check for resource-level authorization, not just identity.
3. **Data handling**: Secrets in code or logs, PII exposure, unsafe deserialization, SQL injection, command injection.
4. **Architecture boundaries**: Business logic in transport layer, shared databases between services, circular dependencies, internal model leakage through public APIs.
5. **Dependency health**: Known vulnerabilities, unmaintained packages, excessive dependency surface.
6. **Error exposure**: Stack traces, internal paths, or implementation details exposed to clients.

## For Every Finding

```
Severity: critical | high | medium | low
Class: vulnerability class (e.g., SQL Injection, Broken Access Control)
Location: file:line
Impact: who or what is affected
Evidence: exact code, behavior, or command output
Remediation: specific fix direction
Validation: how to prove it is fixed
```

## Output

Findings ordered by severity. If no findings, state that explicitly and describe audit coverage.
