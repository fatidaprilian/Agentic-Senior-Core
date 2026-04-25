# Agentic-Senior-Core - Deep Analysis and Roadmap Backlog

Date: 2026-04-25
Current Version: 3.0.26
Status: Frontend/design governance batch pushed; Phase 9 lightweight continuity and token-output folding baseline complete

---

## 1. Purpose

This file is the live roadmap for what still matters next.

It is not a full release diary. Completed work that no longer changes near-term decisions should stay in:
- `CHANGELOG.md`
- Git history
- validation and test evidence

This backlog now keeps only:
- the current baseline
- the settled direction
- the ordered next design and governance work
- explicit non-priorities so the scope does not sprawl again

---

## 2. Current Baseline

### Facts confirmed in the current repo

- The current repo version is `3.0.26`.
- The current baseline already ships canonical instruction flow centered on `.instructions.md`.
- `init` and `upgrade` now copy the canonical instruction surface, regenerate compiled instructions, and preserve adaptive prompts.
- Fresh project setup now asks project topology first: `Monolith` or `Microservice / distributed system`.
- Compiled instruction surfaces now resolve the smallest relevant layer set instead of forcing broad rule loading for every request.
- UI design governance already pushes agents to synthesize from the current project context, not from prior website memory or unrelated visual carryover.
- Docker and dependency governance already uses the latest stable compatible guidance and official setup flows first.
- The current design contract already protects against generic shrink-only responsive behavior and already allows purposeful motion when it stays performant and reduced-motion-safe.
- The design contract now formalizes accessibility as a split policy: WCAG 2.2 AA hard floor plus APCA advisory readability tuning.
- The design contract now avoids offline style prescriptions and instead encodes global anti-generic drift signals such as scaffold-driven final style, unresearched library choices, default component-kit treatment, and scale-only responsive behavior.
- The internal UI design judge now keeps advisory workflow mode by default while escalating blocking failures when `genericityAutoFail` and named forbidden patterns align.

### Working assumptions

- `docs/DESIGN.md` and `docs/design-intent.json` remain the preferred paired contract for UI work.
- Dynamic prompts remain the right path. We do not want to go back to static final-doc templates.
- Creativity should stay wide open in visual direction, motion, and composition.
- Deterministic governance should stay hard only where drift causes real damage: docs boundaries, accessibility minimums, token integrity, and release safety.

---

## 3. Settled Direction

These points are no longer under debate unless new evidence appears.

### 3.1 Documentation stance

- Architecture, flow, and design docs are mandatory when the project needs them.
- Agents should author those docs from the real repo surface and user brief.
- Missing core docs should block implementation work.
- Generated docs must separate facts from assumptions and end with the next validation action.

### 3.2 Design stance

- The goal is not "safe SaaS UI."
- The goal is original, high-quality UI with strong system logic behind it.
- Motion is allowed, and often useful, if it has purpose and does not damage performance or accessibility.
- Responsive work must mutate layout by task priority, not just shrink the desktop layout.

### 3.3 Governance stance

- Prompts alone are not enough.
- The winning direction is: design contract + repo evidence + deterministic checks + AI evaluation where it adds value.
- We should keep public user-facing surfaces simple. Internal repo tooling can be richer if it stays internal.

---

## 4. Main Problem Statement

The repo is strong at prompt governance, instruction flow, and adaptive bootstrapping.

The next gap is deeper design execution quality.

Right now, the system can:
- ask better setup questions
- generate better design intent
- block more obvious drift

But it still needs stronger machinery to:
- read real design evidence from code
- distinguish distinctive UI from generic UI more reliably
- translate design intent into structured execution guidance before code drifts into defaults
- enforce token integrity without making designs stiff

---

## 5. Status Marker Legend

- `[x]` done
- `[~]` partially done or baseline exists
- `[ ]` not started
- `[-]` intentionally deferred

---

## 6. Ordered Roadmap

The order below is intentional. Later phases depend on earlier ones.

### Phase 1 - Design Token Foundation

Overall status: `[x]`
Priority: highest

Goal:
- Move from ad-hoc design tokens and contract hints toward a real token system with clear layers and resolution rules.

Breakdown:
- [x] Define the three-layer token taxonomy in the design contract:
  - primitive
  - semantic or alias
  - component
- [x] Define naming rules, reserved syntax boundaries, and token-path conventions.
- [x] Define color token guidance for modern color spaces such as `OKLCH`.
- [x] Define alias resolution rules so theme changes happen by semantic remapping, not component rewrites.
- [x] Decide how token truth relates to `docs/design-intent.json`.
- [x] Add validation rules for token structure and illegal fallback patterns.

