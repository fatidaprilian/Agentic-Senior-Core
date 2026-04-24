# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## Unreleased
### Changed

## 3.0.25 - 2026-04-25
### Changed
- Synced `frontend-architecture.md` with the Dynamic Avant-Garde Anchor Engine so UI agents reject dashboard/admin fallback from both the bootstrap prompt and frontend rule surface.
- Compacted the generated `docs/design-intent.json` seed by trimming verbose handoff defaults while preserving validator-enforced conceptual anchor, responsive mutation, accessibility, and genericity gates.

## 3.0.24 - 2026-04-24
### Changed
- Strengthened the prompt-only UI conceptual anchor flow into a Dynamic Avant-Garde Anchor Engine so missing user research triggers agent-led synthesis instead of fallback to scaffold, prior UI, or dashboard/admin metaphors.
- Added visual risk budget, motion risk budget, high-variance candidate selection, and smoke/validation coverage so expressive motion and spatial interaction are allowed when they fit the selected anchor and remain accessible.

## 3.0.23 - 2026-04-24
### Changed
- Added an advanced conceptual anchor requirement for prompt-only UI work so agents must choose one cohesive non-template concept before coding when no external design research is supplied.
- Extended the dynamic design-intent seed, validation, and smoke coverage with `conceptualAnchor`, including internal candidate selection policy, forbidden basic UI labels, broad non-template source domains, and derived token axes for typography, spacing, morphology, motion, and responsive composition.

## 3.0.22 - 2026-04-24
### Changed
- Added user-supplied research intake to the UI bootstrap flow so attached library lists, articles, screenshots, or benchmark notes become candidate evidence that must be summarized, filtered for project fit, and verified against current official documentation before implementation.
- Extended the dynamic design-intent seed with `externalResearchIntake` so user research can influence motion, scroll, UI primitives, canvas/3D, charts, icons, typography, and interaction candidates without becoming an offline style or dependency preset.

## 3.0.21 - 2026-04-24
### Changed
- Added a zero-based redesign protocol so requests such as `redesign from zero`, `redesain dari 0`, `ulang dari 0`, or `research ulang` treat existing UI as content and behavior evidence only, not visual continuity.
- Extended the dynamic design contract with `visualResetStrategy`, prior-visual-DNA drift signals, and restyle-vs-recomposition anti-patterns so reset-language UI work cannot quietly become a recolor of the previous layout.
- Tightened the UI design judge prompt and release gate integration so `reviewRubric.genericityAutoFail` escalates named genericity or forbidden-pattern drift into blocking-recommended findings instead of being framed as merely advisory.

## 3.0.20 - 2026-04-24
### Changed
- Fixed MCP template synchronization for `init` and `upgrade` so target repositories now receive the full `scripts/mcp-server/` helper bundle alongside `scripts/mcp-server.mjs`, preventing Antigravity and similar IDE integrations from crashing on missing local module imports.
- Extended repository validation and CLI smoke coverage so missing MCP helper modules are now caught before release and restored automatically during `upgrade` when MCP templates are enabled.
- Removed the offline architecture selection path from `init`, so fresh repositories now rely on explicit stack selection, detected existing-project evidence, or named presets instead of silent heuristic stack picking.
- Reframed the bootstrap and planning surfaces around constraints, structural guidance, and live research, and removed the remaining `Federated Governance baseline` onboarding wording from user-facing init and upgrade flows.
- Removed offline stack, framework, blueprint, and topology bias from init guidance so fresh projects require an agent recommendation from the current brief, repo evidence, and live official documentation.
- Reworked existing-project init to treat detected runtime markers as evidence only, infer product context from repository files instead of folder names, and preserve unresolved decisions as agent-led handoff fields.
- Compressed global rules, prompts, workflows, and review checklists into boundary-first guidance so agents avoid bad habits without being steered into one language, framework, architecture style, or visual template.
- Reframed the UI design contract around context-led synthesis, responsive recomposition, modern researched motion/styling choices, and genericity auto-fail signals without locking the project to a fixed aesthetic.

## 3.0.19 - 2026-04-23
### Changed
- Added a deterministic rubric-calibration layer for the internal UI design judge so generic-vs-distinctive status now gets checked against named drift signals, contract drift, and valid authored signals instead of trusting provider labels at face value.
- Introduced a small internal rubric gold set plus a machine-readable calibration runner to keep `generic`, `mixed`, and `distinctive` judgments stable as the judge evolves.
- Extended repo validation, frontend audit, enterprise ops coverage, and test execution so the new calibration path stays part of the release guardrails rather than a local-only experiment.

## 3.0.18 - 2026-04-23
### Changed
- Regrouped the repo-internal script surfaces for the MCP server, release gate, and UI design judge so large single-file tools now live behind function-focused folders while keeping the public package surface unchanged.
- Reworked the dynamic design-intent seed so `init` and `upgrade` now emit a structure-first scaffold instead of a domain-bucket taste engine, making project-specific art direction come from repo evidence and the active brief rather than pre-shaped visual heuristics.
- Hardened the structured UI handoff and validation path so scaffold-only fields are marked explicitly, minimum semantic palette roles are enforced, and smoke coverage keeps `docs/design-intent.json` aligned with the new scaffold-first contract.

