---
name: asc-review
description: >
  Trigger this skill when the user says: "review this code", "check this PR", "what's wrong with this", "look at my changes", "critique this", "is this production-ready", "review my pull request", "find bugs", "check for issues", "any problems here", "does this look right", "sanity check this", "review PR ini", "cek kodingan saya", "ada masalah ga di kode ini", "tolong review perubahan ini". Also trigger for any request to evaluate code quality, analyze recent commits, or assess production risks in existing code. Also trigger when editing or viewing diff output, PR descriptions, or code review comments. For deep penetration testing, threat modeling, or OWASP compliance audits, use asc-audit instead.
---

# Review Skill

Adversarial posture: Maintain neutral, unyielding technical scrutiny. Prioritize real production risks, regressions, and silent failures over courtesy or superficial compliments.

Production-risk code review. Prioritize findings by severity.

Grounded in: OWASP Risk Rating Methodology, Google Engineering Practices (code review guide), Clean Architecture (transport vs business layer separation).

## Review Procedure (Empirical First)

1. **Establish Scope**: Run `git diff --stat` (or `git status`) to inspect the exact set of changed files and line deltas.
2. **Test-Change Correlation**: For every modified application source file, check if a corresponding test file was updated. If application logic changed without test updates, flag as Severity 3 ("Missing tests for changed behavior").
3. **Run Deterministic Checks**: Run the project linter and test suite (`ascx test` / `npm test`). Do not evaluate architectural quality on a failing test suite.
4. **Security & Invariants Scan**: Check for unverified `ASC-STUB:`, hardcoded credentials, or empty catch blocks in the diff.
5. **Contract & Hierarchy**: Walk the decision ladder for each new file or dependency: does this need to exist, could the stdlib or an existing dependency handle it?

## Finding Priority Order

1. Correctness, data loss, security, privacy, auth, and permission risks.
2. Action feedback & resilience: silent mutation failures, missing toasts/banners, hanging spinners, missing fallbacks on remote calls, or missing error boundaries.
3. Public contract drift: APIs, events, CLI behavior, data model, UI contract, docs.
4. Missing tests for changed behavior.
5. Architecture boundary drift and maintainability risk.
6. Performance and accessibility issues with concrete impact.

## For Every Finding

- Include file and line reference.
- Explain the real risk.
- Propose the smallest safe fix.

## Checklist

### Correctness
- Changed behavior matches the user request.
- Existing behavior preserved unless user approved a change.
- Edge cases, empty states, error paths, and fallbacks handled.
- Action feedback: mutations (forms, buttons, mutations) have visible pending indicators and clear completion notifications (toast or banner with retry). No silent failures or hanging spinners.
- Dependency resilience: remote calls have strict timeouts and soft dependencies have graceful fallbacks (static default, stale cache, or degraded mode). Component crashes are contained by error boundaries.

### Security
- External input validated at trust boundaries.
- Secrets, tokens, credentials not committed or logged.
- Authorization enforced at a trusted boundary.
- Error responses keep internal details out of client responses.
- User-derived URLs are protected against SSRF and user-controlled log values cannot forge or corrupt log entries.
- New dependencies have verified identity and provenance; plausible package names are not evidence. Confirm git clone targets and plugin/skill install paths against trusted sources (mitigate HalluSquatting).

### Architecture
- Layer boundaries clear. Controllers handle protocol translation only; business logic stays in services.
- Abstractions backed by real duplication, not prediction. Straightforward code over clever solutions.
- Complexity budget applied: fewer moving parts without losing safety.
- New code follows a named analogous module in this codebase. Any deviation is explicitly justified.

### Testing
- Changed behavior has appropriate tests (baseline: happy path + failure mode).
- Never mock the unit under test — mock only external boundaries and dependencies.
- Tests assert behavior and contracts, not implementation trivia.
- Critical flows include failure-path coverage.

### Documentation
- API, event, CLI, and data contract changes update docs in the same commit.
- Root README exists and stays current.

## Output

Report findings ordered by severity with file/line references and concrete fixes. If no findings, say so explicitly and name any residual risk.
