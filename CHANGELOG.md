# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## Unreleased
### Changed
- Split `lib/cli/detector/design-evidence.mjs` into focused submodules (`design-evidence/{constants,file-traversal,utility-helpers,structured-attribute-evidence,summary,collector}.mjs`). The aggregator preserves the public exports (`collectFrontendDesignEvidence`, `FRONTEND_SCAN_IGNORE_DIRECTORY_NAMES`); behavior is unchanged.
- Split `scripts/llm-judge.mjs` into focused submodules under `scripts/llm-judge/` (constants, checklist-loader, diff-collection, prompting, providers, verdict). The CLI entry file keeps the same flags and exit semantics; behavior is unchanged.
- Split `lib/cli/detector.mjs` into focused submodules under `lib/cli/detector/` (constants, workspace-scan, ui-signals, stack-detection). The aggregator preserves the public exports (`collectProjectMarkers`, `detectProjectContext`, `detectUiScopeSignals`, `buildDetectionSummary`, `formatDetectionCandidates`); behavior is unchanged.

### Fixed

## 3.0.50 - 2026-05-15
### Changed
- Strengthened backend and API governance with explicit liveness/readiness/startup health semantics, domain-fit contract review, command-oriented endpoint guidance, cache and rate-limit documentation, and idempotency requirements for unsafe mutations.
- Added deeper persistence, observability, recovery, security, naming, and testing guidance covering index rationale, delete and tenancy semantics, structured logs, retry/fallback strategy, public-surface security decisions, why-focused comments, and failure-path tests.
- Expanded UI craft governance so generated design contracts treat color and typography as explicit systems, including perceptual palette curves, theme persistence, accessible text-on-color pairs, variable typography choices, and font loading strategy.

## 3.0.49 - 2026-05-14
### Changed
- Added a compact implementation craft layer to UI design bootstrap guidance so agents record CSS decisions for color space, typography scale, spatial rhythm, motion budget, and anti-attractor checks before UI code.
- Added CSS production hardening to frontend architecture governance for overflow, responsive recomposition, motion timing, modern CSS technique selection, and implementation drift signals.
- Extended generated design-intent seeds, completeness validation, AI synthesis prompts, frontend audits, and smoke coverage so the new craft fields are enforceable instead of prompt-only.

## 3.0.48 - 2026-05-14
### Changed
- Made `AGENTS.md` the canonical installed instruction source and reduced the default root surface to `AGENTS.md`, `CLAUDE.md`, `GEMINI.md`, and `.agent-context/`.
- Updated init, upgrade, optimize, package publishing, docs, audits, validators, and smoke tests to stop generating compiled and legacy tool-specific instruction files by default.
- Refreshed README guidance so setup, MCP opt-in behavior, managed legacy cleanup, and the release checklist match the current CLI behavior.

### Fixed
- Removed the stale source-repo override and IDE instruction surfaces so the repository matches the compact distribution contract while preserving active GitHub workflow files.
- Retired the validator requirement for `.agent-override.md` and locked the new retired-override contract in smoke tests.

## 3.0.47 - 2026-05-14
### Changed
- Added `docs/doc-index.md` to project bootstrap guidance as the compact routing map for generated project docs, while keeping PRD, SRS, technical-design, and separate ERD files conditional on project evidence.
- Updated init and upgrade flows to ensure `.agentic-backup/` is ignored in the target repository root `.gitignore` whenever local backup artifacts are created.

### Fixed

## 3.0.46 - 2026-05-13
### Added

### Changed
- Added anti-room-anchor guidance so generated design contracts avoid `room`, `darkroom`, `counting room`, and similar place metaphors unless the product truly depends on that physical model.
- Clarified external website inspiration boundaries: references may inform constraints, mechanics, and quality bars, but must not be copied as layout, palette, component skin, visual metaphor, or brand posture.
- Tightened runtime and styling neutrality so fresh web projects do not default to Next.js, Tailwind-only styling, shadcn/ui, or from-scratch framework assembly by habit, while still allowing those choices when they are the strongest project fit.

### Fixed

## 3.0.45 - 2026-05-12
### Changed
- Added a universal root `README.md` gate so fresh and existing projects have a public and developer entrypoint before implementation.
- Updated project bootstrap guidance so README content stays public and developer friendly, plain, and free of secrets, internal agent notes, or governance policy dumps.
- Added adaptive documentation growth guidance so docs stay current with project changes without creating extra files unless the topic is stable, distinct, or too large for core docs.

## 3.0.44 - 2026-05-09
### Changed
- Rebalanced dependency and performance governance so maintained lightweight libraries can be selected dynamically when they improve accessibility, UX, correctness, maintainability, or delivery speed.
- Added dynamic UI foundation guidance so generated design contracts do not default to shadcn, native-only, Tailwind-only, or component-kit styling by habit.
- Added a design flexibility layer so generated design contracts separate locked outcomes from flexible expression, keeping exact tokens, candidate signature moves, literal anchor artifacts, and component skins from becoming accidental hard requirements.
- Tightened UI design governance so line, scanline, and calibration-mark backgrounds are rejected as decorative wallpaper unless they serve a named product function.
- Tightened UI governance so generated design contracts reject testing/demo/placeholder UI copy and terminal-only core user flows unless the product scope explicitly justifies them.
- Strengthened Docker governance so selected development/production Docker lanes require materialized assets and runbooks, not docs-only acknowledgment.