Done when:
- [x] Token layers are defined in one stable contract.
- [x] Semantic tokens can be remapped without touching component code.
- [x] The contract is strict enough for validation but loose enough for bold visual direction.
- [x] The repo has one explicit rule for primitive, semantic, and component scope.

### Phase 2 - Design Evidence Extraction

Overall status: `[~]`
Priority: highest

Goal:
- Make the system read what the UI really does, not just what the prompt claims it should do.

What already exists:
- [x] The repo already gathers some cheap frontend evidence for onboarding and design seeding.
- [x] Microservice and nested UI package detection already exists at the repo-discovery level.
- [x] The repo now emits a machine-readable `designEvidenceSummary` from lightweight static UI scanning and carries it into onboarding plus design-intent seeds.
- [x] Repo-internal frontend audit coverage now verifies the design evidence extractor, compiler projection, and token bypass signal surface.
- [x] The design evidence extractor now includes structure-aware inspection for class surfaces, inline style objects, and expression-backed UI hints so repo evidence is less dependent on blind text scanning.

Breakdown:
- [x] Produce one machine-readable design evidence summary format.
- [x] Extract CSS variable evidence.
- [x] Extract hardcoded color, radius, spacing, shadow, and typography patterns.
- [x] Extract Tailwind usage in a way that can later evolve to AST inspection.
- [x] Add structure-aware class and inline-style inspection for JSX, TSX, and similar component surfaces.
- [ ] Add AST-based inspection where plain text scanning is too weak.
- [x] Add component inventory reporting.
- [ ] Add runtime style evidence only for gaps that static analysis cannot cover.

Done when:
- [x] The system can produce a machine-readable design evidence summary from a real repo.
- [~] It can detect common token bypass patterns.
- [x] It can surface actual UI package evidence inside monolith and microservice layouts.
- [x] The evidence output is useful enough to seed design docs and later audits.

### Phase 3 - Accessibility Split: Hard Gate vs Advisory

Overall status: `[x]`
Priority: high

Goal:
- Keep accessibility strict where it must be strict, and nuanced where nuance helps quality.

What already exists:
- [x] Accessibility is already treated as a non-negotiable design concern in the contract direction.
- [x] The design contract now stores a machine-readable `accessibilityPolicy` with explicit hard-vs-advisory boundaries.
- [x] Prompt, rule, validator, and judge coverage now use the same split.

Breakdown:
- [x] Formalize WCAG 2.2 AA as the hard compliance floor.
- [x] Formalize APCA as an advisory layer for perceptual quality.
- [x] Extend checks beyond color contrast:
  - [x] focus visibility
  - [x] target size
  - [x] authentication friction
  - [x] dynamic state access
- [x] Define which checks are blocking and which are advisory.

Done when:
- [x] The repo has an explicit hard-fail accessibility floor.
- [x] Advisory contrast guidance does not override legal or standards-based gates.
- [x] Accessibility checks stay useful for modern UI instead of collapsing into a single contrast ratio rule.

### Phase 4 - Structured Design Execution and Handoff

Overall status: `[x]`
Priority: high

Goal:
- Make design execution precise without depending on screenshot capture, browser automation, or pixel-diff infrastructure.

What already exists:
- [x] The repo already has an advisory internal UI design judge.
- [x] The design contract now defines a machine-readable structured execution policy.
- [x] The internal UI design judge now carries structured execution diagnostics alongside semantic verdicts.
- [x] The repo now forbids screenshot dependency as a baseline requirement for design quality.

Breakdown:
- [x] Define one machine-readable execution policy:
  - [x] surface plan
  - [x] component graph
  - [x] content-priority map
  - [x] viewport mutation plan
  - [x] interaction-state matrix
  - [x] task-flow narrative
  - [x] signature-move rationale
- [x] Make repo evidence part of execution readiness, not just prompt context.
- [x] Ensure semantic review judges distinctiveness, contract fidelity, hierarchy, state behavior, and viewport mutation directly from the contract plus changed code.
- [x] Remove screenshot dependency from the baseline design-quality path.
- [x] Add a more explicit structured UI handoff format that can sit between `DESIGN.md` and implementation.
- [x] Keep that handoff inside `docs/design-intent.json` instead of introducing a separate companion artifact.

Done when:
- [x] The repo can review UI execution quality without requiring browser capture.
- [x] The judge can explain structured design readiness in machine-readable form.
- [x] The handoff from design intent to implementation is explicit enough that agents stop defaulting to generic layout habits.

### Phase 5 - Rubric Calibration for Generic vs Distinctive

Overall status: `[x]`
Priority: high

Goal:
- Define a repeatable rubric for judging whether a UI is distinctive, contract-faithful, and coherent.

