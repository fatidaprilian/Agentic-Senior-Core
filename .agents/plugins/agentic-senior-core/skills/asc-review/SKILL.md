---
name: asc-review
description: >
  Trigger this skill when the user is: reviewing pull requests, checking recent changes, auditing security, scanning for vulnerabilities, threat modeling, or detecting duplicate code. Trigger when the user says: "review this code", "check this PR", "what's wrong with this", "look at my changes", "is this production-ready", "find bugs", "audit this", "security check", "find vulnerabilities", "check for XSS", "check for SQL injection", "OWASP check", "check auth", "find duplicate code", "check for clones", "audit for duplication", "review PR ini", "cek kodingan saya", "cari celah keamanan", "cari kode duplikat". Covers Code Review, Security Audit, and Duplicate Detection.
---

# Quality & Security Assurance Playbook (`asc-review`)

Unified assurance playbook for rigorous code review, deep vulnerability audits, and structural duplication detection. Operates with an adversarial, zero-trust posture: prioritizing production risks, data security, and maintainability over superficial compliments.

Grounded in: OWASP Top 10 (2025), OWASP ASVS v5.0, OWASP Agentic Applications (ASI01-ASI10), Google Engineering Practices, and Fowler's Rule of Three.

---

## Mode 1: Production Code Review

Use when reviewing PRs, diffs, commits, or newly written feature code.

### Review Procedure
1. **Scope Inspection**: Run `git diff --stat` (or `git status`) to inspect modified files and line deltas.
2. **Test-Change Correlation**: For every modified application logic file, verify that a corresponding test was updated. If logic changed without tests, report as a missing test finding.
3. **Deterministic Verification**: Run project linter and test suite (`ascx test` / `npm test`).
4. **Severity Priority Order**:
   - **Severity 1 (Critical)**: Correctness, data corruption, auth/permission bypass, security sinks, PII leakage.
   - **Severity 2 (High)**: Action feedback failures (hanging spinners, unhandled mutations, missing error boundaries), unhandled async rejections, missing remote timeouts.
   - **Severity 3 (Medium)**: Public contract drift, missing failure-path tests, architectural boundary violations.
   - **Severity 4 (Low)**: Maintainability debt, performance micro-optimizations, code comment noise.

---

## Mode 2: Security & Vulnerability Audit

Use when assessing trust boundaries, reviewing auth systems, running threat models, or auditing external dependencies.

### Security Audit Procedure
1. **Dependency Audit**: Run native vulnerability scanners (`npm audit`, `cargo audit`, `pip-audit`).
2. **Lexical Sink & Secret Scan**: Search for hardcoded secrets, dangerous functions (`eval`, `pickle.load`, `shell=True`), unvalidated redirects, and unhandled stubs (`// ASC-STUB:`).
3. **Trust Boundary Mapping**: Trace all points where external, untrusted input enters the application. Validate that inputs are strictly sanitized, type-checked, and normalized.

### Security Scope Checklist
- **Authentication & Authorization**: Verify resource-level access control on every private endpoint, not just session presence.
- **Injection & XSS**: Verify all database queries are strictly parameterized. Check HTML escaping for user-controlled strings.
- **SSRF & Network**: Validate outbound URLs; verify service credentials follow least-privilege principles.
- **Agentic Risk Scope (OWASP Top 10 for Agentic Applications)**:
  - Agent Goal Hijack (ASI01), Tool Parameter Tampering (ASI02), Identity & Privilege Abuse (ASI03).
  - Supply Chain & Untrusted Plugins (ASI04), Sandboxing & Execution (ASI05).
  - Memory & Context Poisoning (ASI06): Treat persistent state as untrusted input.

---

## Mode 3: Clone & Code Duplication Audit

Use when evaluating copy-paste repetition or consolidating duplicated logic across a repository.

### Duplication Audit Procedure
1. **Rule of Three Threshold**: Duplication is permitted up to 2 instances to avoid premature wrong abstractions. Three or more identical or near-identical logic blocks must be flagged for consolidation.
2. **Scan Tools**: Execute token-level clone audit (e.g., `asc dedup` or `jscpd`) when available.
3. **Consolidation Guidance**:
   - Prefer extracting pure, stateless utility functions over creating complex abstract base classes.
   - Ensure the consolidated helper resides in a shared module matching existing project conventions.

---

## Output Format for Findings

Report findings ordered strictly by severity with file and line references:

```
Severity: Critical | High | Medium | Low
Category: Correctness | Security | Resilience | Duplication
Location: path/to/file.ext:line
Impact: Concrete operational risk or threat vector
Evidence: Exact code excerpt or test failure
Remediation: Smallest safe, actionable fix
```

If no issues are found, state so explicitly and summarize the audit coverage.
