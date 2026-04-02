# CLI Skill Pack

Default tier: `advance`

## Purpose
Create smart command-line workflows that guide users efficiently and safely.

## In Scope
- Interactive initialization and upgrade flows
- Safe defaults and confirmation steps
- Machine-readable output for automation
- Validation and self-healing hooks
- Cross-platform shell behavior

## Must-Have Checks
- Explicit command help and examples
- Deterministic output format for automation
- Safe destructive-action guards
- Validation before mutation
- Exit codes reflect success and failure clearly

## Evidence
- CLI smoke tests
- Machine-readable report output
- Upgrade dry-run output
- Cross-platform execution notes

## Fallback
- Standard mode can remain available for compatibility, but advance is the default user experience.