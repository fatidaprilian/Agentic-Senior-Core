# Agentic-Senior-Core - Deep Analysis and Roadmap Backlog

Date: 2026-04-20
Current Version: 3.0.7
Status: Stable and release-ready

---

## Part 1: Current State Audit

### 1.1 Health Check Snapshot

| Gate | Result |
|------|--------|
| npm run validate | pass (target: 426 checks, 0 failed, 0 warnings) |
| npm test | pass (target: 33 tests, 0 failed) |
| Version consistency | package.json, CHANGELOG, .cursorrules, .windsurfrules aligned |
| Release gate | machine-readable JSON report, blocking failures supported |
| Forbidden content gate | integrated in npm run gate:release |

Note: final numbers are re-validated before each release commit.

### 1.2 Asset Inventory (2026-04-11)

| Category | Count | Notes |
|----------|-------|-------|
| Universal rules | 14 | complete rule baseline |
| Stack profiles | 10 | typescript, python, java, php, go, csharp, rust, ruby, flutter, react-native |
| Blueprints | 14 | includes mobile-app and observability |
| Review checklists | 8 | includes marketplace-acceptance |
| Skill domains | 6 | backend, frontend, fullstack, cli, distribution, review-quality |
| Scripts | 20 | includes benchmark evidence bundle, writer-judge matrix, and governance reporting |
| CI workflows | 7 | publish + release + benchmark + sbom + frontend + weekly governance |
| Tests | 5 files | smoke, enterprise ops, knowledge injection, llm judge, skill tier |
| State files | 14 | includes reproducibility, writer-judge configuration, and benchmark evidence snapshots |
| Docs | 12 | includes deep analysis and semantic audit docs |

### 1.3 Maturity by Subsystem

| Subsystem | Maturity | Current Position |
|-----------|----------|------------------|
| Rule engine | mature | stable and complete |
| Stack and blueprint system | mature | broad language and delivery coverage |
| Validator and release safety | mature | strict checks, publish-time blocking enabled |
| Skill platform | mature | domain depth expanded with verified trust tier on key release domains |
| CLI engine | growing | modularized, optimize/init/upgrade safety now strong |
| Benchmark system | growing | ready for multi-model expansion in V2.5 |
| Marketplace trust layer | growing | trust tiers and evidence are available |
| Enterprise federation | planned | V3.0 scope |

### 1.4 Major Changes Landed in 2.0.x

Completed:
- CLI modularization and thin entrypoint
- Trust tiers and evidence bundle validation
- Transactional install safety: preflight, backup, rollback
- Forbidden content publish protection
- Token optimization mode with optional external proxy detection and native fallback
- Init auto-enable token optimization flags
- Init default-on token optimization for all init paths, with `--no-token-optimize` opt-out
- Compatibility manifests for all six skill domains
- Compatibility warnings in init/upgrade
- Strict compatibility validation in release gate for publish-time blocking
- Weekly governance reporting artifact and scheduled CI workflow
- Expanded stack-specific preset catalog (Java, .NET, Laravel, NestJS, Kubernetes)
- Mobile-app blueprint depth expansion with offline/testing/release governance coverage
- Verified trust-tier uplift for frontend/fullstack/distribution/review-quality domains
- Project context scaffolding hardening: template version headers, upgrade-time staleness detection, and docs-lang support (en, id)
- Integration playbook coverage for GitHub Actions, Jenkins, VS Code, and JetBrains
- Project discovery UX hardening: quick-choice mode, multilingual answer guidance, Enter-to-default selection, and prompt starter examples
- Documentation quality drift artifact automation: machine-readable report script plus dedicated CI workflow
- Release gate benchmark hard-blocking: threshold checks embedded in release gate diagnostics and benchmark-detection CI workflow
- Init flow domain-first stack orchestration: scope-based stack filtering, existing-project auto stack reuse, and web dual-stack metadata capture
- Init selection intelligence expansion: web dual-blueprint architecture capture, runtime environment hinting (Linux/WSL or Windows), and Docker dev/prod strategy capture for dynamic container generation
- Frontend excellence rubric enforcement: designer-grade scoring checklist plus release-gate/frontend-audit validation hooks
- Benchmark history and trend visibility: per-run state history, chart-ready JSON/CSV trend artifacts, and release-over-release delta summaries
- Benchmark security and reliability signals: forbidden-content plus vulnerability indicators and early-risk reliability checks in evidence bundle
- Cross-agent memory continuity pilot foundations: provider-agnostic schema, adapter contract, privacy redaction controls, and hydration benchmark output

---

## Part 2: Updated Backlog Status

### 2.1 V2.0 Remaining Work

| Issue | Title | Priority | Status | Notes |
|------|-------|----------|--------|-------|
| V2.0-010 | Numbered launcher UX | P1 | done | launch menu exists and tested |
| V2.0-011 | Preset expansion | P1 | done | expanded preset catalog includes Java, .NET, Laravel, NestJS, and Kubernetes paths |
| V2.0-012 | Quality trend artifacts | P2 | done | `report:quality-trend` now emits machine-readable state artifact |
| V2.0-013 | Weekly governance report | P3 | done | `report:governance-weekly` + scheduled CI artifact workflow shipped |
| V2.0-014 | Frontend parity CI hard enforcement | P1 | done | release gate now blocks on frontend parity checklist and frontend usability audit |
| V2.0-015 | Expand mobile-app blueprint depth | P3 | done | mobile blueprint upgraded with architecture, offline, testing, and release governance patterns |
| V2.0-016 | Frontend skill depth to advance tier | P1 | done | frontend domain expanded (responsive + conversion) and promoted to verified trust tier |
| V2.0-017 | Fullstack/CLI/distribution/review depth | P2 | done | cross-domain depth topics + evidence bundles promoted domains to verified trust tier |

