# Data Design Boundary

Use the data store, ORM, migration tool, and query style already chosen by the project. If unresolved, the LLM must recommend a current fit from requirements, repo evidence, and official docs before implementation.

Reject these bad habits:
- schema changes without a migration, rollback or recovery note, and data-safety plan
- duplicated facts or derived values without a sync strategy and rationale
- unbounded reads or missing pagination on growable datasets
- missing indexes or access-path planning for frequent filters, joins, lookups, search, or ordering
- raw query construction that bypasses safe parameterization
- destructive data changes without backup, migration, or deployment sequencing notes

Docs must record entity ownership, relationships, constraints, data lifecycle, migration risk, and assumptions to validate.
