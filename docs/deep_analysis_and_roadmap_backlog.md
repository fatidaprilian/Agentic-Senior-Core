# Agentic-Senior-Core Roadmap Backlog

Date: 2026-04-30
Current Version: 3.0.40
Status: Phase 10 instruction-footprint simplification, Phase 11 cleanup/refactor audit, and Phase 12 post-release hygiene cleanup are complete.

---

## Purpose

Use this file to decide the next work, not to store release history.

Keep it short:
- Current baseline
- Settled direction
- Ordered roadmap
- Active migration checklist
- Explicit non-goals

Move completed detail to `CHANGELOG.md`, Git history, or validation output.

---

## Current Baseline

- `.instructions.md` is the canonical instruction source.
- Thin adapters are generated from `.instructions.md` and hash-synced.
- `.agent-context/` holds managed rules, prompts, checklists, policies, and state.
- Init/upgrade copy the canonical instruction surface and regenerate compiled guidance.
- Rule loading is scope-resolved. Narrow tasks must not load broad unrelated rules.
- Documentation-first requests must create/refine docs before implementation.
- UI work must create/refine `docs/DESIGN.md` and `docs/design-intent.json` before UI code.
- UI governance rejects AI-safe UI, palette autopilot, decorative wallpaper, and scale-only responsive behavior.
- Motion, 3D, canvas, WebGL, and animation libraries are allowed when they serve the product.
- Palette choices must be visually exploratory, product-derived, contrast-safe, and status-clear.
- Accessibility policy is split: WCAG 2.2 AA is the hard floor; APCA is advisory.
- Dependency and Docker guidance use current official docs and latest stable compatible choices first.
- Active instruction surfaces now use imperative gates, authority statements, README redirection, and mechanical validation.

---

## Settled Direction

- Use one official, proven instruction architecture. Do not add user-facing modes.
- Keep public user-facing surfaces simple.
- Keep detailed governance inside `.agent-context/`.
- Keep prompts short, imperative, and mechanically validated.
- Keep UI direction open-ended. Do not hard-code a house style, color family, or layout pattern.
- Prefer generated adapters over hand-edited duplicate rules.
- Retire legacy root adapters only after migration tests prove upgrade safety and rollback behavior.

---

## Status Legend

- `[x]` done
- `[~]` partially done
- `[ ]` not started
- `[-]` deferred

---

## Ordered Roadmap

### Phase 1 - Design Token Foundation

Status: `[x]`

Done:
- Token taxonomy: primitive, semantic, component.
- Token-path rules, reserved syntax, and alias resolution.
- `docs/design-intent.json` as token truth.
- Validation for token structure and bad fallback patterns.

### Phase 2 - Design Evidence Extraction

Status: `[x]`

Done:
- Machine-readable `designEvidenceSummary`.
- CSS variable, hardcoded style, Tailwind, component inventory, and token-bypass signals.
- Nested frontend detection in monolith and microservice layouts.
- Structure-aware class and inline-style inspection.

Next:
- [ ] Add AST-based inspection where text scanning is weak.
- [ ] Add runtime style evidence only for gaps static analysis cannot cover.

### Phase 3 - Accessibility Split

Status: `[x]`

Done:
- WCAG 2.2 AA is the hard compliance floor.
- APCA is advisory perceptual tuning.
- Focus, target size, auth friction, and dynamic state access are part of the hard-check surface.

### Phase 4 - Structured Design Execution

Status: `[x]`

Done:
- `designExecutionPolicy` and `designExecutionHandoff`.
- Surface plan, component graph, content-priority map, viewport mutation plan, interaction-state matrix, task-flow narrative, and signature-move rationale.
- Screenshot capture is not a baseline dependency.

### Phase 5 - Generic vs Distinctive Rubric

Status: `[x]`

Done:
- Machine-readable `reviewRubric`.
- Genericity signals, valid bold signals, and taste-vs-failure separation.
- UI judge diagnostics and calibration gold set.

### Phase 6 - Context Hygiene

Status: `[x]`