### 2.2 New Action Items from Semantic Scan and Ops Feedback

#### V2.0-018: Instruction Adapter Consolidation

Priority: P1
Status: done

Scope:
- Keep one canonical policy source.
- Convert AGENTS/coplanar tool entry files into thin adapters.
- Add drift detection rule for adapter files.

Acceptance:
- [x] High-overlap instruction duplication reduced.
- [x] No behavior regression in Copilot/Cursor/Gemini entrypoints.
- [x] Drift detection enforced via canonical hash metadata validation.

#### V2.0-019: Progressive Compatibility Policy (User-Friendly)

Priority: P1
Status: done

Scope:
- Keep init and upgrade compatibility feedback as warnings for onboarding comfort.
- Keep release and publish checks strict for maintainers.
- Document this split clearly so external users are not surprised.

Acceptance:
- New users are not blocked during setup.
- Maintainers cannot publish with invalid compatibility metadata.

#### V2.0-020: Init Selection Intelligence Hardening

Priority: P1
Status: done

Scope:
- Ask project scope before manual stack selection and filter stacks to that scope.
- Auto-reuse detected stack signals for existing projects to avoid repeated language prompts.
- Capture frontend/backend split stack metadata for web projects.
- Capture frontend/backend split blueprint metadata for web projects and compile both architecture references.
- Add runtime environment hinting with optional override (`--runtime-env`) for Windows vs Linux/WSL command context.
- Add Docker strategy capture (none, development-only, production-only, both) to project discovery.

Acceptance:
- Mobile setup path does not surface unrelated backend stacks in manual choices.
- Existing project initialization can proceed without manual stack re-selection when detection confidence is reliable.
- Onboarding report stores additional stack signals for polyglot repositories.
- Onboarding report stores additional blueprint context for dual-architecture web projects.
- Project docs include Docker strategy and runtime target context.

#### V2.0-021: Docker and Runtime Workflow Guidance

Priority: P1
Status: done

Scope:
- Add dedicated Docker governance rules that enforce dynamic generation and separation of development and production container lanes.
- Add frontend excellence rubric checklist aligned to designer-grade quality expectations.
- Enforce rubric/checklist presence in frontend audit and release gate workflows.

Acceptance:
- Docker guidance explicitly bans static one-size-fits-all templates.
- Frontend release checks fail when excellence rubric requirements are missing.
- Validation enforces presence of Docker rule and frontend excellence rubric artifacts.

### 2.3 Completion Checklist (2.0.x)

- [x] Token optimization command and state/report wiring
- [x] Compatibility manifests + strict publish gate validation
- [x] Init defaults to token optimization on all entry paths
- [x] Token optimization opt-out via `--no-token-optimize`
- [x] Token optimization benchmark script + JSON artifact
- [x] README token usage comparison table from benchmark snapshot
- [x] Instruction adapter consolidation (V2.0-018)
- [x] Frontend parity CI hard enforcement (V2.0-014)
- [x] Quality trend artifacts (V2.0-012)
- [x] Weekly governance report generation (V2.0-013)
- [x] Preset expansion across stack-specific starts (V2.0-011)
- [x] Mobile blueprint depth expansion (V2.0-015)
- [x] Frontend/fullstack/distribution/review skill-depth expansion (V2.0-016, V2.0-017)

### 2.4 Token Optimization Focus Track

- [x] Default token optimization enabled on init
- [x] Native fallback guidance and command rewrite matrix
- [x] Local benchmark harness (`benchmark:token`)
- [x] README benchmark transparency table
- [x] RTK runtime benchmark population on Windows benchmark host (`rtk` v0.35.0)

Current benchmark note:
- Latest benchmark artifact reports native savings average `83.64%` and RTK savings average `18.95%` on current Windows host profile.

---

## Part 3: Recommended Next Steps (Pragmatic and Friendly for External Users)

Execution status (2026-04-12):
- [x] Freeze V2.0 stable baseline with release cut and publish evidence.
- [x] Keep weekly governance artifact, release gate, and quality trend reports attached to release evidence.
- [x] Start V2.5 preparation immediately.
- [x] Define reproducible benchmark fixture matrix and writer-judge separation architecture.
- [x] Stage anti-regression threshold calibration before enabling hard-block rollout in CI.

Completion note:
- Part 3 is complete for preparation scope (planning, baseline, calibration setup).
- Full implementation and rollout execution continue under Part 5 V2.5 phases.

V2.5 preparation snapshot (ready to execute):

1. Reproducible benchmark fixture matrix (initial)
- Detection benchmark fixtures are fixed via `scripts/detection-benchmark.mjs` and cover multi-stack markers (TypeScript, Python, Java, PHP, Go, .NET, Rust, Ruby, mixed markers).
- Token optimization benchmark scenarios are tracked in state artifacts and can be re-run with machine-readable outputs.
- Governance benchmark signals are emitted through `scripts/benchmark-gate.mjs` and `scripts/benchmark-intelligence.mjs` for repeatable pass/fail checks.

2. Writer-judge separation architecture (initial)
- Writer lane: model-under-test generates outputs per scenario and profile.
- Judge lane: independent scoring path evaluates outputs against rubric dimensions.
- Comparison output: side-by-side score matrix per scenario/model pair, designed for blind review mode.

3. Anti-regression threshold calibration (staged)
- Current calibrated thresholds are defined in `.agent-context/state/benchmark-thresholds.json`:
	- `minimumTop1Accuracy`: `0.90`
	- `maximumManualCorrectionRate`: `0.12`
	- `maximumTop1AccuracyDrop`: `0.02`
	- `maximumManualCorrectionIncrease`: `0.03`
	- baseline: `top1Accuracy=0.9167`, `manualCorrectionRate=0.0833`
