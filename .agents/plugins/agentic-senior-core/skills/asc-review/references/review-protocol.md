# Code Review Protocol, Clean as You Code & Language Hygiene

Operational workflow for conducting fast, objective code reviews grounded in Google Engineering Practices (`google/eng-practices`), SonarQube Clean as You Code, Conventional Comments (`conventionalcomments.org`), and ISO 24495-1 Plain Language.

---

## 1. Google Standard of Code Review & Clean as You Code

1. **Progress Over Perfection:** Approve a change list (PR) once it measurably improves overall system code health, even if minor optional polish remains. Never hold up delivery for subjective preferences not backed by project standards.
2. **Audit Priority Order:** Inspect changes in strict descending order of operational impact:
   1. **Design & Architecture:** Boundary separation, dependency direction, module cohesion, zero YAGNI bloat.
   2. **Functionality & Concurrency:** Edge cases, async safety, resource disposal, null/boundary handling, transaction atomicity.
   3. **Complexity & Maintainability:** Cognitive complexity <= 15, nesting <= 3, zero Rule-of-Three duplication.
   4. **Tests:** Meaningful happy-path and failure-mode assertions matching changed behavior (no mocked units under test or relaxed assertions).
   5. **Naming, Comments & Copy:** Clear identifiers, rationale-only comments, and single-language purity.
3. **Clean as You Code (New-Diff Focus):** Apply strict blocking gates to added and modified lines. Pre-existing debt untouched by the PR should be logged separately (or tagged when deferred) rather than blocking unrelated bug fixes or features.

---

## 2. Conventional Comments Classification

Label every review finding explicitly so authors know immediately what blocks merge and what is optional:

| Label | Meaning & Merge Impact | Example |
|---|---|---|
| `issue (blocking)` | Correctness bug, security risk, resource leak, CWE violation, or missing critical test. Must be resolved before merge. | `issue (blocking): Unclosed database stream in export handler (CWE-404); wrap in a scoped using/finally block.` |
| `suggestion (non-blocking)` | Concrete architectural or readability improvement with rationale. Author may adopt or defer. | `suggestion (non-blocking): Extract these 4 filter arguments into a QueryOptions object to keep signatures readable.` |
| `nitpick (non-blocking)` | Trivial formatting, naming polish, or optional simplification. Never blocks merge. | `nitpick (non-blocking): Rename tmpVal to normalizedTotal for clarity.` |
| `question` | Request for clarification when intent or operational constraints are unclear from the diff. | `question: Does this retry loop share an idempotency key with the upstream payment webhook?` |

---

## 3. Language Purity & Human-by-Design Hygiene Audit

Audit all comments, identifiers, error strings, UI labels, and documentation across the diff:

- **English Identifiers Everywhere:** All class, function, variable, and file names must be English without emojis.
- **Comment *Why*, Never *What* (`//`, `#`, `/* */`):** Reject decorative ASCII banners (`// =====`, `# =====`), procedural step narration (`// Step 1:`, `# Step 1:`), and signature echoes. Preserve comments explaining non-obvious constraints, invariants, concurrency hazards, or protocol contracts.
- **Single-Language Purity (ISO 24495-1):** Every user-facing string, error payload, and file comment block must adhere to **one** language per surface or document:
  - Ban hybrid neologisms combining Indonesian affixes with English roots (`meng-generate`, `di-submit`, `mengupload`, `terupdate`).
  - Ban parenthetical translation glosses appended to terms (`"Kelola Aset (Asset Management)"`, `"Simpan (Save)"`).
  - Prefer direct active verbs over light-verb nominalizations (`validates` over `performs validation on`; `to` over `in order to`) and reject unasked anticipatory disclaimers or utopian closers.
  - Ban LLM prose tells catalogued by WikiProject AI Cleanup: buzzwords (`seamless`, `robust`, `supercharge`, `cutting-edge`, `delve`, `pivotal`, `crucial`, `next-generation`), synthetic tricolon cadences (`Fast. Simple. Secure.`), and rebuttal tropes (`Not just a X, it's a Y`).
