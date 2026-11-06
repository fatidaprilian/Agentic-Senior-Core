# Concrete UI Composition Patterns

> **Core Invariant:** Do not rely on abstract prohibition lists. Modern models build high-craft interfaces by pattern-matching against authentic, human-designed DOM compositions and visual assets. Use the real-world reverse-engineered benchmarks below and structural archetypes instead of enclosing every section in a `1px` border wireframe box.

---

## 0. Real-World Live Benchmarks (Extracted via REA)

The `references/visuals/` directory contains authentic, human-designed production websites reverse-engineered from the live web using REA (`capture_browser_scenario`). Each entry includes a **viewport screenshot (PNG)** for visual-spatial calibration and the **rendered DOM structure (JSON)** for class tokens and layout hierarchies:

| Target Domain | Visual Reference (Screenshot) | Rendered DOM Structure | Key Design Traits to Adopt |
| :--- | :--- | :--- | :--- |
| **Developer Infra / Dark Editorial** | `references/visuals/real-resend.png` | `references/visuals/real-resend-dom.json` | High-contrast serif/sans display typography, delicate lighting gradient rays, minimal pill announcement, solid primary + ghost secondary actions. |
| **Analytics & Data Dashboards** | `references/visuals/real-dub.png` | `references/visuals/real-dub-dom.json` | Subtle light grid canvas, embedded live dashboard stage, large bold KPI numbers (`$210,429.00`), spline chart rhythm, tabbed filter pills. |
| **CRM & Relational Operations** | `references/visuals/real-attio.png` | `references/visuals/real-attio-dom.json` | Windowed desktop console frame, quick actions search bar with `⌘K`, multi-filter table density, minimal prompt input. |
| **Authentication & Forms** | `references/visuals/real-clerk.png` | `references/visuals/real-clerk-dom.json` | Bounded form cards (`max-w-md`), multi-tenancy switcher tabs, OAuth SSO buttons, clean single-line inputs with generous tap targets. |
| **Documentation & API Reference** | `references/visuals/real-mintlify.png` | `references/visuals/real-mintlify-dom.json` | Dual-rail navigation tree, section guide cards, language switcher pills, floating assistant action button. |
| **Booking & Scheduling Flow** | `references/visuals/real-cal.png` | `references/visuals/real-cal-dom.json` | Playful bold typography with inline status badges, dual Microsoft/Google SSO buttons, embedded booking calendar mockup. |
| **Storefront & App Catalog** | `references/visuals/real-marketplace.png` | `references/visuals/real-marketplace-dom.json` | Sidebar category filters, search toolbar, discrete integration cards with verified badges and tags, tabbed recommendation lists. |
| **Collaborative Canvas & Studio** | `references/visuals/real-tldraw.png` | `references/visuals/real-tldraw-dom.json` | Receding full-bleed canvas chrome, floating bottom utility dock, minimal top-right palette/stroke controller, clean viewport zoom indicator. |
| **Command Centers & Launchers** | `references/visuals/real-raycast.png` | `references/visuals/real-raycast-dom.json` | Obsidian dark background, directional accent glow, pill search/action bar, clean monospace system notes. |
| **Cloud Databases & Platforms** | `references/visuals/real-supabase.png` | `references/visuals/real-supabase-dom.json` | Asymmetric 2-column hero split, signature accent color (emerald), capability feature grid with checkmarks and code pills. |
| **Product Craft & Philosophy** | `references/visuals/real-linear.png` | `references/visuals/real-linear-dom.json` | Disciplined whitespace, editorial typography contrast, subtle geometric hairline accents, no unearned visual clutter. |
| **High-Impact Brand Stage** | `references/visuals/real-vercel.png` | `references/visuals/real-vercel-dom.json` | Central geometric focal point, 3-line manifesto typography, high-contrast monochrome customer logo proof. |
| **Enterprise Infrastructure** | `references/visuals/real-stripe.png` | `references/visuals/real-stripe-dom.json` | Fluid signature mesh gradients, prominent primary CTA with arrow, dual-action row with Google SSO. |

