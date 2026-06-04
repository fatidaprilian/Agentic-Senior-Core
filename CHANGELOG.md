# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## Unreleased

## 4.3.8 - 2026-06-04
### Changed
- Removed deprecated backend rules `naming-conv.md`, `git-workflow.md`, and `efficiency-vs-hype.md` for better token optimization.
- Condensed `architecture.md` to remove redundancy (ARCH-008).
- Generalized frontend and backend rules to be truly framework-agnostic.
- Cleaned up rule fixtures and rule triggers to maintain validation correctness.

## 4.3.7 - 2026-06-01
### Changed
- Removed remaining active `design-intent.json` requirements from UI bootstrap, review, refactor, and PR checklist guidance.
- Updated design direction docs to use `docs/DESIGN.md` as the single UI design contract under the compact Context Ops flow.

## 4.3.6 - 2026-06-01
### Changed
- Synchronized npm release metadata for the 4.3.6 package version.
- Removed obsolete validation output artifacts from the release tree.

## 4.3.5 - 2026-06-01
### Changed
- Removed conflicting files check from `init` command so that it overwrites `CLAUDE.md`, `GEMINI.md`, and other bridge adapters instead of throwing an error when re-initializing.
- Purged final traces of `design-intent.json` from `AGENTS.md` universal SOP gates.

## 4.3.4 - 2026-06-01
### Changed
- Adopted 2026 Context Ops Paradigm for UI design: `bootstrap-design.md` is now a compact Tier 1 aesthetics prompt (~400 tokens), removing JSON compliance theater.
- Restructured `frontend-architecture.md` into Tier 2 engineering invariants only, completely removing `FE-001` to `FE-008` gates.
- Dropped strict `design-intent.json` generation requirements from CI validation scripts.
- Deprecated `audit:design-anti-repeat` command and completely purged `design-intent.json` generation from CLI init and upgrade flows.

## 4.3.3 - 2026-06-01
### Changed
- Re-compressed the `.agent-context/rules/` directory (backend rules) to extreme token efficiency by stripping rigid text-matching validation requirements from the internal tests.
- Re-enabled anti-AI slop requirements (no emojis, succinct code) in the newly compressed rules.

## 4.3.2 - 2026-05-28
### Fixed
- Removed explicit mentions of Godly.website and Awwwards from `research-design.md` to prevent LLMs from hallucinating discovery platform URLs as direct product sources.

## 4.3.1 - 2026-05-28
### Added
- Added new ASCX token-saving wrappers for `npm install` (and `yarn/pnpm` equivalents) and `tsc` to drastically compress output noise while preserving critical failure logs.
- Added `npm run build` wrapper documentation and usage to `AGENTS.md`.

### Changed
- Replaced the static 7-category design routing with an Adaptive Default Detection Protocol to prevent AI UI convergence.
- Added a Pre-Emit Identity Check in `bootstrap-design.md` to flag and rewrite overly generic/default UI structures.
- Expanded the Anti-Repeat Ledger to track structural fingerprints in addition to palette and typography.

## 4.3.0 - 2026-05-27
### Changed
- Clarified Reference Routing in `research-design.md` to explicitly forbid using gallery homepages (e.g., Godly.website, Awwwards) as anchors, requiring the agent to drill down and fetch a specific featured product URL instead.

## 4.2.9 - 2026-05-27
### Changed
- Simplified UI design research prompts (`research-design.md`) and the `design-intent.json` contract seed to remove the morphological matrix, uncomfortable combinations, and 5-anchor generation ceremony. Retained the product-reading, explicit category-cliche rejection, and specific anchor references.

## 4.2.8 - 2026-05-26
### Changed
- Strengthened Universal SOP hard gates to block application code implementation when required project documentation (`flow-overview.md`, `database-schema.md`, `api-contract.md`) is missing.
- Mandated Mermaid.js as the default diagram format for all documentation and forbade PlantUML, ASCII art, Graphviz DOT, and Structurizr DSL to improve LLM token efficiency and consistency.

## 4.2.7 - 2026-05-24
### Changed
- Removed famous brand references (Apple, Linear, Stripe) from `bootstrap-design.md` prompts and replaced them with generic placeholders to prevent unintentional AI anchor bias.
- Translated Indonesian Reference Routing instructions in `research-design.md` to English to maintain language consistency across the project.

## 4.2.6 - 2026-05-24
### Changed
- Shifted UI design research governance from physical-first to digital-first, allowing the agent to use premium contemporary digital products as concrete anchors (e.g., specific interactions on Apple M3 page or Linear).
- Expanded Reference Routing to explicitly direct the agent to check Awwwards, Godly.website, and Layers.to for state-of-the-art UI research.
- Refined UI design research governance to safely handle existing UI projects by explicitly capturing current UI state as the anchor to avoid destructive re-designs during additive UI tasks.
- Made Reference Routing more adaptive by allowing agent fetching from other modern digital product equivalents instead of strictly limiting to a hardcoded domain list, while explicitly blocking low-signal sources like Wikipedia and Dribbble.

