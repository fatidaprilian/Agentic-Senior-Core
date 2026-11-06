# Curated Design Themes Catalog (16 Production Material Systems)

> **Core Invariant:** Never allow an LLM to invent an ad-hoc color palette or arbitrary font pairing from scratch on new greenfield projects. Unconstrained models converge onto the statistical median: muddy slate-indigo, generic SaaS card soup, or gimmick cosplay. On **Greenfield (new from scratch)** builds, lock visual styling to one of **16 verified, domain-calibrated material themes** across **8 real-world software domains** (2 contrasting directions per domain). If working in an existing codebase (*Brownfield*) with defined tokens in `app.css` or Tailwind config, **DO NOT override project tokens with this catalog**—respect and calibrate the project's authentic brand palette instead.

---

## 1. Domain Matrix (8 Domains × 2 Contrasting Directions)

Select the domain matching the product's real-world purpose, then pick one of its two contrasting material directions so consecutive projects never converge onto a single look:

| Domain | Option A (Cool / Crisp / Structural) | Option B (Warm / Tactile / Editorial) |
|---|---|---|
| **1. Civic, Academic & Institutional** | `01. Sovereign Slate` | `02. Almanac Index` |
| **2. Financial, ERP & Operations** | `03. Editorial Ledger` | `04. Warm Stationery` |
| **3. Healthcare, Clinical & Care** | `05. Pharmacy Calm` | `06. Clinical Precision` |
| **4. Commercial B2B SaaS & Platforms** | `07. Ink & Signal` | `08. Obsidian Stage` |
| **5. Developer Tools, Observability & Security** | `09. Graphite Instrument` | `10. Technical Whiteprint` |
| **6. Commerce, Hospitality, Craft & Hardware** | `11. Atelier Gallery` | `12. Kinetic Grid` |
| **7. Editorial, Publishing, EdTech & Knowledge** | `13. Studio Proof` | `14. Botanical Field` |
| **8. Industrial, Logistics, Construction & Geo** | `15. Formwork Concrete` | `16. Meridian Survey` |

---

## 2. Production Constraints & Accessibility Requirements

Theme choices must satisfy real-world usability and production budgets. The following patterns are excluded:
1. **Gimmick Surfaces:** Medieval blackletter parchment, CRT phosphor scanlines, two-drum pink/blue risograph with no black ink, torn-paper edges, and die-cut sticker outlines.
2. **Runtime Shaders:** Mandatory `<canvas>` or WebGL background noise fields, drifting particle hazes, and SVG `feTurbulence` grain overlays sitting over running body text.
3. **Broken Font & Asset Dependencies:** Unbundled font packages that fail to load on standard web CDNs, and unbundled local texture URLs (`url("cotton.svg")`). Every font in this catalog is verified on Google Fonts with clean system fallbacks.
4. **Low-Contrast Mid-Tone Grounds:** Raw `70%` grey or `35%` saturated blue full-app drenches that fail WCAG 2.2 AA `4.5:1` contrast on secondary metadata.

---

## 3. Domain 1 — Civic, Academic & Institutional

### `01. Sovereign Slate`
*Best for: Institutional evaluations, accreditation dossiers, compliance portals, municipal registries.*
- **Surface Tokens:** Canvas `#f8fafc` (`oklch(98.4% 0.003 248)`) · Sheet `#ffffff` · Rail `#f1f5f9` · Rule `1px solid #e2e8f0`
- **Ink Tokens:** Primary `#0f172a` · Secondary `#334155` · Muted `#64748b`
- **Accent & Semantic:** Deep Pine `#0f766e` (`oklch(51% 0.096 186)`), Soft `#f0fdfa` · Status: Emerald `#047857`, Amber `#b45309`, Rose `#be123c`
- **Typography:** Display & UI `Plus Jakarta Sans` (600/700 heads, 400/500 body) · Numeric `JetBrains Mono` (`tabular-nums`)
- **Geometry & Posture:** Unified Spatial Canvas (`0px` sheet divisions, `6px` control radius). Left verification rail + right primary data table. Zero floating card islands.

