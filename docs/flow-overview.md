# Flow Overview

## Init Flow

1. Resolve the target directory and run preflight checks.
2. Detect whether the target is a fresh or existing project.
3. Copy the compact governance surface: `AGENTS.md`, `CLAUDE.md`, `GEMINI.md`, and `.agent-context/`.
4. Write policy, memory continuity, default token optimization, Compact Natural response-compression metadata, onboarding state, and local `.gitignore` entries for generated ASCX runtime artifacts when enabled.
5. Scaffold project documentation prompts or seed docs only when the selected scope requires them.
6. Report the selected profile, runtime evidence status, architecture decision status, and validation guidance.

## Upgrade Flow

1. Detect the current project and managed governance surface.
2. Preview stale managed files, UI contract gaps, and onboarding state.
3. Back up relevant files under `.agentic-backup/` and ensure backup plus ASCX runtime artifact paths are ignored.
4. Refresh the compact governance surface, including Compact Natural Mode, and preserve user-owned instruction entrypoints.
5. Backfill missing default token optimization state unless the existing onboarding report explicitly opted out.
6. Rewrite policy and onboarding state with `operationMode: upgrade`.

## Optimize Flow

1. Require an initialized repository with an onboarding report.
2. Write `.agent-context/state/token-optimization.json`.
3. Write `.agent-context/state/token-optimization-report.json`.
4. Prefer local ASCX wrappers for supported command output compression: `ascx git status`, `ascx git diff`, and `ascx npm test`.
5. Use `asc optimize status` for a non-mutating readiness check.
6. Use `asc optimize doctor` when tee write safety or double-compression risk needs diagnosis.
7. Print the selected agent profile and optional external proxy hook guidance for commands outside the ASCX MVP.

## Validation Flow

1. Run `npm run check:adapters` to verify native import bridges.
2. Run `npm run validate` for repository integrity, docs, policy, and instruction-surface checks.
3. Run `npm run audit:cache-layer-contract` when prompt-caching layers, cache simulation, or validation wiring changes.
4. Run `npm run audit:reflection-citations` when bounded reflection text, citation requirements, rule IDs, prompts, or review checklists change.
5. Run `npm test` for CLI smoke tests, MCP tests, LLM judge tests, operations tests, UI rubric tests, and knowledge-injection tests.
6. Run `npm run gate:release` before release or publish work.

## Anti-Halu Flow

1. Keep stable rule text in the canonical governance surface.
2. If a user request conflicts with stricter `.agent-context/` rules, refuse or redirect with the relevant rule ID.
3. Use MCP compliance tools when rule citations need deterministic checking: `lookup_rule`, `validate_against_rules`, and `audit_compliance`.
4. Use `npm run audit:reflection-citations` to verify bounded reflection snippets and cited rule IDs in canonical prompts and checklists.
5. Keep task-specific evidence, command output, and generated citations in the dynamic request layer.

## UI Design Flow

1. On any UI keyword (ui, ux, layout, screen, tailwind, frontend, redesign), read `.agent-context/prompts/bootstrap-design.md` and `.agent-context/rules/frontend-architecture.md`.
2. Detect user-explicit redesign first; redesign requests treat existing UI as behavioral evidence only and require a fresh `docs/DESIGN.md` direction before UI code.
3. Name the defaults the agent is tempted to use, reject them with product-specific reasons, and derive the search direction from that rejection.
4. Choose one concrete interaction anchor, then record what mechanic is borrowed and what surface styling is explicitly not borrowed.
5. Record typography, color, motion, and composition commitments in `docs/DESIGN.md`. If prior directions are listed there, treat them as a blocklist.

## Failure And Rollback

- Init and upgrade abort on preflight failures.
- Upgrade and init create local backup manifests before managed writes.
- `agentic-senior-core rollback` restores files from `.agentic-backup/manifest.json` when needed.

## Next Validation Action

After any CLI flow change, run the targeted smoke test first, then the full validation sequence.