## 4.2.5 - 2026-05-24
### Changed
- Added hard completion gates and structural validation to `lib/cli/project-scaffolder/design-contract.mjs` to enforce research compliance before UI implementation.
- Made UI design research freshness rolling-current from the session date instead of relying on fixed year labels.
- Marked research vocabulary such as evidence, dossier, anchor, category-code, morphology, rename-test, and source-freshness as internal-only so generated frontend output stays product-native.
- Added generated design-contract, validation, frontend audit, and test coverage for unbiased design freshness and internal research vocabulary boundaries.
- Clarified global CLI installation usage in README and init output for direct `ascx` / `agentic-senior-core` commands.

## 4.2.4 - 2026-05-23

### Added
- Added option to keep AI instructions and governance files local-only. Appends `.agent-context/`, `AGENTS.md`, `CLAUDE.md`, `GEMINI.md`, and `mcp.json` to `.gitignore` to prevent pushing to GitHub. Supported via `--local-only` flag and interactive setup interview prompt.

## 4.2.3 - 2026-05-23

### Changed
- Clarified the `context` command instruction in `AGENTS.md` by explicitly including the `"<task_description>"` placeholder to prevent initial execution failures.

## 4.2.2 - 2026-05-23

### Changed
- Tightened `AGENTS.md` instruction framing: Default Activation is now a set of strict imperative binary checks (`Always`, `Never`, `Skip only for`); Knowledge Inventory Checklist requires a hard stop if files are unreachable.
- Cleaned up duplicate skip conditions in the Bootstrap Receipt section and corrected "MCP validation" to "Project validation" in the Definition of Done.

## 4.2.1 - 2026-05-23

### Changed
- Made init and upgrade write explicit `.gitignore` entries for generated ASCX runtime artifacts and clarified the default Adaptive Context, ASCX, and Compact Natural activation cues.
- Upgrade now backfills missing default token optimization state for older initialized repositories while preserving an existing token-optimization opt-out.
- Refreshed repository-health documentation so benchmark references, CLI contract docs, and runtime token-saver plans match the current ASCX and Compact Natural Mode surface.
- Updated the repo-local onboarding report version to the current package version.

### Removed
- Removed empty `.gitkeep` placeholders from benchmark directories that now contain tracked files.
- Removed archived v3-to-v4 migration helper files whose own archive README marked them as historical-only and not runnable in place.

## 4.2.0 - 2026-05-22

### Added
- Added the `ascx` token saver command wrapper (`bin/ascx.js` CLI prefix) with custom, high-signal adapters for common commands:
  - `git status`: filters untracked/staged paths and presents an optimized clean summary for agent parsing.
  - `git diff`: compresses large diffs (summarizes counts, renames, additions/deletions, and patterns like lockfiles/vendor) while passing small, high-fidelity changes through raw to maximize context precision.
  - `npm test`: captures execution logs, normalizes progress/interactive prompts, and provides structured completion summaries.
- Added `Compact Natural Mode` response compression (`.agent-context/prompts/compact-natural-mode.md`) to guide AI agents into writing professional, concise, CITATION-anchored prose and eliminating verbose fillers/politeness.
- Added judged token benchmarks for response compression (`npm run benchmark:compact-natural`) and command token reduction (`npm run benchmark:ascx`).
- Added full test coverage for the `ascx` command wrapper, adapters, and `compact-natural-mode` integration (203/203 tests passing).

### Changed
- Integrated `Compact Natural Mode` as the default final-response contract in canonical instructions `AGENTS.md`.
- Updated CLI scaffolding (`init` and `upgrade`) to copy the new response compression prompts recursively and auto-enable optimization defaults.
- Onboarding and metadata generation now record `responseCompression.defaultOn: true`.

## 4.1.0 - 2026-05-17

### Changed
- Tagline shifted from "Force your AI Agent..." to "Change your AI Agent..." in `README.md` and `package.json` description.
- AGENTS.md Layer 1 line updated to "21 Files"; rule list extended with the six new entries below; backend routing block re-split so that `observability.md` is loaded for single-endpoint, auth, and queue work in addition to multi-service distributed boundaries (previous merge under-routed observability for single-service tasks). AGENTS.md remains within the 180-line footprint cap.
- Coverage validator cap for `.agent-context/rules/frontend-architecture.md` raised from 140 to 180 lines in `scripts/validate/coverage-checks.mjs` to fit the four new FE sections; the cap stays bounded to match `bootstrap-design.md` and `AGENTS.md`.
- README adds a "Why this exists" section and a "Long-Term Stability" sub-section explaining the invariant / outcome / freshness-criterion phrasing the rules use, the three-year stability promise, and the freshness anchor in each rule's citation block.