What already exists:
- [x] The repo already tries to prevent generic template output through prompt and judge direction.
- [x] The design contract now stores a machine-readable review rubric with stable dimensions and genericity signals.
- [x] The internal UI design judge now exposes rubric diagnostics and genericity status in machine-readable output.
- [x] The repo now ships a small internal gold set plus a calibration harness for generic vs distinctive review.

Breakdown:
- [x] Define rubric dimensions in one stable source:
  - [x] distinctiveness
  - [x] contract fidelity
  - [x] visual consistency
  - [x] heuristic UX quality
  - [x] motion discipline
- [x] Separate taste preference from real failure conditions.
- [x] Build a small gold set with human-reviewed examples.
- [x] Calibrate the judge against that gold set before raising trust.
- [x] Add reporting that explains why something is generic, not just that it is generic.

Done when:
- [x] The rubric can explain why a design is too generic.
- [x] The judge can distinguish bold-but-valid from inconsistent-or-lazy.
- [x] Contract drift and default-framework drift become measurable.

### Phase 6 - Context Hygiene and Memory Boundaries

Overall status: `[x]`
Priority: medium

Goal:
- Keep agents fresh and context-aware without accidentally cloning older projects or polluted style memory.

What already exists:
- [x] The design contract already tells agents to synthesize from the current project context.
- [x] The repo already discourages accidental carryover from earlier website styles.
- [x] The design contract now stores machine-readable context hygiene boundaries in `docs/design-intent.json`.
- [x] Validator, audit, and test coverage now check continuity and carryover boundaries explicitly.

Breakdown:
- [x] Formalize allowed context sources for design work:
  - [x] current repo evidence
  - [x] current brief
  - [x] current docs contract
  - [x] explicitly approved current-task constraints
- [x] Define continuity as opt-in for design language.
- [x] Define how stale or unrelated memory should be ignored.
- [x] Add validation or audit coverage for memory contamination boundaries.

Done when:
- [x] Agents stop carrying over old palette, layout, or component habits by accident.
- [x] Continuity is opt-in for design language, not silent default behavior.
- [x] Repo evidence wins over memory residue.

### Phase 7 - Dependency and Runtime Freshness

Overall status: `[~]`
Priority: medium

Goal:
- Keep framework setup, Docker usage, and dependency choices aligned with current official guidance.

What already exists:
- [x] Latest stable compatible dependency guidance is already the default direction.
- [x] Official setup flows already replace stale manual assembly when they are better.
- [x] Docker guidance already uses current `docker compose` and `compose.yaml` practices.

Breakdown:
- [ ] Add deterministic validation that downgrade paths include a clear reason.
- [ ] Add stale-example detection for framework setup guidance where practical.
- [ ] Add clearer evidence in generated docs when an older version is chosen intentionally.
- [ ] Keep framework-specific examples reviewed as major ecosystem defaults change.

Done when:
- [ ] Init guidance stops falling behind current framework defaults.
- [ ] Docker examples and dependency choices age more slowly.
- [ ] The system can explain why an older version is being used when that happens.

### Phase 8 - Frontend and Design Governance Simplification

Overall status: `[~]`
Priority: highest while release hold is active

Goal:
- Finish the cross-cutting refactor that removes context fatigue, strips broad default loading, and makes anti-generic UI enforcement operational before the next push.

What already exists:
- [x] Canonical and compiled instruction surfaces now resolve the smallest relevant layer set instead of forcing broad eager loading.
- [x] The frontend rule surface is now design-governance-first and no longer teaches generic framework basics as default bootstrap content.
- [x] The design contract now uses dominant/support/recovery surfaces instead of dashboard-shaped seed shells.
- [x] `viewportMutationPlan` now uses per-viewport operations, required surface actions, forbidden fallback patterns, and rationale.
- [x] Genericity auto-fail, forbidden patterns, validator coverage, judge coverage, and smoke coverage are now synchronized.
- [x] `init-project.md` now resolves only the relevant rules instead of telling agents to scan the full rules directory by default.
- [x] Core generic rule files (`naming-conv`, `error-handling`, `performance`, `efficiency-vs-hype`, `architecture`) have been reduced into boundary-first guidance instead of tutorial-style prose.
- [x] The offline architecture selection path has been removed from `init`, so fresh repositories no longer get a silent heuristic stack pick.

