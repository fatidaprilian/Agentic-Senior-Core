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

## 3. Marketing Buzzword Blacklist

The following words are banned in operational interfaces:

`seamless`, `seamlessly`, `empower`, `empowering`, `robust`, `effortless`, `effortlessly`, `cutting-edge`, `game-changing`, `elevate`, `unlock`, `dive in`, `delightful`, `next-generation`, `supercharge`, `blazing-fast`.

When tempted to write an adjective, state the measurable property instead:
- Instead of: *"A robust, blazing-fast pipeline."*
- Write: *"Builds complete in under 45 seconds with isolated caching."*

---

## 4. Single-Language Purity & Anti-Gado-Gado

Interfaces must maintain strict language purity. Mixing two languages within the same surface causes cognitive friction and feels unpolished.

### 4.1 Strict Monolingual Surface
Choose one language for the entire surface and enforce it across headings, labels, errors, and tooltips:
- **English UI:** All copy, actions, and timestamps in English.
- **Indonesian UI:** All copy, actions, and timestamps in standard Indonesian (KBBI/PUEBI).

### 4.2 Ban Hybrid Neologisms (Indonesian Context)
Never prefix Indonesian grammatical affixes (`di-`, `meng-`, `ter-`, `pe-`) onto raw English stems:

| Hybrid Neologism (Banned) | Standard Indonesian | Pure English Alternative |
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

## 5. Dynamic Text Expansion & Internationalization Layout

Text length varies drastically between languages:
- German and Dutch expand +20% to +35% compared to English.
- Indonesian expands +15% to +30% for verb-rich phrases.
- Japanese and Chinese are visually dense and vertically taller.

### 5.1 Layout Rules for Expanding Strings
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

