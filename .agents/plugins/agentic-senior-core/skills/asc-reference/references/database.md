# Database Engineering: Indexing, Transactions & Migrations

Relational and document databases underpin application state. High-traffic systems fail most frequently at the database boundary.

---

## 1. Indexing Strategies & Query Optimization

Indexes turn full table scans ($O(N)$) into logarithmic tree lookups ($O(\log N)$). Unindexed queries are the primary source of production latency spikes.

### 1.1 Index Placement Rules
- **Foreign Keys:** Always index foreign key columns (`author_id`, `org_id`). Database engines do not automatically index foreign keys, leading to full table scans during cascade checks and joins.
- **Filter & Sort Predicates:** Index columns present in `WHERE`, `ORDER BY`, and `GROUP BY` clauses.
- **Leftmost Prefix Rule for Composite Indexes:** An index on `(org_id, status, created_at)` accelerates:
  - `WHERE org_id = ?`
  - `WHERE org_id = ? AND status = ?`
  - `WHERE org_id = ? AND status = ? ORDER BY created_at`
  - *It does NOT accelerate:* `WHERE status = ?` alone. Order columns by cardinality and filter frequency.

### 1.2 Partial Indexes
Save index size and write overhead by indexing only active rows:
```sql
-- Accelerates lookups for active users without indexing millions of deleted rows
CREATE INDEX idx_users_active_email ON users (email) WHERE deleted_at IS NULL;
```

---

## 2. N+1 Query Prevention

Never execute database queries inside an application loop:

```typescript
// BANNED: 1 initial query + N separate queries for authors
const posts = await db.posts.findMany();
for (const post of posts) {
  post.author = await db.users.findUnique({ where: { id: post.authorId } });
}

// ENFORCED: 1 query with join or batch preload
const posts = await db.posts.findMany({
  include: { author: true }
});
```

---

## 3. Transaction Boundaries & Concurrency Control

Any operation modifying more than one table, or reading state to calculate a mutation, must be guarded by an ACID transaction.

### 3.1 Lost Update Prevention (Pessimistic Locking)
When decrementing balances or claiming inventory, reading then writing in two queries creates a race condition:

```sql
-- BANNED: Two concurrent requests read balance = 100, both deduct 50, final balance 50 instead of 0
SELECT balance FROM accounts WHERE id = 1;
UPDATE accounts SET balance = balance - 50 WHERE id = 1;

-- ENFORCED: Pessimistic Row Lock inside transaction
BEGIN;
SELECT balance FROM accounts WHERE id = 1 FOR UPDATE;
-- Validate balance >= 50
UPDATE accounts SET balance = balance - 50 WHERE id = 1;
COMMIT;
```

---

## 4. Zero-Downtime Migrations: The Expand-and-Contract Pattern

Never perform breaking schema alterations (renaming columns, changing column types, deleting columns) in a single deployment step. Use the Expand-and-Contract pattern across three deployments:

```
Deployment 1 (Expand)        Deployment 2 (Migrate & Read)    Deployment 3 (Contract)
──────────────────────       ────────────────────────────     ───────────────────────
Add new column `new_col`     Application writes both cols     Drop old column `old_col`
Application writes both      Reads from `new_col`             Remove dual-write logic
Backfill historical data     All code points to `new_col`     Migration complete
```

### 4.1 Migration Invariants
- **Non-blocking Index Creation:** In PostgreSQL, always use `CREATE INDEX CONCURRENTLY` to avoid locking the table against writes. Set a statement lock timeout: `SET lock_timeout = '5s'`.
- **Never Edit Merged Migrations:** Once a migration has been committed and run in shared environments, treat it as immutable. Author a new corrective migration instead.
- **Reversibility:** Every migration must provide a valid `down` step that reverses schema modifications cleanly.

---

## 5. Data Types: Precision & Time

1. **Monetary Amounts:**
   - **Strictly Banned:** `FLOAT`, `DOUBLE`, `REAL`. Floating-point arithmetic produces rounding inaccuracies (`0.1 + 0.2 = 0.30000000000000004`).
   - **Enforced:** Integer minor units (e.g. storing USD as integer cents: `$19.99` $\to$ `1999`) or exact fixed-point `NUMERIC(18, 4)`.
2. **Timestamps:**
   - Store all timestamps in UTC with timezone: `TIMESTAMPTZ` (Postgres) or ISO-8601 UTC strings (`2026-11-04T10:00:00Z`).
   - Never store naive local times without timezone offset.