- Rollout policy:
	- Phase 2.5.1: monitor mode and baseline stabilization
	- Phase 2.5.2: hard-block release on threshold regression
	- Phase 2.5.3: tighten thresholds after trend confidence is stable

---

## Part 4: Versioning Policy for Auto Publish

Because GitHub push triggers npm publish, every release-intent push must include:
- [x] package version bump (semantic versioning)
- [x] CHANGELOG entry for the same version
- [x] compiled rule markers synced to the same version in .cursorrules and .windsurfrules
- [x] passing validate and test gates before push

Recommended release cadence:
- Docs-only non-release updates: keep local or batch them.
- Any push that can trigger publish: bump patch version at minimum.

---

## Part 5: V2.5 and V3.0 Direction

### V2.5 (Benchmark Expansion)

Top goals:
- reproducible and transparent benchmark foundation
- objective writer-judge separation across multiple models
- anti-regression release protection with explicit quality thresholds
- benchmark history and trend observability
- practical onboarding and ecosystem integration (CI/CD + IDE)
- security and reliability signal in benchmark outputs
- advanced frontend quality track with non-template visual output diversity and expert UX standards
- framework currency and migration readiness for major ecosystem releases (starting with Laravel 13)

Execution tracks (incremental, ordered, and checklist-driven):

1. Reproducibility and transparency baseline (Phase 2.5.1)
- [x] lock benchmark fixtures and deterministic runtime settings
- [x] publish rerun instructions, raw inputs, rubric, outputs, and command examples
- [x] define before-vs-after comparison schema (quality, bug signal, runtime, token) in `.agent-context/state/benchmark-comparison-schema.json`
- [x] kickoff artifact implemented: `scripts/benchmark-evidence-bundle.mjs` with deterministic profile in `.agent-context/state/benchmark-reproducibility.json`

2. Multi-model writer-judge architecture (Phase 2.5.1)
- [x] writer lane and judge lane architecture drafted in preparation snapshot
- [x] blind review mode objective documented
- [x] separate writer and judge pipelines with independent runtime configuration (`.agent-context/state/benchmark-writer-judge-config.json`)
- [x] emit side-by-side comparison matrix for multiple models per scenario (`scripts/benchmark-writer-judge-matrix.mjs` -> `.agent-context/state/benchmark-writer-judge-matrix.json`)

3. Release blocking and anti-regression gates (Phase 2.5.2)
- [x] minimum threshold baseline defined in `.agent-context/state/benchmark-thresholds.json`
- [x] integrate threshold checks into release gate and CI workflows
- [x] fail release on regression and emit machine-readable diagnostics

4. History and visualization (Phase 2.5.2)
- [x] append benchmark state artifact per run and release
- [x] generate trend tables and chart-ready JSON and CSV outputs
- [x] surface release-over-release changes for quick decision review

5. Adoption and integrations (Phase 2.5.3)
- [x] provide quickstart benchmark paths for new users (README benchmark quickstart sequence)
- [x] add profile and preset guidance for common usage patterns (`docs/v2-upgrade-playbook.md` guidance matrix)
- [x] maintain integration playbooks for GitHub Actions, Jenkins, VS Code, and JetBrains (`docs/integration-playbook.md`)

6. Security and reliability checks (Phase 2.5.3)
- [x] include bug and vulnerability scan indicators in benchmark report bundle
- [x] add reliability checks to highlight risky output degradation early

7. Frontend excellence and design quality (Phase 2.5.3)
- [x] define frontend scoring rubric for visual direction, typography quality, color strategy diversity, and interaction quality
- [x] require non-template UI outputs with measurable variation in layout and style systems
- [x] treat MiniMax frontend references as baseline and enforce stricter quality targets above baseline
- [x] align frontend output expectations to advanced design workflow quality comparable to high-signal manual design teams

8. Framework currency and migration readiness (Phase 2.5.1)
- [x] refresh PHP stack profile and Laravel blueprint to Laravel 13 baseline (PHP 8.3+)
- [x] codify high-impact 12.x to 13.x migration checks (CSRF middleware rename, `upsert` `uniqueBy`, cache `serializable_classes`)
- [x] align onboarding prompts and setup references to Laravel 13 target state
- [x] add annual Laravel major-release watch with owner and response SLA

9. Project context scaffolding (Phase 2.5.1)
- [x] build project discovery interview with domain, database, auth, and feature questions
- [x] create parameterized doc templates (project-brief, ADR, database-schema, api-contract, flow-overview)
- [x] integrate scaffolder into init flow with `--scaffold-docs`, `--no-scaffold-docs`, `--project-config` flags
- [x] add Layer 9 PROJECT CONTEXT to compiled governance rulebook (`.cursorrules`, `.windsurfrules`)
- [x] add compiled rules generation for Antigravity/Gemini (`.gemini/instructions.md`) and Copilot (`.github/copilot-instructions.md`)
- [x] add Layer 9 reference to `.instructions.md` for all non-Cursor/Windsurf IDEs (including Zed which reads natively)
- [x] add template versioning header and upgrade-time staleness detection
- [x] add `--docs-lang` multi-language template support (initial: en, id)
- [x] add Docker strategy capture (development and production lanes) with dynamic containerization guidance in generated docs
- [x] add runtime environment hinting for Linux/WSL, Windows, and macOS with optional CLI override
- [x] add dual-web blueprint selection path so frontend and backend architecture references compile together

