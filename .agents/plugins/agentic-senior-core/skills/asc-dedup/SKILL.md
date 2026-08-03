---
name: asc-dedup
description: >
  Trigger this skill when the user says: "find duplicate code", "check
  for clones", "audit for duplication", "is this repeated elsewhere",
  "scan for copy-paste", "run jscpd", "dedup report", "consolidate
  duplicate logic", "this looks the same as the other file",
  "we already have this somewhere", "why is this code repeated",
  "isn't this a copy of", "cari kode duplikat", "ini kok sama kayak yang itu",
  "ini udah ada kan". Use for whole-repo or whole-directory duplication
  audits on demand — this is a deep, on-demand scan, distinct from the
  continuous per-edit check already enforced by the dedup-gate hook.
---

# Duplicate Code Audit

On-demand deep duplication scan using jscpd (token-level clone detection). Distinct from the continuous per-edit `dedup-gate` hook — this skill runs a full-scope scan and produces a ranked report.

Grounded in: GitClear 2024 analysis (211M LOC, 8x increase in duplicated code blocks in AI-assisted repos). Token-level clone detection catches near-duplicates that differ in names/structure — something diff-only review tools and pattern matching cannot do.

## When to Use

- User asks to scan a directory, package, or entire repo for duplicated code
- Before a refactoring pass, to identify consolidation targets
- After a multi-file feature addition, to verify no accidental duplication was introduced

## Scan Procedure

1. Determine scope from user's request (specific directory, package, or full repo).
2. Check for `.asc/dedup-config.json` — use `ignoreDirs` and `minTokens` from it if present.
3. Run: `npx jscpd@5 "<scope>" --min-tokens <minTokens> --reporters console,json --output ./report/`
   - If `bunx` is available, prefer `bunx jscpd` for speed (24-37x faster per jscpd v5 benchmarks).
   - Apply `--ignore` flags from config `ignoreDirs`.
4. Parse the JSON report and present findings ranked by number of duplicated lines (largest clusters first).

## Report Format

For each duplicate cluster, report:
- **Files involved** and line ranges
- **Duplicated lines count** and overlap percentage
- **Consolidation recommendation** (only if pattern appears 3+ times — Rule of Three)

## Consolidation Rules

Per this repo's asc-refactor YAGNI and Rule of Three conventions:

- **2 occurrences**: Report the duplication. Do NOT suggest a shared abstraction — "three similar lines is better than a premature abstraction."
- **3+ occurrences**: Suggest the smallest safe consolidation — extract a shared function, component, or module. Explain what risk or friction the duplication creates and what the consolidated shape looks like.
- **Structural boilerplate** (imports, prop types, export statements): Flag but do not count as actionable duplication — these are framework-mandated patterns, not logic clones.

## Integration

- The `dedup-gate` hook provides continuous per-edit detection (PostToolUse, scoped, fast).
- This skill provides deep on-demand audits (full scope, thorough, user-triggered).
- Findings from either can be logged to the debt ledger via `/asc-debt` if deferred.