### Added
- Six new technology-neutral backend rule files under `.agent-context/rules/`:
  - `observability.md` (`OBS-*`, 5 sections OBS-001..005). Defines observability as structured per-request events; treats metrics, logs, and traces as derived views. Rejects unbounded-cardinality metric labels, vendor-proprietary instrumentation when an open standard exists, logging of secrets / tokens / PII / full request bodies, paging on symptoms without user impact (SLO + error-budget intent required), and signal substitution. Cites W3C Trace Context, OpenTelemetry semantic conventions, RFC 5424, OWASP ASVS.
  - `resilience.md` (`RES-*`, 7 sections RES-001..007). Requires explicit timeouts derived from the user-facing operation's worst-acceptable latency, deadline propagation, bounded retries with backoff and jitter on idempotent operations only, dependency isolation with bounded pools, fail-fast on unhealthy dependencies as an OUTCOME (not a named pattern), explicit graceful-degradation per dependency, and observable backpressure. Background reading: AWS Well-Architected Reliability Pillar (REL05), Google SRE Workbook chapters on overload and cascading failures.
  - `migrations.md` (`MIG-*`, 7 sections MIG-001..007). Requires expand-contract / parallel-change for any schema change touching live data, the deploy-ordering invariant, online or non-blocking migration whenever a DDL operation would hold a lock longer than the service's acceptable request-latency threshold (relative threshold, not a fixed row count or wall-clock duration), reversibility OR a documented forward-only recovery plan, idempotent and resumable backfills separate from DDL, and a fixed risk-documentation field set per migration ticket.
  - `background-jobs.md` (`JOB-*`, 9 sections JOB-001..009). Distinguishes scheduled / queued / recurring stream / one-shot job shapes; requires per-job ownership, runtime budget, runbook, job-level idempotency, lease and checkpoint and graceful-shutdown handling for long-running jobs, explicit poison-message handling with dead-letter destinations, UTC schedule storage, jittered fan-out, and explicit backpressure.
  - `config-and-flags.md` (`CFG-*`, 7 sections CFG-001..007). Requires configuration sourced from environment / runtime injection / secret manager, startup validation, four-way feature-flag taxonomy (release / operational kill switch / experiment / entitlement) handled separately, per-flag owner / removal criterion / expiry, safe defaults on flag-service unreachability, and rejects branching business logic on environment name.
  - `api-versioning.md` (`VER-*`, 8 sections VER-001..008). Requires one versioning strategy per public surface, defines breaking vs non-breaking changes precisely, requires explicit deprecation with in-band signaling via the platform's standard mechanism (RFC 9745 and RFC 8594 cited as the standardized HTTP mechanism with the qualifier that adoption is uneven), explicit support windows, additive evolution as default, and CI-blocking compatibility checks.
- Targeted refinements to four existing rules:
  - `frontend-architecture.md` adds FE-012 Data state surface (distinct UI for first-load / empty / stale-while-revalidate / error / limited-connectivity, WCAG 2.2 status-message announcement), FE-017 Interactivity priority (smallest interactive unit, INP as operational measurement), FE-018 Internationalization as layout (logical CSS properties, direction-conveying vs object-representing icon classification, 30-100% text-expansion budget), FE-019 Theme as context (theme as lighting/surface model not color inversion, elevation cannot depend on drop-shadows alone, per-theme contrast verification, OKLCH cited as one example with sRGB as universal fallback).
  - `security.md` adds SEC-003 authentication versus authorization (independently testable authorization decision layer, audit events recorded `[REF:OBS-004]`), SEC-004 credential storage (memory-hard algorithm requirement; Argon2id default with bcrypt acceptable on platforms without memory-hard implementations; general-purpose hashes MD5/SHA-1/SHA-256/SHA-3 forbidden for password storage), SEC-005 service-to-service authentication (cryptographically verifiable identity required; shared static tokens rejected as sole identity).
  - `database-design.md` adds DATA-003 money and time (fixed-precision integer in smallest unit OR decimal with explicit precision, floating-point forbidden for monetary columns, currency code stored on same row, UTC for real-world moments, naive timestamps forbidden), DATA-004 concurrency and write conflicts (optimistic-concurrency token mandatory on shared mutable resources, HTTP 409 with current state and conflict reason as the canonical conflict response), DATA-005 citations and freshness for the new sections.
  - `api-docs.md` extends API-005 with a cross-reference to `api-versioning.md` via `[REF:VER-001]`, and adds API-012 Idempotency as Runtime Invariant (server returns the original response on duplicate idempotency identifiers within a documented retention window; three duplicate outcomes distinguished; durable storage required for multi-instance deployments).
- New `[REF:RULE-ID]` cross-references between rules: SEC-003 -> OBS-004, SEC-004 -> CFG-002, DATA-005 -> DATA-003 / DATA-004, API-005 -> VER-001. All resolved by `npm run audit:rule-id-uniqueness`.

### Removed
- Retired one-shot v3-to-v4 migration tooling. `scripts/v3-purge-audit.mjs`, `scripts/migrate-rule-format.mjs`, `scripts/migrate-rule-format/`, and `tests/migrate-rule-format.test.mjs` moved to `docs/archive/migrations/` for historical reference. `audit:v3-purge` npm script removed; `migrate-rule-format.test.mjs` removed from `npm test`. `clean-local-artifacts.mjs` no longer references the retired `v3-purge-audit.json` state file.
- Consolidated archived planning, phase-outcome, and dated audit files into `docs/archive/HISTORY.md`. Deleted: `phase-2-outcome.md`, `phase-3-outcome.md`, `phase-5-hardening.md`, `phase-5-outcome.md`, `v1.7-execution-playbook.md`, `v1.7-issue-breakdown.md`, `v1.8-operations-playbook.md`, `v2-upgrade-playbook.md`, `analysis-priority-matrix.md`, `rtk-comparison-and-sync-audit-2026-04-11.md`, `semantic-redundancy-scan-2026-04-11.md`. `CHANGELOG-archive.md` retained.
- Deleted `docs/roadmap.md` (legacy track, replaced by `docs/deep-analysis-and-roadmap-backlog.md`). Deleted `docs/terminology-mapping.md` (3-row table inlined into `README.md`). Validators, release-gate static checks, and `frontend-usability-audit.mjs` updated to read project history and terminology from `docs/archive/HISTORY.md` and `README.md` respectively.



