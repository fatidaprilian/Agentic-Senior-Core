---
name: asc-audit
description: >
  Trigger this skill when the user says: "audit this", "security check", "find vulnerabilities", "is this secure", "check for XSS", "check for SQL injection", "threat model", "penetration test", "OWASP check", "architecture review", "is this safe", "check auth", "check permissions", "find security holes". Also trigger for any deep security audit, vulnerability scanning, or request to find structural anti-patterns in existing code. Also trigger when reviewing authentication, authorization, input validation, or encryption-related code.
---

# Audit Skill

Security and architecture audit. Deeper than review, focused on finding vulnerabilities and structural anti-patterns.

Grounded in: OWASP Top 10 (2021), OWASP ASVS v4, CVSS vulnerability report structure, CWE classification.

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