### `02. Almanac Index`
*Best for: University catalogs, public archives, policy repositories, judicial & regulatory filings.*
- **Surface Tokens:** Canvas `#f7f4ed` (`oklch(96.6% 0.012 85)`) · Sheet `#fcfbf8` · Subtle `#efeae0` · Rule `1px solid #ded8cb` (Section head rule: `2px solid #1f1d1a`)
- **Ink Tokens:** Primary `#1f1d1a` · Secondary `#3d3934` · Muted `#666057`
- **Accent & Semantic:** Terracotta Seal `#b4532a` (`oklch(53% 0.14 38)`), Soft `#fdf2ed`
- **Typography:** Display `Newsreader` (500/600, `-0.02em`) · Body & UI `Source Sans 3` (400/600) · Index/Filing IDs `IBM Plex Mono`
- **Geometry & Posture:** Archival index sheet (`4px` control radius, zero drop shadows at rest). Heavy `2px` ink top-bars anchor tables and statutory sections; hairline rules separate rows.

---

## 4. Domain 2 — Financial, ERP & Operations

### `03. Editorial Ledger`
*Best for: Accounting systems, treasury consoles, ERP inventory, institutional billing, audit ledgers.*
- **Surface Tokens:** Canvas `#ffffff` · Sub-surface / Striping `#f9fafb` (`oklch(98.5% 0.002 247)`) · Rule `1px solid #e5e7eb`
- **Ink Tokens:** Primary `#111827` · Secondary `#374151` · Muted `#6b7280`
- **Accent & Semantic:** Sovereign Navy `#1e3a8a` (`oklch(38% 0.14 262)`), Soft `#eff6ff` · Variance: Positive `#047857`, Negative `#b91c1c`
- **Typography:** Display & UI `Inter` (600 heads, 400/500 body) · Figures `IBM Plex Mono` (`tabular-nums`, right-aligned quantitative columns)
- **Geometry & Posture:** Edge-to-edge sticky-header tables (`10px–12px` vertical cell padding, `6px` control radius) with 65/35 master-detail inspector Drawer/Rail.

### `04. Warm Stationery`
*Best for: Private banking, advisory portfolios, payroll & compensation portals, procurement workflows.*
- **Surface Tokens:** Canvas `#faf7f2` (`oklch(97.5% 0.009 80)`) · Sheet `#ffffff` · Subtle `#f2ede4` · Rule `1px solid #e4ddd1`
- **Ink Tokens:** Primary `#231f1c` · Secondary `#443e38` · Muted `#6e655d`
- **Accent & Semantic:** Deep Forest `#166534` (`oklch(44% 0.11 152)`), Soft `#f0fdf4`
- **Typography:** Display & Totals `Instrument Serif` (400, `-0.015em`) · UI & Tables `DM Sans` (400/500/600) · Figures `DM Mono` (`tabular-nums`)
- **Geometry & Posture:** Calm ledger sheet (`8px` radius on inputs/wells, `1px` warm hairline borders, zero shadow on resting panels).

---

## 5. Domain 3 — Healthcare, Clinical & Care

### `05. Pharmacy Calm`
*Best for: Patient portals, telehealth scheduling, pharmacy fulfillment, mental health & wellness care.*
- **Surface Tokens:** Canvas `#f6f7f4` (`oklch(97.2% 0.008 135)`) · Sheet `#ffffff` · Subtle `#ebeee7` · Rule `1px solid #dce1d6`
- **Ink Tokens:** Primary `#18221e` · Secondary `#33423c` · Muted `#596b63`
- **Accent & Semantic:** Apothecary Eucalyptus `#0d6e5b` (`oklch(48% 0.095 172)`), Soft `#ecfdf5`
- **Typography:** Display `Outfit` (600, `-0.02em`) · Clinical Body `Public Sans` (400/500, `1.55` line-height) · Dosages & Times `JetBrains Mono`
- **Geometry & Posture:** Generous breathing room (`10px` control/surface radius, `1px` crisp borders, clear progressive step flows, high-legibility medication and appointment timelines).