## 4.0.3 - 2026-05-17
### Added
- New CSS-level anti-repeat audit: `npm run audit:typography-palette-anti-repeat` (script `scripts/audit-typography-palette-anti-repeat.mjs`, helper `lib/cli/audits/typography-palette-anti-repeat-audit.mjs`). Scans `*.css`, `*.scss`, `*.sass`, `*.less`, and Tailwind / theme / design-tokens config files for `font-family` declarations and color values, then cross-checks them against `researchDossier.metadata.antiRepeatLedger`. Typography matches are exact and reported as `BOUNDARY_TYPOGRAPHY_LEDGER_VIOLATION` (blocking). Palette matches block by default with `BOUNDARY_PALETTE_LEDGER_VIOLATION`: hex-vs-hex requires exact normalized equality and OKLCH-vs-OKLCH uses an L*C*H perceptual distance threshold (default 0.04). Cross-type comparisons (hex vs OKLCH or vice versa) are intentionally out of scope and tracked in `docs/deep-analysis-and-roadmap-backlog.md`. Pass `--palette-advisory` (or `treatPaletteAsAdvisory: true`) to opt a project into advisory-only palette reporting; release stays unblocked by palette findings while typography still blocks. The audit is wired into `npm run validate`.
- User-facing CLI subcommand `audit:design-anti-repeat` exposed on the published bin. `npx @ryuenn3123/agentic-senior-core audit:design-anti-repeat` runs the audit against the user's current working directory, so consumer projects can scan their own `globals.css`, `tailwind.config.js`, theme files, and design tokens against the anti-repeat ledger that lives in their `docs/design-intent.json`. Skip behavior is friendly: missing design contract or missing dossier metadata print an actionable next step and exit 0. Typography violations and (default-blocking) palette violations exit 1. Help text: `npx @ryuenn3123/agentic-senior-core audit:design-anti-repeat --help`.

### Changed
- `npx @ryuenn3123/agentic-senior-core upgrade` now prints a one-line next-step suggestion at the end of a successful run pointing UI-scope users at the new audit subcommand.

### Fixed
- `audit:design-anti-repeat --threshold <number>` no longer treats the numeric threshold value as the target directory when no explicit target directory is provided.

## 4.0.2 - 2026-05-17

### Added
- `antiRepeatLedger.previousTypographyChoices` now extracts existing `tokenSystem.typographyTokens` during research-dossier migration, closing a loophole where redesigns could keep the previous design's exact font trio without the ledger flagging it.
- `derivedTokenLogic.tokenContinuityClassification` requires explicit classification per token category (typography, palette, motion, spacing) on every contract: `anchor-derived`, `continuity-retained`, `newly-introduced`, or `pending-research` for fresh seeds. Continuity is now declared, not implied through free-text `derivationSource`.
- `research-design.md` Section 3 now requires a dimensional category-code split (`typographyClusters`, `paletteClusters`, `layoutClusters`, `motionClusters`, `imageryClusters`) instead of collapsing into broad category-level codes, plus a self-check requirement so the agent's own typography, palette, and motion picks must not silently match an item in the agent's own identified `categoryCodes` without an explicit continuity claim or a revised pick.

### Changed
- `bootstrap-design.md` now requires `tokenContinuityClassification` to be set after research dossier consumption, before the final write-back step.

### Migration
- Existing projects re-run `npx upgrade` to populate `previousTypographyChoices` in the anti-repeat ledger and to seed `tokenContinuityClassification` with `pending-research` placeholders. Migration is idempotent and additive; existing tokens, anchors, and palettes are not modified.

## 4.0.1 - 2026-05-17
### Added
- Added `.agent-context/prompts/research-design.md` as the UI research dossier contract. UI work now has explicit product-reading, reference-intake, category-code, morphological-exploration, and five-anchor candidate gates before implementation.
- Added research dossier metadata migration for existing `docs/design-intent.json` files, including compact anti-repeat ledger seeding from prior anchor, palette, and motion signatures.
- Added focused validation and tests for research dossier metadata, category-code specificity, morphological matrix shape, anchor candidate rename tests, and seed-status handling.

### Changed
- Updated `AGENTS.md`, `bootstrap-design.md`, design-intent seed generation, and prompt builders so UI Design Mode loads `research-design.md`, routes by freshness state, preserves anti-repeat history, and blocks repeated spatial/default anchor patterns.
- Moved live v4 decision docs from `docs/plan/` into `docs/architecture/`, moved historical phase outcomes into `docs/archive/`, and refreshed doc routing plus benchmark references to point at the new authority split.

