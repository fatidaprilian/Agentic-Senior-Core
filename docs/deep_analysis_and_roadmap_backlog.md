# Agentic-Senior-Core - Deep Analysis and Roadmap Backlog

Date: 2026-04-22
Current Version: 3.0.16
Status: Stable baseline, design-governance expansion active

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

- The published package version is `3.0.15`.
- The current baseline already ships canonical instruction flow centered on `.instructions.md`.
- `init` and `upgrade` now copy the canonical instruction surface, regenerate compiled instructions, and preserve adaptive prompts.
- Fresh project setup now asks project topology first: `Monolith` or `Microservice / distributed system`.
- UI design governance already pushes agents to synthesize from the current project context, not from prior website memory or unrelated visual carryover.
- Docker and dependency governance already prefer the latest stable compatible guidance and official setup flows first.
- The current design contract already protects against generic shrink-only responsive behavior and already allows purposeful motion when it stays performant and reduced-motion-safe.

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
- evaluate visual drift with better signal than prose-only review
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

Breakdown:
- [x] Produce one machine-readable design evidence summary format.
- [x] Extract CSS variable evidence.
- [x] Extract hardcoded color, radius, spacing, shadow, and typography patterns.
- [x] Extract Tailwind usage in a way that can later evolve to AST inspection.
- [ ] Add AST-based inspection where plain text scanning is too weak.
- [x] Add component inventory reporting.
- [ ] Add runtime style evidence only for gaps that static analysis cannot cover.

Done when:
- [x] The system can produce a machine-readable design evidence summary from a real repo.
- [~] It can detect common token bypass patterns.
- [x] It can surface actual UI package evidence inside monolith and microservice layouts.
- [x] The evidence output is useful enough to seed design docs and later audits.

### Phase 3 - Accessibility Split: Hard Gate vs Advisory

Overall status: `[~]`
Priority: high

Goal:
- Keep accessibility strict where it must be strict, and nuanced where nuance helps quality.

What already exists:
- [x] Accessibility is already treated as a non-negotiable design concern in the contract direction.

Breakdown:
- [ ] Formalize WCAG 2.2 AA as the hard compliance floor.
- [ ] Formalize APCA as an advisory layer for perceptual quality.
- [ ] Extend checks beyond color contrast:
  - [ ] focus visibility
  - [ ] target size
  - [ ] authentication friction
  - [ ] dynamic state access
- [ ] Define which checks are blocking and which are advisory.

Done when:
- [ ] The repo has an explicit hard-fail accessibility floor.
- [ ] Advisory contrast guidance does not override legal or standards-based gates.
- [ ] Accessibility checks stay useful for modern UI instead of collapsing into a single contrast ratio rule.

### Phase 4 - Hybrid Visual QA

Overall status: `[~]`
Priority: high

Goal:
- Evaluate UI changes with a hybrid flow that uses deterministic screenshot checks first, then escalates meaningful diffs to a semantic judge.

What already exists:
- [x] The repo already has an advisory internal UI design judge.

Breakdown:
- [ ] Add deterministic screenshot baseline support.
- [ ] Add masking rules for dynamic content.
- [ ] Add threshold and stability rules for rendering noise.
- [ ] Add viewport coverage expectations across mobile, tablet, and desktop.
- [ ] Escalate only meaningful diffs to the semantic judge.
- [ ] Define machine-readable output for deterministic diff and semantic verdict together.

Done when:
- [ ] The repo can tell the difference between tiny rendering noise and real design drift.
- [ ] Mobile, tablet, and desktop changes can be judged against the same contract.
- [ ] The system reduces false positives without hiding real regressions.

### Phase 5 - Rubric Calibration for Generic vs Distinctive

Overall status: `[~]`
Priority: high

Goal:
- Define a repeatable rubric for judging whether a UI is distinctive, contract-faithful, and coherent.

What already exists:
- [x] The repo already tries to prevent generic template output through prompt and judge direction.

Breakdown:
- [ ] Define rubric dimensions in one stable source:
  - [ ] distinctiveness
  - [ ] contract fidelity
  - [ ] visual consistency
  - [ ] heuristic UX quality
  - [ ] motion discipline
- [ ] Separate taste preference from real failure conditions.
- [ ] Build a small gold set with human-reviewed examples.
- [ ] Calibrate the judge against that gold set before raising trust.
- [ ] Add reporting that explains why something is generic, not just that it is generic.

Done when:
- [ ] The rubric can explain why a design is too generic.
- [ ] The judge can distinguish bold-but-valid from inconsistent-or-lazy.
- [ ] Contract drift and default-framework drift become measurable.

### Phase 6 - Context Hygiene and Memory Boundaries

Overall status: `[~]`
Priority: medium

Goal:
- Keep agents fresh and context-aware without accidentally cloning older projects or polluted style memory.

What already exists:
- [x] The design contract already tells agents to synthesize from the current project context.
- [x] The repo already discourages accidental carryover from earlier website styles.

Breakdown:
- [ ] Formalize allowed context sources for design work:
  - [ ] current repo evidence
  - [ ] current brief
  - [ ] current docs contract
  - [ ] explicitly approved reference systems
- [ ] Define continuity as opt-in for design language.
- [ ] Define how stale or unrelated memory should be ignored.
- [ ] Add validation or audit coverage for memory contamination boundaries.

Done when:
- [ ] Agents stop carrying over old palette, layout, or component habits by accident.
- [ ] Continuity is opt-in for design language, not silent default behavior.
- [ ] Repo evidence wins over memory residue.

### Phase 7 - Dependency and Runtime Freshness

Overall status: `[~]`
Priority: medium

Goal:
- Keep framework setup, Docker usage, and dependency choices aligned with current official guidance.

What already exists:
- [x] Latest stable compatible dependency guidance is already the default direction.
- [x] Official setup flows are already preferred over stale manual assembly when they are better.
- [x] Docker guidance already prefers current `docker compose` and `compose.yaml` practices.

Breakdown:
- [ ] Add deterministic validation that downgrade paths include a clear reason.
- [ ] Add stale-example detection for framework setup guidance where practical.
- [ ] Add clearer evidence in generated docs when an older version is chosen intentionally.
- [ ] Keep framework-specific examples reviewed as major ecosystem defaults change.

Done when:
- [ ] Init guidance stops falling behind current framework defaults.
- [ ] Docker examples and dependency choices age more slowly.
- [ ] The system can explain why an older version is being used when that happens.

---

## 7. Deferred Until the Foundation Is Real

These ideas are valid, but they should not jump ahead of the roadmap above.

- Full multi-agent maker-checker orchestration for design work
- Complex long-term memory architectures for design preference persistence
- Heavy VLM architecture optimization before deterministic visual QA exists
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
1. token taxonomy and resolver plan
2. design evidence extraction
3. accessibility split formalization
4. hybrid visual QA
5. rubric calibration
6. context hygiene refinements

If this file starts becoming a release diary again, cut it back and move history to the changelog.
