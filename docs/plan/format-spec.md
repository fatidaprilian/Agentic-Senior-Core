# Rules Pack Format Spec (v4)

> **Status:** Draft pending GATE A approval
> **Audience:** Maintainer + agents performing Phase 1 migration
> **Authority:** Lock via `00-context.md` Decision once user approves at GATE A

This document is the canonical reference for the v4 rules pack format. Every file under `.agent-context/rules/` migrates to this shape during Phase 1. After the pilot validates the format (GATE B), the same shape applies to all 15 rules.

## 1. Format Components

Every rule file contains, in this order:

1. **YAML frontmatter** between two `---` delimiters
2. **One H1 heading** stating the rule's domain
3. **Optional one-paragraph factual intro** (max 3 sentences, no marketing phrases)
4. **Numbered sections** with stable rule IDs as `## <PREFIX>-NNN: <Name>`
5. **Numbered list items** within each section as the canonical instruction body

### 1.1 YAML Frontmatter Schema

Required keys:

```yaml
---
id_prefix: FE
domain: frontend-architecture
version: 1
priority: high
scope: ui
applies_to:
  - frontend
  - fullstack
keywords:
  - ui
  - ux
  - design
  - layout
last_migrated: 2026-XX-XX
---
```

Field semantics:

- `id_prefix` (required, string) — 2-4 character uppercase prefix used in every section ID inside this file. Lock per file in section 3 below.
- `domain` (required, string) — kebab-case slug matching the filename without extension. Used by validate gate to confirm filename and domain agree.
- `version` (required, integer) — schema version starting at `1`. Bump only when frontmatter shape itself changes.
- `priority` (required, enum) — one of `critical`, `high`, `medium`. Drives loading order when the agent loads multiple rule scopes simultaneously.
- `scope` (required, enum) — one of `all-tasks`, `backend`, `ui`, `data`, `infra`, `governance`. Multi-scope rules pick the dominant scope; secondary scopes go in `applies_to`.
- `applies_to` (required, array of strings) — domains that activate this rule. Drawn from `{frontend, backend, fullstack, infra, mobile, cli, library}`.
- `keywords` (required, array of strings) — kebab-case keywords used by AGENTS.md routing and grep-based validate snippet checks. **Every kebab-case keyword that the validate gate currently looks for must appear here OR in the body. Keep them here when the keyword is metadata; keep them in the body when they are part of an active instruction.**
- `last_migrated` (required, string ISO date) — date of the migration commit. Audit trail.

Optional keys:

- `superseded_by` (string ID) — if a section was removed and rolled into another rule.
- `experimental` (boolean) — true for rules under active iteration; default false.

### 1.2 Section ID Convention

```markdown
## FE-014: Anti-Generic UI Gate
```

- Format: `## <PREFIX>-NNN: <Title>` where `NNN` is zero-padded 3-digit decimal.
- IDs are **stable**. Once assigned, an ID is never reused even if the section is removed (it goes to a tombstone marker in CHANGELOG instead). New sections take the next unused integer.
- Sub-sections within one rule append a single uppercase letter: `FE-014-A`, `FE-014-B`. Sub-IDs only when the parent has 3+ sub-bullets that benefit from individual citation.
- Section ID assignment for the migration is documented in section 5.

### 1.3 Numbered Body Convention

```markdown
## FE-014: Anti-Generic UI Gate

1. Do not ship interchangeable dashboard chrome, balanced card grids, centered marketing shells, generic component-kit surfaces, generic abstract logos, or nonfunctional background decoration unless the product earns them.
2. Make at least three at-a-glance product-specific signals visible for new screens or broad redesigns. Signals may be data treatment, iconography, state language, motion behavior, spatial structure, typography, material logic, or color behavior.
3. Apply the rename test: if the UI can be renamed to another product category without changing composition, palette, iconography, and motion language, revise before implementation is considered complete.
4. Apply the old-design regression test for broad redesigns: if the UI reads as the previous design with fewer details, revise before implementation is considered complete.
```

Rules:

- Use Arabic numerals starting at `1`. Reset to `1` at every new H2 section.
- Each numbered item is **one directive**. Multi-clause sentences are OK; multi-directive paragraphs are not.
- Sub-bullets allowed up to one level deep, in plain `-` form. Used only for explicit options, library names, or examples that support the parent directive.
- Maximum 12 numbered items per section. If a section grows beyond 12, split into two sections with sequential IDs.
- Empty numbered placeholders are forbidden. Every item carries an instruction.

### 1.4 Positive Framing

Per `research-foundation.md` D1 Q5 (positive instruction framing for cross-model compatibility), prefer positive directives.