## 3.0.17 - 2026-04-23
### Changed
- Hardened bootstrap reliability for existing repositories by strengthening the thin adapters with a Critical Bootstrap Floor, clarifying that memory continuity is host-supported project memory rather than a replacement for instruction loading, and keeping UI/bootstrap triggers usable even when a host stops at `AGENTS.md`.
- Expanded the dynamic design contract with explicit context-hygiene boundaries, hybrid visual QA policy, and long-page screenshot capture planning so UI work stays fresh, repo-grounded, and deterministic before any semantic judging occurs.
- Extended the repo-internal UI design judge so deterministic visual review now understands long-page section coverage instead of treating viewport coverage alone as complete, and synced validation, smoke coverage, and LLM-judge fixtures to enforce that behavior.

## 3.0.16 - 2026-04-22
### Changed
- Reframed the architect module as an honest offline, repo-grounded architecture brief instead of a pseudo-realtime research engine, and removed stale snapshot-style selection baggage.
- Simplified `init`, `upgrade`, and related compiler flows so review thresholds stay as internal policy while noisy user-facing profile-pack and Golden Standard surface wording disappears.
- Removed dead architect and profile-pack plumbing, synced docs and smoke tests to the new offline-brief model, and kept package-facing guidance aligned with agent-led live research for drift-prone ecosystem claims.

## 3.0.15 - 2026-04-21
### Changed
- Strengthened Docker governance so container work now prefers the latest official Docker documentation, current `docker compose` and `compose.yaml` patterns, and latest stable compatible images and dependencies before documented fallback.
- Strengthened dependency governance so framework and package setup now defaults to the latest stable compatible versions and official setup flows before any documented downgrade path.
- Strengthened fresh-project discovery so `init` now asks for project topology up front (`Monolith` or `Microservice / distributed system`) and threads that choice into project-context synthesis and onboarding metadata.
- Strengthened UI design governance so agents synthesize visual direction from the current project context instead of carrying over palettes or layout memory from prior websites, chats, or unrelated projects.
- Relaxed the design contract so motion and visual originality can stay bold and expressive when they remain purposeful, reduced-motion-safe, and performant instead of being flattened into overly safe UI.

## 3.0.14 - 2026-04-21
### Changed
- Clarified the canonical instruction chain so `.instructions.md` remains the baseline, thin adapters explicitly delegate to it, and `.agent-instructions.md` is treated as the compiled project-specific snapshot rather than a competing source of truth.
- Hardened `upgrade` so it fully regenerates the compiled instruction surface, including `.agent-instructions.md`, IDE adapters, and onboarding metadata, instead of leaving stale compiled files behind.
- Made Layer 2 stack strategy signals and Layer 3 architecture playbooks explicitly adaptive in `.instructions.md`, so agents can prefer better-fit stacks or synthesize better-fit playbooks when repo evidence and current constraints justify it.

## 3.0.13 - 2026-04-21
### Changed
- Streamlined fresh-project `init` so setup no longer opens a second architecture interview loop; the CLI now uses one focused project questionnaire, folds the CI decision into that flow, and auto-scaffolds fresh-project docs from the same answers.
- Hardened fresh-vs-existing detection to ignore init-owned governance artifacts such as `.agentic-backup`, `.agent-context`, and compiled rule adapters, preventing empty repos from being misclassified as existing projects on first run or rerun.
- Reduced generic UI bias in the dynamic design seed by removing the raw architect design-signal control vector from the design bootstrap prompt and relying on the stronger machine contract plus project-specific intent instead.
- Strengthened the adaptive-docs governance path so missing project docs block implementation, bootstrap prompts must synthesize project-specific docs from repo evidence instead of templates, and generated docs must separate confirmed facts from assumptions with explicit next validation actions.

## 3.0.12 - 2026-04-21
### Changed
- Hardened initialized workspaces so `.instructions.md` is copied alongside the thin adapters, keeping the canonical instruction chain intact after `init` or `upgrade`.
- Improved microservice and workspace detection so nested UI packages such as `apps/web` or `services/frontend` still trigger UI design seeding, frontend evidence analysis, and onboarding transparency.
- Made the copied MCP server tolerate repos without a root `package.json` and hide repo-internal validate/test tools when their supporting scripts are absent in the target workspace.
- Expanded the dynamic UI contract with `motionSystem` and `componentMorphology` so agents can use purposeful animation and coherent state behavior without collapsing into generic static output.
- Surfaced nested UI workspace evidence into existing-project design seeds, upgrade messaging, and onboarding reports so microservice repositories retain frontend context across init and upgrade flows.

## 3.0.11 - 2026-04-20
### Changed
- Simplified `ui-design-judge` into a repo-internal advisory audit with no user-facing runtime flags or output-file generation.
- Removed the extra package-level `audit:ui-design-judge` entry so the audit stays internal to this repository workflow instead of looking like a public init-facing feature.
- Updated UI judge validation and tests to enforce the simplified repo-internal contract and avoid unused local report artifacts.

## 3.0.10 - 2026-04-20
### Added
- Added an advisory-first `ui-design-judge` audit that compares changed UI surfaces against `docs/design-intent.json` and `docs/DESIGN.md` without hard-blocking release by default.
- Added release-gate diagnostics and direct test coverage for the UI design judge so advisory behavior, strict opt-in behavior, and non-blocking policy stay enforced.