### `06. Clinical Precision`
*Best for: Electronic Health Records (EHR), lab diagnostics, radiology worklists, ICU/ward triage.*
- **Surface Tokens:** Canvas `#f8fafc` · Worklist `#ffffff` · Header/Rail `#f1f5f9` · Rule `1px solid #cbd5e1`
- **Ink Tokens:** Primary `#0b1324` · Secondary `#283548` · Muted `#526277`
- **Accent & Semantic:** Diagnostic Cerulean `#0369a1` (`oklch(50% 0.12 238)`), Soft `#f0f9ff` · Out-of-range flag: `#b91c1c` (always paired with explicit `H`/`L` symbol, never color alone)
- **Typography:** UI `IBM Plex Sans` (400/500/600) · Vitals, Reference Ranges & Timestamps `IBM Plex Mono` (`tabular-nums`)
- **Geometry & Posture:** High-density patient banner pinned top, `4px` tight radius, zero decorative imagery, instant keyboard/row triage.

---

## 6. Domain 4 — Commercial B2B SaaS & Platforms

### `07. Ink & Signal`
*Best for: Collaborative workspaces, CRM, project trackers, service desks, multi-tenant B2B apps.*
- **Surface Tokens:** Canvas `#fcfcfc` (`oklch(99.2% 0.002 100)`) · Well `#f5f5f4` · Subtle `#ebebea` · Rule `1px solid #e4e4e2`
- **Ink Tokens:** Primary `#171717` (`oklch(16% 0 0)`) · Secondary `#383838` · Muted `#666666`
- **Accent & Semantic:** Chromatic Teal `#0d7477` (`oklch(50% 0.095 190)`), Soft `#e6f6f6`
- **Typography:** Display `Epilogue` (700, `-0.035em`) · Body & Controls `Inter` (400/500/600) · IDs & Counts `IBM Plex Mono`
- **Geometry & Posture:** Hueless carbon ink on clean paper; teal marks only active/open state and primary CTA (`8px` control radius, `12px` wells, shadow reserved strictly for floating popovers/dialogs).

### `08. Obsidian Stage`
*Best for: Media production suites, AI creative workflows, high-contrast SaaS launches, real-time analytics.*
- **Surface Tokens:** Canvas `#09090b` (`oklch(14% 0.005 270)`) · Elevated `#121216` · Subtle `#1c1c22` · Rule `1px solid #27272a`
- **Ink Tokens:** Primary `#fafafa` · Secondary `#d4d4d8` · Muted `#a1a1aa`
- **Accent & Semantic:** Cobalt Signal `#3b82f6` (`oklch(62% 0.19 258)`), Soft `rgba(59, 130, 246, 0.14)`
- **Typography:** Display `Space Grotesk` (600/700, `-0.03em`) · Body `Plus Jakarta Sans` (400/500) · Telemetry `JetBrains Mono`
- **Geometry & Posture:** Precision dark surface separated strictly by `1px solid #27272a` keylines and luminance steps (`8px` radius). Zero purple/indigo neon blooms or glowing card borders.

---

## 7. Domain 5 — Developer Tools, Observability & Security

### `09. Graphite Instrument`
*Best for: Log explorers, APM tracing, DAST/pentest consoles, database studios, CI/CD pipelines.*
- **Surface Tokens:** Canvas `#0d1117` (`oklch(17.5% 0.012 255)`) · Pane `#161b22` · Subtle `#21262d` · Rule `1px solid #30363d`
- **Ink Tokens:** Primary `#e6edf3` · Secondary `#b1bac4` · Muted `#8b949e`
- **Accent & Semantic:** Amber Telemetry `#f59e0b` (`oklch(75% 0.16 75)` — dark ink `#0d1117` on filled buttons), Soft `rgba(245, 158, 11, 0.14)` · Severity: Critical `#f85149`, High `#db6d28`, Low `#3fb950`
- **Typography:** UI `IBM Plex Sans` (400/500/600) · Logs, Payloads, Traces & Queries `JetBrains Mono` (`tabular-nums`)
- **Geometry & Posture:** Keyboard-first multi-pane workbench (`4px` radius, `Cmd+K` bar, split log/trace inspector, zero marketing ornament).