Done:
- Current repo evidence, current brief, current docs, and explicit current-task constraints are valid design inputs.
- Unrelated memory and old visual language are tainted unless the user approves continuity.
- Design continuity is opt-in.

### Phase 7 - Dependency and Runtime Freshness

Status: `[x]`

Done:
- Latest stable compatible dependency guidance.
- Official setup flows before stale manual assembly.
- Current Docker Compose and `compose.yaml` guidance.

Next:
- [ ] Validate downgrade paths include reasons.
- [ ] Detect stale setup examples where practical.
- [ ] Explain intentional old-version choices in generated docs.

### Phase 8 - Frontend and Design Governance Simplification

Status: `[~]`

Done:
- Scope-resolved loading across canonical and compiled instruction surfaces.
- Frontend rule is governance-first, not generic frontend basics.
- Design contract uses product-specific surfaces instead of dashboard-shaped defaults.
- Generic drift is machine-actionable through forbidden patterns and named signals.
- Core generic engineering rules are reduced and lazy-loaded.

Next:
- [ ] Run one deliberate real-project redesign validation pass before lifting release hold.
- [ ] Confirm real output no longer collapses into hero-plus-stats, repeated cards, or scale-only responsive fallback.

### Phase 9 - Context Continuity and Output Folding

Status: `[x]`

Done:
- Compact `active-memory.json` contract.
- Privacy-safe validation for secrets and raw logs.
- Design continuity remains opt-in.
- Token output folding policy keeps failures and actionable details while folding repetitive noise.

### Phase 10 - Instruction Footprint Simplification

Status: `[x]`

Goal:
- Keep downstream project roots small while AI tools still load the right rules through proven entrypoints.

Current completed slice:
- [x] Verified official entrypoint direction for Codex, Cursor, Windsurf, GitHub Copilot, Claude Code, and Gemini CLI.
- [x] Rewrote active design prompt and frontend rule into shorter imperative gates.
- [x] Added README redirection to `.agent-context/` and current project docs.
- [x] Updated thin adapter generation with authority, scoped loading, and bootstrap receipt wording.
- [x] Added line-count validation for active instruction surfaces.
- [x] Added generated bridge adapters for Claude, Gemini, Cursor, Windsurf, and GitHub path instructions.
- [x] Converted legacy root `.cursorrules`, `.windsurfrules`, and `.clauderc` output into thin compatibility adapters.
- [x] Updated tests and audits for the new contract shape.

Root footprint target:
- [x] Keep `AGENTS.md` as the primary bridge.
- [x] Add `CLAUDE.md` as a thin Claude import bridge.
- [x] Add `GEMINI.md` as a thin Gemini import bridge.
- [x] Keep `.instructions.md` canonical but compact.
- [x] Keep `.agent-context/` as managed canonical context.
- [x] Keep `.github/copilot-instructions.md` and `.github/instructions/*.instructions.md` generated.
- [x] Add Cursor rules under `.cursor/rules/*.mdc`.
- [x] Add Windsurf rules under `.windsurf/rules/*.md`.
- [x] Keep root `.cursorrules` and `.windsurfrules` as legacy thin adapters after migration tests passed.

Migration checklist:
- [x] Change `scripts/sync-thin-adapters.mjs` to generate imperative thin adapters with hash metadata.
- [x] Change `lib/cli/compiler.mjs` for the final entrypoint set.
- [x] Change `lib/cli/commands/init.mjs`, `upgrade.mjs`, and `optimize.mjs` output and generated file lists.
- [x] Change `lib/cli/constants.mjs`, `preflight.mjs`, and `backup.mjs` for new managed adapter files.
- [x] Review `detector.mjs`, rollback handling, and legacy ignore rules before root adapter retirement.
- [x] Update validation scripts for current contract checks.
- [x] Generate `CLAUDE.md`, `GEMINI.md`, `.cursor/rules/*.mdc`, `.windsurf/rules/*.md`, and `.github/instructions/*.instructions.md`.
- [x] Move active long-form Cursor/Windsurf content out of root legacy files.
- [x] Stop generating long-form root `.cursorrules`, `.windsurfrules`, and `.clauderc`.
- [x] Decide `.gemini/instructions.md` is a thin bridge; keep compiled content only in `.agent-instructions.md`.
- [x] Update adapter-path tests.
- [x] Update README, CONTRIBUTING, FAQ, deep dive, integration playbook, semantic redundancy notes, and CHANGELOG.

