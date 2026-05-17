# Project History

This document consolidates the historical record from prior phase outcomes, audit snapshots, execution playbooks, and the legacy product roadmap. Individual files were removed when this consolidation landed; their dated content is summarized below for traceability. For active execution work, use `docs/deep-analysis-and-roadmap-backlog.md`. For current governance authority, use `AGENTS.md` and `.agent-context/`.

---

## Phase 2 Outcome — Caching Layer (completed 2026-05-16)

Phase 2 implemented the three-layer caching contract (D4): a static governance prefix, a semi-static project context, and a non-cacheable dynamic suffix. The benchmark harness emits cache-layered prompt contracts from the same fixtures used by Phase 0 and Phase 1; the simulation writes 120 rows across 10 fixtures, six providers, and two scenarios to `benchmarks/results/cache-phase-2-2026-05-16.json`.

The strongest result is the Anthropic five-minute prompt-cache projection: for `with_loaded_rules`, the average cold input is 8,483.1 tokens and the average warm-read effective input is 907.26 tokens, an 89.31% effective-token reduction on repeat reads using the documented Anthropic cache read multiplier. OpenAI and Gemini ship eligibility-only projections. Grok, DeepSeek, and Qwen ship estimate-only entries with no economic projection because no official cache source was locked.

## Phase 3 Outcome — Anti-Halu Stack (completed 2026-05-16)

Phase 3 implemented D6's three-mechanism anti-halu stack with no runtime dependencies: an L1 pre-prompt with stricter rule authority and rule-ID citation requirements, an L2 in-flight bounded reflection format that cites rule IDs without exposing hidden chain-of-thought, and an L3 post-hoc set of MCP rule lookup and compliance tools, citation drift audits, and an offline benchmark scorer. The provider-free anti-halu benchmark passed all five fixtures (rule conflict, missing-docs claim, public API change without docs, fake dependency claim, uncited compliance claim) at 100% pass rate and 100% citation validity. Source of truth: `benchmarks/results/anti-halu-phase-3-2026-05-16.json`.

## Phase 5 Hardening Plan (generated 2026-05-16)

Phase 5 was scoped as 10–16 active hours of work after Gate C accepted Phase 3 and skipped Phase 4 retrieval. The plan committed to a publishable v4 release candidate that tells the truth about what v4 changes, ships a single reproducible benchmark bundle, closes supply-chain and install-size gaps, lifts coverage toward locked Phase 5 success-metric targets, and stops at a Gate D decision before publish. Phase 5 explicitly forbade adding retrieval, adding runtime dependencies, inflating tests with low-value coverage, publishing 4.0.0 without explicit Gate D approval, re-debating D1–D6 or any Phase 1–3 locked decisions, and making universal caching claims that mix integration modes.

## Phase 5 Outcome (completed 2026-05-16)

Phase 5 produced a publishable 4.0.0-rc.1 candidate without breaking the lossless, honest-measurement contract. Public surfaces (README, CHANGELOG, FAQ, integration playbook, doc-index) were refreshed to describe v4 truthfully and route readers to the per-tool caching scope matrix. A new caching-scope hygiene audit guards public surfaces against universal "X% caching saving" claims that mix integration modes; a new release-bundle audit verifies `benchmarks/results/release-bundle-4.0.0.json` references each Phase 0–3 artifact by SHA-256 hash with no drift. Supply-chain checks were clean (`npm audit` zero vulnerabilities at every severity, lockfile consistent, SBOM regenerated). Packed size was 271.6 kB, unpacked size 1.1 MB, total files 157 — all within the Phase 5 targets. Test count rose from 176 to 186; validate count rose from 565 to 568. No runtime dependency was added. `4.0.0-rc.1` remained local and unpublished.

## V1.7 Execution Playbook (delivered H2 2026)

V1.7 translated roadmap goals for the Frontend Product Experience into a three-phase delivery flow: foundation baseline (visual-token governance, responsive breakpoint and density standards, accessibility baseline and reduced-motion policy), UX and conversion (homepage and docs shell narrative hierarchy, onboarding CTA clarity, visual regression guardrails for protected pages), and a release gate that ran the frontend usability audit and archived the report artifact. Required release evidence was the frontend usability checklist completion, the audit report artifact from CI, and the KPI snapshot for responsiveness and conversion clarity.

