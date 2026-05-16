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
4. Run `npm test` for CLI smoke tests, MCP tests, LLM judge tests, operations tests, UI rubric tests, and knowledge-injection tests.
5. Run `npm run gate:release` before release or publish work.

## Failure And Rollback

- Init and upgrade abort on preflight failures.
- Upgrade and init create local backup manifests before managed writes.
- `agentic-senior-core rollback` restores files from `.agentic-backup/manifest.json` when needed.

## Next Validation Action

After any CLI flow change, run the targeted smoke test first, then the full validation sequence.