Done when:
- [x] New projects no longer receive long root adapter files.
- [x] Existing projects upgrade without losing user-owned instruction entrypoints.
- [x] Validation blocks adapter drift and stale legacy root surfaces.
- [x] Codex, Cursor, Windsurf, Copilot, Claude, and Gemini entrypoints have source-backed tests or manual verification notes.

### Phase 11 - Repository Hygiene and Bias-Resistant Refactor

Status: `[x]`

Goal:
- Clean stale V2/V3-transition artifacts, shrink high-risk monolith files, and reduce prompt/code surfaces that can bias agents toward obsolete skill-marketplace thinking or generic UI output.

Audit basis:
- Full tracked-file inventory via `git ls-files`.
- Root footprint review.
- Stale-term scan for `skill`, `tier`, `marketplace`, `trust`, `template`, `generic`, `dashboard`, and palette-autopilot terms.
- Package surface review via `npm pack --dry-run`.
- Line-count review for large source, test, docs, and state files.

Immediate cleanup candidates:
- [x] Delete tracked `input.txt`.
  - Reason: it is throwaway CLI input (`1`, `4`, `1`, `1`, `Testing`) with no repo references.
- [x] Keep ignored local artifacts out of package tarballs.
  - Reason: `npm pack --dry-run` currently includes ignored `.agent-context/state/active-memory.json` and `.agent-context/state/v3-purge-audit.json` when they exist locally because the package ships the whole `.agent-context/` tree.
  - Result: `package.json` now allowlists stable `.agent-context/` subtrees and required state seeds instead of shipping the whole directory.
- [x] Decide whether `test_output.txt`, `.benchmarks/`, `.agentic-backup/`, and local `active-memory.json` need a documented cleanup command.
  - Reason: they are ignored and not tracked, but they make the root look noisy during local work.
  - Result: added `npm run clean:local`, backed by `scripts/clean-local-artifacts.mjs`, to remove only known ignored local artifacts on explicit user command.

Obsolete or confusing surfaces:
- [x] Remove or archive `.agent-context/marketplace/trust-tiers.json`.
  - Reason: no active code path references it, and V3 purge mode retired skill marketplace gates.
- [x] Archive or delete `docs/skill-incorporation-playbook.md`.
  - Reason: it describes `.agent-context/skills/`, tier routing, and a 100-page skill-platform plan that conflicts with current compact governance direction.
- [x] Move stale historical planning docs to `docs/archive/` or add a clear historical banner.
  - Candidate files: `docs/roadmap.md`, `docs/v2-upgrade-playbook.md`, `docs/benchmark-reference.md`, `docs/analysis-priority-matrix.md`, `docs/rtk-comparison-and-sync-audit-2026-04-11.md`, and `docs/semantic-redundancy-scan-2026-04-11.md`.
  - Result: kept the files in place for validator and reference stability, but added historical notes that redirect current policy to `.instructions.md`, `.agent-context/`, and this backlog.

Rename stale active terminology:
- [x] Rename `skillTrust` and `verifiedSkillDomainCount` in `scripts/governance-weekly-report.mjs`, `.agent-context/state/weekly-governance-report.json`, and `tests/operations.test.mjs`.
  - Suggested replacement: `governanceSurfaceTrust` and `verifiedGovernanceSurfaceCount`.
  - Reason: the script now checks governance surfaces, not skills.
- [x] Review `lib/cli/compatibility.mjs`.
  - Reason: it only checks `.agent-context/skills/*/compatibility-manifest.json`; active release gates already say the skill compatibility manifest gate is retired in V3 purge mode.
  - Result: deleted after confirming no active imports.

