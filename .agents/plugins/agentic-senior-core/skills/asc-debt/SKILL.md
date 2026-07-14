# Debt Ledger

Track deferred enforcement violations. When an ASC ladder nudge fires and the shortcut is accepted rather than fixed, log it here for later resolution.

## Storage

Entries persist in `.agent-context/state/debt-ledger.json` via MCP `state_read`/`state_write`. The ledger is a JSON array of entry objects.

## Entry Format

```json
{
  "id": "sequential integer",
  "file": "path/to/file.ts",
  "ladderStep": "3",
  "violation": "Added axios — stdlib fetch covers this",
  "addedAt": "ISO-8601 timestamp",
  "status": "open | resolved",
  "resolvedAt": "ISO-8601 timestamp or null"
}
```

## Operations

### Add Entry

When an enforcement nudge fires and the violation is deferred:

1. Read the current ledger via `state_read` (path: `debt-ledger.json`). If missing, start with `[]`.
2. Append a new entry with the next sequential `id`, the file path, ladder step, and a one-line violation summary.
3. Write the updated ledger via `state_write` (path: `debt-ledger.json`, mode: `overwrite`).
4. Confirm: "Logged to debt ledger: [violation summary]"

### List Open Debt

1. Read the ledger via `state_read`.
2. Filter to entries where `status` is `"open"`.
3. Display as a table: ID, file, ladder step, violation, age.
4. If no open entries, say so explicitly.

### Resolve Entry

When a deferred violation has been addressed:

1. Read the ledger.
2. Set the matching entry's `status` to `"resolved"` and `resolvedAt` to the current timestamp.
3. Write the updated ledger.
4. Confirm: "Resolved debt #[id]: [violation summary]"

### Summary

1. Read the ledger.
2. Report: total entries, open count, resolved count, oldest open entry age.

## When to Log

Log a debt entry when ALL of these are true:
- The PostToolUse enforcement hook fired a nudge
- The agent acknowledged the nudge but proceeded without fixing the violation
- The violation is deferrable (not a security issue — security violations must be fixed immediately)

## Integration

The `/asc` skill documents the enforcement loop. This ledger captures what enforcement flags but the session defers. Use `/asc-debt` at session end or before commits to review outstanding shortcuts.