When constructing or redesigning a surface, inspect the matching `references/visuals/real-*.png` via `read_file` to ground visual proportions (padding, font scaling, surface elevation) on real human craft.

---

## Pattern 1: Public Institutional / Product Hero (Bold Ground + Focused Action)

*Use for: Public landing pages, civic platforms, institutional gateways, product launch.*
*Key Traits: High-contrast typography scale, 1 primary action panel, no generic pill kickers, authentic brand presence.*

```html
<section class="relative overflow-hidden bg-zinc-900 text-zinc-100 py-20 lg:py-28">
  <div class="max-w-6xl mx-auto px-6">
    <div class="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center">
      
      <!-- Left: Assertive Narrative (7 cols) -->
      <div class="lg:col-span-7 space-y-6">
        <h1 class="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-white leading-[1.08]">
          Reliable Verification for Regional Operations.
        </h1>
        <p class="text-lg text-zinc-300 max-w-xl leading-relaxed">
          Standardized assessment workflow, objective criteria tracking, and multi-district reporting on a unified surface.
        </p>

        <!-- Factual Key Indicators (Plain typographic numbers, not floating cards) -->
        <div class="pt-6 border-t border-zinc-800 flex flex-wrap gap-8 text-sm">
          <div>
            <span class="block text-2xl font-bold font-mono text-white tabular-nums">12</span>
            <span class="text-zinc-400">Core Categories</span>
          </div>
          <div>
            <span class="block text-2xl font-bold font-mono text-white tabular-nums">148</span>
            <span class="text-zinc-400">Verified Checkpoints</span>
          </div>
          <div>
            <span class="block text-2xl font-bold font-mono text-white tabular-nums">99.8%</span>
            <span class="text-zinc-400">On-Time Submissions</span>
          </div>
        </div>
      </div>

      <!-- Right: Single Functional Action Surface (5 cols) -->
      <div class="lg:col-span-5">
        <div class="bg-white text-zinc-900 rounded-xl p-7 shadow-xl space-y-5">
          <div class="border-b border-zinc-200 pb-4">
            <h2 class="text-lg font-bold text-zinc-900">District Access</h2>
            <p class="text-xs text-zinc-500 mt-1">Select an active region to inspect accreditation status</p>
          </div>

          <div class="space-y-3.5">
            <div>
              <label class="block text-xs font-semibold text-zinc-700 mb-1.5">Region</label>
              <select class="w-full text-sm rounded-lg border border-zinc-300 bg-zinc-50 px-3 py-2 text-zinc-800 focus:outline-none focus:ring-2 focus:ring-zinc-900">
                <option>Region North (Sector A)</option>
                <option>Region Central (Sector B)</option>
                <option>Region South (Sector C)</option>
              </select>
            </div>
            <div>
              <label class="block text-xs font-semibold text-zinc-700 mb-1.5">Organization Unit</label>
              <input type="text" placeholder="Search department or unit..." class="w-full text-sm rounded-lg border border-zinc-300 px-3 py-2 text-zinc-800 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-900" />
            </div>
            <button class="w-full bg-zinc-900 hover:bg-zinc-800 text-white font-medium text-sm rounded-lg py-2.5 transition-colors">
              Continue to Portal
            </button>
          </div>
        </div>
      </div>

    </div>
  </div>
</section>
```

---

## Pattern 2: Progressive Category Explorer (Clean Overview + Focused Preview)

*Use for: Large catalogs, complex instrument sets, curricula, feature breakdown.*
*Key Traits: Prevents raw 100+ row table dumps on public pages while avoiding repetitive bento cards.*

