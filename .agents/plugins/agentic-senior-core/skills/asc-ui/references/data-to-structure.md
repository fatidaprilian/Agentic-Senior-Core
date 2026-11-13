# Deterministic Data-to-Structure Mapping (Anti-Card-Soup)

Code-generation models default to wrapping every dataset in an identical bordered card grid (`grid` + `rounded-xl` + `border` + `p-6`). Repeating card grids across three or more sections produces visually monotonous "Card Soup". Map every dataset deterministically to its semantic HTML structure instead.

---

## 1. Mandatory Structural Mapping Matrix

| Data Shape | Forbidden Pattern (Card Soup) | Required Semantic Container |
| :--- | :--- | :--- |
| **Sequential Steps / Workflow (`1 -> 2 -> 3`)** | 3–4 bordered cards with `01`, `02`, `03` badges | Connected `<ol>` stepper with horizontal/vertical connector lines |
| **Criteria, Rubrics, Pricing Tiers, Logs, Metrics** | Multi-row card grid with repeated labels/badges | Semantic `<table>` with `sticky top-0` header and `tabular-nums` |
| **People, Committees, Directories, Activity Feeds** | Profile cards with placeholder avatar circles | Compact `divide-y divide-border` roster list (single-line or two-column rows) |
| **Summary KPIs / Key Counts (3–5 numbers)** | Individual shadowed boxes per number | Flat typographic strip separated by hairline borders (`sm:divide-x divide-border`) |
| **FAQs / Reference Details** | Nested bordered boxes inside bordered panels | Native `<details>` / `<summary>` or unboxed `divide-y` accordion |
| **Independent Catalog Items / Single Isolated Form** | Card-inside-card nesting | Single-level `Card` (`border border-border` OR `shadow-sm`, never both) |

---

## 2. Structural Reference Templates

### 2.1 Sequential Process -> Connected Stepper (`<ol>`)
```html
<ol class="grid grid-cols-1 gap-6 border-t border-border pt-6 md:grid-cols-4">
  <li class="space-y-1.5">
    <span class="text-xs font-mono font-semibold text-muted-foreground">Step 1</span>
    <h3 class="text-sm font-semibold text-foreground">Authenticate Account</h3>
    <p class="text-sm text-muted-foreground">Sign in with your assigned unit credentials.</p>
  </li>
  <li class="space-y-1.5">
    <span class="text-xs font-mono font-semibold text-muted-foreground">Step 2</span>
    <h3 class="text-sm font-semibold text-foreground">Submit Assessment</h3>
    <p class="text-sm text-muted-foreground">Complete indicator scores per evaluation category.</p>
  </li>
</ol>
```

### 2.2 Weighted Criteria / Structured Records -> Matrix `<table>`
```html
<div class="overflow-x-auto border-y border-border">
  <table class="w-full text-left text-sm">
    <thead class="sticky top-0 bg-background border-b border-border text-xs font-medium text-muted-foreground">
      <tr>
        <th scope="col" class="py-3 pr-4">Category</th>
        <th scope="col" class="py-3 px-4">Required Evidence</th>
        <th scope="col" class="py-3 px-4 text-right">Weight</th>
        <th scope="col" class="py-3 pl-4 text-right">Action</th>
      </tr>
    </thead>
    <tbody class="divide-y divide-border">
      <tr class="hover:bg-muted/40 transition-colors">
        <td class="py-3 pr-4 font-medium text-foreground">Governance &amp; Records</td>
        <td class="py-3 px-4 text-muted-foreground">Decree PDF, annual roster</td>
        <td class="py-3 px-4 text-right font-mono tabular-nums">20%</td>
        <td class="py-3 pl-4 text-right"><a href="#details" class="font-medium text-primary hover:underline">Inspect</a></td>
      </tr>
    </tbody>
  </table>
</div>
```