### Fixed
- Fixed cross-platform release bundle integrity. Release-bundle generation and audit now normalize CRLF to LF before computing SHA-256 hashes, preventing Windows working trees from producing hashes that fail Linux CI. The 4.0.0 release bundle was rebuilt with normalized hashes; no Phase 0-3 source artifact changed.

## 4.0.0 - 2026-05-16
### Breaking changes
- Converted the internal `.agent-context/rules/` pack from prose Markdown to v4 numbered Markdown with YAML frontmatter and stable section IDs. Downstream consumers that parse rule headings must update from prose section names to `<PREFIX>-NNN` headings such as `FE-004`, `ARCH-009`, and `API-006`.
- Removed the v3 prose-shape compatibility assumption for rule files. The package now treats frontmatter, `id_prefix`, `keywords`, and ID-prefixed `##` headings as the canonical rule format.

### Migration guide
Consumers that only import `AGENTS.md`, `CLAUDE.md`, or `GEMINI.md` do not need code changes. The root routing table still names the same rule files and now includes each file's ID prefix for citation.

Consumers that inspect `.agent-context/rules/*.md` directly should parse YAML frontmatter first, then use `## <PREFIX>-NNN: <Title>` headings as stable anchors. Do not depend on old prose-only headings, heading order without IDs, or unnumbered bullet structure.

### Documentation
- Phase 5 Task 5.1 public-surface refresh (2026-05-16). Updated `README.md` to reflect the v4 release and added a "What's New in v4" section that summarizes the rules-pack format change, the Bounded Reflection block, the cache-layer audit, the offline anti-halu benchmark, and the per-tool caching scope. Refreshed `docs/integration-playbook.md` with a "Per-Tool Caching Scope" matrix sourced from `docs/plan/research-foundation.md` D4 and a "Per-Integration Adoption" section covering direct provider API, Claude Code SDK programmatic, Claude Code CLI, Cursor, Windsurf, Codex CLI, and Kiro. Refreshed `docs/faq.md` with two new questions: "Does v4 save 89% on caching for me?" and "Why does v4 break v3 prose-shape parsers?". Refreshed `docs/doc-index.md` to reference `docs/benchmark-reference.md` and `docs/architecture-vision.md` where natural. No code changes; no caching numbers regenerated.
- Caching scope-fix pass (2026-05-16). Audited public-facing surfaces (`README.md`, `CHANGELOG.md` 4.0.0 entries, `AGENTS.md`, `package.json` description, `docs/faq.md`, `docs/integration-playbook.md`, plus the rest of `docs/`) for universal caching claims that mix integration modes. Result: no overpromise language was found on the public surfaces; the canonical caching numbers live in `docs/plan/research-foundation.md` D4, `docs/plan/phase-2-outcome.md`, `docs/plan/phase-3-outcome.md`, and `benchmarks/results/cache-phase-2-2026-05-16.json`. Those four documents now carry the per-tool caching scope matrix, the direct-API-vs-IDE-wrapper caveat, and the per-integration JSON-shape requirement documented in `docs/benchmark-reference.md` "Caching Effectiveness Reporting Format". The 89.31% Anthropic warm-cache figure remains valid only for direct provider API integration and Claude Code SDK programmatic mode; IDE wrappers (Cursor, Windsurf, Codex CLI, Kiro) receive prefix stability that is not measurable from the rules pack side. No code, no runtime API, and no benchmark numbers were modified.