### Changed
- Added a first-class `UI Design Mode` trigger with context isolation so UI-only requests load the design contract and frontend rules without eagerly pulling unrelated backend guidance.
- Strengthened the dynamic design contract seed with deterministic `colorTruth`, `crossViewportAdaptation`, and viewport mutation rules plus cheap frontend evidence metrics for existing UI repositories.
- Clarified `init-project.md` by separating auto-execution directives from user-facing prompt examples, and expanded frontend audits to verify responsive re-layout and UI automation coverage.
- Ignored local machine report artifacts for `llm-judge` and `ui-design-judge` so verification runs do not dirty the worktree with ephemeral audit output.

## 3.0.9 - 2026-04-20
### Changed
- Reworked `bootstrap-design.md` so the dynamic design contract relies on shipped project evidence and active governance context instead of non-shipped repository docs.
- Strengthened the design bootstrap prompt to favor explicit assumptions, reversible design bets, and project-specific rationale over generic SaaS defaults or copied brand systems.
- Updated `init-project.md` to reference the active onboarding and compiled-rule context that actually ships into initialized repositories.

## 3.0.8 - 2026-04-20
### Added
- Added shared UI-scope detection so `init` and `upgrade` agree on when a dynamic design contract is required.
- `init` now seeds `docs/design-intent.json` for detected existing UI repositories when UI scope is present but full project-doc scaffolding is not running.
- `upgrade` now seeds `docs/design-intent.json` for detected UI repositories when the machine-readable design contract is missing.

### Changed
- Upgrade preview now makes the planned UI seed explicit while keeping `docs/DESIGN.md` authoring as a manual, project-specific step.
- Existing-project `init` now surfaces prompt guidance for completing `docs/DESIGN.md` from the seeded machine-readable contract.

## 3.0.7 - 2026-04-20
### Added
- Added dynamic UI design contract seeding so UI scaffolding materializes `docs/design-intent.json` alongside bootstrap prompts.
- Added upgrade preview warnings when UI/frontend scope is detected but `docs/DESIGN.md` or `docs/design-intent.json` is missing.

### Changed
- Simplified init discovery flow by removing low-value wizard branches and reusing architecture description as the default project description.
- Standardized UI governance around the paired dynamic design contract across prompts, rules, compiler output, and upgrade messaging.

### Fixed
- Removed unused interactive Docker discovery state that no longer influenced downstream generation.
- Fixed onboarding continuity for upgraded repositories by persisting and reusing project-scope signals during UI contract checks.

## 3.0.6 - 2026-04-19
### Added
- Content-aware 1:1 synchronization for governance assets during upgrade.
- Restoration of missing managed files (marked as [NEW] during sync).
- Detailed reporting of change statistics (Created, Updated, Deleted, Unchanged).

### Changed
- Refactored `upgrade` command to provide file-by-file transparency.
- Intelligent non-destructive merging of MCP configurations (VS Code, Cursor, Zed) to preserve custom servers.
- Standardized Cursor workspace configurations to use the `mcpServers` key.

### Fixed
- Fixed redundant file overwrites during upgrade by implementing hash-based/binary comparison.

## 3.0.5 - 2026-04-18
### Added
- When `--mcp-template` is enabled, `upgrade` now ensures the target project contains `scripts/mcp-server.mjs` so Cursor can start the MCP server without missing-module failures.

### Changed
- MCP workspace templates are now self-contained: `mcp.json` points to a script that is guaranteed to exist after init/upgrade.

### Fixed
- Fixed Cursor connection failures caused by `MODULE_NOT_FOUND` for `./scripts/mcp-server.mjs` in upgraded projects.

## 3.0.4 - 2026-04-18
### Added
- Updated upgrade MCP template generator so Cursor workspaces receive a valid `.cursor/mcp.json` using the `mcpServers` schema.

### Changed
- Split workspace MCP templates by IDE: VS Code uses `servers`, Cursor uses `mcpServers`.

### Fixed
- Fixed upgrade/init output where `.cursor/mcp.json` could be generated with a VS Code-only schema and fail to load in Cursor.

## 3.0.3 - 2026-04-18
### Added
- Switched Cursor workspace MCP config to Cursor-native `mcpServers` schema to prevent startup configuration errors.

### Changed
- Standardized `.agent-context/prompts/init-project.md` to English-only wording to keep prompts and docs consistent.

### Fixed
- Fixed Cursor MCP error: `mcpServers must be an object`.

## 3.0.2 - 2026-04-18
### Added
- Added Cursor MCP workspace configuration at `.cursor/mcp.json` so Cursor can detect the MCP server without manual wiring.

### Changed
- Fixed prompt cross-links in `.agent-context/prompts/*` to resolve correctly from their actual directory.
- Added `docs/DESIGN.md` placeholder so UI bootstrap prompts have a stable local link target.

### Fixed
- Fixed `npm run validate` failures caused by broken internal markdown links.

## 3.0.1 - 2026-04-18
### Changed
- Simplified README: only basic npx command shown, advanced config moved to docs.
- Updated terminology: 'Federated Governance' → 'Strict AI Coding Guidelines' in user-facing docs.
- Moved all init/architect config options to docs/roadmap.md and docs/deep-dive.md.
- Managed-surface prune: upgrade now prunes obsolete managed files by default.
- Bumped version to 3.0.1.

