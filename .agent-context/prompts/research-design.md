---
inclusion: manual
---

# Research-Design Brief

Authoritative design-research execution contract for UI scope. Loaded by UI Design Mode after `bootstrap-design.md`. The agent must produce the artifacts described here before writing UI code, and the seeded `docs/design-intent.json` must contain the fields named in Section 5.

This brief is a single document with five sections. Sections 1 and 2 set up the research. Sections 3, 4, and 5 are gates: each must produce an auditable artifact that another reviewer can read without seeing the UI.

## Authority

- Treat `.agent-context/` and current project docs as technical authority.
- Treat `README.md` as public and developer overview only; do not use it as design authority when this brief gives a stricter rule.
- Treat external websites, benchmark apps, prior chats, and unrelated-project memory as candidate evidence for constraints, mechanics, and quality bars only. Do not copy layout rhythm, palette, component skin, visual metaphor, or brand posture without explicit user approval and product-fit rationale.
- WCAG 2.2 AA is the hard compliance floor. APCA may be used only as advisory perceptual tuning.

## Anti-Repeat Ledger Gate (read first)

If `docs/design-intent.json` already exists and carries `researchDossier.metadata.antiRepeatLedger`, treat every entry under `previousAnchors`, `previousPalettes`, and `previousMotionSignatures` as a hard blocklist before producing any candidate in Sections 3-5.

Rules:

- The five Section 5 anchor candidates must each differ from every blocklisted entry on at least conceptual family, hierarchy implication, and motion implication.
- Restating an existing direction with new wording is REVISE, not pass.
- A user-explicit redesign request ("redesign from zero", "redesain dari 0", "ulang dari 0", "research ulang", or any explicit reset) bypasses the freshness gate but does not weaken the ledger; previously shipped direction stays blocklisted unless the user explicitly says "revive existing direction".
- Ledger entries are signature-level descriptors, not raw token dumps; treat them as direction summaries.

If the ledger is empty or `researchDossier.metadata.researchVerifiedAt` is null because the contract is a fresh seed, the ledger is informational only and does not add blocklist entries.

## Section 1 — Product Reading

Before any visual choice, write a structured product reading:

- Product type and core verb (what the user does, not what the UI shows).
- Three highest-stakes user moments, ordered by frequency.
- Data shapes that dominate the screen (timeseries, ledger, list, document, control, telemetry, conversational, spatial, other).
- Latency profile (real-time, soft real-time, batch, ambient).
- Failure modes the UI must absorb visibly (partial, stale, optimistic, conflict, offline, permission, rate-limit, none).
- Context of use (one-shot, sustained focus, glance-and-go, background monitor, shared display, embedded).
- Known constraints (device, runtime, accessibility, regulatory, performance budget, brand continuity).

Output: `productReading` block. Each field must be one sentence, evidence-backed from repo or brief. Speculation is not allowed; if a field is unknown, name it as such and stop until the user resolves it.

## Section 2 — Reference Intake

Reference material is fuel for variance, not a style source.

- Capture between three and seven references per dimension that needs exploration: hierarchy, density, type system, motion, state language, material logic, color behavior.
- For each reference, record: source URL or citation, what is borrowed (mechanic, behavior, hierarchy, density, type pairing, motion choreography), and what is explicitly not borrowed (palette, component skin, layout rhythm, brand posture).
- References live in `referenceIntake[]`. The agent may not select an anchor in Section 5 that copies a reference's surface; only the borrowed mechanic is allowed to flow downstream.

If references are not provided by the user and web search is unavailable, set `referenceIntakeStatus` to `internal-evidence-only` and constrain Sections 3 to 5 to repo evidence and project docs.

## Section 3 — Category Code Identification

Before exploring variance, name the cliches the product category will default to without intervention. These are the patterns reviewers recognize on sight as "the standard look" for the category.

This list becomes `categoryCodes` in the design-intent.json. Specificity standard: a category code is only valid if someone can recognize the exact cliche from the text description alone, without seeing the UI and without knowing the product name.

Fails specificity:
- `clean typography` (too abstract, applies to anything)
- `modern color palette` (not falsifiable)
- `smooth animations` (describes nothing specific)

