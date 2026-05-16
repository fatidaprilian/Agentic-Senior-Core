# Architecture Vision: Knowledge Layer Roadmap

This document is the honest forward-looking record for the knowledge-layer registry declared in `mcp.json`. It separates what ships today from what is planned, so users and contributors can audit the gap rather than rely on marketing copy.

## Audience

- Maintainers planning Phase 1 through Phase 5 of the v4 upgrade.
- Contributors looking for stable extension points in the rules pack.
- Users evaluating whether the agent surface matches their reliability bar.

## Scope of Truth

`mcp.json` is the single source of truth for layer status. The fields `status`, `plannedPhase`, and `rationale` per layer in `mcp.json` are authoritative. This document narrates them; it does not introduce new commitments.

## Today: Five Implemented Layers

These five layers are file-backed and resolve to concrete content at runtime.

| Layer | Path | What it does today |
|-------|------|--------------------|
| `rules` | `.agent-context/rules/` | 15 rule files; loaded on-demand per AGENTS.md routing. |
| `prompts` | `.agent-context/prompts/` | 4 trigger-mode prompts (`init-project`, `bootstrap-design`, `refactor`, `review-code`). |
| `state` | `.agent-context/state/` | Active-memory snapshot, dependency map, architecture map, benchmark history. |
| `policies` | `.agent-context/policies/` | LLM-judge thresholds and profile selection. |
| `project-context` | `docs/` | Project docs (`project-brief`, `architecture-decision-record`, `flow-overview`, etc.). Lazy-loaded when the agent needs them. |

These layers are what every install actually receives.

## Planned: Four Dynamic Layers

These four layers are declared in `mcp.json` with `status: "planned"`. They resolve to no-op today and will be implemented in later phases. Declaring them up front gives downstream tooling a stable contract surface, but they should not be cited as features today.

### `stack-strategies` (planned phase-2-or-later)

A runtime-decision-signal cache derived from the detected project stack. The current detector at `lib/cli/detector/` already reads markers and assigns confidence scores; the planned layer will memoize those signals into a queryable cache so the agent can answer "what runtime/framework decisions are already evident?" without re-walking the filesystem each turn.

### `architecture-playbooks` (planned phase-2-or-later)

Structural-planning playbooks derived from repo evidence. Today the agent reads `architecture.md` and `microservices.md` and applies them by hand. The planned layer will encode common architecture transitions (monolith to module boundaries, API extraction, queue introduction) as resolvable playbooks the agent can cite by ID.

### `execution-contracts` (planned phase-3-anti-halu)

Active-contract resolution. Today the agent reads `prompts/`, `review-checklists/`, and `policies/` directly from their file-backed layers. The planned layer is the dedicated execution-contract resolver that backs the Phase 3 anti-halu MCP tools (`validate_against_rules`, `lookup_rule`, `audit_compliance`). When implemented, this layer will give agents a stable API for "which contract is active for this task?" instead of reasoning over multiple file paths.

### `governance-modes` (planned phase-2-or-later)

Governance-mode selection metadata. Profile selection (`platform`, `regulated`, `startup`) currently lives in policy files; the planned layer is the mode-resolver that switches threshold profiles based on detected project signals (e.g. `regulated` triggers stricter accessibility, audit, and data-handling gates without manual policy edits).

## Phase Mapping

| Phase | Goal | Affected Planned Layers |
|-------|------|-------------------------|
| Phase 1 | Format migration to numbered markdown + YAML frontmatter | none directly |
| Phase 2 | Caching architecture (three-layer sandwich) | `stack-strategies`, `architecture-playbooks`, `governance-modes` benefit from stable layer 1/2 cache positions |
| Phase 3 | Anti-halu (validation MCP tools) | `execution-contracts` becomes the resolver backend |
| Phase 4 | Retrieval (conditional, opt-in) | none directly; retrieval is orthogonal |
| Phase 5 | Hardening and adoption | activate, document, and benchmark the now-implemented planned layers |

This mapping is a forecast, not a contract. The plan files in `docs/plan/` carry the operational schedule.

## Why Declare Planned Layers Up Front

Two reasons:

1. **Stable extension points.** Tooling that consumes `mcp.json` (CI gates, IDE adapters, future MCP server endpoints) can index against the full registry and degrade gracefully when a layer reports `status: "planned"`. Keeping the registry stable across phases avoids breaking changes when layers go from planned to implemented.
2. **Honest disclosure.** Removing planned layers from the registry until implementation would hide the architectural intent and force users to discover it from changelogs. The current shape (5 implemented, 4 planned, total 9) is verifiable per-field in `mcp.json`.

## What This Document Does NOT Promise

- It does not commit to a calendar date for implementing the planned layers.
- It does not promise that all four planned layers ship in v4. Phase 4 is conditional, and the planned layer set is a target, not a guarantee.
- It is not a substitute for `CHANGELOG.md`. Implementation milestones are recorded there per release.

## How to Consume This Document

- If you are evaluating the agent today, read the "Today: Five Implemented Layers" table.
- If you are planning extensions, read the "Planned" section to know what reserved layer keys not to collide with.
- If a phase ships and a planned layer becomes implemented, update both `mcp.json` (`status` field) and this document in the same change.

## Related Documents

- `mcp.json` — single source of truth for layer status fields.
- `docs/plan/00-context.md` — v4 upgrade decisions and prohibited patterns.
- `docs/plan/research-foundation.md` — empirical foundation for the decisions that drive the planned phases.
- `AGENTS.md` — current rules-pack routing table that consumes the implemented layers today.