10. Cross-agent memory continuity pilot (Phase 2.5.3)
- [x] define a provider-agnostic memory schema for observations, summaries, and timeline metadata
- [x] implement adapter contract for Claude Code, Gemini CLI, and VS Code chat memory ingestion/retrieval
- [x] add privacy tagging and redaction controls before persistence
- [x] add continuity benchmark that validates new chat hydration from prior sessions
- [x] expand cross-IDE MCP auto-configuration support out of the box (VS Code, Cursor, Zed workspace configs, and Gemini global auto-registration)

## Part 6: Documentation and Explanation Standards (Mandatory)

Status in V2.5:
- [x] treated as a mandatory style standard with advisory severity (non-blocking for merge timing)
- [x] explicit mention retained in repository validation expectations
- [x] scope style checks do not delay same-commit API docs sync when contract details are correct
- [x] add dedicated CI artifact for documentation-quality drift over time (`scripts/docs-quality-drift-report.mjs` + `.github/workflows/docs-quality-drift-report.yml`)

Scope:
- This applies to documentation, release notes, onboarding text, review summaries, and agent-facing explanations.

Writing style baseline:
- Write for native English speakers.
- Target an 8th-grade reading level.
- Use clear, direct, plain language.
- Keep sentence rhythm natural with short and medium sentences.
- Keep tone confident, practical, and conversational.
- Say the main point first, then supporting detail.

Required behavior:
- Explain decisions the way a competent coworker would explain them out loud.
- Cut unnecessary words and remove filler.
- Use concrete verbs and everyday phrasing.
- Rewrite, reorder, merge, or split sentences when it improves flow.
- Keep explanations short by default; expand only when complexity requires it.

Non-negotiable rules:
- No emoji in formal artifacts. This is mandatory.
- Avoid AI cliches and buzzwords such as: delve, leverage, robust, utilize, seamless.
- Avoid inflated, academic, or performative language.
- Avoid padding, hedging, and redundant phrasing.
- Use bullet lists only when they improve clarity.

Additional critical rules:
- Any performance, quality, or reliability claim must include a measurable source and timestamp.
- Expand acronyms on first use, then use the short form consistently.
- Separate facts from assumptions explicitly.
- End each major explanation with a clear next action.
- Keep terminology stable across docs for the same concept.

Final quality check:
- Read the text out loud before publishing. If it sounds stiff or robotic, rewrite it.

Suggested rollout order:
- Phase 2.5.1: Tracks 1, 2, and 8 (foundation, objectivity, and framework currency)
- Phase 2.5.2: Tracks 3 and 4 (release gates and trend intelligence)
- Phase 2.5.3: Tracks 5, 6, and 7 (adoption, trust hardening, and frontend excellence)

### V3.0 (Federated Governance)

Top goals:
- signed governance bundle distribution
- org-level override registry with expiry governance
- policy drift detection across repositories
- provenance and portfolio-level quality reporting
- staged rollout safety across pilot, canary, and global phases
- explicit rollback governance with clear trigger conditions per issue
- budget-aware AI orchestration (token budget, latency budget, and response-noise budget)
- evidence-first quality reporting with measurable metrics and timestamps

Execution policy:
- V3.0 implementation is staged and issue-by-issue, not one-shot.
- Version `3.0.0` release lock has been closed on 2026-04-18 after release-gate verification and V3.0-018E completion.
- Patch/minor releases continue on 2.x track during V3.0 execution.
- Every V3.0 issue must define rollout strategy: pilot, canary, then global.
- Every V3.0 issue must define rollback trigger and rollback owner.
- AI-heavy flows must define token, latency, and response-noise guardrails.
- Every quality claim must include measurable source and timestamp.
- AI as Architect flow must include explicit failure-mode checklist.

#### Phase 1: Critical Overhaul (Onboarding and Initialization)

#### V3.0-001: Onboarding Compression and README Minimal Start

Priority: P1
Status: done

Scope:
- Reduce README onboarding surface significantly and move benchmark-heavy content to docs.
- Keep only strong positioning, one quick install command, and one before/after demo in the first screen.
- Keep advanced tables and benchmark details in dedicated docs files.

Acceptance:
- [x] New users can understand value proposition in less than 60 seconds.
- [x] Main README first-screen content can be scanned without scrolling overload.
- [x] Detailed benchmark references remain available in docs with explicit links.

#### V3.0-002: Golden Standard Init Mode

Priority: P1
Status: done

Scope:
- Make one Golden Standard mode the default user path.
- Hide beginner, balanced, and strict profile choices from first-run onboarding flow.
- Keep legacy profile engine internally for compatibility and migration safety.

Acceptance:
- [x] Default init flow has one recommended quality path with no profile selection prompt.
- [x] Existing repositories using older profile metadata remain compatible.
- [x] Upgrade flow does not break historical policy states.

#### V3.0-003: AI as Architect with User Veto Control

Priority: P1
Status: done

Scope:
- Replace manual stack and blueprint selection with project-description-first initialization.
- Require AI to propose stack and blueprint with technical rationale and trade-off notes.
- Require explicit user confirmation before applying architecture decision.
- Enforce user veto rule: if user chooses a different stack, AI must comply immediately.
- Define bounded research budget before first recommendation output (token ceiling and timeout).
- Enforce concise recommendation format to keep onboarding response fast and readable.
- Define failure-mode checklist for low-confidence recommendation, data conflict, and repeated user override.

Acceptance:
- [x] Init supports single project-description input for architecture recommendation.
- [x] Recommendation output is concise: stack declaration, rationale in 3-5 sentences, and alternatives in one line each.
- [x] Recommendation output includes confidence label and uncertainty notes when evidence is weak.
- [x] Research phase does not exceed configured token ceiling and timeout before outputting recommendation.
- [x] Failure-mode handling is explicit: low-confidence and data-conflict scenarios trigger caution labels; repeated user override updates preference and skips debate.
- [x] User rejection path applies selected override without argumentative loop.

