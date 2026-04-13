# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## 2.0.13 - 2026-04-13
### Fixed
- Fixed MCP transport protocol to support dual-framing: automatically detects and parses both Content-Length headers (LSP-style, backward compatible) and line-delimited JSON (MCP standard modern format).
- MCP initialize handshake now works reliably with all client types: Claude Desktop, Cursor, Windsurf, and custom clients that use either framing style.
- Cleaned up unused framing detection functions; kept simple, robust dual-mode parser.

## 2.0.12 - 2026-04-13
### Changed
- Clarified Quick Start documentation: distinguished npx/npm exec (temporary download, per-project) from global install (system-wide convenience).
- Added detailed output file tree showing what `init` creates: `.cursorrules`, `.windsurfrules`, `.instructions.md`, `.agent-context/`, `.vscode/mcp.json`.
- Added comparison table for install approaches with clear use cases.

## 2.0.11 - 2026-04-13
### Fixed
- Hardened workspace MCP launch configuration by enforcing `cwd: ${workspaceFolder}` to avoid path resolution ambiguity in VS Code local process startup.
- Updated `init --mcp-template` output to use local `node ./scripts/mcp-server.mjs` runtime with explicit workspace cwd for more reliable initialize handshake.

### Changed
- Updated MCP documentation in README, FAQ, and deep-dive to match the node-based workspace runtime model.
- Clarified release publish notes as maintainer and fork guidance.

## 2.0.10 - 2026-04-13
### Fixed
- Fixed MCP initialize handshake reliability by accepting both CRLF and LF framed headers in the local MCP server runtime.
- Added regression tests to prevent MCP initialize timeout from returning in future releases.

### Changed
- Restructured README onboarding for clearer newbie flow with npm-first setup as the primary path and GitHub-based setup as secondary path.
- Added complete CLI command reference and release automation notes (auto publish on push to main still requires semantic version bump).
- Expanded V2.5 roadmap with frontend excellence focus, including advanced UI and UX quality targets beyond baseline benchmark references.

## 2.0.9 - 2026-04-13
### Fixed
- Fixed MCP onboarding confusion by adding a real MCP stdio runtime command (`agentic-senior-core mcp`) and workspace MCP config support.
- Fixed `--mcp-template` output so it now creates `.vscode/mcp.json` (the location VS Code MCP actually reads), instead of writing an unrelated root file.
- Fixed untrusted remote schema warning in root `mcp.json` by removing the external `$schema` URL.

### Added
- Added local MCP server runtime script (`scripts/mcp-server.mjs`) exposing validate/test/release checks as MCP tools.
- Added repository workspace MCP config file at `.vscode/mcp.json` using trusted `vscode://schemas/mcp` schema.

## 2.0.8 - 2026-04-13
### Fixed
- Fixed `init` and `upgrade` behavior so repository-internal GitHub workflows are no longer copied into target projects by default.
- Clarified MCP onboarding behavior: MCP server registration remains manual in IDE settings, while `mcp.json` is now an explicit opt-in template via `--mcp-template`.
- Added smoke-test coverage to prevent regressions in workflow-copy scope and MCP-template behavior.

## 2.0.7 - 2026-04-11
### Fixed
- Fixed cross-platform instruction adapter hash drift by normalizing line endings before canonical SHA256 computation in validation and knowledge-injection tests.
- Updated AGENTS, Copilot, and Gemini thin-adapter hash metadata to match normalized canonical hash so CI/Linux and Windows environments stay consistent.

## 2.0.6 - 2026-04-11
### Added
- Added weekly governance reporting (`report:governance-weekly`) with state artifact generation and scheduled CI workflow publishing.
- Added expanded init presets: `typescript-nestjs-service`, `java-enterprise-api`, `dotnet-enterprise-api`, `php-laravel-api`, and `kubernetes-platform`.
- Added mobile blueprint depth for architecture, offline behavior, testing baseline, and release governance.
- Added advanced skill topics for frontend, fullstack, distribution, review-quality, and CLI operational telemetry.

### Changed
- Upgraded trust-tier evidence enforcement so `cli`, `frontend`, `fullstack`, `distribution`, and `review-quality` domains must reach Verified tier in validation.
- Upgraded frontend/fullstack/distribution/review-quality skill domains with evidence bundles, maintenance metadata, and test placeholders for stable marketplace readiness.
- Updated roadmap and deep backlog status to mark V2.0 backlog items complete and shift focus to V2.5/V3.0 preparation.

