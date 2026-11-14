---
name: asc-review
description: >
  Trigger this skill when the user is: reviewing pull requests, checking recent changes, auditing security, scanning for vulnerabilities, threat modeling, or detecting duplicate code. Trigger when the user says: "review this code", "check this PR", "what's wrong with this", "look at my changes", "is this production-ready", "find bugs", "audit this", "security check", "find vulnerabilities", "check for XSS", "check for SQL injection", "OWASP check", "check auth", "find duplicate code", "check for clones", "audit for duplication", "review PR ini", "cek kodingan saya", "cari celah keamanan", "cari kode duplikat".
---

# Clean Code, Review & Security Assurance Router (`asc-review`)

Universal assurance router enforcing enterprise code health, complexity bounds, resource/concurrency safety, contract isolation, and security across all languages.

Grounded in: Google Engineering Practices, SonarSource Cognitive Complexity & Clean as You Code, Conventional Comments, MITRE CWE (404, 390, 915), OWASP Top 10 (2025), and ISO 24495-1.

---

## 1. The Universal Quality Floor (Non-Negotiable Invariants)

1. **Bounded Complexity & Signatures:** Cognitive Complexity <= 15 per function, nesting <= 3 via guard clauses, <= 3 positional parameters (use Parameter Objects for 4+), zero boolean mode flags, and zero O(n^2) scans on unbounded collections.
2. **Deterministic Resource Disposal (CWE-404):** Release acquired handles, DB connections, streams, and listeners via scoped constructs (`using`, `with`, `try-finally`).
3. **Async & Concurrency Safety:** Zero blocking sync I/O inside async contexts, zero unhandled fire-and-forget tasks, mandatory timeout/cancellation propagation, and immutable shared request state.
4. **Contract & DTO Isolation (CWE-915):** Separate request/response DTOs from persistence entities; ban unsafe type escape hatches (`any`, `dynamic`, unchecked casts) at trust boundaries.
5. **Error Integrity & Human Copy (CWE-390):** Never catch exceptions only to return `null`, `[]`, or fake success. Preserve root-cause chains; write user-facing errors in active, single-language plain prose without leaking stack traces.
6. **Comment & Language Purity:** English identifiers only; comment *why* not *what* (`//`, `#`, `/* */`); zero mixed-language hybrids or parenthetical translation glosses.

---

## 2. On-Demand Reference Library (1-Hop Gate)

> [!IMPORTANT]
> Paths below are relative to this `SKILL.md` directory (`.../skills/asc-review/`). Prepend this skill's folder path when calling `read_file`.

Before issuing review verdicts on non-trivial diffs, load the applicable reference:

| Audit Domain | Mandatory Reference Path |
|---|---|
| Complexity ceilings (<= 15), Fowler code smells, YAGNI & acyclic boundaries | `references/clean-code-and-complexity.md` |
| Resource leaks (CWE-404), async event-loop safety, timeouts & deadlocks | `references/concurrency-and-resources.md` |
| DTO isolation (CWE-915), type rigor, error masking (CWE-390) & human error copy | `references/contracts-and-error-hygiene.md` |
| Google `eng-practices`, Clean as You Code, Conventional Comments & prose audit | `references/review-protocol.md` |

---

## 3. Claim Verification Gate

Never accept claims of correctness or test coverage without fresh execution evidence:

| Claim | Requires (Sufficient Evidence) | NOT Sufficient (Invalid Evidence) |
|---|---|---|
| *"Code works / Bug fixed."* | Reproduction test failed before fix, passes with it, and full suite passes. | *"The code looks correct."* |
| *"All tests pass."* | Fresh test suite run in current session with exit code 0. | *"Tests passed earlier."* |
| *"Zero security vulnerabilities."* | Parameterized queries, resource authz checks, DTO isolation & audit tool output. | *"I used an ORM so it's safe."* |
| *"No duplicate code."* | Lexical/token dedup scan (`asc dedup` / `jscpd`) with Rule of Three check. | *"I don't recall copying this."* |

---

## 4. Operational Modes

1. **Mode 1 — Production PR Review (Clean as You Code):**
   - Inspect `git diff --stat` and verify tests updated alongside changed logic.
   - Run linter and test suite fresh (`ascx npm test`, `pytest`, `dotnet test`).
   - Audit strictly on new/changed lines in priority order: Design -> Functionality & Concurrency -> Complexity -> Tests -> Naming/Comments/Copy.
2. **Mode 2 — Security & Trust-Boundary Audit:**
   - Run dependency vulnerability scanners (`npm audit`, `pip-audit`, `cargo audit`, `dotnet list package --vulnerable`).
   - Audit trust boundaries: DTO allowlists (CWE-915), parameterized queries, resource-level authz, SSRF URL checks, and OWASP Agentic risks (ASI01–ASI06).
   - Scan for hardcoded secrets, untracked stub markers (`ASC-STUB:` missing `[ASC-DEBT-xxx]`), and unsafe sinks (`eval`, `shell=True`, `pickle.load`).
3. **Mode 3 — Clone, Smell & Language Hygiene Audit:**
   - Run `asc dedup` / `jscpd` for Rule-of-Three clones and inspect for God Services, Feature Envy, Primitive Obsession, dead exports, and mixed-language prose/comments.

---

## 5. Output Format (Conventional Comments & Severity)

Order findings strictly from blocking issues down to optional polish:

```text
Label: issue (blocking) | suggestion (non-blocking) | nitpick (non-blocking) | question
Severity: Critical | High | Medium | Low
Category: Correctness | Security | Concurrency | Complexity | Contract | Language
Location: path/to/file.ext:line
Impact: Concrete operational risk, CWE vector, or maintainability ceiling
Evidence: Exact code excerpt, metric breach, or failed verification output
Remediation: Minimal, actionable fix aligned with codebase conventions
```

If no issues exist across the diff, state so explicitly and summarize checked files, executed commands, and verified exit codes.
