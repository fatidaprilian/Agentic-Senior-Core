---
name: asc-learn
description: >
  Trigger this skill when the user says: "learn this preference", "don't do this again", "remember my preference", "log this rule", "add to my design rules", "never use X", "always use Y for UI", "save this preference", "remember this style", "ingat preferensi ini", "jangan lakuin ini lagi", "catat aturan ini", "simpan gaya ini". Also trigger when mining explicit user corrections from conversation history to update adaptive preferences. Do NOT trigger for initial day-one design rule bootstrapping or cold start wizard (use asc-bootstrap instead).
---

# Adaptive Preference Miner (`asc-learn`)

Mines explicit user corrections and design preferences from conversation history, atomizes them into clean rules, and routes them to Track A (Syntactic/Compiled) or Track B (Taste/AGENTS.md).

Grounded in: **TRACE (arXiv:2606.13174)** correction mining & **Supermemory** dual-scope preference isolation.

## Workflow

1. **Extract & Atomize**: Parse the user's explicit correction or preference into a single atomic rule.
2. **Categorize Track**:
   - **Track A (Syntactic / Concrete)**: Banned Tailwind classes, specific CSS patterns, forbidden AST structures, or exact code tokens.
   - **Track B (Taste / Visual Vibe)**: Subjective UI aesthetic guidance (layout flow, typography feel, brand mood).
3. **Select Scope**:
   - **User Scope (`~/.gemini/config/`)**: Global personal preferences that follow the developer across all repositories.
   - **Project Scope (`.agents/`)**: Repository-specific conventions.
4. **Execute Dual-Track Routing**:
   - For **Track A**: Pass rule to `addRule()` in `adaptive-preferences.mjs` and invoke `installGitPreCommitHook()` / `compileAndSaveValidator()` to generate deterministic Git pre-commit & `ascx validate` enforcement (capped at `DEFAULT_RULE_CAP = 25`).
   - For **Track B**: Append the structured, deduped atomic rule to `AGENTS.md` / `SCRUTABLE_RULES.md` under `## Adaptive Preferences`.
5. **Track B Governance & Budgeting (Anti-Bloat)**:
   - Cap active taste rules at a maximum of **15 rules** per repository to prevent instruction density degradation (Gloaguen ETH Zurich 2026).
   - When exceeding 15 rules, perform semantic compaction: merge overlapping guidelines (e.g. typography rules) and prune superseded preferences.

## Atomic Rule Format

```json
{
  "id": "rule_timestamp_hash",
  "type": "syntactic | taste",
  "pattern": "Concrete pattern or regex",
  "reason": "Clear explanation of why this pattern is preferred or banned",
  "source": "learn",
  "scope": "user | project"
}
```