### Changed
- Phase 5 Task 5.4 release benchmark bundle. Added `scripts/build-release-benchmark-bundle.mjs` and `scripts/audit-release-bundle.mjs`, plus the `build:release-bundle` and `audit:release-bundle` npm scripts. The audit is wired into `npm run validate`. The bundle (`benchmarks/results/release-bundle-4.0.0.json`) references Phase 0 baseline, Phase 2 cache simulation, Phase 3 anti-halu benchmark, and the Phase 5 supply-chain snapshot by SHA-256 hash; no Phase 0-3 number is regenerated. Documented the bundle shape and reproduction in `docs/benchmark-reference.md` "Release Benchmark Bundle".
- Phase 5 Task 5.3 supply-chain snapshot recorded at `benchmarks/results/scorecard-2026-05-16.json`. `npm audit --omit=dev` and `npm audit --json` (full) report 0 vulnerabilities at every severity. SBOM regenerated successfully. OpenSSF Scorecard CLI was not installed locally; the scorecard JSON documents the missing prerequisite honestly with fallback signals rather than fabricating a score.
- Phase 5 Task 5.2 coverage uplift. Added `scripts/audit-caching-scope-hygiene.mjs` plus the matching `audit:caching-scope-hygiene` npm script and wired it into `npm run validate`. The audit scans public surfaces (`README.md`, `AGENTS.md`, `docs/faq.md`, `docs/integration-playbook.md`, `docs/doc-index.md`, `CHANGELOG.md`) for numerical caching saving claims and fails if any claim is not integration-scoped within +/- 600 characters. Source of truth for the per-tool matrix is `docs/plan/research-foundation.md` D4. Added `tests/audit-caching-scope-hygiene.test.mjs` with 5 tests including a regression guard against the live public surfaces. Added 5 targeted tests for `scripts/migrate-rule-format/parse-legacy.mjs` (H1 missing, intro length warning, colon-labelled sections, nested bullets, no-H2 fallback). Test count rises from 176 to 186; validate count rises from 565 to 569. No runtime dependency added.
- Added `scripts/migrate-rule-format.mjs` plus the focused submodules under `scripts/migrate-rule-format/` (`id-prefix-table`, `parse-legacy`, `render-new`, `roundtrip-validate`). The helper takes a legacy rule file and produces a v4 candidate with assigned section IDs, validates substance roundtrip at >=95% word-set overlap, and reports per-file token deltas using the offline OpenAI tiktoken counter. Used during Phase 1 Task 1.3 onwards. SDK in `devDependencies` only (`yaml`); runtime dependencies still empty.
- Added `tests/migrate-rule-format.test.mjs` with 19 tests covering the prefix table, parser, renderer, sentence-boundary edge cases (file paths, dotted versions, domain literals, abbreviations), roundtrip checker, and the end-to-end migration helper. Test count rises from 125 to 144. The new test file is wired into `npm test`.
- Updated release validation to accept full SemVer prerelease/build identifiers so release candidates such as `4.0.0-rc.1` pass the package metadata and release-gate checks.
- Updated `.gitignore` to keep `*.candidate.md` files inside `.agent-context/rules/` and `.tmp-*.mjs` probes out of version control. Migration candidates are reviewer-only artifacts; the `--apply` flag overwrites the source file when ready.
- Hardened `paragraphSplitsIntoDirectives` in the migration renderer. Sentence boundaries now require punctuation followed by whitespace plus an uppercase letter, backtick, or opening parenthesis. File paths (`docs/DESIGN.md`), dotted versions (`v1.5`), domain literals (`example.com`), and internal abbreviation periods (`e.g.`, `i.e.`) no longer break a paragraph mid-clause. Pilot delta on `frontend-architecture.md` improved from +9.71% to +9.06% as a side effect of recovering the FE-003 directives that the earlier splitter mangled.
- Added `scripts/audit-rule-id-uniqueness.mjs` plus an `audit:rule-id-uniqueness` npm script wired into `npm run validate`. The audit checks YAML frontmatter shape, section ID prefix and uniqueness, `[REF:<PREFIX>-NNN]` resolution, optional `related: { <PARENT-ID>: [...refs] }` resolution, and ambiguous prose references (`see above`, `as noted earlier`, etc.) across `.agent-context/rules/`, `.agent-context/prompts/`, and `.agent-context/review-checklists/`. Pre-migration files (no YAML frontmatter) are skipped with a notice; the audit only enforces shape on migrated files.
- Documented the optional `related: { <PARENT-ID>: [<REF-ID>, ...] }` frontmatter field in `format-spec.md` for preserving conceptual grouping when one source rule is split across multiple section IDs (e.g. FE-004 split into FE-004 + FE-013 + FE-014). Validate audit now resolves these refs. The pilot dropped this field for token economy; it remains optional in the schema.
- Added the Intro Classification Rubric to `format-spec.md` section 1.5 to make migration decisions deterministic. Three buckets: factual/directive (keep), philosophical/motivational (delete per ETH Zurich finding), borderline (stop, ask). Migrators log word-count removed in the phase outcome file.
- Revised Phase 1 GATE B in `phase-1-format.md`. The original >=10% token reduction target was inherited from a generic prose-vs-structured estimate; pilot measurement on `frontend-architecture.md` showed structural markup overhead exceeds prose compression savings on lean imperative text. The gate now combines a no-regression token guard (per-file <=+15%, aggregate <=+5%, 100% lossless roundtrip) with a citability axis (unique stable IDs, [REF:...] resolution, no ambiguous prose references) and structural quality (snippet checks, cross-doc refs, frontmatter compliance). Trimmed the frontmatter shape: drop `version` for first-time-v1 files, drop `last_migrated` (git is the audit trail), cap `keywords` array at 6 hand-picked entries.
- Updated `research-foundation.md` D1 with a pilot-finding caveat. The 15-25% token reduction estimate applies to verbose prose; for already-condensed instruction text, structural markup overhead dominates. The research-backed primary win (+6.74% reasoning accuracy from EACL Findings 2026) remains valid; Phase 1 gates on accuracy and citability rather than raw token reduction.
- Logged D2 attribution correction for `research-foundation.md`: arXiv 2601.18341 was misattributed. That paper is the coding-agent adoption study across 128K repositories (Robbes et al.), not a content-quality study and not ETH Zurich. The correct ETH Zurich source is arXiv 2602.11988 (Gloaguen et al., Feb 2026). Verified finding: context files, both LLM-generated and developer-written, tend to reduce task success rates versus no context and increase inference cost by more than 20%. The D2 "-3% success" claim is an understatement; the finding is more cautionary. D2's conclusion to avoid LLM-generated content remains valid but needs nuance: even human-written context files can hurt task success on SWE-bench-style tasks. Trust: HIGH (verified). Source ID update: replace 2601.18341 with 2602.11988.
- Logged D6 compression-paper correction for `research-foundation.md`: arXiv 2603.23527 is a replication/extension study showing output explosion is benchmark-dependent (severe on MBPP at 56x, low on HumanEval at 5x). The original paper with the +2000% figure is arXiv 2603.23528 (Johnson, "Provider-Dependent Energy Effects"). Verified finding: DeepSeek-Chat output expansion reaches +2,140% at r=0.3 on MBPP, while GPT-4o-mini is comparatively stable. The prohibition on lossy compression for rules remains valid, but the claim should change from "universal +2000%" to "worst-case on MBPP/DeepSeek, benchmark-dependent." Trust: HIGH (verified). Primary source ID: 2603.23528; secondary source ID: 2603.23527.
- Relaxed the Phase 1 aggregate cap from +5% to +10% after Task 1.5 hit +4.77% OpenAI native `with_loaded_rules` delta versus the Phase 0 baseline. Rationale: Anthropic prompt-caching pricing documents cache reads at 0.1x base input price, so a cold +10% cap (77,861 → ~85,647 tokens) has an estimated warm-cache effective cost of ~8,565 tokens versus ~8,175 tokens at the old +5% cap (~390 effective-token delta). The +10% cap matches the repo's actual standard-file pilot data better than the old guard while preserving per-file and tiny-file caps.
- Hardened the Phase 1 migration parser for legacy rule files that use colon-labelled sections instead of `##` headings. This preserves files such as `error-handling.md` without lossy manual rewrites and keeps roundtrip validation authoritative.
- **Migrated `.agent-context/rules/frontend-architecture.md` to v4 numbered format (Phase 1 Task 1.3 pilot).** Sections split per format spec section 1.3 cap (12 items max): FE-004 (Anti-Generic UI Gate, 4 items) + FE-013 (Background and Wallpaper Discipline, 6 items) + FE-014 (Production Content Policy, 2 items); FE-006 (Motion, Palette, and 3D, 7 items) + FE-015 (Motion Implementation Budget, 4 items) + FE-016 (Library and Design-Intent Discipline, 2 items). Three body `[REF:FE-NNN]` cross-refs added (FE-008→FE-004, FE-009→FE-004, FE-013→FE-005). Roundtrip overlap 100% (zero substantial words lost). Final per-file token delta: +11.82% (under +12% pilot ceiling, well under +15% gate cap). The `related: {...}` frontmatter map was prototyped but dropped after measurement (104 tokens / 29% of delta) since body `[REF:X]` directives already cover the operational links. Word count removed from intro audit: 0 (both intro sentences classified as factual/directive per locked rubric, kept verbatim).
- **Migrated `.agent-context/rules/architecture.md` to v4 numbered format (Phase 1 Task 1.4).** 12 sections (ARCH-001 through ARCH-012), no splits required (max 11 items per section, all under 12-item cap). One `[REF:FE-004]` cross-ref added in ARCH-002 item 7 to link the backend domain-fit rename pass to the frontend rename test. Roundtrip overlap 100%. Per-file token delta: +10.74% (under +15% gate cap). Existing snippet checks updated in `scripts/validate/config.mjs`, `scripts/rules-guardian-audit.mjs`, `scripts/explain-on-demand-audit.mjs`, and `scripts/single-source-lazy-loading-audit.mjs` to reference the new section IDs (`## ARCH-005: Rules as Guardian (...)`, `## ARCH-006: Invisible State Management (...)`, `## ARCH-007: Single Source of Truth (...)`, `## ARCH-009: Layer Boundaries (...)`).
- **Migrated `.agent-context/rules/error-handling.md` to v4 numbered format (Phase 1 Task 1.5 continuation).** The migration helper now supports colon-labelled legacy sections, producing `ERR-001` and `ERR-002` with 100% roundtrip overlap. Original OpenAI token count was 447; migrated count is 540 (+93 tokens, +20.81%), which is within the tiny-rule absolute overhead cap (+120 tokens).
- **Migrated `.agent-context/rules/database-design.md` to v4 numbered format (Phase 1 Task 1.5 continuation).** The colon-labelled legacy sections now render as `DATA-001` and `DATA-002` with 100% roundtrip overlap. Original OpenAI token count was 518; migrated count is 605 (+87 tokens, +16.80%), which is within the tiny-rule absolute overhead cap (+120 tokens).
- **Migrated `.agent-context/rules/security.md` to v4 numbered format (Phase 1 Task 1.5 continuation).** The colon-labelled legacy sections now render as `SEC-001` and `SEC-002` with 100% roundtrip overlap. Original OpenAI token count was 540; migrated count is 635 (+95 tokens, +17.59%), which is within the tiny-rule absolute overhead cap (+120 tokens).
- **Migrated `.agent-context/rules/efficiency-vs-hype.md` to v4 numbered format (Phase 1 Task 1.5 continuation).** The migration split the 13-item dependency checklist into `DEP-002` and `DEP-003` to respect the 12-item section cap while preserving 100% roundtrip overlap. Original OpenAI token count was 490; migrated count is 605 (+115 tokens, +23.47%), which is within the tiny-rule absolute overhead cap (+120 tokens).
- **Migrated `.agent-context/rules/docker-runtime.md` to v4 numbered format (Phase 1 Task 1.5 continuation).** Legacy numeric heading prefixes were removed after ID assignment to avoid duplicate numbering while preserving 100% roundtrip overlap. Original OpenAI token count was 823; migrated count is 924 (+101 tokens, +12.27%), which is within the standard-file +15% cap.
- **Migrated `.agent-context/rules/git-workflow.md` to v4 numbered format (Phase 1 Task 1.5 continuation).** The PR template, branch examples, commit atomicity, `.gitignore`, and health-check material were consolidated into six stable `GIT-*` sections after the helper over-split nested headings. Roundtrip overlap is 100%. Original OpenAI token count was 1,348; migrated count is 1,302 (-46 tokens, -3.41%).
- **Migrated `.agent-context/rules/api-docs.md` to v4 numbered format (Phase 1 Task 1.5 completion).** The public contract rules and Human Writing Standard were split into eleven stable `API-*` sections to stay under the 12-item section cap while preserving 100% roundtrip overlap. Original OpenAI token count was 1,313; migrated count is 1,483 (+170 tokens, +12.95%), which is within the standard-file +15% cap.
- Updated the writing-governance validate snippet to the new `## API-006: Human Writing Standard (Mandatory)` heading after `api-docs.md` migrated to v4 IDs.
- Raised the line-count cap for `.agent-context/rules/frontend-architecture.md` from 110 to 140 in `scripts/validate/coverage-checks.mjs`. The 110 cap was set for v3 prose; v4 numbered format necessarily has more lines (each directive on its own line, plus YAML frontmatter, plus split sections). Token economy is the primary axis (+11.82% delta), line count is a coarse proxy. Will revisit once all 15 rules migrate at Task 1.7.
- Split `lib/cli/detector/design-evidence.mjs` into focused submodules (`design-evidence/{constants,file-traversal,utility-helpers,structured-attribute-evidence,summary,collector}.mjs`). The aggregator preserves the public exports (`collectFrontendDesignEvidence`, `FRONTEND_SCAN_IGNORE_DIRECTORY_NAMES`); behavior is unchanged.
- Split `scripts/llm-judge.mjs` into focused submodules under `scripts/llm-judge/` (constants, checklist-loader, diff-collection, prompting, providers, verdict). The CLI entry file keeps the same flags and exit semantics; behavior is unchanged.
- Split `lib/cli/detector.mjs` into focused submodules under `lib/cli/detector/` (constants, workspace-scan, ui-signals, stack-detection). The aggregator preserves the public exports (`collectProjectMarkers`, `detectProjectContext`, `detectUiScopeSignals`, `buildDetectionSummary`, `formatDetectionCandidates`); behavior is unchanged.
- Split `lib/cli/project-scaffolder/design-contract.mjs` into focused submodules under `design-contract/` (signal-vocab, seed-signals, sections/conceptual-anchor, sections/audits, sections/execution-handoff). The aggregator preserves the public exports (`shouldBootstrapDesignDocument`, `buildDesignIntentSeed`, `buildDesignIntentSeedFromSignals`, plus the validation re-exports); the produced contract JSON shape is unchanged.
- Split `lib/cli/project-scaffolder/design-contract/validation.mjs` into focused validators under `design-contract/validation/` (helpers, completeness, structural-validators, anchor-validators, audit-validators, system-validators, execution-validators). The aggregator preserves the public exports (`validateDesignContractCompleteness`, `validateDesignIntentContract`); error messages and ordering are unchanged.
- Added `audit:file-size` script that enforces a 500 LOC threshold across `bin/`, `lib/`, and `scripts/` (excluding test files). Files that genuinely need to exceed the limit can declare a `// @file-size-exception: <reason>` marker in the first 5 lines. The check is wired into `npm run validate`. The seven currently oversize files (`lib/cli/commands/init.mjs`, `lib/cli/compiler.mjs`, `lib/cli/memory-continuity.mjs`, `scripts/benchmark-evidence-bundle.mjs`, `scripts/rules-guardian-audit.mjs`, `scripts/validate/config.mjs`, `scripts/validate.mjs`) are exempted with a reason and queued for a Phase 1 split.

### Fixed
- Suppressed git stderr noise from audit and judge scripts (`documentation-boundary-audit`, `context-triggered-audit`, `explain-on-demand-audit`, `rules-guardian-audit`, `single-source-lazy-loading-audit`, `ui-design-judge/git-input`, `llm-judge/diff-collection`). Each `git` invocation now passes `stdio: ['ignore', 'pipe', 'ignore']` so that the JS-level `try/catch` fallback no longer leaks `fatal: ambiguous argument 'HEAD~1..HEAD'` to the test output on shallow clones or initial-commit repos.
- Honestly disclosed knowledge-layer status in `mcp.json`. Five implemented layers (rules, prompts, state, policies, project-context) are tagged `status: "implemented"`; the four virtual layers (stack-strategies, architecture-playbooks, execution-contracts, governance-modes) now carry `status: "planned"` plus `plannedPhase` and `rationale` fields. Top-level descriptions reference the new `docs/architecture-vision.md` roadmap so the registry no longer reads as a "9-layer dynamic injection" capability claim.

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