## V1.7 Issue Breakdown (delivered H2 2026)

V1.7 work was decomposed into two milestones (Q3 Foundation, Q4 UX-Conversion) with epics covering visual language and token system, frontend system foundation, UX clarity and conversion improvements, and release-gate evidence. Issues were tracked under labels v1.7, v1.7-q3, v1.7-q4, design-system, frontend-architecture, ux, a11y, performance, docs, and testing.

## V1.8 Operations Playbook (delivered 2026-03-30)

V1.8 focused on release operations governance and supply-chain evidence. Three objectives: prevent version and changelog drift before release, produce repeatable machine-readable release evidence, and attach SBOM artifacts to CI runs for audit readiness. The release pipeline ran `npm run validate` and `npm test` for baseline checks, `npm run audit:frontend-usability` and `npm run gate:release` for governance, and `npm run sbom:generate` for compliance evidence. Required CI workflows shipped: `.github/workflows/release-gate.yml` and `.github/workflows/sbom-compliance.yml`. Operational controls blocked promotion on any failed release gate, missing required governance artifact, or SBOM generation failure.

## V2 Upgrade Playbook (benchmark-driven, retired by V3 purge)

The V2 playbook captured the benchmark-driven direction that made `advance` the default skill tier and required parity with three benchmark repositories (`sickn33/antigravity-awesome-skills`, `github/awesome-copilot`, `MiniMax-AI/skills`). It defined an Adopt/Adapt/Improve matrix per benchmark: transactional installation semantics, backup/rollback safety checkpoints, and forbidden-content blocking from `antigravity-awesome-skills`; role-based contribution flow and contribution hygiene from `awesome-copilot`; mandatory frontend quality parity from `MiniMax-AI/skills`. V3 purge mode retired the skill marketplace path; current policy lives in `AGENTS.md`, `.agent-context/`, and `docs/deep-analysis-and-roadmap-backlog.md`.

## Analysis Priority Matrix (post 2.0.2 release)

After the 2.0.2 release, the highest-return strategy was finishing high-impact 2.0.x hardening, locking measurable quality gates, and moving to V2.5 benchmark rigor. The bottleneck had shifted from foundational architecture to execution hygiene: token-efficiency adoption, compatibility policy closure, benchmark anti-regression, and documentation synchronization. Token optimization was kept as an optional policy layer with safe fallback, with explicit command rewrite guidance in compiled governance rules; installation and hook guidance was added without forcing a hard dependency on external binaries.

## RTK Comparison and Sync Audit (2026-04-11)

The 2026-04-11 audit compared Agentic-Senior-Core against RTK as a reference implementation for token-efficient CLI workflows and mapped cleanup and synchronization actions. Repository hygiene findings: no duplicate skill files under `.agent-context/skills/`; expected duplicate pair `.cursorrules` and `.windsurfrules` (same compiled output by design); local artifacts `.agentic-backup/`, `validate-output.log`, and tracked legacy `validate-output-new.txt` were observed. Actions taken: added `.benchmarks/` to `.gitignore`, removed tracked legacy `validate-output-new.txt`, removed local generated `.agentic-backup/` and `validate-output.log`. Pending items remained in the roadmap for full compatibility enforcement and local dependency security auditing.

## Semantic Redundancy Scan, Phase 2 (2026-04-11)

The 2026-04-11 redundancy scan applied n-gram similarity and lexical overlap scoring to root markdown, `docs/`, `.agent-context/`, and the instruction entry files. Top findings: very high overlap among `.github/copilot-instructions.md`, `.gemini/instructions.md`, `.instructions.md`, and `AGENTS.md` (0.68–0.80 cluster), indicating governance directives repeated across multiple instruction entry points. Recommendation: keep one canonical instruction source and reduce other files to thin adapters, moving duplicated policy text into `.agent-context/rules/` and referencing it. Expected and intentional: `.cursorrules` ↔ `.windsurfrules` perfect overlap. Medium-overlap pairs centered on `docs/roadmap.md` versus `README.md`, `CHANGELOG.md`, `docs/deep-dive.md`, and `docs/analysis-priority-matrix.md`; the recommendation was to keep README as a concise index and the roadmap as the single source of milestone truth.

