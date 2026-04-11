# RTK Comparison and Sync Audit (2026-04-11)

## Scope

This audit compares Agentic-Senior-Core against RTK as a reference implementation for token-efficient CLI workflows, then maps cleanup and synchronization actions for this repository.

Benchmark clone location:
- `.benchmarks/rtk`

Reference source:
- `https://github.com/rtk-ai/rtk`

## Repository Hygiene Findings

### 1. Duplicate Content Scan

Status:
- No duplicate markdown skill files were found under `.agent-context/skills/`.
- Expected duplicate pair exists: `.cursorrules` and `.windsurfrules` (same compiled output by design).

Conclusion:
- No accidental duplicate skill documentation detected.

### 2. Redundant Artifact Scan

Observed local artifacts:
- `.agentic-backup/` (generated backup objects)
- `validate-output.log` (generated validation output)
- `validate-output-new.txt` (tracked legacy output dump)

Actions taken:
- Added `.benchmarks/` to `.gitignore`.
- Removed tracked legacy artifact: `validate-output-new.txt`.
- Removed local generated artifacts: `.agentic-backup/` and `validate-output.log`.

### 3. Stale Documentation Signals

Detected stale entries:
- `docs/analysis-priority-matrix.md` referenced `1.8.0` baseline.

Actions taken:
- Recreated `docs/analysis-priority-matrix.md` to align with `2.0.1` status and current hardening priorities.

Pending entries still valid in roadmap:
- `docs/roadmap.md` includes pending items for full compatibility enforcement and local dependency security auditing.

## RTK vs Agentic-Senior-Core Delta

### What RTK Does Very Well

- Command-specific output compression with stable patterns (filter, group, truncate, deduplicate).
- Hook-first shell rewrite model for high adoption in shell-heavy sessions.
- Token savings analytics and discoverability (`gain`, `discover`, `session`).
- Clear architecture boundaries and fail-safe execution principles.

### What Agentic-Senior-Core Should Keep Differently

- Keep RTK integration optional, not mandatory dependency.
- Preserve governance-first architecture where rule quality and release gates remain source of truth.
- Avoid coupling core CLI behavior to external binary availability.

### Practical Adoption Direction

Adopt now:
- Explicit token optimization policy in governance output.
- Optional RTK detection and setup guidance per agent.
- Safe fallback mode for environments without RTK.
- Token efficiency benchmark script with machine-readable output at `.agent-context/state/token-optimization-benchmark.json`.
- README benchmark snapshot table sourced from `npm run benchmark:token`.

Adopt next:
- Hook bootstrap helpers per agent as optional setup command.
- Token savings telemetry export into `.agent-context/state/` (local-only by default).
- Release gate checks for token-optimization policy drift.

Defer:
- Hard dependency or required install path for RTK.
- Any architecture change that weakens existing governance validation guarantees.

## Priority Recommendations (Execution)

1. Finish `2.0.x` hardening first:
   - compatibility manifest enforcement closure
   - frontend parity as release blocker
   - local dependency security audit integration
2. Move to `V2.5` benchmark harness with regression blocking.
3. Keep RTK benchmark clone local under `.benchmarks/` and update comparison quarterly.

## Benchmark Status Update (2.0.3)

Implemented:
- `scripts/token-optimization-benchmark.mjs`
- npm script: `benchmark:token`
- machine-readable artifact: `.agent-context/state/token-optimization-benchmark.json`
- README token benchmark snapshot table

Current runtime state:
- RTK binary is not detected on this environment, so RTK comparison columns are marked `N/A`.
- Native optimization benchmark average savings from latest run: `61.09%` (estimate model).

Next benchmark step:
- Install RTK on benchmark host and rerun `npm run benchmark:token` to populate RTK comparison values.

## Acceptance Snapshot After Audit

- `npm test`: passing
- `npm run validate`: passing
- Duplicate skill content: none
- Local benchmark workspace isolated from tracked source
- Priority matrix synchronized to current version line