```html
<section class="py-16 lg:py-24 bg-zinc-50">
  <div class="max-w-6xl mx-auto px-6">
    
    <!-- Section Header (Clear and direct, no uppercase kicker) -->
    <div class="max-w-2xl mb-12">
      <h2 class="text-3xl font-bold tracking-tight text-zinc-900">Evaluation Criteria</h2>
      <p class="text-sm text-zinc-600 mt-2">Select a operational domain to review requirements and compliance records.</p>
    </div>

    <!-- Category Tabs & Preview Canvas -->
    <div class="bg-white rounded-xl border border-zinc-200/80 shadow-sm overflow-hidden">
      <!-- Category Strip -->
      <div class="grid grid-cols-2 md:grid-cols-4 border-b border-zinc-200 divide-x divide-zinc-200 bg-zinc-100/50 text-center text-xs font-medium">
        <button class="py-3.5 px-4 bg-white text-zinc-900 font-semibold border-b-2 border-zinc-900">
          Governance (25%)
        </button>
        <button class="py-3.5 px-4 text-zinc-600 hover:text-zinc-900 transition-colors">
          Financial Controls (25%)
        </button>
        <button class="py-3.5 px-4 text-zinc-600 hover:text-zinc-900 transition-colors">
          Field Operations (30%)
        </button>
        <button class="py-3.5 px-4 text-zinc-600 hover:text-zinc-900 transition-colors">
          Reporting & Audit (20%)
        </button>
      </div>

      <!-- Preview Table for Selected Category -->
      <div class="p-6">
        <div class="flex items-center justify-between mb-4">
          <div class="text-sm font-semibold text-zinc-900">Governance Benchmarks (24 Items)</div>
          <span class="text-xs text-zinc-500 font-mono">Format: Signed PDF / Audit Log</span>
        </div>

        <table class="w-full text-left text-sm border-collapse">
          <thead>
            <tr class="border-b border-zinc-200 text-xs font-semibold text-zinc-500 uppercase">
              <th class="py-2.5 px-3 w-12 font-mono">No</th>
              <th class="py-2.5 px-4">Performance Indicator</th>
              <th class="py-2.5 px-4">Verification Artifact</th>
              <th class="py-2.5 px-3 w-20 text-right font-mono">Weight</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-zinc-100 text-zinc-800">
            <tr>
              <td class="py-3 px-3 font-mono text-zinc-500">01</td>
              <td class="py-3 px-4 font-medium">Annual Board Review Minutes</td>
              <td class="py-3 px-4 text-zinc-600">Signed meeting resolution and verified attendance roll</td>
              <td class="py-3 px-3 text-right font-mono tabular-nums">5.0%</td>
            </tr>
            <tr>
              <td class="py-3 px-3 font-mono text-zinc-500">02</td>
              <td class="py-3 px-4 font-medium">Quarterly Budget Reconciliation</td>
              <td class="py-3 px-4 text-zinc-600">Reconciled bank statement and expenditure journal</td>
              <td class="py-3 px-3 text-right font-mono tabular-nums">4.5%</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

  </div>
</section>
```

---

## Pattern 3: Clean Human Directory (No Infinite Marquee, No 3-Level Card Nest)

*Use for: Advisory boards, committees, team members, reviewers.*
*Key Traits: Uses subtle natural spacing and typography instead of infinite marquee tickers or nested card boxes.*

```html
<section class="py-16 lg:py-24 bg-white border-t border-zinc-200">
  <div class="max-w-6xl mx-auto px-6">
    
    <div class="max-w-2xl mb-12">
      <h2 class="text-3xl font-bold tracking-tight text-zinc-900">Review Committee</h2>
      <p class="text-sm text-zinc-600 mt-2">Accredited evaluators and audit leads for the current inspection cycle.</p>
    </div>

    <!-- Direct Grid: Unnested, clean borders or airy spacing -->
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
      
      <div class="space-y-3">
        <div class="flex items-center gap-4">
          <div class="w-12 h-12 rounded-lg bg-zinc-100 border border-zinc-200 flex items-center justify-center font-bold text-zinc-700">
            ER
          </div>
          <div>
            <h3 class="text-base font-bold text-zinc-900">Elena Rostova, Ph.D.</h3>
            <p class="text-xs text-zinc-500 font-medium">Lead Governance Auditor</p>
          </div>
        </div>
        <p class="text-xs text-zinc-600 leading-relaxed">
          Oversees statutory compliance, governance resolutions, and organizational constitution reviews.
        </p>
      </div>

      <div class="space-y-3">
        <div class="flex items-center gap-4">
          <div class="w-12 h-12 rounded-lg bg-zinc-100 border border-zinc-200 flex items-center justify-center font-bold text-zinc-700">
            MC
          </div>
          <div>
            <h3 class="text-base font-bold text-zinc-900">Marcus Chen, CPA</h3>
            <p class="text-xs text-zinc-500 font-medium">Senior Financial Evaluator</p>
          </div>
        </div>
        <p class="text-xs text-zinc-600 leading-relaxed">
          Verifies accounting balances, grant disbursements, and audit trails across regional chapters.
        </p>
      </div>

    </div>
  </div>
</section>
```