Large-file refactor targets:
- [x] Split `lib/cli/project-scaffolder/design-contract.mjs` (about 1,450 lines before split).
  - Suggested modules: seed defaults, schema validation, AI-safe UI audit, conceptual-anchor validation, review-rubric validation.
  - Reason: this is the highest-risk active monolith and the easiest place for duplicated bias wording to grow.
  - Result: moved design-intent validation into `lib/cli/project-scaffolder/design-contract/validation.mjs`; the public `design-contract.mjs` entrypoint remains stable and is now about 715 lines.
- [x] Split `tests/cli-smoke/design-and-detection.mjs` (about 833 lines before split).
  - Reason: one smoke file owns too many concerns; split design contract, detector, upgrade UI seed, and optimization behavior tests.
  - Result: kept the public registration wrapper and moved the concerns into `tests/cli-smoke/design-and-detection/`.
- [x] Split `lib/cli/commands/init.mjs` (about 774 lines).
  - Reason: init orchestration, prompts, project evidence, scaffolding, and console output are interleaved.
  - Result: kept `runInitCommand` as the public entrypoint and moved runtime detection, project-context/design seed, and setup decision helpers into `lib/cli/commands/init/`; `init.mjs` is now about 587 lines.
- [x] Split `lib/cli/utils.mjs` (about 634 lines before split).
  - Suggested modules: file sync, managed-surface manifest, MCP config sync, CLI prompt helpers.
  - Result: kept `lib/cli/utils.mjs` as the public entrypoint and moved filesystem helpers, CLI prompt helpers, and managed-surface analysis into `lib/cli/utils/`.
- [x] Review `scripts/validate.mjs`, `scripts/validate/config.mjs`, and `scripts/validate/coverage-checks.mjs`.
  - Reason: validation is strong but dense; split checks by adapter, docs, purge, design, dependency, and state surfaces.
  - Result: keep the current three-file boundary for this slice. `validate.mjs` owns orchestration/basic repository checks, `coverage-checks.mjs` owns behavior coverage checks, and `config.mjs` is static validation data; splitting the static config now would add import churn without reducing active behavior risk.

Generated state policy:
- [x] Classify `.agent-context/state/*.json` as one of `seed`, `fixture`, `generated-report`, or `local-only`.
  - Reason: the package currently ships benchmark reports, weekly reports, onboarding reports, and local generated audit state together.
  - Result: added `.agent-context/state/README.md`; stable seeds/config stay tracked and shipped, `onboarding-report.json` stays tracked as repo operational state, and generated report outputs are ignored/local-only.
- [x] Move report snapshots used only by tests into `tests/fixtures/` or regenerate them in tests.
  - Candidate files: `benchmark-evidence-bundle.json`, `benchmark-writer-judge-matrix.json`, `weekly-governance-report.json`, `quality-trend-report.json`, `onboarding-report.json`.
  - Reason: shipped state should not look like current project truth when it is only historical output.
  - Result: removed tracked generated report snapshots for benchmark, trend, weekly governance, quality, token, and memory-continuity outputs. Scripts already regenerate these reports on demand; tests use stdout/generated output. `onboarding-report.json` remains tracked because audit scripts read it as the repository operational state.

Bias and generic-output cleanup:
- [x] Keep anti-generic UI rules, but reduce repeated prose copies of the same forbidden examples in active prompts, tests, and seed builders.
  - Reason: repeated words like `dashboard`, `generic`, `template`, `cream`, `slate`, and `AI-safe` are useful as detectors, but over-repetition can become an unintended style anchor.
  - Result: centralized duplicate `genericitySignals`, `validBoldSignals`, and `forbiddenPatterns` in `design-contract.mjs`, then shortened active prompt/rule prose so concrete examples appear as drift checks rather than repeated style anchors.
- [x] Keep palette policy product-derived and contrast-bound, not color-prescriptive.
  - Reason: the repo should reject autopilot palettes without banning valid product-earned palettes.
  - Result: retained product-derived/WCAG-bound palette language and kept color-family examples framed as autopilot risks, not banned palettes or preferred colors.