## 3.0.0 - 2026-04-18
### Added
- Added scoped auto-doc sync rollout metadata in documentation boundary audit output (`autoDocsSyncScope`) with explicit phase-1 boundaries for public surface, API contract, and database structure.
- Added timestamped rollout metrics (`rolloutMetrics`) with precision and recall signals for expansion decisions.
- Added deterministic release-gate checks for phase-1 scope lock and rollout metrics presence (`auto-docs-sync-scope-phase1`, `auto-docs-sync-rollout-metrics`).

### Changed
- Changed boundary audit report schema to version `2.1.0` with machine-readable rollout evidence fields.
- Changed validator and smoke/enterprise tests to enforce 018E scope and metrics coverage in CI.
- Changed scaffolder synthesis context to remove dead fields and unused import paths while preserving runtime behavior.
- Changed repository footprint by removing obsolete `.tmpl` project-doc template files from `lib/cli/templates/` after template-free runtime migration.

## 2.5.22 - 2026-04-18
### Added
- Added AI-first bootstrap prompt generation under `.agent-context/prompts/` for dynamic project context synthesis (`bootstrap-project-context.md`) and UI design synthesis (`bootstrap-design.md`) when applicable.

### Changed
- Changed init scaffolding flow from direct docs template rendering to prompt-driven AI synthesis mode while preserving deterministic guardrails and onboarding report linkage.
- Changed Layer 9 compiled context behavior to instruct IDE assistants to execute bootstrap prompts when docs are not materialized yet.
- Changed CLI init summaries and prompt starter guidance to reflect bootstrap-first docs workflow.
- Changed CLI smoke coverage to lock AI-bootstrap behaviors and preserve upgrade stale-template compatibility checks.

## 2.5.21 - 2026-04-18
### Changed
- Changed init architecture selection defaults to request realtime research mode first, with realtime ingestion enabled by default and automatic fallback to deterministic snapshot when trusted realtime payload is unavailable.
- Changed CLI help text to document realtime-first init behavior and explicit snapshot override via `--disable-realtime-research` or `--architect-research-mode snapshot`.
- Changed CLI smoke expectations so project-description-first init now records `requestedMode: realtime` while preserving deterministic fallback behavior when realtime evidence is missing.
- Changed roadmap execution note for V3.0-013 to reflect realtime-first init with guarded fallback semantics.

## 2.5.20 - 2026-04-18
### Added
- Added deterministic stack research snapshot artifact at `.agent-context/state/stack-research-snapshot.json` for reproducible architecture selection baselines.
- Added architect decision evidence output with measurable citations and timestamps (`evidenceCitations`) plus normalized anti-copy design synthesis metadata (`designGuidance`).
- Added CLI controls for stack research engine mode and realtime gating (`--architect-research-mode`, `--enable-realtime-research`, `--architect-realtime-signal-file`).
- Added validator and CLI smoke coverage for snapshot determinism, gated realtime fallback, citation emission, and anti-DESIGN.md-copy policy enforcement.

### Changed
- Changed architecture selection scoring to blend keyword/detection signals with deterministic snapshot metrics and optional trusted realtime boost.
- Changed decision formatting and onboarding report payload to persist research mode metadata (`requestedMode`, `effectiveMode`, gating status, trusted source context).
- Changed roadmap backlog status for `V3.0-013` from planned to done with all acceptance criteria checked.

## 2.5.19 - 2026-04-18
### Added
- Added existing-project detection transparency summaries in init and upgrade flows, including detected stack, active rules baseline, and major constraints.
- Added onboarding report persistence for detection transparency metadata and detection decision outcome under `autoDetection.detectionTransparency`.
- Added validator coverage for detection transparency snippets in init, upgrade, and compiler surfaces.

### Changed
- Changed existing-project init path to include quick confirmation and quick override flow for detected setup in interactive sessions.
- Changed CLI smoke assertions to lock detection transparency output and onboarding decision metadata.
- Changed roadmap backlog status for `V3.0-012` from planned to done with all acceptance criteria checked.

## 2.5.18 - 2026-04-18
### Added
- Added dedicated terminology reference in `docs/terminology-mapping.md` and linked it from README and roadmap.
- Added terminology boundary checks in `scripts/validate.mjs` for developer first-mention patterns and compliance/audit alias restrictions.
- Added CLI smoke assertions to lock terminology migration behavior in help output and validator checks.

### Changed
- Changed primary docs (`README.md`, `docs/deep-dive.md`, `docs/faq.md`, `docs/roadmap.md`) to use developer-friendly aliases with canonical first mention.
- Changed release operations checklist to include explicit compliance terminology boundary guidance.
- Changed roadmap backlog status for `V3.0-011` from in-progress to done with all acceptance criteria checked.

## 2.5.17 - 2026-04-18
### Added
- Added terminology mapping consistency checks in `scripts/validate.mjs` for README and roadmap mapping tables.
- Added CLI smoke assertions for V3.0-011 runtime wording in init and upgrade output.

### Changed
- Changed init and upgrade runtime wording to developer-facing aliases while keeping canonical enterprise term on first mention.
- Changed CLI help and onboarding prompt wording to use `quality checks (guardrails)` and `rules operations (Federated Governance baseline)` phrasing.
- Changed V3.0-011 roadmap status to in-progress and documented no-template dynamic synthesis direction for V3.0-013.

