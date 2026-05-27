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

## Live Source Freshness Gate

Run this gate before Section 2 whenever web search is available. Treat modernity as rolling-current: use the session's current date as the freshness reference, and prefer the newest stable evidence that is relevant to the product and implementation surface.

Rules:

- For browser capability, framework setup, UI library, animation, 3D, canvas, charting, styling, accessibility, and package/API claims, use current official documentation or primary release notes first. Do not use trend posts as implementation authority.
- For design trend, category-code, visual-language, motion-pattern, typography, color, and interaction claims, prefer sources published or materially updated within the last 24 months from the current date. If stronger older evidence is used, label it `old-timeless` and restrict it to durable principles, not "current modern" claims.
- For product-category defaults, observe the current live category for this task. Do not rely on old examples, old galleries, or remembered benchmark screenshots as proof of what the category defaults to now.
- If web search is unavailable, set `sourceFreshnessStatus` to `pending-live-verification`; use repo evidence and user-provided material only, and do not claim a direction is current-year modern.
- If sources disagree, choose by product fit, accessibility, browser/runtime support, maintainability, and implementation feasibility, then record the disagreement.
- If the user provides a concept, treat it as a first-class constraint. Research should support, refine, or challenge that concept with evidence; it must not override the concept with generic trend defaults unless there is a concrete product, accessibility, technical, or evidence conflict.

Output: `sourceFreshness` block with `freshnessAnchorDate`, `rollingLookbackMonths` (default 24 for trend evidence), `sourceFreshnessStatus`, `officialDocsRequiredFor`, `oldSourcePolicy`, `userConceptAdaptation`, and `disagreements[]`.

Every important research claim must also appear in `evidenceTable[]` with:

- `claim`
- `sourceUrl`
- `sourceType` (`official`, `primary`, `industry`, `opinion`, `old-timeless`, `repo-evidence`, `user-provided`)
- `publishedOrUpdatedAt` when visible, otherwise `unknown`
- `fetchedAt`
- `confidence` (`high`, `medium`, `low`)
- `decisionImpact`

Research vocabulary is internal-only. Use `sourceFreshness`, `evidenceTable[]`, `researchDossier`, `anchor`, `categoryCodes`, `morphologicalExploration`, and `renameTest` to audit decisions, but do not expose those labels in UI copy, public-facing docs, section headings, or final user-facing rationale unless the user explicitly asks for the research trace.

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

## Reference Routing

After Section 1, identify the product category. Then run web_search 
and web_fetch on the matching domains below (or other modern, highly-regarded digital product equivalents) before picking any anchor.

Developer tool / CLI / AI infrastructure:
→ Linear, Raycast, Vercel, Warp, Resend, Railway (or equivalents)

SaaS / B2B productivity:
→ Notion, Loom, Cron, Superhuman, Intercom (or equivalents)

AI product / API:
→ Anthropic, Perplexity, ElevenLabs, Replicate, Mistral (or equivalents)

Ecommerce:
→ SSENSE, Allbirds, Represent, Shopify examples (or equivalents)

Design tool / creative:
→ Framer, Spline, Rive, Penpot (or equivalents)

Consumer / mobile:
→ Arc browser, Craft, Things, Bear (or equivalents)

Data / analytics:
→ Retool, Posthog, Metabase, Grafana (or equivalents)

For every product category:
→ Also check: Awwwards, Godly.website, and Layers.to for 
  state-of-the-art quality references in that category.

DO NOT fetch: Wikipedia, Dribbble templates, or generic blog posts 
about "best UI design practices."

For each reference: fetch the actual page this session, record what 
mechanic or hierarchy is borrowed, and explicitly state what is NOT 
borrowed (palette, component skin, layout rhythm).

If the anchor concept you're considering would make sense to someone 
from 1920, it's too archival. The anchor must be legible to someone 
who uses the web today.

## Section 2 — Reference Intake

Reference material is fuel for variance, not a style source.

- Capture between three and seven references per dimension that needs exploration: hierarchy, density, type system, motion, state language, material logic, color behavior.
- For each reference, record: source URL or citation, what is borrowed (mechanic, behavior, hierarchy, density, type pairing, motion choreography), and what is explicitly not borrowed (palette, component skin, layout rhythm, brand posture).
- References live in `referenceIntake[]`. The agent may not select an anchor in Section 5 that copies a reference's surface; only the borrowed mechanic is allowed to flow downstream.

If references are not provided by the user and web search is unavailable, set `referenceIntakeStatus` to `internal-evidence-only` and constrain Sections 3 to 5 to repo evidence and project docs.