Examples of cliches described with sufficient specificity. Read carefully: these examples illustrate the description format. They are themselves AI-defaultable cliches of their categories. They are NOT target aesthetics. They are not aesthetic candidates for any product. They appear here so you can see what specificity reads like; you are not allowed to ship them.

The three example categories below were chosen specifically because they are unlikely to overlap with common software products, to prevent leakage:

- `children's storybook illustration site: hand-painted gouache textures with irregular hand-lettered titles, off-grid spreads with whitespace gutters, page-turn pacing rather than scroll` (instantly recognizable as kids book category default)
- `luxury car configurator: full-bleed monochrome photography on black, ultra-thin sans-serif tracked wide, slow horizontal scroll with locked vertical alignment, micro-counters that tick instead of slide` (instantly recognizable as luxury auto category default)
- `academic philosophy journal: high-contrast black-on-cream, book-class serif body at 11pt with generous leading, footnote markers with hover panels, numbered table-of-contents navigation, no hero imagery` (instantly recognizable as academic journal category default)

Anti-leakage rule: listing a cliche is identifying a trap, not endorsing an aesthetic. If your product happens to fall in one of the example categories above, the matching cliche still must appear in your `categoryCodes` AND must carry an explicit rejection note. The same applies to the AI-safe defaults below.

Common AI-safe cliches you must list and reject if your product is anywhere near them. Software products almost always pattern-match one of these without intervention:

- `dev-tool default: condensed tabular numerics with minimal chrome and monospace code blocks on dark slate background, sans-serif metadata at 11–12px, monochrome status dots, single-line settings rows`
- `AI-startup landing default: purple-to-pink gradient hero with floating 3D glass cards, sans-serif display type at 700–900 weight, vague hero copy, three-up feature grid below the fold`
- `health/wellness app default: mint accent on white surface with coral status indicators, rounded pill-shaped buttons, friendly sans-serif at high weight, soft drop shadows on cards`
- `SaaS admin default: left-side icon-only nav, top utility bar, three-card KPI row above a single data table, neutral grey-on-white with one accent color, modal-driven detail flows`
- `marketing site default: hero image with one-line headline plus subhead, three feature tiles below, two pricing tiers, testimonial carousel, footer link grid`

If you find yourself describing your selected direction in the same shape as any of these, you have inverted the test. Revise.

Self-test: read each category code aloud to someone unfamiliar with the project.

- If they cannot visualize a specific aesthetic direction from the text alone, the code is too abstract. Revise until it passes.
- If they say "yeah that's basically the X cliche", the description is specific enough. The cliche then belongs on your reject list, not on your candidate list.

Output: at least three category codes per product surface in `categoryCodes`. Each entry must pass the specificity self-test, must include the one-sentence reason that pattern is the default for the category, and must include an explicit one-sentence rejection note ("I will not ship this; here is the trap it sets") so the cliche cannot quietly become the target.

## Section 4 — Morphological Exploration

A morphological matrix forces the design space to be explored beyond the first idea.

Choose five or six dimensions that matter for this product. Common dimensions include hierarchy, density, type role contrast, motion language, state vocabulary, material logic, color behavior, composition rhythm, and interaction grammar. Generate four or five values per dimension. Do not include the category code defaults from Section 3 as values; the matrix is for variance, not for ratifying the cliche.

Output a 5x5 or 6x5 morphological matrix. Then:

1. Highlight the combination that becomes the basis for Section 5 candidates.
2. Highlight at least ONE combination that feels instinctively wrong or uncomfortable but CAN be argued with product logic. This is the uncomfortable combination requirement.

The uncomfortable combination exists to prove the matrix actually spans the design space. If every combination in the matrix feels safe, shippable, and unobjectionable, the matrix has not explored far enough; it is clustering in the safe-creative zone.