## 2.5.16 - 2026-04-18
### Added
- Added `single-source-lazy-loading-audit` script with machine-readable output to enforce canonical rule source integrity, lazy stack guidance loading, and duplicate-instruction conflict checks.
- Added Single Source of Truth and Lazy Rule Loading governance sections in architecture rules, PR checklist, and review prompt guidance.

### Changed
- Changed context compiler output to include explicit lazy rule-loading policy guidance and persisted onboarding metadata (`ruleLoadingPolicy`) for deterministic init/release behavior.
- Changed release gate diagnostics to execute single-source lazy-loading audit and block release when canonical-source, lazy-loading, or duplicate-instruction checks fail.
- Expanded CLI and enterprise test coverage for V3.0-010 checks and diagnostics.

## 2.5.15 - 2026-04-17
### Added
- Added `explain-on-demand-audit` script with machine-readable output to enforce invisible state management defaults and explicit diagnostic visibility requests.
- Added Invisible State Management (Explain-on-Demand) governance sections in architecture rules, PR checklist, and review prompt guidance.

### Changed
- Changed release gate diagnostics to execute explain-on-demand audit and block release when default state visibility, explicit diagnostic gating, or diagnostic explainability checks fail.
- Changed frontend architecture and frontend excellence rubric to enforce content-language consistency, text contrast/collision safety, and overlap-safe layout positioning for responsive UI outputs.
- Expanded frontend usability audit and automated test coverage for explain-on-demand behavior and UI consistency guardrails so repeated reminders are no longer required.

## 2.5.14 - 2026-04-17
### Added
- Added `rules-guardian-audit` script with machine-readable output for cross-session architecture contract handoff, drift detection, and explicit direction-change confirmation.
- Added Rules as Guardian (Cross-Session Consistency) governance sections in architecture rules, PR checklist, and review prompt guidance.

### Changed
- Changed release gate diagnostics to execute rules-guardian audit in PR-preparation mode and block release when session handoff summary or explicit confirmation policy is missing.
- Expanded validator and test coverage to enforce rules-guardian audit integration and drift-confirmation behavior.

## 2.5.13 - 2026-04-17
### Added
- Added `context-triggered-audit` script with machine-readable output to enforce workflow-aware strict security and performance audits.
- Added explicit context-trigger policy sections to security and performance audit checklists, including strict trigger rules and manual override support.

### Changed
- Changed release gate diagnostics to run context-triggered audit in PR-preparation mode and block release when strict mode is not auto-activated or audit checks fail.
- Changed security and performance governance rules, PR checklist, and review prompt to enforce context-triggered strict audit behavior.
- Expanded CLI smoke and enterprise operations tests to verify strict-mode auto activation, lightweight default for small edits, and manual force strict override.

## 2.5.12 - 2026-04-17
### Added
- Added `documentation-boundary-audit` script with machine-readable output to enforce boundary-aware documentation sync for public surface, API contract, and database structure changes.
- Added explicit Documentation as Hard Rule (Boundary-Aware) section to API documentation governance rules.

### Changed
- Changed release gate diagnostics to execute documentation boundary audit and block release when triggered boundaries miss synchronized documentation updates.
- Changed PR checklist and review prompt guidance to enforce boundary-aware documentation hard blockers on changed scopes.
- Expanded CLI smoke and enterprise operations tests to cover documentation boundary audit and release gate hard-rule diagnostics.

## 2.5.11 - 2026-04-17
### Added
- Added explicit backend universal principles in architecture rules for backend and shared core modules: no clever hacks, no premature abstraction, and readability over brevity.
- Added readability-first and anti-cleverness checks in architecture review and PR review checklists.

### Changed
- Changed refactor prompt guidance to prioritize maintainability over compressed one-liners and avoid premature abstraction.
- Changed release gate diagnostics to validate backend universal principles coverage in rules, review checklist, and refactor guidance sources.
- Expanded enterprise and CLI smoke tests to lock backend universal principles governance coverage.

## 2.5.10 - 2026-04-17
### Added
- Added Frontend Designer Mode auto-activation policy in frontend architecture rules, including UI scope trigger signals and mandatory rubric application.
- Added explicit low-diversity template output policy and Template Diversity and Originality scoring section in the frontend excellence rubric.

### Changed
- Changed frontend usability audit to enforce frontend auto-activation rule snippets plus conversion and anti-template rubric coverage.
- Changed release gate frontend rubric coverage checks to include conversion clarity and low-diversity template policy snippets.
- Expanded smoke-test coverage to assert frontend auto-activation and anti-template governance signals remain enforced.

## 2.5.9 - 2026-04-17
### Added
- Added project-description-first architecture selection engine for `init`, including stack and blueprint proposal, confidence label, uncertainty notes, and one-line alternatives.
- Added selection guardrails for token-budget and timeout envelopes (`--architect-token-budget`, `--architect-timeout-ms`) plus non-interactive project input via `--project-description`.
- Added onboarding report architecture metadata to persist decision state, failure-mode labels, veto outcome, and guardrail usage.
- Added CLI smoke coverage for project-description-first selection flow and repeated-override preference behavior.