#### Phase 2: Execution Rules (Behavior and Quality)

#### V3.0-004: Frontend Designer Mode (Auto Activation)

Priority: P1
Status: done

Scope:
- Auto-activate frontend design rules when UI scope is detected.
- Enforce designer mindset: conversion clarity, interaction quality, and transition intent.
- Prevent template-only repetitive outputs.

Acceptance:
- [x] UI tasks trigger frontend design rubric without manual toggle.
- [x] Generated UI work is evaluated against conversion, interaction, and visual intent checks.
- [x] Release checks can flag low-diversity template output.

#### V3.0-005: Backend Universal Principles Hardening

Priority: P1
Status: done

Scope:
- Add explicit universal rules: no clever hacks, no premature abstraction, readability over brevity.
- Apply consistently across backend and shared core modules.

Acceptance:
- [x] Review checklists include readability-first and anti-cleverness enforcement.
- [x] Refactor guidance prioritizes maintainability over compressed one-liners.
- [x] Violations are visible in review diagnostics.

#### V3.0-006: Documentation as Hard Rule (Boundary-Aware)

Priority: P1
Status: done

Scope:
- Require automatic documentation updates for public functions, database structures, and API endpoints when changed.
- Apply boundary-aware scope to avoid unnecessary token overhead on untouched areas.

Acceptance:
- [x] Public surface changes fail review if docs are missing or stale.
- [x] API and database changes include synchronized documentation updates.
- [x] Documentation checks stay focused on changed scope.

#### V3.0-007: Context-Triggered Security and Performance Checks

Priority: P1
Status: done

Scope:
- Trigger strict security and performance audits on review requests, PR preparation, and major feature completion.
- Avoid heavy audit mode on small edits unless explicitly requested.

Acceptance:
- [x] Strict audit mode activates automatically on review and PR-intent workflows.
- [x] Small edits avoid unnecessary heavy checks by default.
- [x] User can always force strict audit mode manually.

#### V3.0-008: Rules as Guardian (Cross-Session Consistency)

Priority: P1
Status: done

Scope:
- Persist architecture and pattern decisions across sessions.
- Detect drift and request explicit confirmation before changing declared stack or core patterns.

Acceptance:
- [x] Session handoff includes active architecture contract summary.
- [x] Drift detection warns before direction changes.
- [x] Direction changes require explicit user confirmation.

#### Phase 3: Quality of Life and State Management

#### V3.0-009: Invisible State Management with Explain-on-Demand

Priority: P2
Status: done

Scope:
- Keep JSON state complexity in background for normal user experience.
- Allow explicit debug visibility when user asks state-level questions.

Acceptance:
- [x] Default responses avoid unnecessary state-file internals.
- [x] State internals are exposed only on explicit request.
- [x] Diagnostic mode can explain relevant state decisions when needed.

#### V3.0-010: Single Source of Truth and Lazy Rule Loading

Priority: P1
Status: done

Scope:
- Keep one canonical rule source and reduce active entrypoint ambiguity.
- Load language-specific rules on demand during initialization and task execution.

Acceptance:
- [x] Canonical rule source is explicitly defined and enforced.
- [x] Language-specific guidance is loaded lazily based on detected scope.
- [x] No conflicting duplicate rule instructions during normal flow.

#### V3.0-011: Terminology Rebrand (Developer-Friendly)

Priority: P2
Status: done

Scope:
- Rebrand bureaucratic terms into developer-friendly language.
- Map old terms to new terms with compatibility aliases during transition.
- Keep enterprise canonical term `Federated Governance` for compliance and audit contexts.
- Introduce developer-facing alias `Federated Rules Operations` in onboarding and day-to-day guidance.
- Publish dual-term mapping reference (legacy term, developer term, canonical enterprise term, usage context).

Execution note (2026-04-18):
- Terminology mapping reference is now published at `docs/terminology-mapping.md` and linked from README + roadmap.
- Validator now enforces mapping rows, first-mention canonical-term examples in developer-facing surfaces, and compliance/audit alias boundary checks.
- Runtime onboarding and help surfaces keep developer-friendly aliases while retaining canonical compatibility hints.

Acceptance:
- [x] Primary docs use new terminology consistently.
- [x] Transition aliases keep older references understandable.
- [x] Validation and onboarding text remain stable during migration.
- [x] Dual-term mapping reference is published and linked from README and roadmap.
- [x] Compliance and audit artifacts keep canonical enterprise terms unchanged.
- [x] Developer-facing docs can use friendly aliases but include canonical term on first mention.

#### V3.0-012: Existing Project Detection Transparency

Priority: P1
Status: done

Scope:
- Make existing-project detection more vocal at session start.
- Declare detected stack, active rules, and major constraints clearly.

Execution note (2026-04-18):
- Init and upgrade now print explicit existing-project detection transparency blocks at session start.
- Existing-project init path now supports quick confirmation and quick override for detected setup in interactive mode.
- Onboarding report now stores detection transparency declaration and user decision metadata under `autoDetection.detectionTransparency`.

Acceptance:
- [x] Existing project sessions show detected stack and active rule summary up front.
- [x] User can confirm or override detected setup quickly.
- [x] Onboarding report captures declared detection and user confirmation result.

#### Phase 4: Long-Horizon Intelligence

#### V3.0-013: Data-Backed Stack Research Engine

Priority: P2
Status: done