## 2.0.5 - 2026-04-11
### Added
- Added instruction adapter drift detection in repository validation via canonical SHA256 metadata checks for AGENTS, Copilot, and Gemini entrypoints.
- Added release-gate hard enforcement for frontend parity checklist coverage and frontend usability audit execution.

### Changed
- Consolidated AGENTS, Copilot instructions, and Gemini instructions into thin adapters pointing to `.instructions.md` as the canonical policy source.
- Updated knowledge injection and enterprise operations tests to enforce the new adapter-chain and frontend parity release checks.
- Synced backlog statuses for V2.0-018 (Instruction Adapter Consolidation) and V2.0-014 (Frontend parity CI hard enforcement) to done.

## 2.0.4 - 2026-04-11
### Changed
- Updated token efficiency benchmark snapshot with live RTK (`v0.35.0`) measurements on the Windows benchmark host.
- Switched benchmark scenarios to deterministic RTK-compatible git workflows to reduce host-specific command noise.
- Synced backlog and RTK audit documentation with the latest benchmark artifact averages (`83.64%` native savings and `18.95%` RTK savings).

## 2.0.3 - 2026-04-11
### Changed
- Token optimization is now enabled by default for all `init` flows (`npx`, `npm exec`, global CLI install, presets, and interactive wizard).
- Added explicit opt-out behavior with `--no-token-optimize` so onboarding remains flexible for external users.
- Updated CLI help text and README guidance to reflect default-on optimization behavior.

### Added
- Added smoke-test coverage verifying default token optimization on init and `--no-token-optimize` opt-out behavior.

## 2.0.2 - 2026-04-11
### Added
- Added token optimization command flow with optional external proxy detection and fallback guidance for shell-heavy sessions.
- Added init flags `--token-optimize`, `--token-agent`, and `--no-token-optimize` for auto-enabling token optimization at onboarding time.
- Added compatibility manifests for all six skill domains and integrated compatibility warnings into init/upgrade onboarding output.
- Added strict compatibility-manifest checks in release gate so publish-time validation blocks incomplete compatibility metadata.

### Changed
- Updated README onboarding guidance to introduce token optimization as optional and beginner-friendly.
- Added updated deep analysis and roadmap backlog document aligned to current 2.0.x state.

## 2.0.1 - 2026-04-08
### Fixed
- Fixed a fatal bug where running Windows npm via WSL (`npx`) on UNC network paths defaulted execution to `C:\Windows`, causing CLI crashes (`EPERM` during backup/init). The CLI now catches this fallback proactively and aborts with clear instructions to use a native Linux Node.js environment.

## 2.0.0 - 2026-04-08
### Added
- Publish Gate & Pre-Publish Safety (V2.0-008) automated forbidden content detection preventing API keys, passwords, and absolute paths to leak into production.
- Marketplace Trust Tiers (V2.0-002) with 4-dimension scorecard and automated acceptance checklist validation.
- Preflight Safety Checks (V2.0-005) to assert Node.js versions, directory write permissions, disk space availability, and to abort without touch state on file conflicts.
- Transactional Install & Rollback Safety (V2.0-006, V2.0-007) via new `lib/cli/backup.mjs` and `lib/cli/rollback.mjs` modules with a manual `rollback` CLI command.
- Evidence Bundle Validation & Trust Scorer (V2.0-003, V2.0-004) calculating readiness limits and preventing unverified skill components from passing tests.

## 1.9.4 - 2026-04-08

## 1.9.3 - 2026-04-08
### Changed
- CLI modularization (V2.0-001): split 1557-line monolith `bin/agentic-senior-core.js` into 9 ESM modules under `lib/cli/`. Entry point reduced to 61 lines.
- Migrated entire package from CommonJS to ESM (`"type": "module"` in package.json).
- Added `lib/` to npm publish manifest.

### Added
- Mandatory `.gitignore` enforcement rules in `.agent-context/rules/security.md` with 70+ patterns covering secrets, dependencies, build output, IDE files, and keys.
- Knowledge injection test suite (`tests/knowledge-injection.test.mjs`) with 55 test cases verifying all 8 layers across every IDE entry point.
- `.gitignore` verification added to security checklist.

