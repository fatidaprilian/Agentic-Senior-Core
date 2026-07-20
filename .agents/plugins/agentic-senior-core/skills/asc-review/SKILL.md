---
name: asc-review
description: >
  Production-risk code review. Prioritize findings by severity.
---

# Review Skill

Production-risk code review. Prioritize findings by severity.

Grounded in: OWASP Risk Rating Methodology, Google Engineering Practices (code review guide), Clean Architecture (transport vs business layer separation).

## Before Reviewing

1. Read the changed files and understand the scope.
2. For UI changes, check accessibility and design consistency.
3. For API changes, check contract stability and documentation sync.
4. Walk the decision ladder for each new file or dependency: does this need to exist, could the stdlib or an existing dependency handle it?

## Finding Priority Order

1. Correctness, data loss, security, privacy, auth, and permission risks.
2. Public contract drift: APIs, events, CLI behavior, data model, UI contract, docs.
3. Missing tests for changed behavior.
4. Architecture boundary drift and maintainability risk.
5. Performance and accessibility issues with concrete impact.

## For Every Finding

- Include file and line reference.
- Explain the real risk.
- Propose the smallest safe fix.

## Checklist

### Correctness
- Changed behavior matches the user request.
- Existing behavior preserved unless user approved a change.
- Edge cases, empty states, error paths handled.

### Security
- External input validated at trust boundaries.
- Secrets, tokens, credentials not committed or logged.
- Authorization enforced at a trusted boundary.
- Error responses keep internal details out of client responses.

### Architecture
- Layer boundaries clear. Controllers handle protocol translation only; business logic stays in services.
- Abstractions backed by real duplication, not prediction. Straightforward code over clever solutions.
- Complexity budget applied: fewer moving parts without losing safety.

### Testing
- Changed behavior has appropriate tests.
- Tests assert behavior and contracts, not implementation trivia.
- Critical flows include failure-path coverage.

### Documentation
- API, event, CLI, and data contract changes update docs in the same commit.
- Root README exists and stays current.

## Output

Report findings ordered by severity with file/line references and concrete fixes. If no findings, say so explicitly and name any residual risk.
