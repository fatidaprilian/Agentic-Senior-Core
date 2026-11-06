# UX Writing, Microcopy & Internationalization (i18n)

UI microcopy is an operational tool, not marketing collateral. Every word on screen either reduces user uncertainty or costs attention.

---

## 1. The 50% Reduction Rule

Draft the copy, then delete half the words without losing meaning. Remove polite throat-clearing, redundant labels, and ornamental adjectives.

| Verbose / Conversational | Direct Operational Copy | Rationale |
|---|---|---|
| "In order to get started, please enter your email address below." | "Email address" | Input labels require no preamble. |
| "Are you sure you want to delete this repository? This action cannot be undone." | "Delete `octocat/hello-world`? This permanently removes all code and history." | Name the exact target and concrete consequence. |
| "We couldn't seem to find any results matching your search criteria." | "No results for \"billing\"." | State the outcome, mirror the query. |
| "Successfully updated your preferences." | "Preferences saved." | Past participle, 2 words, passive verb eliminated. |
| "Click here to view our comprehensive documentation." | "View documentation →" | Never write "click here"; state the destination. |

---

## 2. Action Controls: Verb + Noun Grammar

Buttons and mutation triggers must name their concrete target. Never use ambiguous lone affirmations.

- **Banned:** `Submit`, `OK`, `Yes`, `Proceed`, `Continue`, `Go`, `Done`.
- **Enforced:** `Create project`, `Invite member`, `Deploy branch`, `Delete webhook`, `Export CSV`.

Exception: Standard multi-step navigation controls in fixed wizards (`Back`, `Next`) where the step indicator supplies the context.

---

## 3. Arithmetic Copy Budgets & The Argument-First Protocol

### 3.1 Arithmetic Budgets
Constraint is arithmetic; enforce before falling in love with a sentence:
- **Hero Headline Budget:** Must fit in **two lines or fewer** across all viewports.
  - Mobile (390px): $\le 32$ characters ($\sim 4$–$5$ words).
  - Desktop (1280px): $\le 42$ characters ($\sim 5$–$6$ words).
  - Use `text-wrap: balance` and intentional `<br>` tags to avoid single-word orphans.
- **Supporting Line Budget:** Exactly **1 sentence**, at most **22 words**.
  - Directly states concrete function and audience.
  - Never repeats or paraphrases headline words.
- **First-Viewport Word Budget:** Maximum **80 words** total across the first screen.

### 3.2 The Argument-First Protocol
Before writing any HTML/JSX markup, outline the page as a sequence of claims with verifiable proofs:
```text
1. Claim: Three-legged oak stool, made to order.      → Proof: High-res macro photography of stool.
2. Claim: Each seat cut from single solid board.      → Proof: 3 close-ups of continuous wood grain.
3. Claim: Shipped in 6 weeks with tracking.           → Proof: Verifiable production stages schedule.
4. Claim: Costs $240, delivered by the maker.         → Proof: Exact price figure + Order button.
```
*Rule:* Any section that lacks a factual claim or verifiable proof is filler—delete it immediately.

---

## 4. AI Cadences & Marketing Buzzword Blacklist

### 4.1 Banned AI Cadence Formulas
Language models fall into statistical average patterns; recognize and refuse them:
1. **The Mad-Lib:** *"The [AI-powered/next-gen] platform for modern teams."*
2. **The Tricolon:** *"Fast. Simple. Secure."* or *"Plan. Build. Ship."*
3. **The Rebuttal:** *"It’s not just a tool, it’s a workflow."* / *"More than a framework."*
4. **The Preamble Throat-Clearing:** *"In today’s fast-paced digital world..."* / *"Built for modern teams..."*
5. **The Em-Dash Habit:** Using multiple em-dashes (`—`) in a single paragraph. Use a full stop.

### 4.2 Banned Marketing Buzzwords
The following adjectives and verbs are banned across all surfaces:
`seamless`, `seamlessly`, `empower`, `empowering`, `robust`, `effortless`, `effortlessly`, `cutting-edge`, `game-changing`, `elevate`, `unlock`, `unleash`, `dive in`, `delightful`, `next-generation`, `supercharge`, `blazing-fast`.

When tempted to write an adjective, state the measurable property instead:
- Instead of: *"A robust, blazing-fast pipeline."*
- Write: *"Builds complete in under 45 seconds with isolated caching."*

---

## 5. Actionable Error Messages & Recovery