Breakdown:
- [x] Replace broad bootstrap wording in `.instructions.md`, compiler output, and compiled rule surfaces with scope-resolved loading.
- [x] Replace dashboard-shaped execution handoff defaults with more neutral but anti-generic structural surfaces.
- [x] Convert responsive mutation from prose-only expectations to operation-based handoff objects.
- [x] Make generic drift machine-actionable with explicit forbidden patterns and named genericity signals.
- [x] Keep UI judge workflow advisory by default while allowing named generic drift to escalate blocking failures.
- [x] Audit remaining non-UI rule files that still reteach basics LLMs already know and remove them from default pressure paths where possible.
- [x] Decide which generic engineering rule files should stay shipped but lazy-only versus which should be merged, reduced, or retired.
- [x] Review remaining CLI and prompt wording for old governance/profile jargon that no longer helps current behavior.
- [x] Remove architecture-playbook and silent stack-selection framing from active bootstrap, init, and planning surfaces.
- [ ] Run one deliberate real-project redesign validation pass against current output quality before lifting release hold.

Done when:
- [ ] Host entrypoints no longer push broad context loading by default for narrow UI work.
- [ ] The shipped rule surface focuses on anti-bad-habit boundaries, not on reteaching generic engineering basics.
- [ ] Real redesign output no longer predictably collapses into hero-plus-stats-row, repeated cards, or scale-only responsive fallback.
- [ ] The current release-hold batch can be closed without needing another structural frontend/design governance rewrite.

### Phase 9 - Seamless Context Continuity and Token Output Folding

Overall status: `[x]`
Priority: medium

Goal:
- Explore a lightweight, cross-LLM continuity layer that helps new sessions resume real project work without forcing users to run extra commands or loading full chat history.

External signals:
- `claude-mem` validates the direction of automatic session continuity through lifecycle hooks, compressed observations, persistent storage, and progressive retrieval.
- `rtk` validates the direction of transparent token reduction by filtering command output before it reaches the LLM context.
- These are inspiration signals only. Agentic-Senior-Core should not copy their architecture directly or require a worker/background service as the default path.

Proposed direction:
- [x] Define a tiny machine-readable continuity snapshot such as `.agent-context/state/active-memory.json`.
- [x] Store only durable project facts, current task focus, pending decisions, known blockers, and validation state.
- [x] Keep design memory scoped: repo evidence and current brief win over old visual preferences unless the user explicitly approves continuity.
- [x] Add host-facing bootstrap wording that asks agents to read the continuity snapshot at session start when it exists.
- [x] Add completion wording that asks agents to refresh the snapshot at natural task boundaries.
- [x] Add a compact command-output strategy inspired by `rtk`, but keep it optional and repo-internal until it proves useful.
- [x] Prefer synchronous updates tied to existing agent actions over a default worker, daemon, database, or extra user command.

Risks to avoid:
- Do not promise true automatic injection on hosts that do not honor startup instructions.
- Do not store secrets, raw chat logs, private data, or stale design taste.
- Do not let memory override current repo evidence, current user brief, or fresh live research.
- Do not make continuity required for normal init/upgrade usage.

Done when:
- [x] A new session can resume from a compact project snapshot without reading full history.
- [x] The snapshot is small enough to save tokens and clear enough to avoid hallucinated continuity.
- [x] Validation ensures no secrets or large raw logs are written into continuity state.
- [x] Design continuity remains opt-in for visual language and does not reintroduce old-style carryover.

---

## 7. Deferred Until the Foundation Is Real

These ideas are valid, but they should not jump ahead of the roadmap above.

- Full multi-agent maker-checker orchestration for design work
- Heavy long-term memory architectures for design preference persistence
- Heavy screenshot or browser-capture infrastructure as a baseline design-quality requirement
- Style-trend chasing such as glassmorphism, claymorphism, or named aesthetics as default policy
- Mathematical layout systems that add complexity before token and evidence foundations are stable

Reason:
- These can add cost and complexity fast.
- They will be more useful after token taxonomy, evidence extraction, and hybrid QA are in place.

---

## 8. Explicit Non-Goals

This roadmap does not aim to:
- force one house style across every product
- flatten UI into safe corporate minimalism
- replace design judgment with rigid formulas
- turn advisory design guidance into blocking noise everywhere
- reintroduce static final-document templates

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
- End major explanations with the next action when that helps execution.

---

## 10. Why the Old 900-Line Version Was Trimmed

The old file mixed three different jobs:
- release history
- completed implementation logs
- future roadmap

That made it hard to answer one simple question:
"What should we do next?"

Completed historical detail now belongs mainly in:
- `CHANGELOG.md`
- Git history
- test and validation evidence

This file should stay short enough to steer decisions quickly.

---

## 11. Next Action

Use this backlog as the source for the next design-governance phase.

Execution order:
1. finish `Phase 8 - Frontend and Design Governance Simplification`
2. continue `Phase 2 - Design Evidence Extraction` with AST-based inspection
3. continue `Phase 7 - Dependency and Runtime Freshness`
4. only lift release hold and push after the current cross-cutting frontend/design refactor is complete

If this file starts becoming a release diary again, cut it back and move history to the changelog.