### `10. Technical Whiteprint`
*Best for: API documentation, architecture registries, CAD/spec viewers, schema & hardware documentation.*
- **Surface Tokens:** Canvas `#f4f7fb` (`oklch(97.2% 0.008 245)`) · Sheet `#ffffff` · Subtle `#e8eef6` · Rule `1px solid #cbd5e1` (Major register rule: `2px solid #13294b`)
- **Ink Tokens:** Primary `#13294b` (Prussian Ink) · Secondary `#2c4469` · Muted `#566d8e`
- **Accent & Semantic:** Drafting Cobalt `#1d4ed8` (`oklch(49% 0.19 260)`), Soft `#dbeafe`
- **Typography:** Display `Chakra Petch` (600, `-0.015em`) · Prose & UI `IBM Plex Sans` (400/500) · Specs, Endpoints & Units `IBM Plex Mono`
- **Geometry & Posture:** Square `0px` drafted keylines, specification register tables, dual-rail documentation layout with crisp code/parameter blocks.

---

## 8. Domain 6 — Commerce, Hospitality, Craft & Hardware

### `11. Atelier Gallery`
*Best for: Architecture studios, boutique hospitality, furniture/ceramics commerce, specialty roasters, galleries.*
- **Surface Tokens:** Canvas `#f4f0e8` (`oklch(95.5% 0.012 78)`) · Card Stock `#faf8f4` · Subtle `#eae4d8` · Rule `1px solid #dcd4c5`
- **Ink Tokens:** Primary `#241d18` (Deep Umber) · Secondary `#463b33` · Muted `#6e6055`
- **Accent & Semantic:** Slate Ultramarine `#334e68` (`oklch(41% 0.075 248)`), Soft `#eaeff5`
- **Typography:** Display `Cormorant Garamond` (500/600, `-0.018em`, line-height `1.06`) · Body, Wall Labels & Checkout `Hanken Grotesk` (400/500/600) · Prices/Editions `Hanken Grotesk` (`tabular-nums`)
- **Geometry & Posture:** Crisp `2px` gallery corners, generous daylight imagery with captions placed cleanly beneath (never overlaid on cluttered gradients), quiet ruled specification tables.

### `12. Kinetic Grid`
*Best for: Athletic gear, consumer electronics, ticketing & live events, fitness/training platforms, automotive.*
- **Surface Tokens:** Canvas `#f7f7f5` · Plate `#ffffff` · Subtle `#ededeb` · Rule `1px solid #d6d6d2` (Section header bar: `2px solid #111111`)
- **Ink Tokens:** Primary `#111111` · Secondary `#333333` · Muted `#636360`
- **Accent & Semantic:** Vermilion Signal `#dc2626` (`oklch(56% 0.21 27)`), Soft `#fef2f2`
- **Typography:** Display & Scoreboards `Barlow Condensed` (700 uppercase, `-0.01em`) · Body & Controls `Archivo` (400/500/600) · Splits, SKUs & Specs `JetBrains Mono`
- **Geometry & Posture:** High-contrast Swiss structural grid (`4px` radius), bold typographic hierarchy, crisp inventory/size matrices, zero soft pastel washes.

---

## 9. Domain 7 — Editorial, Publishing, EdTech & Knowledge

### `13. Studio Proof`
*Best for: Digital publications, research journals, documentation hubs, writing studios, legal analysis.*
- **Surface Tokens:** Canvas `#f9f7f1` (`oklch(97.5% 0.010 90)`) · Reading Sheet `#ffffff` · Subtle `#f0ece1` · Rule `1px solid #e0dacb`
- **Ink Tokens:** Primary `#1c1917` · Secondary `#3f3a36` · Muted `#6b635b`
- **Accent & Semantic:** Editorial Crimson `#9f1239` (`oklch(45% 0.17 15)`), Soft `#fff1f2`
- **Typography:** Display `Fraunces` (600, `-0.02em`) · Long-form Prose `Source Serif 4` (`65ch–72ch` measure, `1.65` line-height) · UI Chrome & TOC `Work Sans` (400/500/600)
- **Geometry & Posture:** Distraction-free reading column flanked by receding table-of-contents and citation/footnote margin rails (`4px` radius).

