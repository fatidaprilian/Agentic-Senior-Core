# Compact Natural Mode Plan

Status: benchmarked prompt integrated into installed default guidance.
Last updated: 2026-05-22.

Compact Natural Mode reduces user-facing agent replies without using broken grammar, dialect, or global hard word caps.

It is not ASCX. ASCX compresses command output before it enters the agent context. Compact Natural Mode controls the final response style after the agent has enough evidence to answer safely.

## Decision

Build Compact Natural Mode as a task-aware instruction layer with benchmarks before broadening it beyond the installed prompt surface.

The mode optimizes for:

- fewer low-value output tokens
- complete technical meaning
- natural professional prose
- preserved commands, paths, errors, assumptions, validation status, decisions, risks, and next actions

The mode must not optimize for the shortest possible answer. A longer planning answer is valid when the reasoning chain is the deliverable.

## Product Boundary

Compact Natural Mode owns:

- response-level compression
- task-aware answer formats
- filler removal
- semantic preservation checks
- natural technical tone
- output-quality benchmark fixtures

It does not own:

- command-output compression
- raw tee files
- provider routing
- model selection
- prompt caching
- hidden reasoning compression
- caveman-style dialect

## MVP Scope

The first implementation should be instruction-only and benchmarked before it becomes the default installed behavior.

Initial task types:

- final implementation summary
- debug/root-cause explanation
- test failure explanation
- code review finding
- refactor summary
- planning/architecture answer
- destructive command warning
- commit/PR message

Security findings are explicitly low-compression. They can be longer when severity, impact, reproduction, and remediation need room.

## Files

- `instruction-contract.md`: system-level behavior contract.
- `task-formats.md`: task-specific output shapes.
- `benchmark-plan.md`: fixtures, metrics, release gates, and failure modes.
- `integration-surface.md`: where this mode may be injected later.

## Release Rule

Do not enable Compact Natural Mode globally until:

1. ASCX remains stable for `git status`, `git diff`, and `npm test`.
2. Compact Natural fixtures pass semantic and evidence-preservation gates.
3. The mode preserves natural grammar and professional register.
4. The benchmark separates quality score from token reduction.
5. Security, destructive commands, assumptions, and validation gaps are never hidden by compression.

## Next Validation Action

1. Keep `.agent-context/prompts/compact-natural-mode.md` as the active installed contract.
2. Run `npm run benchmark:compact-natural` before changing response-compression behavior.
3. Do not add a command, proxy, or extra model call until users need a separate runtime surface.