### 2.3 Team / Roster Directory -> Compact `divide-y` List
```html
<ul class="divide-y divide-border border-y border-border">
  <li class="flex flex-col gap-1 py-3.5 sm:flex-row sm:items-baseline sm:justify-between">
    <div>
      <span class="font-medium text-foreground">Dr. Budi Santoso</span>
      <span class="ml-2 text-sm text-muted-foreground">Lead Auditor — Administrative Verification</span>
    </div>
    <span class="text-xs font-mono text-muted-foreground">District I–II</span>
  </li>
</ul>
```

### 2.4 Summary Figures -> Flat Stat Strip
```html
<dl class="grid grid-cols-2 gap-6 border-y border-border py-6 sm:grid-cols-4 sm:gap-0 sm:divide-x sm:divide-border">
  <div class="sm:px-6 first:sm:pl-0">
    <dt class="text-xs text-muted-foreground">Registered Units</dt>
    <dd class="mt-1 text-2xl font-semibold tracking-tight font-mono tabular-nums text-foreground">40</dd>
  </div>
  <div class="sm:px-6">
    <dt class="text-xs text-muted-foreground">Evaluation Domains</dt>
    <dd class="mt-1 text-2xl font-semibold tracking-tight font-mono tabular-nums text-foreground">5</dd>
  </div>
</dl>
```

### 2.5 Edge-to-Edge Enterprise Table (`Card` + `Table`)
```html
<div class="rounded-lg border border-border bg-card text-card-foreground">
  <div class="flex items-center justify-between border-b border-border px-6 py-4">
    <div>
      <h3 class="text-base font-semibold text-foreground">Active Work Orders</h3>
      <p class="text-xs text-muted-foreground">Operational maintenance requests scheduled for inspection.</p>
    </div>
    <button type="button" class="inline-flex items-center rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground">Create Order</button>
  </div>
  <div class="overflow-x-auto">
    <table class="w-full text-left text-sm">
      <thead class="bg-muted/50 text-xs font-medium text-muted-foreground">
        <tr>
          <th scope="col" class="py-2.5 pl-6 pr-4">Order ID</th>
          <th scope="col" class="py-2.5 px-4">Unit Designation</th>
          <th scope="col" class="py-2.5 px-4">Status</th>
          <th scope="col" class="py-2.5 px-4 text-right">Parts Cost</th>
          <th scope="col" class="py-2.5 pl-4 pr-6 text-right">Actions</th>
        </tr>
      </thead>
      <tbody class="divide-y divide-border">
        <tr class="hover:bg-muted/30 transition-colors">
          <td class="py-2.5 pl-6 pr-4 font-mono text-xs font-medium text-foreground">WO-4029</td>
          <td class="py-2.5 px-4 text-foreground">CAT 320 Hydraulic Excavator</td>
          <td class="py-2.5 px-4"><span class="inline-flex rounded px-1.5 py-0.5 text-xs font-medium bg-amber-500/10 text-amber-700 dark:text-amber-400">Scheduled</span></td>
          <td class="py-2.5 px-4 text-right font-mono tabular-nums text-foreground">IDR 14.500.000</td>
          <td class="py-2.5 pl-4 pr-6 text-right">
            <button type="button" aria-label="Order actions" class="p-1 text-muted-foreground hover:text-foreground">···</button>
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</div>
```