---

## Pattern 4: Operational Workspace (High-Density Master-Detail for Authenticated Users)

*Use for: Internal dashboard, audit workstation, evaluator screen.*
*Key Traits: Sticky column headers, tabular figures, master-detail side rail, zero consumer fluff.*

```html
<div class="min-h-dvh flex flex-col bg-zinc-100 text-zinc-900">
  <!-- Top Bar -->
  <header class="h-14 bg-white border-b border-zinc-200 px-6 flex items-center justify-between">
    <div class="flex items-center gap-3">
      <span class="font-bold text-sm">AUDIT DESK</span>
      <span class="text-zinc-300">/</span>
      <span class="text-xs text-zinc-600">District 04 (Central Sector)</span>
    </div>
    <div class="flex items-center gap-4 text-xs">
      <span class="text-zinc-500">Evaluator: Field Team 2</span>
      <button class="bg-zinc-900 text-white px-3 py-1.5 rounded-md font-medium hover:bg-zinc-800">
        Save Evaluation
      </button>
    </div>
  </header>

  <!-- Split View (Master list left, detail right) -->
  <div class="flex-1 flex overflow-hidden">
    <!-- Left Rail: Categories & Status (280px) -->
    <aside class="w-72 bg-white border-r border-zinc-200 p-4 space-y-2 overflow-y-auto">
      <div class="text-xs font-semibold text-zinc-500 px-2 uppercase tracking-wide">Audit Categories</div>
      <button class="w-full text-left px-3 py-2 rounded-lg bg-zinc-100 font-medium text-xs text-zinc-900 flex justify-between items-center">
        <span>Governance</span>
        <span class="text-emerald-700 font-mono">18/22</span>
      </button>
      <button class="w-full text-left px-3 py-2 rounded-lg hover:bg-zinc-50 text-xs text-zinc-600 flex justify-between items-center">
        <span>Field Operations</span>
        <span class="text-amber-700 font-mono">10/25</span>
      </button>
    </aside>

    <!-- Main Workspace: Dense Data Table with inline inspector -->
    <main class="flex-1 p-6 overflow-y-auto">
      <div class="bg-white rounded-lg border border-zinc-200 shadow-xs overflow-hidden">
        <table class="w-full text-left text-xs border-collapse">
          <thead class="bg-zinc-50 border-b border-zinc-200 text-zinc-600 font-semibold sticky top-0">
            <tr>
              <th class="py-2.5 px-3 w-10 font-mono">No</th>
              <th class="py-2.5 px-3">Audit Item</th>
              <th class="py-2.5 px-3">Submitted Evidence</th>
              <th class="py-2.5 px-3 w-28">Status</th>
              <th class="py-2.5 px-3 w-24 text-right">Action</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-zinc-100 text-zinc-800">
            <tr>
              <td class="py-2.5 px-3 font-mono text-zinc-400">01</td>
              <td class="py-2.5 px-3 font-medium">Bylaw Resolution Filing</td>
              <td class="py-2.5 px-3 text-zinc-500">bylaw_resolution_2026.pdf (1.2 MB)</td>
              <td class="py-2.5 px-3">
                <span class="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-emerald-50 text-emerald-800 border border-emerald-200">
                  Verified
                </span>
              </td>
              <td class="py-2.5 px-3 text-right">
                <button class="text-zinc-900 hover:underline font-medium">Inspect</button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </main>
  </div>
</div>
```
