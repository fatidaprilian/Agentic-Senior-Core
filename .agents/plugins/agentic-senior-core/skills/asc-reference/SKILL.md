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
- Action Feedback & Mutations: Any user-initiated mutation (form submit, delete, upload, toggle) must provide immediate pending feedback (disabled button, inline spinner) and a visible completion notification (toast or alert banner with retry). Never silently swallow mutation errors.
- Form Validation: Render field errors inline directly next to the affected input with `aria-describedby` and `aria-invalid="true"`. Never use floating toasts for individual form input validation.
- Data-Fetching State Quad: Data components must explicitly handle 4 states — loading skeleton/spinner, empty state (friendly message + call to action), error fallback (clear message + retry button), and populated data.
- Component Error Boundaries: Wrap major widgets, dashboards, and routes in localized Error Boundaries with fallback UI cards to prevent a single rendering crash from taking down the entire page.
- Accessible Notifications: Toast and status messages must use ARIA live regions (`role="status"`, `aria-live="polite"` for non-urgent feedback; `role="alert"` for critical errors). Never steal keyboard focus for toasts.
- WCAG 2.2 AA accessibility floor. Responsive by default.
- No placeholder, lorem, or TODO content in production UI.

## Infrastructure

- Container configs: multi-stage builds, minimal base images, non-root users, no baked secrets.
- Configuration from environment, validated at startup. Fail fast if invalid.
- Structured logging with correlation IDs. No PII in logs.

## Resilience

- Every outbound network call has a strict timeout (client and server).
- Retries use exponential backoff with jitter and max attempt limits.
- Only retry idempotent operations (GET, PUT, DELETE, or requests with `Idempotency-Key`).
- Dependency Fallback Strategy (Hard vs Soft):
  - Hard dependencies (core workflow blocks without them): Fail fast, roll back transactions, return structured RFC 9457 error with actionable explanation.
  - Soft dependencies (non-critical enhancements): Provide graceful fallbacks:
    - *Static Fallback*: Return safe default values, static placeholders, or empty collections alih-alih melempar exception.
    - *Stale Cache Fallback*: Serve last-known-good cached state (`stale-while-revalidate`) with an offline/stale indicator.
    - *Degraded Mode*: Isolate and disable the failing peripheral widget while preserving core user journeys.
- Circuit breakers for unhealthy dependencies to fail fast and prevent thread/resource exhaustion.
- Offline Detection: Detect offline network status and notify users before initiating network requests that are guaranteed to fail.