### 2.6 Record Highlights Panel (Single Source of Identity)
```html
<header class="border-b border-border bg-background pb-6">
  <div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
    <div class="space-y-1">
      <div class="flex items-center gap-3">
        <h1 class="text-xl font-bold tracking-tight text-foreground">Unit EX-8910</h1>
        <span class="inline-flex rounded px-2 py-0.5 text-xs font-semibold bg-emerald-500/10 text-emerald-700 dark:text-emerald-400">Operational</span>
      </div>
      <p class="text-sm text-muted-foreground">Caterpillar 777G Off-Highway Haul Truck · Fleet Mining Sector 4</p>
    </div>
    <div class="flex items-center gap-2">
      <button type="button" class="rounded-md border border-input bg-background px-3 py-1.5 text-xs font-medium text-foreground hover:bg-muted">Download Telematics</button>
      <button type="button" class="rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:bg-primary/90">Dispatch Technician</button>
    </div>
  </div>
  <dl class="mt-4 grid grid-cols-2 gap-4 border-t border-border pt-4 sm:grid-cols-4">
    <div>
      <dt class="text-xs text-muted-foreground">Engine Operating Hours</dt>
      <dd class="mt-0.5 font-mono text-sm font-semibold tabular-nums text-foreground">8,421 hrs</dd>
    </div>
    <div>
      <dt class="text-xs text-muted-foreground">Mean Fuel Consumption</dt>
      <dd class="mt-0.5 font-mono text-sm font-semibold tabular-nums text-foreground">42.8 L/hr</dd>
    </div>
    <div>
      <dt class="text-xs text-muted-foreground">Last Periodic Service</dt>
      <dd class="mt-0.5 font-mono text-sm font-semibold tabular-nums text-foreground">2026-10-14</dd>
    </div>
    <div>
      <dt class="text-xs text-muted-foreground">Next Scheduled Inspection</dt>
      <dd class="mt-0.5 font-mono text-sm font-semibold tabular-nums text-foreground">2026-12-01</dd>
    </div>
  </dl>
</header>
```

---

## 3. Page Rhythm & Enterprise Layout Invariants

1. **Shell Boundary Invariant (Zero Outer Chrome in Pages):**
   - Page components (`page.tsx`, `*.razor`, `*.blade.php`) must **never** declare outer application chrome (`<nav>`, app headers, global profile bars, or outer wrapper padding) when an enclosing layout shell exists.
   - A single view must feature at most one top-level page title heading (`h1` or `PageHeader.Title`). Never render duplicate titles.
2. **Action Boundary Hierarchy (Single Primary CTA per Region):**
   - Exactly one primary solid button per viewport segment. Secondary controls must use `variant="outline"` or `variant="ghost"`.
   - Never duplicate top-level actions inside empty states or sub-headers if already present in the primary page header.
   - For table row actions exceeding two operations, wrap secondary actions into an overflow menu (`···` / kebab trigger) to prevent horizontal column inflation.
3. **Data Projection Invariant (Summarize OR Enumerate, Zero Echoing):**
   - Never echo identical key-value attributes between adjacent summary cards and child detail panels without data transformation.
   - If an entity's status or serial number is rendered in the top Highlights Panel, sub-views must project detailed operational logs, related parts, or telematics history—not restate the identical header labels in a duplicate card.
4. **Tabular Density & Alignment Standards (IBM Carbon / SAP Fiori):**
   - **Numeric Right-Alignment:** All currencies, parts counts, percentages, and metrics must be right-aligned (`text-right font-mono tabular-nums`), and their column header `<th class="text-right">` must match.
   - **Text Left-Alignment:** Descriptions, asset names, and categories must be left-aligned.
   - **Compact Density:** Default enterprise operational tables to row heights of 32px–40px (`py-2.5` to `py-3`) rather than loose 64px heights that waste vertical scanning space.
5. **Skeleton-Geometry Parity (Anti-CLS):**
   - Loading skeletons must replicate the exact geometry, column count, and row height of the target data table or stat strip.
   - Never insert a generic floating circular spinner that causes a cumulative layout shift upon data arrival.
6. **Maximum One Card Grid Per View:** A single page must never stack two or more multi-column card grids consecutively. Alternate dense sections (`<table>`, `divide-y` list, `<dl>` stat strip, split 2-column prose/form).
7. **No Placeholder Avatars or Fake Chrome:** Omit empty gray silhouette circles when real user photos do not exist. Omit fake macOS traffic-light window dots (`red/yellow/green`) outside developer CLI documentation.
8. **Single Elevation Per Surface:** Use either `border border-border` OR `shadow-sm` on an isolated container—never combine heavy borders with drop shadows, and never nest a bordered card inside another bordered card.