### Fixed
- Clarified that measurement, calibration, crop, route, timeline, and inspection marks belong to task-bound overlays or controls, not page or hero backgrounds.

## 3.0.43 - 2026-05-07
### Added
- 

### Changed
- 

### Fixed
- 

## 3.0.42 - 2026-05-03
### Changed
- Made UI governance default to agent-chosen ambition for broad screens and redesigns, so expressive motion, spatial hierarchy, and distinctive composition are considered without waiting for the user to say "rich".
- Added the Brave Redesign Default and expressive-path research requirement to the design bootstrap prompt.
- Synced thin adapter hashes after the canonical instruction update.

### Fixed
- Added old-design regression checks so broad redesigns cannot pass as simplified versions of the previous composition with animation, media, depth, or interaction density removed.

## 3.0.41 - 2026-05-02
### Changed
- Retired the static external benchmark watchlist flow so benchmark intelligence no longer depends on stale offline stack-selection snapshots.
- Archived historical v1.x/v2.x planning docs and moved older changelog history into `docs/archive/CHANGELOG-archive.md`.
- Clarified documentation around active state, benchmark evidence, and roadmap scope after removing obsolete research/watchlist surfaces.

### Fixed
- Updated validation, release gates, docs-quality checks, and operations tests to match the archived docs and retired watchlist behavior.

## 3.0.40 - 2026-04-30
### Changed
- Added a mandatory complexity budget rule so agents prefer fewer moving parts only when behavior, safety, clarity, and maintainability stay intact.
- Added the complexity budget to the architecture rule, refactor prompt, and PR checklist.

### Fixed
- Updated the bump script so legacy root adapter release metadata stays aligned with package versions.

## 3.0.39 - 2026-04-30
### Changed
- Refreshed repo-local agent context in `.agent-context/state/architecture-map.md`, `.agent-context/state/dependency-map.md`, and `onboarding-report.json`.
- Consolidated upgrade setup constraints through the shared init-detection helper and removed an unused init-selection export.
- Clarified that grid or line backgrounds are review findings unless they serve a named product function.
- Documented the GitHub owner versus npm package scope to reduce contributor confusion.

### Fixed
- Synced `package-lock.json` with the package release version and taught `scripts/bump-version.mjs` to keep it aligned.
- Added validation that blocks npm lockfile drift and accidental `bun.lock` package-manager ambiguity.
- Removed stale V2 evidence-bundle validation and the obsolete Bun lockfile.

## 3.0.38 - 2026-04-30
### Changed
- Started Phase 11 repository hygiene by narrowing the package allowlist so volatile local state is not published accidentally.
- Renamed weekly governance trust output from skill-oriented terms to governance-surface terms.
- Split design-intent contract validation out of the large `design-contract.mjs` scaffold entrypoint while preserving the existing public exports.
- Split the broad design/detection CLI smoke suite into focused sub-suites for design seeds, UI detection, upgrade design seeding, and optimization defaults.
- Split filesystem helpers, CLI prompt helpers, and managed-surface analysis out of `utils.mjs` while preserving the existing utility entrypoint.
- Split init runtime, project-context, design seed, and setup decision helpers out of `lib/cli/commands/init.mjs` while preserving the existing `runInitCommand` entrypoint.
- Added `npm run clean:local` for explicit cleanup of ignored local reports, backups, benchmarks, and active-memory state.
- Classified `.agent-context/state` artifacts and converted regenerated benchmark, trend, weekly governance, quality, token, and memory-continuity reports into ignored local outputs.
- Reduced duplicated anti-generic UI wording by centralizing design-contract drift signals and shortening active prompt/rule prose without making palette guidance color-prescriptive.

### Removed
- Removed stale skill marketplace artifacts: `input.txt`, `.agent-context/marketplace/trust-tiers.json`, `docs/skill-incorporation-playbook.md`, and the orphaned skill compatibility helper.

## 3.0.37 - 2026-04-27
### Changed
- Strengthened frontend design governance with AI color and motion/spatial courage audits so agents must reject template-looking palettes, explain product-derived color behavior, and justify any omission of rich motion, 3D, canvas, or spatial interaction.
- Compact canonical instructions and design governance into shorter imperative gates with mechanical line-count checks.
- Added generated thin adapters for Claude, Gemini, Cursor, Windsurf, and GitHub path-specific instructions.
- Converted legacy root `.cursorrules`, `.windsurfrules`, and generated `.clauderc` output into thin compatibility adapters that point to `.agent-instructions.md`.
- Kept `.agent-instructions.md` as the only compiled rulebook and preserved user-owned instruction entrypoints during upgrade.

