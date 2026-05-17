# Flow Overview

## Init Flow

1. Resolve the target directory and run preflight checks.
2. Detect whether the target is a fresh or existing project.
3. Copy the compact governance surface: `AGENTS.md`, `CLAUDE.md`, `GEMINI.md`, and `.agent-context/`.
4. Write policy, memory continuity, token optimization, and onboarding state when enabled.
5. Scaffold project documentation prompts or seed docs only when the selected scope requires them.
6. Report the selected profile, runtime evidence status, architecture decision status, and validation guidance.

## Upgrade Flow

1. Detect the current project and managed governance surface.
2. Preview stale managed files, UI contract gaps, and onboarding state.
3. Back up relevant files under `.agentic-backup/` and ensure the backup folder is ignored.
4. Refresh the compact governance surface and preserve user-owned instruction entrypoints.
5. Rewrite policy and onboarding state with `operationMode: upgrade`.

## Optimize Flow

1. Require an initialized repository with an onboarding report.
2. Write `.agent-context/state/token-optimization.json`.
3. Write `.agent-context/state/token-optimization-report.json`.
4. Print the selected agent profile and optional external proxy hook guidance.

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

1. On any UI keyword (ui, ux, layout, screen, tailwind, frontend, redesign), read `.agent-context/prompts/bootstrap-design.md`, `.agent-context/prompts/research-design.md`, and `.agent-context/rules/frontend-architecture.md`.
2. Detect user-explicit redesign first; redesign requests bypass the freshness gate but never the anti-repeat ledger.
3. Inspect `docs/design-intent.json`. When the file is missing, the status is a seed value, or `researchDossier.metadata.researchVerifiedAt` is null or older than `freshnessWindowDays` (90 by default), run the research dossier prompt to produce category-cliche identification, a morphological matrix, and five anchor candidates with the strengthened rename test, then run the bootstrap prompt and stamp `researchVerifiedAt` to today's ISO date.
4. When the dossier is fresh and no explicit redesign is requested, run the bootstrap prompt only for additive UI tasks; do not auto-refresh `researchVerifiedAt`.
5. Treat anti-repeat ledger entries (`previousAnchors`, `previousPalettes`, `previousMotionSignatures`, `previousTypographyChoices`) as a hard blocklist when generating anchor candidates. Restating an existing direction with new wording is REVISE, not pass.

## Failure And Rollback

- Init and upgrade abort on preflight failures.
- Upgrade and init create local backup manifests before managed writes.
- `agentic-senior-core rollback` restores files from `.agentic-backup/manifest.json` when needed.

## Next Validation Action

After any CLI flow change, run the targeted smoke test first, then the full validation sequence.