Scope:
- Build data-backed architecture recommendation support using ecosystem signals.
- Start with reproducible snapshot-based inputs before optional real-time enrichment.
- Prevent hallucination-only recommendations for architecture justification.
- Prefer context-driven research over static template copying; treat template packs as optional references only.
- Allow optional real-time design/stack evidence from trusted sources (for example Awwwards) with source and timestamp citations.
- Do not depend on manually curated external DESIGN.md packs as baseline inputs.
- Use dynamic synthesis from project context + research signals to generate original design guidance.
- Store only normalized design signals (palette roles, typography scale, spacing patterns, motion characteristics), not copied prose from external sites.

Execution note (2026-04-18):
- Architect engine now uses deterministic snapshot evidence from `.agent-context/state/stack-research-snapshot.json` as baseline mode.
- Init now defaults to gated realtime research attempt, with safe fallback to deterministic snapshot when realtime payload is unavailable (`--disable-realtime-research` can force snapshot-only mode).
- Recommendations now persist measurable `evidenceCitations` with timestamps and normalized `designGuidance` with anti-copy policy (`copiedExternalProse: false`).
- Validator and CLI smoke tests now lock coverage for snapshot determinism, gated realtime behavior, citation output, and anti-DESIGN.md-copy policy.

Acceptance:
- [x] Architecture recommendations cite measurable sources and timestamps.
- [x] Snapshot-based mode runs deterministically for release validation.
- [x] Optional real-time mode is gated and does not block baseline operation.
- [x] Design guidance generation does not copy external DESIGN.md content or source prose.

#### V3.0-014: V3 Release Lock and Exit Gate

Priority: P1
Status: completed

Scope:
- Define explicit V3 release lock policy tied to completion of all Great Purge acceptance gates.
- Keep 2.x release stream active until all V3.0 criteria are complete.
- Enforce destructive-change guardrail: mass deletion is blocked until audit report is approved explicitly by user.

Acceptance:
- [x] `3.0.0` release lock was enforced until accepted release scope checks were complete.
- [x] Exit report includes machine-readable pass/fail diagnostics and purge readiness summary before release cut.
- [x] Release note for `3.0.0` references executed V3 scope and completion evidence.
- [x] Mass deletion path remains guarded by explicit confirmation after dry-run audit.

Execution note (2026-04-18):
- Release cut completed at `3.0.0` with deterministic gate verification (`npm run validate`, `npm test`, and `npm run gate:release` pass).
- Purge readiness remains controlled through `npm run audit:v3-purge` and explicit user confirmation gates.

Direction change note (2026-04-18):
- Future roadmap is refocused from static knowledge expansion to Dynamic Reasoning Engine execution.
- Historical completed items remain unchanged for audit continuity.
- Planned items below are rewritten to prioritize repository slimming, universal SOP guidance, and live research via MCP.

#### Phase 5: Dynamic Reasoning Core (The Great Purge)

#### V3.0-015: Static Knowledge Purge and Compatibility Bridge

Priority: P1
Status: done

Scope:
- Remove static knowledge directories that create long-term maintenance drag:
	- `.agent-context/stacks`
	- `.agent-context/blueprints`
	- `.agent-context/profiles`
- Refactor init, compiler, validator, and tests to stop hard dependency on removed static directories.
- Keep temporary compatibility handling for legacy flags so migration from 2.x to 3.x is controlled.

Acceptance:
- [x] Static stacks, blueprints, and profiles directories are removed.
- [x] Init and upgrade no longer require static stack or blueprint markdown files.
- [x] Validate, test, and release gate pass without restoring deleted static directories.
- [x] Legacy init inputs (`--stack`, `--blueprint`, legacy profile options) are handled with clear migration behavior.

Execution note (2026-04-18):
- Static directories `.agent-context/stacks`, `.agent-context/blueprints`, and `.agent-context/profiles` have been removed.
- Compatibility bridge is active through fallback metadata and loaders in init/compiler/profile-pack flows, keeping legacy option behavior stable during migration.
- Validation and release evidence is green after deletion:
	- `npm test`: 55 passed, 0 failed.
	- `npm run gate:release`: pass (including forbidden-content check pass).
	- `npm run audit:v3-purge`: `readyForMassDeletion: true`, `runtimeBlockingFileCount: 0`, `documentationReferenceFileCount: 5`.

#### V3.0-016: Universal SOP Consolidation (Sang Penuntun)

Priority: P1
Status: done

Scope:
- Consolidate non-expiring universal SOP guidance in `.agent-context/rules/`.
- Enforce backend mindset hard rules: readability over brevity, no clever hacks, no premature abstraction.
- Enforce frontend mindset hard rules: UI/UX designer mode, conversion clarity, and anti-generic-template output.
- Keep security and testing as mandatory foundation (OWASP baseline plus functional/TDD discipline).
- Enforce Guardian Rule: architecture and design documents must exist before implementation starts.

Acceptance:
- [x] Universal SOP rules are compact, non-duplicative, and become the default guidance source.
- [x] Backend and frontend mindset checks are explicitly enforced in review and generation flows.
- [x] Security/testing requirements remain mandatory after static template purge.
- [x] Coding flow is blocked when required `docs/Architecture-Decision-Record.md` or `docs/DESIGN.md` is missing.

Execution note (2026-04-18):
- Universal SOP baseline is consolidated into `.agent-context/rules/architecture.md` as mandatory guidance source.
- Review and generation flows now enforce explicit Universal SOP gates in:
	- `.agent-context/review-checklists/pr-checklist.md`
	- `.agent-context/prompts/review-code.md`
	- `.agent-context/prompts/refactor.md`
- Layer 9 compiled governance now enforces hard block policy in `lib/cli/compiler.mjs` for missing architecture or design docs before coding.
- Validator now includes dedicated Universal SOP coverage checks in `scripts/validate.mjs`.