## Section 3 — Creative Direction

Before UI code, commit to a specific visual direction. The agent tends to converge toward generic, "on distribution" outputs. In frontend design this creates what users call the "AI slop" aesthetic. This section exists to prevent that.

### 3a. Category defaults to avoid

Name at least three specific cliches your product category will fall into without intervention. Be specific enough that someone unfamiliar with the project can visualize the exact aesthetic trap from the text alone.

Common AI-safe cliches to name and reject when your product sits anywhere near them:

- `dev-tool default: condensed tabular numerics with minimal chrome and monospace code blocks on dark slate background, sans-serif metadata at 11-12px, monochrome status dots`
- `AI-startup landing default: purple-to-pink gradient hero with floating 3D glass cards, sans-serif display type at 700-900 weight, vague hero copy, three-up feature grid`
- `SaaS admin default: left-side icon-only nav, top utility bar, three-card KPI row above a single data table, neutral grey-on-white with one accent color`
- `marketing site default: hero image with one-line headline plus subhead, three feature tiles below, two pricing tiers, testimonial carousel, footer link grid`

Each category default must include a one-sentence rejection note explaining the trap it sets.

Output: `categoryCodes[]` with at least three entries in `docs/design-intent.json`. Each entry has `description`, `categoryDefaultReason`, and `rejectionNote`.

### 3b. Anchor reference

Pick one concrete, googleable real-world reference whose mechanics (not surface) translate to your UI. The anchor must be specific enough that renaming the product to a different category breaks coherence.

Hard constraints:
- Reject generic quality words as anchors: "modern", "clean", "premium", "expressive", "minimal", "bold", "futuristic", "elegant" are not anchors.
- Specific premium digital products are valid anchors when the borrowed element is an interaction mechanic, hierarchy pattern, or motion behavior -- not a palette or brand.
- Do not default to spatial place metaphors (room, darkroom, control room, studio, lab, cockpit, command center). Prefer artifacts, workflows, instruments, data behaviors, materials, editorial systems, or interaction mechanisms.
- Draw from IDE themes, cultural aesthetics, cinematic campaigns, editorial systems, material artifacts, or specific product experiences for inspiration.

Output: `conceptualAnchor.anchorReference` in `docs/design-intent.json`.

### 3c. Four creative commitments (record before coding)

1. **Typography**: Choose distinctive fonts with meaningful role contrast. Avoid overused families (Inter, Roboto, Arial, Space Grotesk, system fonts). Pick choices that elevate the aesthetic. Record one variable-axis or pairing decision.
2. **Color and palette**: Commit to a cohesive product-derived palette. Dominant colors with sharp accents outperform timid, evenly-distributed palettes. Name what product evidence makes the palette fit and one color behavior that would not transfer to another category.
3. **Motion and interaction**: Define one signature motion behavior more specific than "smooth." Focus on high-impact moments: one well-orchestrated page load with staggered reveals creates more delight than scattered micro-interactions. Use CSS-only or a modern motion library.
4. **Composition**: Make one composition choice that avoids interchangeable card stacks. Create atmosphere and depth rather than defaulting to solid backgrounds.

Avoid generic AI-generated aesthetics:
- Overused font families and cliched color schemes (particularly purple gradients)
- Predictable layouts and cookie-cutter component patterns
- Solid-color backgrounds without atmosphere or depth

Interpret creatively and make unexpected choices that feel genuinely designed for the context. Vary between light and dark themes, different fonts, different aesthetics. The agent still tends to converge on common choices across generations; resist this.

Output: Record all four commitments in `docs/design-intent.json` before UI code. The `derivedTokenLogic.tokenContinuityClassification` must classify each of typography, palette, motion, and spacing as `anchor-derived`, `continuity-retained`, or `newly-introduced` with rationale.

## Done Criteria

The brief is complete when:

1. `productReading` is filled with evidence-backed sentences.
2. `referenceIntake[]` records the borrowed mechanic and the explicit non-copy boundary per reference (or `referenceIntakeStatus: internal-evidence-only` is set).
3. `categoryCodes[]` has at least three entries with rejection notes.
4. One anchor reference is recorded that passes the specificity test (renaming the product to a different category breaks coherence).
5. Four creative commitments are recorded with product-derived rationale.
6. Generic anchors and spatial-place defaults are rejected with the rejection reason recorded.

Only after the brief is complete does the agent move on to `docs/DESIGN.md` and the rest of `docs/design-intent.json` (token logic, motion budget, accessibility policy, review rubric, library decisions, etc., per `bootstrap-design.md`).
