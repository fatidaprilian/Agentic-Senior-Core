# Reflexes & Waivable Defaults Catalog

Grounded in: Hallmark Reflex Gates and Impeccable Refusal Catalog.

> **Definition:** A reflex is an unthinking default that models and junior designers fall into out of habit. Unlike absolute bans (The Floor), reflexes **can be earned** by a specific product brief or technical necessity. However, using a reflex without a deliberate reason is a design defect.
>
> **The Waiver Protocol:** When an interface genuinely requires one of these patterns, document the operational rationale in code:
> ```typescript
> // ASC-WAIVER: [pattern-id] [concrete operational reason why this default was earned]
> ```

---

## 1. Page Scaffold Reflexes

### 1.1 Identical Card Grids (`card-grid-reflex`)
- **The Reflex:** Defaulting every section to 3 or 4 identical rounded cards with an icon, title, and 2 lines of text.
- **Why It's a Reflex:** Cards are the lazy container. They flatten information hierarchy, making secondary features look identical in importance to core capabilities.
- **When Allowed (Waived):** Only when displaying truly homogeneous peer entities (e.g., 3 subscription pricing tiers, or a grid of user avatar cards).

### 1.2 The Hero-Metric Template (`hero-metric-reflex`)
- **The Reflex:** Placing a giant number (e.g. `99.9%`, `10M+`) next to a tiny label as the primary visual hook.
- **Why It's a Reflex:** Models use giant numbers as a shortcut for visual mass when they have no real product screenshots or narrative.
- **When Allowed (Waived):** When the core value proposition is fundamentally a mathematical guarantee (e.g., SLA guarantee on an infrastructure status page).

### 1.3 Modal Dialogs for Simple Tasks (`modal-reflex`)
- **The Reflex:** Popping a modal dialog for every sub-task, form, or setting.
- **Why It's a Reflex:** It isolates the task on a blank canvas so the model doesn't have to design layout coexistence.
- **When Allowed (Waived):** Only when user action is strictly interruptive, irreversible (destructive account deletion), or requires focused authentication.

### 1.4 Dark Mode by Habit (`dark-mode-habit`)
- **The Reflex:** Making every page dark with indigo accents because it looks "tech".
- **Why It's a Reflex:** Models over-represent developer tool aesthetics on consumer or business products.
- **When Allowed (Waived):** When the target user operates in low-light environments (IDE, code editor, video grading, night terminal) or brand guidelines mandate it.

---

## 2. Surface & Decoration Reflexes

### 2.1 Side-Stripe Colored Borders (`side-stripe-border`)
- **The Reflex:** Adding `border-l-4 border-blue-500` to random cards, list items, or callouts.
- **Why It's a Reflex:** A cheap visual crutch to make a plain card look designed without establishing real typography or spacing.
- **When Allowed (Waived):** High-priority operational system alerts (info/warn/error alert banners).

### 2.2 Hard Offset Block Shadows (`hard-offset-shadow`)
- **The Reflex:** Applying `box-shadow: 4px 4px 0 #000` to standard SaaS components.
- **Why It's a Reflex:** Adopting a Neo-Brutalist costume on an interface that has no other brutalist attributes.
- **When Allowed (Waived):** Authentic, cohesive Neo-Brutalist design systems where heavy typography, bold line art, and high contrast coexist throughout.

### 2.3 Zero-Offset Colored Glows (`zero-offset-glow`)
- **The Reflex:** Slapping `shadow-[0_0_20px_rgba(...)]` behind buttons, icons, or cards.
- **Why It's a Reflex:** Glow is an attention amplifier. Sprayed everywhere, it amplifies nothing and marks the interface as AI-generated.
- **When Allowed (Waived):** Maximum 1 focal element on a dark entertainment or gaming canvas where glow simulates an actual light source.

### 2.4 Monospace Font as Technical Costume (`mono-costume`)
- **The Reflex:** Using monospace fonts on generic labels, headers, or buttons to simulate a "developer tool" vibe.
- **Why It's a Reflex:** Monospace has low reading legibility for extended prose.
- **When Allowed (Waived):** Literal code snippets, terminal commands, hashes, IP addresses, or data matrices requiring vertical character alignment.