## 3.0.36 - 2026-04-27
### Changed
- Added an AI-safe UI review gate to frontend governance, generated design prompts, and `docs/design-intent.json` seeds so template-looking card/grid/logo/palette defaults are treated as genericity drift.

## 3.0.35 - 2026-04-27
### Changed
- Treat fresh fullstack projects as UI-bearing during docs scaffolding so `docs/design-intent.json` is seeded, UI docs are listed in the bootstrap prompt, and `docs/api-contract.md` remains in scope.
- Added upgrade coverage for already-installed fullstack workspaces so missing `docs/design-intent.json` is restored from the recorded onboarding project scope.

## 3.0.34 - 2026-04-27
### Changed
- Clarified documentation-first governance so agents must materialize required project docs in English by default and stop before application, firmware, or UI implementation unless the user asks or approves.

## 3.0.33 - 2026-04-27
### Changed
- Added a UI Motion/Palette Decision readability gate to canonical instructions, thin adapters, frontend governance, and design-intent seeds so agents must name motion density, interaction states, palette autopilot risk, and 3D/canvas fit before UI implementation.
- Clarified that product categories are heuristics rather than style presets, keeping motion density and palette choices tied to task, content density, brand intent, performance, and accessibility evidence.

## 3.0.32 - 2026-04-26
### Changed
- Added scoped Bootstrap Receipt governance so non-trivial coding, review, planning, and governance work must name loaded files, selected rules, skipped rules, unreachable files, and validation plan before implementation output.
- Synced thin adapters with Bootstrap Receipt guidance and extended validation coverage so adapter output cannot drift from the canonical receipt contract.
- Added a frontend 3D and spatial experience boundary so immersive UI can be primary when useful without hiding navigation, content, user actions, performance, accessibility, or non-3D fallbacks.

## 3.0.31 - 2026-04-26
### Changed
- Clarified dependency governance so agents may add new packages when they create a better practical tradeoff than custom implementation.
- Reframed dependency decisions around efficiency, delivery time, correctness, maintainability, and avoiding unnecessary in-house code instead of defaulting to dependency avoidance.
- Synced thin instruction adapters after the canonical `.instructions.md` policy update.

## 3.0.30 - 2026-04-25
### Added
- Added the `project-context` layer to root `mcp.json` so MCP metadata reflects the current 9-layer governance model.

### Changed
- Synced root MCP knowledge metadata with the current rule, prompt, state, and scoped-loading surface: 15 rules, 4 prompts, and current state inventory.
- Updated the MCP full-knowledge workflow wording from eager load-all injection to scope-first relevant-layer injection.

### Fixed
- Fixed stale MCP metadata that still described the old 8-layer model and omitted the UI design bootstrap prompt.

## 3.0.29 - 2026-04-25
### Added
- Added deterministic UI token derivation through `conceptualAnchor.anchorReference` plus top-level `derivedTokenLogic` for color, spacing, typography, and motion decisions.
- Added `libraryResearchStatus` and `libraryDecisions[]` so unverified UI libraries stay visible with explicit fallbacks instead of becoming hallucinated imports.
- Added a compiler-generated UI task anchor header when `docs/design-intent.json` is present, keeping the active anchor, signature motion, and typographic decision at the top of compiled context.
- Added release-gate coverage for design-intent completeness so token derivation and library verification rules are checked deterministically.

### Changed
- Updated frontend bootstrap prompts and generated design prompts with token derivation and library research protocols.

### Fixed
- Avoided brittle prose matching by validating exact `anchorReference` IDs instead of checking whether derivation text includes the anchor name.

## 3.0.28 - 2026-04-25
### Changed
- Made memory-continuity completion behavior explicit: agents must refresh `.agent-context/state/active-memory.json` directly before final responses when material project progress happened.
- Added active-memory completion checks to the PR checklist and CLI smoke coverage so seeded snapshots do not stay empty after meaningful work.
- Strengthened frontend design governance with a creative commitment gate requiring a concrete real-world anchor reference, signature motion, and typographic decision before broad compliance review or UI implementation.

### Fixed
- Clarified that `active-memory.json` is a seed plus agent-owned continuity snapshot, not a user-run command flow or automatic repo runtime.
- Reduced safe-default UI drift by rejecting anchors described only with generic quality words such as modern, clean, premium, expressive, minimal, or bold.

## 3.0.27 - 2026-04-25
### Changed
- Added backend governance posture to the weekly governance report so architecture, security, data access, error handling, API contracts, testing, performance, idempotency, and risk-map surfaces are verified alongside frontend governance.
- Kept backend/API governance global and stack-agnostic by routing through domain rules instead of adding framework-specific adapters or stack-detection branches.
- Strengthened backend rule and review surfaces for zero-trust input, bounded list reads, N+1 prevention, transaction safety, centralized API errors, mutation idempotency, and behavior-focused API tests.
- Synced Index and Lazy Loading checks around global domain governance so runtime evidence stays separate from stack-specific governance adapters.


---

## Historical Releases

Older releases are documented in the [Changelog Archive](docs/archive/CHANGELOG-archive.md).
