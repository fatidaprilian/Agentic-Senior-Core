# Domain Alignment & Visual Posture

> **Core Invariant:** The real-world problem domain dictates visual posture, NEVER generic AI trends. A school evaluation system must look like an educational instrument; an accounting app must look like a ledger; only actual developer tools should ever look like a terminal.

---

## 1. The 4 Target Genres & Aesthetic Contracts

Before laying out a single component or proposing a visual design, classify the project into one of four real-world genres:

```
┌────────────────────────────────────────────────────────────────────────┐
│                       THE 4 REAL-WORLD GENRES                          │
├────────────────────────────────────────────────────────────────────────┤
│ 1. Civic, Institutional & Educational (Gov, School, NGO, Compliance)  │
│ 2. Enterprise & B2B Operational (ERP, CRM, Accounting, Inventory)     │
│ 3. Commercial SaaS & Conversion (Public Landing, Pricing, Product)    │
│ 4. Developer Tools & Infrastructure (SDKs, CLIs, Observability, APIs)  │
└────────────────────────────────────────────────────────────────────────┘
```

### Genre 1: Civic, Institutional & Educational
*Examples: Evaluation systems, accreditation portals, public services, municipal registries, educational instruments.*

- **Visual Tone:** Dignified, calm, accessible, structured, and trustworthy.
- **Surface & Palette:** Clean neutral ground (pure white or soft stone background), crisp 1px borders (`border-border`), high-contrast dark foreground text, semantic status pills (e.g. emerald for verified, amber for needs revision, slate for pending).
- **Live Visual Benchmarks:** Inspect `references/visuals/real-clerk.png` (clean single-line inputs and bounded tabs) and `references/visuals/real-cal.png` (scheduling layout, calm typography, and status indicators).
- **Core Components:**
  - Clear evaluation tables with explicit weight/point columns.
  - Category assessment cards showing actual scores vs targets.
  - Step progress indicators for verification workflows.
  - Summary scorecard with clear totals and action buttons.
- **ABSOLUTE PROHIBITIONS (Second-Order Slop):**
  - **NO Terminal / CLI Cosplay:** Never put evaluation data inside a faux terminal, command prompt window, or ASCII box.
  - **NO ASCII Art or Pseudo-Radars:** Never draw ASCII charts (`/\`, `[■■■□□]`, `[2026]`). Use semantic progress bars (`<progress>` or standard div progress) and proper tabular rows.
  - **NO Dark Cyberpunk Mode:** Never force dark mode or neon glow on institutional workflows.
  - **NO Jargon Injections:** Never label an assessment tool with pseudo-sci-fi phrases ("telemetry console", "evaluation engine", "neural scanner", "quantum monitor"). Always use the project's genuine domain terminology.

---

### Genre 2: Enterprise & B2B Operational
*Examples: Internal operations, HR portals, supply chain management, financial reporting.*

- **Visual Tone:** Compact, data-dense, predictable, and keyboard-efficient.
- **Surface & Palette:** Neutral surfaces, subtle divider lines, minimal elevation shadows (flat or `shadow-sm`), clear focus rings.
- **Live Visual Benchmarks:** Inspect `references/visuals/real-attio.png` (windowed desktop console, search toolbar with `⌘K`, multi-filter table density) and `references/visuals/real-dub.png` (embedded dashboard stage, large bold KPI metrics, tabular data).
- **Core Components:**
  - Data tables with sticky headers, sortable columns, and filter bars.
  - Master-detail side rails or drawers for drilling into row details.
  - Monospace only for aligned financial values (`font-mono tabular-nums`).
- **ABSOLUTE PROHIBITIONS:**
  - **NO Misplaced Heroes:** Never place giant marketing hero sections, splash banners, or promotional copywriting inside an operational dashboard.
  - **NO Decorative Metric Clutter:** Every stat card must correspond to an actual query or measurable KPI. Omit generic "Welcome back, User!" filler.

---

### Genre 3: Commercial SaaS & Conversion
*Examples: Marketing landing pages, product launch pages, pricing tiers.*

- **Visual Tone:** Sharp, decisive, persuasive, authentic conviction.
- **Surface & Palette:** Generative typographic scale contrast ($Display \ge 3.5\times Body$), tight leading (`leading-[1.05]`), full-bleed background anchor, authentic product screenshots or functional interactive calculators.
- **Live Visual Benchmarks:** Inspect `references/visuals/real-stripe.png` (flowing visual authority and dual CTA row), `references/visuals/real-vercel.png` (high-contrast brand stage and monochrome logo proof), and `references/visuals/real-marketplace.png` (sidebar filters and catalog cards).
- **ABSOLUTE PROHIBITIONS:**
  - **NO Cliché Gradients:** Saturated purple-to-indigo or cyan-to-violet linear gradients.
  - **NO Symmetrical 3-Card Grid:** Identical cards with Lucide icons in pastel rounded squares.
  - **NO Fabricated Proof:** Fake partner logos or manufactured customer testimonials.

---

### Genre 4: Developer Tools & Infrastructure
*Examples: CLI tools, API documentation, log viewers, query consoles.*

- **Visual Tone:** High technical precision, compact syntax highlighting, dark/slate neutral grounding or clean technical whiteprint.
- **Live Visual Benchmarks:** Inspect `references/visuals/real-resend.png` (dark editorial and typography contrast), `references/visuals/real-supabase.png` (asymmetric hero split and capability cards), `references/visuals/real-raycast.png` (command center launcher), `references/visuals/real-mintlify.png` (dual-rail API docs), `references/visuals/real-linear.png` (disciplined whitespace), and `references/visuals/real-tldraw.png` (receding chrome canvas).
- **Core Components:** Copyable command blocks, real interactive code playgrounds, keyboard shortcut prompts.
- **ABSOLUTE RULE:** This developer aesthetic is **RESERVED EXCLUSIVELY FOR DEVELOPER PRODUCTS**. Never leak terminal conventions into Genre 1, 2, or 3.

### Specialized Real-World Sub-Domains (Mapped in `craft/themes-catalog.md`)
When working in Healthcare, Physical Commerce/Hospitality, Editorial/EdTech, or Industrial/Field Logistics, select their dedicated domain pair in `references/craft/themes-catalog.md` (`Pharmacy Calm` / `Clinical Precision`, `Atelier Gallery` / `Kinetic Grid`, `Studio Proof` / `Botanical Field`, `Formwork Concrete` / `Meridian Survey`) rather than flattening them into generic corporate SaaS.

---

## 2. Purpose-Driven Component Gate (Zero Unearned Widgets)

Every component, widget, badge, or section must pass the Purpose-Gate:

> **The Purpose-Gate Test:**
> *"What concrete user decision or task does this element directly enable?"*

1. If the element exists solely to "look high-tech", "fill empty space", or "make the page look interactive" without real underlying data $\to$ **DELETE IT**.
2. Never invent simulated consoles, fake real-time feeds, or unprompted sliders.
3. If the user asks for an evaluation summary, provide clear, functional assessment cards and tables—never decorative cosplay.