---

## Legacy Product Roadmap (V1.6 through V3.0)

The historical product roadmap tracked five release tracks. All tracks below are completed and are preserved here only for traceability.

### V1.6 — Reliability and Team Workflow (completed 2026-03-19)

Foundation and governance: scope-hint onboarding without offline stack or blueprint selection; CLI support favoring one default review-threshold path over multiple profile surfaces; override governance hardening with required Owner and Expiry metadata, ISO date validation, expiry warning window, and expired-entry validation failure. CI and detection quality: LLM Judge machine-readable reporting (JSON_REPORT line plus `.agent-context/state/llm-judge-report.json` artifact), severity normalization for CI parity across GitHub Actions and GitLab CI, detection transparency with confidence score, gap, ranked candidates, and reasoning persisted in the onboarding report. Upgrade and benchmarking: upgrade assistant with dry-run and yes flags, expanded smoke tests for the profile matrix and upgrade dry-run, and `npm run benchmark:detection`. Detection top-1 accuracy 91.67%, manual correction rate proxy 8.33%, smoke test pass rate 100%.

### V1.7 — Frontend Product Experience (completed 2026-03-30)

This repository is a governance and enablement engine, not a runtime frontend app, so V1.7 shipped a frontend execution-quality pack. Frontend usability checklist at `.agent-context/review-checklists/frontend-usability.md`; frontend execution playbook and V1.7 issue decomposition (now archived in this HISTORY); frontend usability audit script `scripts/frontend-usability-audit.mjs`; CI workflow `.github/workflows/frontend-usability-gate.yml` with report artifact upload; GitHub issue template `.github/ISSUE_TEMPLATE/v1.7-frontend-work-item.yml`; npm command `audit:frontend-usability`.

### V1.8 — Release Operations and Compliance (completed 2026-03-30)

Release governance gate: `scripts/release-gate.mjs`, `npm run gate:release`, `.github/workflows/release-gate.yml` with artifact upload. Supply-chain compliance baseline: CycloneDX SBOM generator at `scripts/generate-sbom.mjs`, `npm run sbom:generate`, `.github/workflows/sbom-compliance.yml` with SBOM artifact upload. Operational readiness standards: release operations checklist at `.agent-context/review-checklists/release-operations.md`, operations execution guide (now archived in this HISTORY), operations automated tests at `tests/operations.test.mjs`. Release gate report generation, SBOM generation, and validator enforcement of V1.8 required assets all passed.

### V2.0 and V2.5 (archived)

The older V2.0 and V2.5 direction included marketplace, external benchmark watchlist, and static stack-research experiments. Those surfaces are no longer active governance. The retained active behavior is narrower: scope-first onboarding without offline stack or blueprint selection; transactional install, preflight, backup, and rollback safeguards; release, SBOM, benchmark, documentation-boundary, and governance report automation; frontend governance based on repo evidence, current task constraints, and the design contract, not copied external packs; provider-agnostic memory continuity with privacy redaction. Current runtime, framework, dependency, and ecosystem decisions must come from the target repository evidence, user constraints, and live official documentation when those claims can drift.

### V3.0 — Federated Rules Cloud and Policy Ops (completed 2026-04-18)

V3.0 moved beyond repository-level governance toward federated rules operations (Federated Governance). Planned scope: federated rules operations with centralized policy distribution via signed versioned governance bundles, organization-level override registry with expiry enforcement and audit trails, policy drift detection across multiple repositories; compliance and provenance upgrades including artifact provenance attestations, expanded SBOM and release evidence with cross-repository dependency provenance, and compliance readiness packs mapped to regulated environments; an operations control plane delivering portfolio-level dashboards, controlled rollout and rollback channels, and incident playbooks; dynamic context delivery modernization evaluating MCP-native domain retrieval for rule packs needed only during specific edits. Top intake policy required all candidate work be recorded in roadmap top goals before implementation, with measurable success metrics and a clear exit condition before execution. Success metrics: 100% policy drift detection coverage for onboarded repositories, 100% governance bundle attestation coverage for managed releases, mean time to governance rollback below 15 minutes.