### Changed
- Changed init flow to prioritize AI-as-Architect selection when stack/blueprint is not explicitly provided.
- Changed veto handling so user override is applied immediately without debate and can update reusable preference state for repeated overrides.
- Updated README quickstart with project-description-first init example.

## 2.5.8 - 2026-04-17
### Added
- Added Golden Standard init behavior as the default path, so first-run onboarding no longer asks users to choose beginner, balanced, or strict profile levels.
- Added CLI smoke-test coverage to lock Golden Standard default profile behavior and prevent regression.

### Changed
- Updated init command logic to keep legacy profile overrides (`--profile`, `--newbie`, presets, and profile packs) while defaulting to the Golden Standard profile when no explicit profile is supplied.
- Updated CLI help text to document profile flags as legacy overrides and clarify the Golden Standard default path.
- Updated README with explicit upgrade command examples to make update workflow visible again.

## 2.5.7 - 2026-04-17
### Added
- Added final terminology mapping tables to README and roadmap to enforce canonical enterprise naming with developer-facing aliases.
- Added dedicated benchmark reference document in `docs/benchmark-reference.md` so detailed performance and stack-fit data remain available outside onboarding.

### Changed
- Compressed README onboarding to a minimal-start structure centered on one init command, one before/after example, and short MCP quick setup.
- Updated deep analysis backlog to mark `V3.0-001` as done and align current version metadata.

## 2.5.6 - 2026-04-17
### Fixed
- Fixed critical test pollution issue where automated CLI smoke tests recursively wrote mock projects into the user's global Gemini IDE `mcp_config.json`, causing the IDE to crash with directory-not-found errors on ghost entries.

## 2.5.5 - 2026-04-17
### Added
- Added automatic cross-IDE MCP configuration support out-of-the-box (VS Code, Cursor, Zed, and Gemini/Antigravity).
- Added `.gemini/instructions.md` and `.github/copilot-instructions.md` output to dynamic rule compilation to expand native global prompt injection to more IDEs.
- Added Zed IDE contextual awareness confirming `.cursorrules` and `.windsurfrules` are natively read as Assistant prompts.
- Added `--no-mcp-template` CLI flag to strictly opt-out of auto-configuring MCP across IDEs.

### Changed
- Changed `init` default behavior so `--mcp-template` functionality is enabled automatically rather than requiring opt-in.
- Changed MCP template injection to write directly into Antigravity global configurations (`~/.gemini/antigravity/mcp_config.json`) with absolute path enforcement.
- Updated `docs/deep_analysis_and_roadmap_backlog.md` with the newly delivered MCP and multi-IDE alignment states.

### Fixed
- 

## 2.5.4 - 2026-04-17
### Added
- Added roadmap-first V3.0 intake policy in roadmap documentation so optimization, refactor, reliability, and DX ideas are captured as top goals before execution.
- Added MCP auto-start guidance in docs (`chat.mcp.autoStart`, Experimental) while keeping trust/start expectations explicit.

### Changed
- Updated roadmap and README status framing to mark V2.5 as released and move active planning focus to V3.0.
- Changed generated workspace MCP template (`.vscode/mcp.json`) to omit optional `$schema` for compatibility with current VS Code MCP schema validation.
- Changed validation logic to accept workspace MCP config with omitted `$schema` (or trusted `vscode://schemas/mcp` when present).

### Fixed
- Fixed VS Code MCP config warning path (`Property $schema is not allowed`) by aligning template and guidance with current schema behavior.
- Updated smoke test coverage to lock new MCP template shape and prevent schema-warning regression.

## 2.5.3 - 2026-04-17
### Added
- Added init-time memory continuity state generation (`.agent-context/state/memory-continuity.json`) with progressive-disclosure defaults and supported adapter metadata.
- Added `MEMORY CONTINUITY PROFILE` injection into compiled governance outputs (`.cursorrules`, `.windsurfrules`) for retrieval, privacy, and host-compatibility guidance.

### Changed
- Changed `init` defaults so memory continuity is enabled automatically across all init paths (with opt-out), aligned with token optimization default behavior.
- Changed onboarding report output to persist both token optimization and memory continuity status snapshots for post-init traceability.
- Updated CLI help and README command reference with `--memory-continuity` and `--no-memory-continuity` options plus local/CLI/cloud host compatibility notes.

### Fixed
- Added smoke-test coverage to lock default-on memory continuity behavior, opt-out behavior, and compiled-rule profile injection against regression.

## 2.0.27 - 2026-04-17
### Added
- Added cross-agent memory continuity pilot core with provider-agnostic schema (`.agent-context/state/memory-schema-v1.json`) and adapter contract (`.agent-context/state/memory-adapter-contract.json`) for Claude Code, Gemini CLI, and VS Code chat hosts.
- Added reusable memory continuity utilities in `lib/cli/memory-continuity.mjs` for observation normalization, privacy redaction, lightweight index generation, and selective hydration.
- Added continuity benchmark command `npm run benchmark:continuity` backed by `scripts/memory-continuity-benchmark.mjs`, with machine-readable artifact output in `.agent-context/state/memory-continuity-benchmark.json`.

### Changed
- Updated benchmark evidence bundling to include continuity benchmark execution, continuity thresholds, and memory schema/adapter raw input snapshots.
- Updated enterprise operations tests, repository validator required-files checks, and README benchmark quickstart/docs coverage for the new continuity benchmark path.
- Updated roadmap and deep backlog execution status to mark V2.5 cross-agent memory continuity pilot tracks as delivered.