#### V3.0-017: MCP Intelligence Upgrade (Mata dan Telinga)

Priority: P1
Status: done

Scope:
- Upgrade `.vscode/mcp.json` and `scripts/mcp-server.mjs` for live external research.
- Add web documentation fetch/search capability so framework knowledge is always current.
- Add trend analysis capability for package and ecosystem signals.
- Add state continuity operations for reading and writing `.agent-context/state/` across sessions.

Acceptance:
- [x] MCP can retrieve up-to-date documentation signals from external sources.
- [x] MCP can produce trend snapshots with source references and timestamps.
- [x] MCP state continuity operations are available and validated for cross-session consistency.
- [x] Research outputs include measurable citation metadata (source and time).

Execution note (2026-04-18):
- MCP server now exposes external intelligence and continuity tools in `scripts/mcp-server.mjs`: `research_fetch`, `trend_snapshot`, `state_read`, and `state_write`.
- Workspace MCP wiring is active in `.vscode/mcp.json` and routes to `./scripts/mcp-server.mjs` via Node stdio.
- Runtime smoke verification completed:
	- `research_fetch` success on `https://raw.githubusercontent.com/nodejs/node/main/README.md` with source metadata (`status: 200`, `fetchedAt: 2026-04-18T09:57:00.227Z`).
	- `trend_snapshot` success with citation metadata (`source: npm registry public API`, `fetchedAt: 2026-04-18T09:56:18.663Z`).
	- `state_write` and `state_read` success on temporary state path (`tmp-mcp-smoke.json`) with write/read timestamps and byte counts.
- Gate verification remains green after upgrade (`npm run validate`, `npm test`, and `npm run gate:release` pass).

#### V3.0-018: Universal IDE and AI CLI Adapter Surface

Priority: P1
Status: completed

Scope:
- Simplify init so its main output is one canonical instruction file: `.agent-instructions.md`.
- Add adapter mapping from canonical instruction file to multiple runtimes:
	- `.cursorrules`
	- `.windsurfrules`
	- `.clauderc`
	- Copilot/VS Code, Gemini, and Zed entry files
- Keep adapter files thin and synchronized from one source to avoid instruction drift.
- Stop local scaffolding logic after canonical instruction and adapter generation.
- Remove template-based project doc generation path from init and replace it with dynamic synthesis prompts and context-driven reasoning.
- Keep deterministic enforcement outside LLM compliance (validator/release gate/static checks) so architecture and boundary rules remain non-bypassable.
- Introduce strict boundary scope for auto-doc sync to avoid high-noise false positives.

Acceptance:
- [x] One canonical instruction file is generated and treated as source of truth.
- [x] Adapter files for IDE and CLI AI tools are generated or synchronized automatically.
- [x] Cross-tool initialization path is documented and validated (Cursor, Windsurf, Claude CLI, Copilot, Gemini, Zed).
- [x] Init flow is simpler and no longer depends on static stacks, blueprints, and profile bundles.
- [x] Template rendering path for project docs is removed from active init flow (no `.tmpl`-driven final doc output).
- [x] Init first-run interaction is compressed to minimal intent capture (domain + short project intent) with fast handoff.
- [x] Deterministic guardrail checks can fail CI even when prompt-layer guidance is bypassed.
- [x] Auto-doc sync is limited to explicit public boundaries (API contract, database schema, and exported/public surfaces) with measurable false-positive tracking.

Execution note (2026-04-18):
- V3.0-018A through V3.0-018E are completed and validated by deterministic checks in validate/test/release gate.
- Adapter synchronization is enforced through `sync:adapters` and `check:adapters` workflows to prevent instruction drift.

Execution plan (2026-04-18 proposal):
1. Canonical adapter compiler hardening
- Define `.agent-instructions.md` as the only authoring source and compile all runtime adapters from it.
- Add CI drift detection that blocks when adapter outputs diverge from canonical source.

2. Thin init kernel and zero-friction onboarding
- Refactor init orchestration into small modules so `init` main entry is thin and fast.
- Keep init focused on intent capture and policy handoff, not heavy local generation branches.

3. Template-free dynamic reasoning bootstrap
- Remove legacy template/staleness assumptions from runtime onboarding path.
- Generate architecture/design/context guidance from project intent, detected constraints, and MCP research signals.

4. Hybrid enforcement model (prompt + deterministic)
- Treat prompt-layer refusal as UX guidance only.
- Enforce architecture boundaries, separation-of-concerns, and policy invariants through deterministic validation/release gates.

5. Boundary-scoped auto-doc sync rollout
- Phase 1 scope: API contracts, DB schema, and explicit public interface changes only.
- Emit machine-readable sync diagnostics and trend metrics before any scope expansion.

Critical risk controls:
- Adapter format volatility risk: isolate provider-specific formats behind compiler adapters.
- Prompt bypass risk: keep hard checks in deterministic CI gates.
- Auto-doc drift risk: keep scope narrow first, then expand only with measured precision/recall evidence.

Positioning principle (product narrative):
- This initiative is not "AI restriction". It is "AI intelligence amplification".
- Creativity lane remains wide open for solution design, UI direction, and implementation detail.
- Guardrail lane is deterministic only for boundary integrity: architecture contracts, public API/docs sync, and release safety.
- User value statement: do not force template output; generate original output with accountable quality constraints.

Execution breakdown (issue split proposal):

##### V3.0-018A: Canonical Instruction Source and Adapter Compiler

Priority: P1
Status: completed

Scope:
- Establish `.agent-instructions.md` as single authoring source.
- Compile runtime adapters from canonical source for Cursor, Windsurf, Claude CLI, Copilot, Gemini, and Zed.
- Add deterministic adapter drift blocking in CI.

