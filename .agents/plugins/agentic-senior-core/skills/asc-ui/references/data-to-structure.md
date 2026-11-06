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

---

## 3. Page Rhythm Rules

1. **Maximum One Card Grid Per View:** A single page must never stack two or more multi-column card grids consecutively. Alternate dense sections (`<table>`, `divide-y` list, `<dl>` stat strip, split 2-column prose/form).
2. **No Placeholder Avatars or Fake Chrome:** Omit empty gray silhouette circles when real user photos do not exist. Omit fake macOS traffic-light window dots (`red/yellow/green`) outside developer CLI documentation.
3. **Single Elevation Per Surface:** Use either `border border-border` OR `shadow-sm` on an isolated container—never combine heavy borders with drop shadows, and never nest a bordered card inside another bordered card.

