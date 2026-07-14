---
name: asc-reference
description: "Domain-specific coding rules for testing, API design, database queries, frontend components, infrastructure configs, and service resilience."
homepage: https://github.com/fatidaprilian/Agentic-Senior-Core
license: MIT
---

# ASC Domain Reference

Domain-specific coding rules for testing, API design, database queries, frontend components, infrastructure configs, and service resilience. Load this skill when working on any of these domains.

## Testing

- Write tests for business logic and boundary failures, not implementation details.
- Cover happy path, error paths, edge cases, and empty states.
- Tests must be fast, isolated, deterministic.
- Integration tests for critical data paths.
- Sensitive mutations need idempotency or duplicate-submit coverage.
- CI pipelines block on test failures.

## API Design

- Consistent resource naming and HTTP semantics.
- Bounded list reads: always paginate or set explicit limits.
- Idempotent for side-effect mutations. Document retry behavior.
- Backward-compatible by default. Version breaking changes explicitly.
- Sync docs in the same commit when changing API, CLI, or schema.

## Database

- Use eager loading or batching to eliminate N+1 queries.
- Paginate all growable datasets. No unbounded queries.
- Multi-table mutations run inside transactions.
- Monetary amounts: integer minor units or exact decimal. Never floats.
- Timestamps in UTC. No naive timestamps.
- Schema changes require versioned, reversible migrations.
- Never modify merged migrations. Create new ones.

## Frontend

- Semantic HTML before custom components.
- WCAG 2.2 AA is the accessibility floor.
- Responsive by default. Handle empty, loading, error, and offline states.
- No placeholder, lorem, or TODO content in production UI.

## Infrastructure

- Container configs: multi-stage builds, minimal base images, non-root users, no baked secrets.
- Configuration from environment, validated at startup. Fail fast if invalid.
- Structured logging with correlation IDs. No PII in logs.

## Resilience

- Every outbound network call has a strict timeout.
- Retries use exponential backoff with jitter and max attempt limits.
- Only retry idempotent operations.
- Circuit breakers for unhealthy dependencies.
- Graceful degradation on non-critical dependency failure.