Acceptance:
- [x] Canonical source updates propagate to all adapters via compiler output only.
- [x] CI fails when adapter output diverges from canonical source.

Execution note (2026-04-18):
- Added adapter synchronization compiler helper: `scripts/sync-thin-adapters.mjs`.
- Added npm workflows: `sync:adapters` and `check:adapters`.
- Validation baseline remains green after rollout (`npm run check:adapters` and `npm run validate`).
- `scripts/validate.mjs` now enforces thin-adapter metadata, canonical hash match, and thin-size constraints.
- Publish CI executes `npm run validate`, so adapter drift fails CI before publish.

##### V3.0-018B: Thin Init Kernel (Zero-Friction Handoff)

Priority: P1
Status: completed

Scope:
- Reduce init to minimal intent capture and policy handoff.
- Move non-essential branching out of init main command path.
- Keep token optimization and memory continuity behavior intact.

Acceptance:
- [x] Init first-run prompts are compressed to minimal onboarding intent.
- [x] Init flow remains backward-compatible for legacy migration flags.

Execution note (2026-04-18):
- Extracted architecture recommendation and user-veto orchestration from `lib/cli/commands/init.mjs` into `lib/cli/init-architecture-flow.mjs` to thin the init kernel while preserving behavior.
- Extracted existing-project quick confirmation and override branch handling into `lib/cli/init-detection-flow.mjs` to further reduce init command branching density.
- Compatibility export surface in init command remains unchanged for existing tests and consumers.
- Final verification is green: `npm run validate` passed (287/0/0) and full test suite passed (54/0) with interactive discovery input piped deterministically.

##### V3.0-018C: Template-Free Dynamic Bootstrap

Priority: P1
Status: completed

Scope:
- Remove active `.tmpl`-driven final doc output path.
- Generate architecture/design/context artifacts through dynamic synthesis from project intent and live/snapshot evidence.

Acceptance:
- [x] Runtime onboarding no longer depends on template rendering for final docs.
- [x] Generated docs preserve measurable citations when research-backed claims are present.

Execution note (2026-04-18):
- Removed active template-driven manifest/rendering path in `lib/cli/project-scaffolder.mjs` by replacing template-oriented resolution with dynamic doc-target resolution for AI synthesis bootstrap.
- Added synthesis prompt hard rule requiring citation metadata (`source` + `fetchedAt`) for research-backed claims in `bootstrap-project-context.md` generation.
- Added deterministic validator coverage in `scripts/validate.mjs` for template-free bootstrap snippets and explicit anti-`.tmpl` guard on active scaffolder path.
- Extended CLI smoke coverage in `tests/cli-smoke.test.mjs` to assert citation metadata requirement in generated bootstrap prompt.
- Gate verification is green after rollout: `npm run validate` passed (295/0/0) and full test suite passed (54/0).

##### V3.0-018D: Deterministic Boundary Enforcement Layer

Priority: P1
Status: completed

Scope:
- Keep prompt-layer guidance as UX helper only.
- Enforce architecture boundaries and public contract integrity with deterministic checks in validator/release gate.

Acceptance:
- [x] CI can block boundary violations even if conversational prompts attempt bypass.
- [x] Boundary failure diagnostics are machine-readable and actionable.

Execution note (2026-04-18):
- Upgraded documentation boundary audit output in `scripts/documentation-boundary-audit.mjs` to deterministic machine-readable diagnostics with `reportVersion`, `violations`, `diagnosticCode`, `expectedDocumentationPaths`, and `suggestedActions`.
- Extended release gate enforcement in `scripts/release-gate.mjs` with explicit deterministic check `documentation-boundary-diagnostics-machine-readable` and actionable violation summarization for hard-fail paths.
- Added validator coverage in `scripts/validate.mjs` for deterministic boundary enforcement snippets across boundary audit and release gate.
- Extended tests in `tests/cli-smoke.test.mjs` and `tests/enterprise-ops.test.mjs` to verify machine-readable actionable diagnostics and release-gate deterministic boundary check wiring.
- Gate verification is green after rollout: `npm run validate` passed (302/0/0), `node ./scripts/release-gate.mjs` passed, and full test suite passed (54/0).

##### V3.0-018E: Scoped Auto-Docs Sync Rollout

Priority: P2
Status: completed

Scope:
- Start only with explicit public boundaries: API contract, DB schema, exported/public interfaces.
- Track precision/recall signal before expanding scope.

Acceptance:
- [x] Auto-sync scope remains explicitly bounded in phase 1.
- [x] Precision/recall metrics are emitted with timestamped evidence for rollout decisions.

Execution note (2026-04-18):
- `scripts/documentation-boundary-audit.mjs` now emits explicit phase-1 scope metadata (`autoDocsSyncScope`) bounded to `public-surface`, `api-contract`, and `database-structure`.
- Boundary audit now emits rollout evidence metrics with timestamped payload (`rolloutMetrics.measuredAt`) including precision/recall and numerator/denominator counts.
- `scripts/release-gate.mjs` now enforces deterministic checks `auto-docs-sync-scope-phase1` and `auto-docs-sync-rollout-metrics` for hard-fail CI behavior when scope/metrics metadata drift.
- `scripts/validate.mjs`, `tests/cli-smoke.test.mjs`, and `tests/enterprise-ops.test.mjs` now lock coverage for 018E scope and rollout metrics fields.

---

## Working Assumptions

- Node.js 18+ remains baseline.
- Package remains ESM-first.
- Trust and compatibility metadata are mandatory for publish safety.
- User onboarding remains simple: strictness increases by lifecycle stage, not by first-run friction.