An operational error message must never produce a dead end or display raw internal stack traces. Every error must answer three questions:
1. **What failed:** Direct statement of the blocked action.
2. **Why:** Factual cause (if actionable and known).
3. **How to recover:** Concrete button or path to unblock the user.

| Raw / Unhelpful Error | Actionable Engineering Copy | Recovery Path |
|---|---|---|
| "Error 413: Payload too large." | "File exceeds the 25MB limit." | "Choose a smaller file" CTA |
| "Failed to connect to server." | "Unable to reach database. Changes saved locally." | "Retry connection" button |
| "Invalid credentials." | "Incorrect password for user@example.com." | "Reset password →" link |

---

## 6. Single-Language Consistency & Localization

Interfaces and developer communications must maintain strict language purity without robotic or literal translation awkwardness.

### 6.1 Strict Monolingual Surface
Choose one language for the entire surface and enforce it across headings, labels, errors, and tooltips:
- **English UI:** All copy, actions, and timestamps in English.
- **Indonesian UI:** All copy, actions, and timestamps in natural, standard Indonesian (KBBI/PUEBI).

### 6.2 Codebase Lexicon Supremacy (Anti-Hallucinated Naming)
Before naming navigation menus, section titles, table columns, or actions in an existing codebase, inspect the project's models, controllers, and view variables:
- **Respect established domain terms:** Always adopt the exact nouns established in the repository's models, routes, and translations. Never substitute recognized project nouns with unprompted external synonyms.
- Use the actual terminology the organization and developers already use in their schema and UI.

### 6.3 Ban Robot Translations & Meta-Jargon Parens
In localized interface and review text:
1. **No clumsy literal translations of English layout terms:**
   - Do NOT translate *drawer* into awkward calques; write natural native labels (e.g. "panel samping" or "detail").
   - Do NOT translate *modal* literally; write natural functional terms (e.g. "dialog" or "popup").
   - Do NOT translate *hairline border* as literal anatomy; write "garis tipis 1px" or "garis pemisah".
   - Do NOT translate layout stages into literal theatrical terms; write "layout dua kolom" or "area utama".
2. **No parenthetical English jargon leaks:**
   - Never write sentences that append raw English terms in parentheses as translation glosses.
   - Write clear, natural localized prose without meta-framework disclaimers.

### 6.4 Ban Hybrid Neologisms
Never prefix local grammatical affixes onto foreign language stems:

| Hybrid Neologism (Banned) | Standard Native Alternative | Pure English Alternative |
|---|---|---|
| `di-submit` | `Dikirim` / `Diserahkan` | `Submitted` |
| `meng-generate` | `Menghasilkan` / `Membuat` | `Generating` |
| `di-cancel` | `Dibatalkan` | `Cancelled` |
| `meng-handle` | `Menangani` | `Handling` |
| `di-approve` | `Disetujui` | `Approved` |
| `meng-update` | `Memperbarui` | `Updating` |
| `di-delete` | `Dihapus` | `Deleted` |
| `me-restore` | `Memulihkan` | `Restoring` |

---

## 7. Dynamic Text Expansion & Internationalization Layout

Text length varies drastically between languages:
- German and Dutch expand +20% to +35% compared to English.
- Indonesian expands +15% to +30% for verb-rich phrases.
- Japanese and Chinese are visually dense and vertically taller.

### 7.1 Layout Rules for Expanding Strings
1. **Never set fixed widths on action buttons:**
   ```html
   <!-- BANNED: clips or overflows in German/Indonesian -->
   <button class="w-[120px] truncate">Save settings</button>

   <!-- ENFORCED: content-driven width with min-width safety -->
   <button class="min-w-[5rem] px-4 py-2">Save settings</button>
   ```

2. **Support multi-line wrapping for headings and table headers:**
   - Avoid `white-space: nowrap` on containers holding localized strings unless horizontally scrolling is explicitly designed.
   - Use `hyphens: auto` or flex wrapping on dense metric cards.

3. **Isolate placeholders and interpolated values:**
   - Never assemble sentences by concatenating translated strings:
   ```javascript
   // BANNED: grammar breaks in right-to-left or verb-final languages
   const msg = t("Deleted") + " " + count + " " + t("items");

   // ENFORCED: parameterized translation tokens
   const msg = t("deleted_items_count", { count });
   ```

4. **Numeric and Date Formatting:**
   - Use `Intl.NumberFormat` and `Intl.DateTimeFormat` with the active locale.
   - Never hardcode date patterns (`MM/DD/YYYY` fails in locales expecting `DD/MM/YYYY` or `YYYY-MM-DD`).