OK:
- "Use parameterized queries for all user-supplied input."
- "Return `Result<T, Error>` types or throw an explicit Error subclass."

Avoid:
- "Don't use string concatenation for SQL."
- "Don't return null."

When the negative framing carries semantic weight that positive framing loses, both forms may appear, with the negative as a sub-bullet:

```markdown
1. Validate all user-supplied input against the declared schema before persistence.
   - Reject silent type coercion on type-tagged fields.
```

### 1.5 Optional One-Paragraph Intro

Allowed between the H1 and the first numbered section. Strict format:

- Maximum 3 sentences.
- Factual context only. No motivational phrases, no value statements.
- Names the boundary's primary risk, not its philosophy.

OK example:
> "Authentication boundaries are a perimeter; a violation here means full account compromise. This rule covers HTTP API surface, server-side render surface, and CLI auth contexts."

Not OK example (ETH Zurich red flag):
> "Security is everyone's responsibility. We believe defense-in-depth is the right way to think about modern systems..."

## 2. Cross-Reference Convention

When one rule mentions another:

- Inline reference in body: cite the section ID, e.g. `(see FE-014)`. The validate gate will check that referenced IDs exist.
- Filesystem path references stay valid for backward compat (e.g. `frontend-architecture.md` mentions still resolve in the routing table).
- Avoid wikilinks and arbitrary anchor IDs; only `<PREFIX>-NNN` form is canonical.

## 3. ID Prefix Table (Locked)

Per file, the `id_prefix` value in YAML frontmatter and the section ID prefix.

| File | `id_prefix` | Domain |
|------|-------------|--------|
| `api-docs.md` | `API` | api-docs |
| `architecture.md` | `ARCH` | architecture |
| `database-design.md` | `DATA` | database-design |
| `docker-runtime.md` | `DOCK` | docker-runtime |
| `efficiency-vs-hype.md` | `DEP` | efficiency-vs-hype |
| `error-handling.md` | `ERR` | error-handling |
| `event-driven.md` | `EVT` | event-driven |
| `frontend-architecture.md` | `FE` | frontend-architecture |
| `git-workflow.md` | `GIT` | git-workflow |
| `microservices.md` | `SVC` | microservices |
| `naming-conv.md` | `NAME` | naming-conv |
| `performance.md` | `PERF` | performance |
| `realtime.md` | `RT` | realtime |
| `security.md` | `SEC` | security |
| `testing.md` | `TEST` | testing |

Notes on prefix choices:

- `DEP` for `efficiency-vs-hype.md` reflects the actual content (Dependency and Tooling Boundary), not the filename slug. The filename will rename in a follow-up cleanup; for now, `id_prefix: DEP` and `domain: efficiency-vs-hype` until the rename is approved separately.
- `SVC` for `microservices.md` because the rule is about service boundaries broadly, not a literal microservice prescription.
- `RT` is intentionally short; realtime rule has few sections.

## 4. Validation Hooks

The validate gate gains these checks during Task 1.7:

- `frontmatter.schema` — every rule file parses as valid YAML and contains all required keys with the right types.
- `id.unique` — every section ID is unique within its file. Cross-file collisions impossible because of prefix.
- `id.format` — every section heading matches `^## <PREFIX>-\d{3}(-[A-Z])?: .+$` for that file's prefix.
- `id.contiguous-warn` — warns (not fails) if section IDs skip more than 5 numbers in a row, suggesting a forgotten tombstone.
- `keywords.snippet-coverage` — every kebab-case keyword from the legacy `REQUIRED_*_SNIPPETS` validate config is present either in body, in `keywords` frontmatter, or has been moved to a documented new home.
- `cross-ref.resolves` — every `<PREFIX>-NNN` mention in body resolves to a real section ID somewhere in the rules pack.
- `intro.length` — optional intro is max 3 sentences when present.

## 5. Migration Mapping for `frontend-architecture.md`

Pilot file. Section heading mapping for Task 1.3 (final IDs assigned during migration; this is the planned mapping):

| Current section | Proposed ID | Notes |
|----------------|-------------|-------|
| (no section, `Load this rule for UI-facing work...`) | (intro paragraph, no ID) | One-paragraph intro |
| Activation | `FE-001: Activation Triggers` | Keywords list moves into frontmatter `keywords` |
| Authority | `FE-002: Authority and Style Sources` | 7 numbered items |
| Required Design Contract | `FE-003: Required Design Contract` | Lock the contract field list as positive numbered items |
| Anti-Generic UI Gate | `FE-004: Anti-Generic UI Gate` | First long section; might split into FE-004 + FE-005 if >12 items |
| Dynamic Anchor Gate | `FE-006: Dynamic Anchor Gate` | (next free integer; gap reserved if FE-004 splits) |
| Motion, Palette, and 3D | `FE-007: Motion, Palette, and 3D Choices` | |
| Zero-Based Redesign | `FE-008: Zero-Based Redesign Reset` | |
| Responsive Mutation | `FE-009: Responsive Mutation` | |
| Accessibility | `FE-010: Accessibility Floor` | |
| CSS Production Hardening | `FE-011: CSS Production Hardening` | |
| Implementation Boundaries | `FE-012: Implementation Boundaries` | |

