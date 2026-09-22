---
name: asc-reference
description: >
  Trigger this skill when the user is working on: unit tests, integration tests, REST APIs, GraphQL APIs, SQL queries, database migrations, React components, frontend layouts, Docker configs, CI/CD pipelines, Kubernetes manifests, or service resilience (retries, circuit breakers, rate limiting). Also trigger when the user says: "how should I test this", "design this API", "optimize this query", "set up Docker", "add retry logic", "write a test", "add pagination", "handle errors", "add loading state", "set up CI", "it keeps failing", "make it try again if it fails", "it's too slow with lots of data", "looks broken on mobile", "how do I deploy this", "will this break anything", "bagaimana cara ngetes ini", "bikin tes", "kok lambat banget", "tampilan di hp rusak", "cara deploy ini". Also trigger when editing files matching: `*.test.*`, `*.spec.*`, `Dockerfile`, `docker-compose.*`, `.github/workflows/*`, `*.sql`, or migration files.
---

# ASC Domain Reference

Domain-specific coding rules for testing, API design, database queries, frontend components, infrastructure configs, and service resilience. Load this skill when working on any of these domains.

Grounded in: WCAG 2.2 AA (accessibility), Fowler's Money Pattern (monetary types), Nygard's Release It! (resilience patterns), AWS Well-Architected Reliability Pillar (backoff/circuit breakers), OWASP Secure Coding Practices (input validation, logging).

## Testing

- New business logic requires at least one happy path test and one primary failure mode test.
- Never mock the unit under test — mock only external dependencies and boundaries. Prefer real in-process doubles (e.g. `node:sqlite`, in-memory repositories, or MSW network interceptors) over fragile behavioral mock spies.
- Tests assert behavior and contracts, not implementation details. Must be fast, isolated, deterministic.
- Cover happy path, error paths, edge cases, and empty states.
- Integration tests for critical data paths. Sensitive mutations need idempotency or duplicate-submit coverage.
- CI pipelines block on test failures.

## API Design

- Consistent resource naming and HTTP semantics (follow RFC 9110; RFC 9457 for problem details).
- Bounded list reads: always paginate or set explicit limits.
- Idempotent for side-effect mutations (support `Idempotency-Key` headers for safe retries). Document retry behavior.
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

- Match the project's existing styling paradigm (Tailwind, CSS Modules, Vanilla CSS, styled-components, etc.). Do not introduce a new CSS framework or build tool without explicit user confirmation.
- UI Component Reusability: Primitive UI elements (buttons, inputs, cards, dialogs, badges) must have a single source of truth in the shared component directory (`components/` or `ui/`). Never recreate ad-hoc variants or duplicate JSX structures across individual pages. Extend existing components with props or variants instead of cloning.
- Design Consistency: Consume shared design tokens, CSS variables, or theme configuration for colors, spacing, and border-radius. Do not hardcode arbitrary raw color hexes or inconsistent spacing that causes visual design drift between pages.
- Data-fetching components must explicitly handle 3 states: loading, error (with user-facing toast/notification and retry option), and data. Never leave an unhandled error state.
- WCAG 2.2 AA accessibility floor. Responsive by default.
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