### Fixed
- Fixed continuity benchmark token-efficiency modeling so session-start index payload reflects compact progressive disclosure instead of oversized summaries.
- Fixed continuity benchmark threshold calibration to align with realistic hydration behavior while preserving strict relevance and privacy-safety checks.

## 2.0.26 - 2026-04-16
### Added
- Added domain-first init selection upgrades with web frontend/backend stack split, dual-blueprint capture, and existing-project auto stack reuse.
- Added runtime environment awareness in init (`auto`, `linux-wsl`, `linux`, `windows`, `macos`) with auto-detection and override support.
- Added Docker strategy capture in project discovery (`none`, `dev-only`, `prod-only`, `both`) plus dynamic AI guidance for separate development and production container paths.
- Added frontend excellence governance assets with `.agent-context/review-checklists/frontend-excellence-rubric.md` and `.agent-context/rules/docker-runtime.md`.

### Changed
- Updated compiler/onboarding outputs to preserve additional stacks and additional blueprints, including `LAYER 3A: ADDITIONAL BLUEPRINT PROFILES` in compiled rules.
- Updated project scaffolding templates (version `1.2.0`) to include runtime/container metadata and dynamic Docker guidance text for generated project docs.
- Updated release, validation, and frontend usability audit scripts to enforce frontend excellence rubric coverage and Docker runtime rule availability.
- Updated README and roadmap/backlog docs to reflect the new init orchestration, frontend excellence track progress, and release status.

### Fixed
- Fixed template rendering issues by replacing nested conditional Docker guidance blocks with precomputed context placeholders.
- Fixed forbidden-content release gate failure caused by blocked wording in scaffolder guidance text.
- Added and aligned smoke/enterprise test coverage for scope filtering, runtime normalization, additional blueprint propagation, and frontend rubric gate enforcement.

## 2.0.25 - 2026-04-16
### Added
- Added benchmark gate diagnostics embedding in `scripts/release-gate.mjs` so release reports include threshold-gate evidence.
- Added benchmark anti-regression execution to `.github/workflows/benchmark-detection.yml` with uploaded `benchmark-gate-report.json` artifact.
- Added enterprise release-gate assertions for benchmark threshold and regression-block checks in `tests/enterprise-ops.test.mjs`.

### Changed
- Updated V2.5 Phase 2.5.2 Track 3 roadmap checklist to completed status for release-blocking benchmark integration.
- Updated deep analysis backlog snapshot date/version metadata for the 2.0.25 release cut.

### Fixed
- Fixed detailed discovery flow to fall back to folder name when project name is left empty during docs scaffolding.
- Added smoke-test regression coverage to prevent future fallback breakage in project discovery.

## 2.0.24 - 2026-04-16
### Added
- Added quick-choice project discovery mode for empty-target `init` flow with preset feature bundles and optional custom typing.
- Added prompt starter examples at the end of docs scaffolding to help users continue via short iterative prompts.
- Added documentation quality drift artifact tooling with `scripts/docs-quality-drift-report.mjs` and CI workflow `.github/workflows/docs-quality-drift-report.yml`.

### Changed
- Updated discovery prompts to explicitly allow non-English user answers while keeping CLI prompts in English.
- Updated choice input UX so pressing Enter selects the first option by default for faster onboarding.
- Updated README onboarding and reporting sections to stay in sync with quick discovery mode, language behavior, and docs quality drift reporting commands.
- Updated roadmap backlog to mark documentation-quality drift CI artifact as completed.

### Fixed
- Fixed onboarding friction by reducing required free-text answers in fresh-project setup without removing custom-answer flexibility.
- Added enterprise/validator coverage for docs-quality-drift script and workflow to prevent regression in release checks.

## 2.0.23 - 2026-04-15
### Added
- Added cross-tool integration guidance in `docs/integration-playbook.md` for GitHub Actions, Jenkins, VS Code, and JetBrains.

### Changed
- Updated Layer 9 project-context governance so latest user prompts drive feature scope while architecture constraints remain anchored to project docs unless migration is explicitly requested.
- Updated roadmap backlog and README Further Reading to include the new integration playbook and mark the adoption/integration track item complete.

### Fixed
- Fixed ambiguity between static init-generated docs and dynamic prompt-driven implementation by enforcing same-change docs synchronization when scope evolves.
- Expanded CLI smoke assertions to verify compiled rules include the dynamic-scope and docs-alignment guidance.

## 2.0.22 - 2026-04-15
### Added
- Added an init-time informational message when project config requests non-English docs but output remains English unless explicitly overridden with `--docs-lang`.

### Changed
- Changed project documentation scaffolding behavior to keep English as the default output language for writing-scope consistency.
- Updated CLI smoke coverage to assert English-default doc generation even when project config includes `docsLang: id`.

### Fixed
- Fixed implicit language override behavior where `project-config` `docsLang` could change output language without explicit CLI intent.

## 2.0.21 - 2026-04-15
### Added

- Added CLI smoke coverage for project-config scaffolding, same-run Layer 9 compilation, and project-doc template staleness reporting.