The migration helper (Task 1.2) reads this table from format-spec.md when it auto-assigns IDs for the pilot.

## 6. Worked Example: Before and After

This is the canonical migration example. Authoritative when the helper is ambiguous.

### 6.1 Before (current `Anti-Generic UI Gate` section)

```markdown
## Anti-Generic UI Gate

Do not ship interchangeable dashboard chrome, balanced card grids, centered marketing shells, generic component-kit surfaces, generic abstract logos, or nonfunctional background decoration unless the product earns them.

For new screens or broad redesigns, make at least three at-a-glance product-specific signals visible. Signals may be data treatment, iconography, state language, motion behavior, spatial structure, typography, material logic, or color behavior.

Use the rename test: if the UI can be renamed to another product category without changing composition, palette, iconography, and motion language, revise before implementation is considered complete.

Use the old-design regression test for broad redesigns: if the UI reads as the previous design with fewer details, removed animation, simplified sections, or a new palette on the same composition, revise before implementation is considered complete.
```

### 6.2 After (numbered v4 form)

```markdown
## FE-004: Anti-Generic UI Gate

1. Refuse interchangeable dashboard chrome, balanced card grids, centered marketing shells, generic component-kit surfaces, generic abstract logos, and nonfunctional background decoration. Treat them as drift unless the product earns them.
2. For new screens or broad redesigns, make at least three at-a-glance product-specific signals visible. Valid signal categories:
   - data treatment
   - iconography
   - state language
   - motion behavior
   - spatial structure
   - typography
   - material logic
   - color behavior
3. Apply the rename test before declaring the UI complete: if the UI can be renamed to another product category without changing composition, palette, iconography, and motion language, the test fails and the UI must be revised.
4. Apply the old-design regression test on broad redesigns: if the UI reads as the previous design with fewer details, removed animation, simplified sections, or a new palette on the same composition, the test fails and the UI must be revised.
```

Notes on the transformation:
- Item 1 condenses two prose sentences into one positive-framed directive ("Refuse...") with a subordinate clause for the exception ("unless the product earns them"). The subordinate clause is preserved verbatim.
- Item 2 keeps the full signal list but moves it into a sub-bullet for grep-friendly extraction. Length-counted as one numbered item.
- Items 3 and 4 each carry a single test name plus its failure condition, replacing the old "Use the X test" + "if Y then Z" two-sentence pattern with one sentence each.
- Section ID `FE-004` is locked. Even if items 5-12 grow into a separate section later, FE-004 stays at this content.

### 6.3 Round-trip Substance Check

The migration helper (Task 1.2) implements roundtrip validation:

1. Parse the v4 file.
2. Render back to a flat-prose approximation.
3. Compute substantial-word set overlap between the rendered approximation and the original v3 file.
4. Fail the migration when overlap drops below 95%.

For section 6.2's example, the substantial words from before and after match almost completely:
- Before set: {interchangeable, dashboard, chrome, balanced, card, grids, marketing, shells, component-kit, surfaces, abstract, logos, decoration, screens, redesigns, signals, data, iconography, state, motion, spatial, typography, material, color, rename, test, renamed, category, composition, palette, motion-language, revise, old-design, regression, details, animation, sections, new-palette, same-composition}
- After set: same (after lowercasing and singular reduction).

Roundtrip pass.

## 7. What This Spec Does Not Cover

- **Reflection block format inside prompts.** That is Phase 3 anti-halu work. This spec covers rule files only.
- **Caching layer breakpoints.** That is Phase 2.
- **Retrieval index structure.** That is Phase 4.
- **Filename rename for `efficiency-vs-hype.md`.** Follow-up cleanup, not Phase 1 scope.
- **YAML frontmatter for `prompts/` and `review-checklists/`.** Phase 1 scope is rule files only. Other files keep current format.

## 8. Acceptance for GATE A

Approve this spec only if all of these hold:

1. The ID prefix table fully covers all 15 rule files.
2. The before/after example is faithful (no substantive content removed).
3. The frontmatter schema is reviewable (no fields you do not understand).
4. The cross-reference style supports Phase 3 reflection block use cases.

If any of those fail, raise objections at GATE A. Adjustments happen here before Task 1.2 builds the migration helper around this spec.