## 1.8.2 - 2026-04-02
### Fixed
- Standardized NPM package name references to `@ryuenn3123/agentic-senior-core` to resolve 404 errors in documentation and CLI help.

## 1.8.1 - 2026-04-02
### Added
- Numbered launch menu CLI for improved interactive onboarding (`agentic-senior-core launch`).
- Mobile starter presets for React Native and Flutter (`--preset mobile-react-native`, `--preset mobile-flutter`).
- Product-delivery presets for Frontend, Backend, and Fullstack.
- Frontend expert skill packs and multi-tier quality gate enforcement.
- Skill platform selector with domain and tier filtering (`agentic-senior-core skill`).

## 1.9.1 - 2026-04-03
### Added
- Unified 8-layer knowledge injection across AGENTS.md, copilot-instructions.md, and mcp.json.
- NEW bootstrap metadata file `.instructions.md` for AI agent initialization.
- Enhanced mcp.json with knowledge layer categorization and injection workflows.
- Expanded language profiles to include Flutter and React Native.

## 1.8.0 - 2026-03-30
### Added
- Enterprise release operations checklist (`.agent-context/review-checklists/release-operations.md`).
- V1.8 operations playbook (`docs/v1.8-operations-playbook.md`).
- Release gate script with machine-readable output (`scripts/release-gate.mjs`) and npm command (`npm run gate:release`).
- CycloneDX SBOM generator (`scripts/generate-sbom.mjs`) and npm command (`npm run sbom:generate`).
- CI release gate artifact workflow (`.github/workflows/release-gate.yml`).
- CI SBOM compliance artifact workflow (`.github/workflows/sbom-compliance.yml`).
- Enterprise operations test suite (`tests/enterprise-ops.test.mjs`).

### Changed
- Repository validator now enforces V1.8 release-governance and compliance assets.
- Test command now includes enterprise operations checks.

## 1.7.0 - 2026-03-30
### Added
- Frontend usability checklist for release gating (`.agent-context/review-checklists/frontend-usability.md`).
- V1.7 execution playbook (`docs/v1.7-execution-playbook.md`).
- Frontend usability audit script (`scripts/frontend-usability-audit.mjs`) and npm command (`npm run audit:frontend-usability`).
- Frontend usability CI workflow that publishes audit report artifacts (`.github/workflows/frontend-usability-gate.yml`).
- GitHub issue template for V1.7 frontend work items (`.github/ISSUE_TEMPLATE/v1.7-frontend-work-item.yml`).

### Changed
- Repository validator now enforces V1.7 frontend governance assets.
- Roadmap now marks V1.7 as delivered governance and execution-quality pack for downstream frontend implementations.

## 1.6.0 - 2026-03-19
### Added
- Team profile packs for `startup`, `regulated`, and `platform` in `.agent-context/profiles/`.
- New CLI option `--profile-pack <name>` to apply organization defaults during `init`.
- New CLI command `upgrade` with `--dry-run` and `--yes` options for migration previews and controlled writes.
- Onboarding report metadata now records selected profile pack (`name` and `sourceFile`).
- Onboarding report now records `operationMode` (`init` or `upgrade`) and expanded detection reasoning metadata.
- LLM Judge now emits a machine-readable annotation payload (`JSON_REPORT`) and writes report artifacts.
- Added `npm run benchmark:detection` command backed by `scripts/detection-benchmark.mjs` for top-1 detection KPI tracking.
- Added lightweight CI workflow to publish detection benchmark artifacts on each run (`.github/workflows/benchmark-detection.yml`).

### Changed
- Repository validator now enforces override governance metadata checks for `Owner` and `Expiry`.
- Validator now checks profile pack files as required `.agent-context` assets.
- CLI smoke tests now cover profile pack initialization, profile matrix scenarios, and upgrade dry-run flow.
- LLM Judge now normalizes severity levels for CI provider parity (GitHub/GitLab/local).

## 1.5.0 - Unreleased
### Added
- Zero-Conf onboarding for complete beginners (`--newbie` flag).
- Smart auto-detection for existing projects (stack + blueprint suggestions).
- Profile presets (`beginner`, `balanced`, `strict`).
- `llm-judge-threshold.json` to handle LLM review severities.
- Split documentation paths (FAQ and Deep Dive).
- Refactored all internal tools from Bun to Node-native.
