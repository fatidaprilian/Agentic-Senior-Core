# Surface Mode: Persuade (Marketing, Landing & Conversion)

Use for: Landing pages, marketing websites, product launch pages, and pricing screens.

> **Core Principle:** The visitor decides and acts; design is the product. Earn attention and conversion with bold, authentic conviction. Ambition is expressed through scale, typographic contrast, and proof of reality—never through fluffy filler or generic card stacks.

---

## 1. The Viewport Budget & The 80-Word Rule

- **The Above-the-Fold Law:**
  - At a standard desktop viewport (1280x800), the hero headline, one concise supporting sentence, and the primary call-to-action **MUST** be fully visible without scrolling.
  - Keep visible text in the first viewport under **80 words**. Fullness comes from scale, whitespace, and high-fidelity product imagery, never from extra paragraphs.
- **Hero Posture Options:**
  1. *Stage:* Headline and CTA anchor the left 5–7 columns; a live interactive widget or full-fidelity product preview occupies the right 5–7 columns.
  2. *Split:* Balanced 50/50 composition with high-contrast narrative on one side and direct visual evidence on the other.
  3. *Product-Led:* The live product interface or interactive sandbox leads the canvas; the headline and navigation sit tightly framed around it.

---

## 2. In-Memory Direction Dealer (4 Structural Postures)

When building or redesigning a Persuade surface, never let the LLM default to the statistical average of marketing pages. Choose one of four researched structural postures based on the project's real material:

```
┌────────────────────────────────────────────────────────────────────────┐
│                        THE 4 STRUCTURAL POSTURES                       │
├────────────────────────────────────────────────────────────────────────┤
│ 1. Asymmetric Stage (65/35 Split): Left-anchored heavy typography      │
│    offset against an interactive preview, ROI calculator, or live UI. │
│ 2. The Monolith Ledger: Single-column dense reading measure with       │
│    full-bleed horizontal rows, hairline dividers, and deep ink.        │
│ 3. Product-Led Canvas: Live application interface or workflow canvas   │
│    dominates the first viewport; copy recedes to tightly frame it.     │
│ 4. Kinetic Proof Stream: Alternating proof blocks driven by verifiable │
│    benchmarks, architectural diagrams, and real data payloads.         │
└────────────────────────────────────────────────────────────────────────┘
```

- **Posture Selection Protocol:**
  - If real software interface exists $\to$ **Posture 3 (Product-Led Canvas)**.
  - If quantitative savings or enterprise value proposition $\to$ **Posture 1 (Asymmetric Stage)**.
  - If technical documentation, whitepaper, or architectural manifesto $\to$ **Posture 2 (The Monolith Ledger)**.
  - If performance benchmarks, protocol comparisons, or telemetry proof $\to$ **Posture 4 (Kinetic Proof Stream)**.

### Structural Blueprints (Enforced DOM Geometries)

#### Posture 1: Asymmetric Stage (65/35 Split)
- **Container:** `grid grid-cols-1 lg:grid-cols-12 gap-12 items-center`
- **Left Lead (7 cols):** `lg:col-span-7 space-y-6 text-left`
  - Display headline: `text-5xl lg:text-7xl font-bold tracking-tight leading-[1.05]`
  - Subtitle: `text-lg text-muted-foreground max-w-xl`
  - Actions: `flex flex-wrap items-center gap-4 pt-2`
- **Right Artifact (5 cols):** `lg:col-span-5`
  - Authentic artifact, interactive widget, or live score/ROI card: `rounded-2xl border border-border/80 bg-card p-6 shadow-sm`
  - Zero equal-weight card grids below.

#### Posture 2: The Monolith Ledger
- **Container:** `max-w-4xl mx-auto px-6 py-16 divide-y divide-border/60`
- **Tabular Rows:** Each entity or program is a horizontal row: `py-8 grid grid-cols-1 md:grid-cols-12 gap-6 items-baseline`
  - Category / Date: `md:col-span-3 text-xs font-semibold tracking-wider uppercase text-muted-foreground`
  - Heading & Data: `md:col-span-5 text-xl font-bold text-foreground`
  - Detail & Action: `md:col-span-4 text-sm text-muted-foreground`

#### Posture 3: Product-Led Canvas
- **Container:** `flex flex-col items-center text-center max-w-6xl mx-auto px-6 pt-16 pb-20`
- **Compact Hero Frame:** `max-w-2xl space-y-4 mb-10`
  - Headline: `text-4xl sm:text-6xl font-extrabold tracking-tight`
  - 1-sentence value claim + 1 primary action.
- **Hero Canvas (70% Viewport Lead):** `w-full rounded-2xl border border-border/80 bg-card p-3 shadow-xl`
  - Real interface fragment or live demo canvas dominating the first viewport. Respect project theme tokens; never force artificial dark backgrounds or terminal frames unless the target product is an actual CLI/developer tool.

---

## 3. Anti-Cardocalypse & Visual Pacing

- **Banned 3-Card Symmetrical Grid:**
  - Never default to a 3-column grid where every card has identical dimensions, a Lucide icon in a pastel square, a bold title, and two lines of gray text.
  - Instead, vary composition according to content weight:
    - *Flagship Feature:* Full-width container or asymmetric 8/4 split showing the primary capability in action.
    - *Supporting Capabilities:* Compact 2-column checklist or a structured comparison table.
- **The Signature Element:**
  - Every Persuade surface may feature at most **one memorable signature element** on the first screen that directly reflects the product domain:
    - An interactive calculator or estimator that recalculates results in real time.
    - An unedited, high-resolution product screenshot showing real user data.
    - A live interactive UI fragment (e.g., an assessment scorecard preview for educational tools, a filterable ledger row for accounting tools).
  - **Hard Ban on Faux-Terminal Cosplay:** Never inject terminal prompts, ASCII art, or pseudo-telemetry consoles into non-developer products.
  - A giant counter of marks or animated numbers is a decorative reflex, not a signature.

---

## 4. Material Honesty & Proof of Reality

- **Zero Fabricated Evidence:**
  - Never invent customer quotes, fake partner logos ("Acme Corp, Pied Piper"), or fabricated performance metrics ("10,000+ teams trust us").
  - If quotes or logos are not provided in the project brief, leave them out. A page built around genuine product capabilities is far more persuasive than one filled with synthetic social proof.
- **Action Semantics:**
  - Primary CTA must use an imperative verb + noun: `Start Free Trial`, `Download CLI`, `Book Demo` (never generic `Submit` or `Get Started` without context).
  - Limit the header to at most 1 primary action button and 1 ghost link.