- [x] Keep the `skill command is retired in purge mode` test.
  - Reason: that test is intentionally negative and protects V3 purge behavior.
  - Result: retained the negative smoke coverage while deleting obsolete skill-marketplace artifacts.

Validation plan:
- [x] Rerun `npm pack --dry-run` and confirm volatile local state is excluded.
- [x] Rerun `npm run check:adapters`.
- [x] Rerun `node --test tests/cli-smoke/design-and-detection.mjs`.
- [x] Rerun `node --test tests/knowledge-injection.test.mjs`.
- [x] Rerun `node --check` for split `lib/cli/utils/*` helper modules.
- [x] Rerun `node --check` for split `lib/cli/commands/init/*` helper modules.
- [x] Rerun `node ./scripts/validate.mjs`.
- [x] Rerun `node --test tests/cli-smoke.test.mjs`.
- [x] Rerun `npm test`.
- [x] Run `git diff --check` and resolve whitespace/line-ending noise before release.

### Phase 12 - Post-Release Hygiene Cleanup

Status: `[x]`

Goal:
- Close the small cleanup gaps found after the Phase 11 release without expanding the instruction surface or adding new user-facing modes.

Done:
- [x] Removed stale V2 evidence-bundle validation.
- [x] Removed the obsolete `bun.lock` and ignored Bun lockfiles while npm remains the package manager source of truth.
- [x] Synced `package-lock.json` with the release version.
- [x] Updated `scripts/bump-version.mjs` so future bumps keep `package-lock.json` aligned.
- [x] Added validation for lockfile drift and accidental `bun.lock` reintroduction.
- [x] Removed unused `resolveScopeBlueprintCandidates`.
- [x] Consolidated upgrade setup constraints through `init-detection-flow.mjs`.
- [x] Removed internal scaffolder helpers from the public barrel export.
- [x] Refreshed `.agent-context/state/onboarding-report.json` to the current CLI version.
- [x] Replaced placeholder architecture/dependency state maps with repo-specific agent context.
- [x] Clarified frontend governance: grid or line backgrounds are invalid filler unless tied to a product function.

Decision:
- No further frontend/backend rule reduction is needed in this slice. Current loading is scope-resolved, backend rules remain global and stack-agnostic, and frontend rules unlock motion/3D/canvas while blocking generic template drift.

---

## Deferred

- Full maker-checker multi-agent design orchestration.
- Heavy long-term memory architecture.
- Heavy screenshot or browser-capture infrastructure as a baseline requirement.
- Style-trend chasing as policy.
- Mathematical layout systems before token/evidence foundations are stronger.

---

## Non-Goals

- Do not force one house style.
- Do not flatten UI into safe corporate minimalism.
- Do not replace design judgment with rigid formulas.
- Do not turn advisory design guidance into blocking noise everywhere.
- Do not reintroduce static final-document templates.

---

## Part 6: Documentation and Explanation Standards (Mandatory)

This applies to documentation, release notes, onboarding text, review summaries, and agent-facing explanations.

Writing baseline:
- Write for native English speakers.
- Target an 8th-grade reading level.
- Use clear, direct, plain language.
- Keep tone confident, practical, and conversational.
- Say the main point first, then supporting detail.

Required behavior:
- Explain decisions like a competent coworker speaking clearly.
- Remove filler.
- Use concrete verbs and everyday phrasing.
- Expand only when the topic is truly complex.

Non-negotiables:
- No emoji in formal artifacts. This is mandatory.
- Avoid AI cliches and puffed-up language.
- Separate facts from assumptions.
- Keep terminology stable.
- End major explanations with the next action when useful.

---

## Next Action

Phase 10, Phase 11, and Phase 12 are complete locally.
Next release action:
1. Run the final release validation gate.
2. Commit and push the 3.0.40 complexity-budget release.
3. Start the next follow-up slice from earlier deferred phases only after this cleanup bundle is released.
