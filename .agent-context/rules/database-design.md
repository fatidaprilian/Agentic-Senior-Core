---
id_prefix: DATA
domain: database-design
priority: high
scope: data
applies_to:
  - backend
  - fullstack
keywords:
  - database-design
  - data
  - design
  - boundary
  - reject
  - these
---

# Data Design Boundary

Use the data store, ORM, migration tool, and query style already chosen by the project. If unresolved, the LLM must recommend a current fit from requirements, repo evidence, and official docs before implementation.

## DATA-001: Reject these bad habits

1. schema changes without a migration, rollback or recovery note, and data-safety plan
2. duplicated facts or derived values without a sync strategy and rationale
3. unbounded reads or missing pagination on growable datasets
4. missing indexes or access-path planning for frequent filters, joins, lookups, search, or ordering
5. raw query construction that bypasses safe parameterization
6. destructive data changes without backup, migration, or deployment sequencing notes

## DATA-002: Backend data access rules

1. Relational reads must avoid N+1 query patterns. Use eager loading, joins, batching, or explicit query-shape rationale based on the project's ORM or database driver.
2. List endpoints and exports must paginate, limit, stream, or otherwise bound growable datasets by default.
3. Use cursor pagination for large or frequently changing datasets when the project contract allows it; offset pagination is acceptable for small, stable, explicitly bounded collections.
4. Define maximum page size, payload size, and export limits so list responses cannot exhaust memory or connection pools.
5. Mutations that write more than one table, aggregate, queue, or external consistency boundary must run inside a transaction or document the compensating recovery path.
6. Repository and data-access layers own persistence mechanics. They must not hide business policy that belongs in application or domain logic.
7. Index design follows read patterns, not column lists. Prefer composite indexes with selectivity-correct column order (equality before range), partial indexes for soft-delete or status-filtered tables, and covering indexes when a hot read can be satisfied without a heap fetch. Record the read pattern that justifies each non-trivial index.
8. Record explicit decisions for delete semantics (hard delete, soft delete, append-only audit), tenant isolation (none, row-level with `tenant_id` plus row-level security, schema-per-tenant), and normalize-vs-denormalize trade-off for read-heavy or sparse data. Default to the simplest fit, but make the choice explicit in data docs rather than letting it become a side effect of the first migration.
9. Cross-domain persistence must respect ownership boundaries. Independent services must not share database tables as an integration contract; modular monoliths may share one database only when module ownership and access paths stay explicit.
10. Docs must record entity ownership, relationships, constraints, data lifecycle, migration risk, and assumptions to validate.