### Changed
- Updated project-doc templates to use dynamic `{{templateVersion}}` headers.
- Updated roadmap backlog to mark Track 9 template-versioning/staleness detection and docs-lang (`en`, `id`) support as complete.

### Fixed
- Fixed init flow sequencing so project docs are scaffolded before compile, allowing Layer 9 PROJECT CONTEXT to appear in the same init run.
- Fixed non-interactive init regression by skipping default scaffolding prompts unless explicitly configured.
- Fixed upgrade staleness detection to parse both `Template version:` and `Versi template:` headers.

## 2.0.20 - 2026-04-15
### Added
- Added Auto-Docs-on-Init project scaffolding logic (`lib/cli/project-scaffolder.mjs`).
- Added CLI scaffolding flags (`--scaffold-docs`, `--no-scaffold-docs`, `--docs-lang`, `--project-config`) to the `init` command.
- Added dynamic parameterized context templates (`project-brief.md.tmpl`, `architecture-decision-record.md.tmpl`, `database-schema.md.tmpl`, `api-contract.md.tmpl`, `flow-overview.md.tmpl`).
- Added Layer 9 (Project Context) injection into internal state and compiled rulebook workflows.
- Added `scripts/bump-version.mjs` script for automated version bumping across `package.json`, `CHANGELOG.md`, `.cursorrules`, `.windsurfrules`, and roadmap backlog.

### Changed
- Standardized cross-IDE instructions (`AGENTS.md`, `.gemini/instructions.md`, `.github/copilot-instructions.md`) to point to 9 knowledge layers instead of 8.
- Updated docs/deep_analysis_and_roadmap_backlog.md to mark Track 9 Project Context Scaffolding items as complete.

### Fixed
- Fixed CLI adapter canonical hash drift mismatches during validation test suites.

## 2.0.19 - 2026-04-15
### Added
- Added profile and preset guidance matrix for common usage patterns in `docs/v2-upgrade-playbook.md`, including practical command templates for startup, platform, regulated, and enterprise API scenarios.

### Changed
- Updated roadmap backlog status to mark profile/preset adoption guidance as completed in V2.5 track 5.
- Updated README further-reading description to highlight profile and preset guidance in the V2 upgrade playbook.

## 2.0.18 - 2026-04-15
### Changed
- Clarified API documentation scope behavior so style findings are advisory by default and must not block same-commit endpoint documentation sync.
- Updated documentation checklist and review prompt to treat scope-style findings as advisory unless they hide factual or contract issues.
- Refactored dynamic context compiler output from monolithic inline dumps into a compact modular bootstrap index that still enforces full layer loading.
- Added benchmark quickstart path in README and marked roadmap adoption quickstart item complete.

### Added
- Added explicit sync-rule precedence text in API docs governance to keep contract updates blocking while style polish stays non-blocking.

## 2.0.17 - 2026-04-14
### Added
- Added writer-judge lane configuration file `.agent-context/state/benchmark-writer-judge-config.json` for independent model routing and blind review mode.
- Added `scripts/benchmark-writer-judge-matrix.mjs` and `npm run benchmark:writer-judge` to emit side-by-side writer-judge matrix reports.
- Added generated state artifact `.agent-context/state/benchmark-writer-judge-matrix.json` as the machine-readable snapshot for V2.5.1 track 2.
- Added enterprise operations test coverage for writer-judge matrix output contract in `tests/enterprise-ops.test.mjs`.

### Changed
- Updated `scripts/validate.mjs` required-file checks to include writer-judge script and configuration assets.
- Updated reproducibility command examples, README benchmark documentation, and roadmap backlog checklist to include writer-judge matrix execution and outputs.

## 2.0.16 - 2026-04-14
### Changed
- Refined Human Writing Standard wording to be clearer and more natural while keeping strict enforcement for formal artifacts.
- Added explicit guidance to state the main point first and keep explanations short by default.
- Replaced harsher section phrasing with professional non-negotiable language for consistency across governance docs.

## 2.0.15 - 2026-04-13
### Added
- Added enterprise operations test coverage for benchmark evidence bundle output contract (`tests/enterprise-ops.test.mjs`) to keep release evidence claims fully verifiable.

## 2.0.14 - 2026-04-13
### Added
- Added V2.5.1 reproducibility baseline assets: `.agent-context/state/benchmark-reproducibility.json` and `scripts/benchmark-evidence-bundle.mjs`.
- Added `benchmark:bundle` command to emit machine-readable benchmark evidence bundles with rerun instructions, rubric inputs, and output snapshots.
- Added enterprise test coverage for benchmark evidence bundle output contract.

### Changed
- Updated Laravel guidance to Laravel 13 target state while explicitly documenting Laravel 12 compatibility during staged upgrades.
- Reordered V2.5 backlog execution tracks into checklist format by phase and moved Documentation and Explanation Standards into V2.5 critical scope.
- Updated validation required-file checks for new benchmark reproducibility assets.

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
- Team profile packs for `startup`, `regulated`, and `platform` with built-in CLI definitions and migration-safe fallback behavior.
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
- Smart auto-detection for existing projects (stack + blueprint detections).
- Profile presets (`beginner`, `balanced`, `strict`).
- `llm-judge-threshold.json` to handle LLM review severities.
- Split documentation paths (FAQ and Deep Dive).
- Refactored all internal tools from Bun to Node-native.