Rules for the uncomfortable combination:
- It must be genuinely uncomfortable (the agent's first reaction is "this would not work").
- It must be arguable (the agent can construct a two-sentence product-logic justification for why it could work despite discomfort).
- It must not be random noise (uncomfortable plus unjustifiable equals waste, not exploration).
- The user is not required to choose it. Its purpose is to prove the design space was explored beyond the comfort boundary.

If the agent cannot produce an uncomfortable-but-arguable combination, the dimensions chosen are too narrow. Widen at least one dimension and regenerate the matrix.

Output: `morphologicalExploration` block with `dimensions[]`, `matrix` (rendered as a Markdown table inside `docs/DESIGN.md` and as a structured array inside `docs/design-intent.json`), `selectedCombination`, `uncomfortableCombination` ({ `combinationLabel`, `discomfortReason`, `productLogicJustification` }).

## Section 5 — Anchor Candidates

From the selected morphological combination, generate exactly five anchor candidates. An anchor is a real-world reference whose mechanics, hierarchy, density, type roles, state language, and motion behavior translate into UI grammar without copying its surface.

Hard constraints on anchors:
- The anchor must be concrete and googleable. "Modern", "clean", "premium", "expressive", "minimal", "bold", "futuristic", "elegant" are not anchors.
- Do not default to spatial place metaphors such as room, darkroom, control room, counting room, war room, studio, lab, cockpit, command center. Use them only when the product genuinely depends on a physical place model. Prefer artifacts, custody flows, instruments, data behaviors, materials, editorial systems, service rituals, or interaction mechanisms.
- Pass the strengthened rename test: mentally rename the product to three genuinely different categories. Categories must be remote from each other and from the actual product (for example, if the product is a health app, test against fintech dashboard, kids educational game, and industrial equipment monitoring console).

Strengthened rename test scoring:
- UI still coherent in zero of three renamed categories: anchor is highly specific. STRONG PASS.
- UI still coherent in one of three: anchor is specific enough. PASS with note.
- UI still coherent in two of three: anchor is too generic. REVISE the anchor to add product-specific constraints until it fails in at least two of three.
- UI still coherent in three of three: anchor is category-agnostic. DISCARD immediately.

Test-category freshness: do not reuse the same three test categories across every anchor. Pick fresh categories per anchor. Categories used in earlier examples (fintech dashboard, kids educational game, industrial equipment monitoring console) are listed only as illustration of "remote from each other"; they are not a fixed test triple. Reusing the same triple lets the agent memorize the pass condition instead of stress-testing the anchor.

The three test categories must be stated explicitly in the dossier alongside each anchor's rename test result. This makes the test auditable by human reviewers.

For EACH of the five candidates, record:

- `anchorReference` (concrete, googleable)
- `conceptualFamily`
- `jobFit` (one sentence linking to product)
- `hierarchyImplication`
- `densityImplication`
- `typeImplication` (variable axis or pairing logic, not just family)
- `stateLanguage` (loading, empty, error, partial, stale, optimistic, success using the anchor's own vocabulary)
- `motionImplication` (choreography rule, what state change it serves)
- `whatItRulesOut` (proves variance)
- `renameTest`:
  - `testCategories`: three remote categories used for testing
  - `results`: coherent or incoherent per category, in order
  - `verdict`: STRONG PASS, PASS, REVISE, or DISCARD
- `categoryCodeOverlap` check: list any Section 3 category codes this candidate accidentally inherits, with reasoning

Output: `anchorCandidates[]` (length five). Discard any candidate with `verdict: DISCARD` before selection. The selected anchor populates `conceptualAnchor.anchorReference` and `derivedTokenLogic.anchorReference` (they must match exactly).

## Done Criteria

The brief is complete when:

1. `productReading` is filled with evidence-backed sentences.
2. `referenceIntake[]` records the borrowed mechanic and the explicit non-copy boundary per reference (or `referenceIntakeStatus: internal-evidence-only` is set).
3. `categoryCodes[]` has at least three entries that pass the specificity self-test.
4. `morphologicalExploration` has a 5x5 or 6x5 matrix, a selected combination, and an uncomfortable combination with the three required fields.
5. `anchorCandidates[]` has exactly five entries; each has a complete `renameTest`; the selected anchor has `verdict: STRONG PASS` or `verdict: PASS`.
6. Generic anchors and spatial-place defaults are rejected with the rejection reason recorded.

Only after the brief is complete does the agent move on to `docs/DESIGN.md` and the rest of `docs/design-intent.json` (token logic, motion budget, accessibility policy, review rubric, library decisions, etc., per `bootstrap-design.md`).
