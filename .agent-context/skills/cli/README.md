# CLI Engineering Skills

Default tier: `advance`

This domain covers command design, safe mutation workflows, and machine-readable output conventions for automation.

## Topics
- [Init Flow](init.md) - Deterministic project initialization with explicit write plans
- [Upgrade Flow](upgrade.md) - Safe upgrades with dry-run, rollback, and compatibility checks
- [Machine-Readable Output](output.md) - Stable JSON output and deterministic exit semantics

## Operating Model
- Use `advance` for normal command work.
- Escalate to `expert` when commands mutate user state or require migration safety.

## Above-Line Additions
- Mandatory dry-run support for mutating commands.
- Structured error payloads for CI/CD and bots.
- Explicit rollback plans for upgrade paths.