### `14. Botanical Field`
*Best for: EdTech courses, language & science learning, sustainability/climate platforms, community libraries.*
- **Surface Tokens:** Canvas `#f4f6f0` (`oklch(96.6% 0.012 125)`) · Sheet `#ffffff` · Subtle `#e7ece0` · Rule `1px solid #d5ddd0`
- **Ink Tokens:** Primary `#1c241b` · Secondary `#374436` · Muted `#5c6b5a`
- **Accent & Semantic:** Warm Ochre `#b45309` (`oklch(53% 0.14 55)`), Soft `#fef3c7` · Completion: Forest `#15803d`
- **Typography:** Display `Libre Baskerville` (400/700) · Learning UI & Exercises `Figtree` (400/500/600) · Curriculum Codes & Progress `IBM Plex Mono`
- **Geometry & Posture:** Structured syllabus rail + focused lesson canvas (`10px` radius, clear progress milestones, tactile quietness without childish gamification).

---

## 10. Domain 8 — Industrial, Logistics, Construction & Geospatial

### `15. Formwork Concrete`
*Best for: Construction management, field engineering, manufacturing MES, warehouse WMS, heavy equipment.*
- **Surface Tokens:** Canvas `#eeece6` (`oklch(94.2% 0.008 82)`) · Work Plate `#f9f8f5` · Subtle `#e2dfd7` · Rule `1px solid #cbc7bc` (Plate top-bar: `3px solid #18181b`)
- **Ink Tokens:** Primary `#18181b` · Secondary `#36363a` · Muted `#575652`
- **Accent & Semantic:** Safety Orange `#c2410c` (`oklch(52% 0.18 38)` — passes WCAG AA `4.5:1` with `#ffffff` button ink), Soft `#ffedd5`
- **Typography:** Display `Oswald` (600/700, `-0.005em`) · UI & Field Forms `Archivo` (400/500/600) · Tolerances, Tonnage & Lot IDs `IBM Plex Mono` (`tabular-nums`)
- **Geometry & Posture:** Square `0px` board-cast edges, high-target field controls (`>= 44px`), unambiguous work-order status plates.

### `16. Meridian Survey`
*Best for: Fleet dispatch, supply chain & freight tracking, GIS/geospatial consoles, energy & utility grids.*
- **Surface Tokens:** Canvas `#f3f5f7` (`oklch(96.5% 0.005 235)`) · Map/Data Overlay `#ffffff` · Subtle `#e5e9ef` · Rule `1px solid #cfd6e0`
- **Ink Tokens:** Primary `#0f172a` · Secondary `#2d3a4f` · Muted `#58677e`
- **Accent & Semantic:** Survey Teal `#0f766e` (`oklch(51% 0.096 186)`), Waypoint Alert `#b45309`, Soft `#f0fdfa`
- **Typography:** Display `Sora` (600, `-0.02em`) · Dispatch UI `Public Sans` (400/500/600) · Coordinates, ETAs & Manifests `JetBrains Mono` (`tabular-nums`)
- **Geometry & Posture:** Split canvas (geospatial/timeline viewport + docked high-density manifest drawer, `6px` radius, crisp `1px` keylines).

---

## 11. Selection & Lock Protocol (Greenfield Only)

1. **Match Domain First:** Map the user's product to one of the 8 domains in Section 1. Never cross-contaminate genres (e.g., never apply `09. Graphite Instrument` dark terminal aesthetics to `01. Sovereign Slate` civic portals).
2. **Alternate Within Domain:** Choose between Option A (cool/structural) and Option B (warm/editorial) based on brand tone or to diverge from recent builds.
3. **Brownfield Preemption:** If the repository already defines brand tokens (e.g., Tailwind colors, CSS variables in `globals.css` or `app.css`), skip this catalog completely. Do not override established project palettes.
4. **Silent Internal Token Application:** Translate selected tokens directly into CSS custom properties (`--bg-canvas`, `--bg-surface`, `--text-ink`, `--border-rule`, `--accent-primary`) in code. Never output promotional or meta-jargon phrases to the user.
