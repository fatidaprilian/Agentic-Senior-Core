# Distribution Skill Pack

Default tier: `expert`

## Purpose
Protect package installation and release distribution with transactional safety.

## In Scope
- Package validation
- Backup and rollback
- Compatibility checks
- Forbidden-file detection
- Publish hygiene and provenance

## Must-Have Checks
- Preflight validation before installation or publish
- Backup point before mutating user state
- Automatic rollback on failure
- Compatibility manifest present
- Evidence bundle attached to release

## Evidence
- Install validation report
- Rollback verification log
- Publish dry-run output
- Integrity and provenance manifest

## Fallback
- If automated rollback cannot be guaranteed, the operation must stop before mutation.