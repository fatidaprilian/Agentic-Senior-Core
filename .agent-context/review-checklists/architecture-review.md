# Architecture Review Checklist

Use this when module structure, feature shape, public contracts, topology, or refactoring are in scope.

## Boundary Review

- [ ] The changed code has clear transport, application, domain, and infrastructure boundaries where those layers exist.
- [ ] Business policy is not hidden in transport handlers, UI adapters, database queries, framework glue, or generated code.
- [ ] Internal models do not leak across public API, event, CLI, library, or UI contracts without a deliberate mapping.
- [ ] Modules import through public entrypoints instead of deep internal paths.
- [ ] Circular dependencies are absent or explicitly removed.

## Structure Review

## Backend Universal Principles

- [ ] No clever hacks in backend and shared core modules
- [ ] No premature abstraction (base classes/util layers created only after repeated stable patterns)
- [ ] Readability over brevity for maintainability
- [ ] The project structure follows existing repo conventions unless a change was approved.
- [ ] New structure is feature/domain-oriented when that improves discoverability.
- [ ] Large files or modules are split around real responsibilities, not arbitrary layers.
- [ ] Shared code is genuinely shared and not domain-specific behavior disguised as utility.
- [ ] Names describe product meaning, not generic plumbing.

## Topology Review

- [ ] Monolith remains acceptable when boundaries, team size, consistency needs, and operations favor one deployable.
- [ ] Service extraction is backed by current evidence: ownership, scaling, compliance, fault isolation, or deploy cadence.
- [ ] Service boundaries define ownership, contract, data boundary, observability, timeouts, retry, and recovery behavior.
- [ ] Event or realtime architecture is justified by product need, not trend pressure.

## Contract Review

- [ ] API, event, CLI, library, data, and UI contracts are documented before or alongside implementation.
- [ ] Schema and validation strategy matches the project’s chosen runtime and official docs.
- [ ] Error contracts are safe, stable, and do not leak internals.
- [ ] Migration and rollback plans exist for risky data or public contract changes.

## Operational Review

- [ ] Critical flows have tests at the right level.
- [ ] Observability, logging, and health checks match the project’s runtime and risk level.
- [ ] Security assumptions are documented and enforced at trust boundaries.
- [ ] Performance-sensitive paths avoid avoidable repeated work, unbounded lists, and hidden blocking operations.
