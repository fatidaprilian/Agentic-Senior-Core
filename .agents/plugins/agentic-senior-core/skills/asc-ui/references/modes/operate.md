# Surface Mode: Operate (Productivity & Task Execution)

Use for: Dashboards, data grids, admin consoles, editors, settings, financial ledgers, logistics tools, and developer tools.

> **Core Principle:** The visitor completes a task. Scanability, dense data alignment, low cognitive friction, and native expectations outrank emotional expression. Brand identity lives in the precision of micro-details, not loud decorative containers.

---

## 1. Information Density & Layout Geometry

- **Two-Pane Master-Detail Canvas:**
  - Fixed-width contextual left rail (240px–280px) for navigation or entity selection.
  - Fluid, high-density right canvas for inspection, editing, and execution.
  - Breadcrumb trails with root-to-leaf path (`Projects / Acme / Billing`).
- **Dense Data Matrix (Tables):**
  - Table headers must be `sticky top-0` with opaque background and hairline bottom border.
  - Compact vertical padding: `py-2` to `py-2.5` (row height 36px–40px).
  - Hover feedback: `hover:bg-muted/40` across the entire row.
  - Text alignment rule: Left-align text strings, right-align numeric figures and monetary amounts, center status chips and icon actions.
  - Numeric values must use `tabular-nums` for vertical column alignment.
- **Progressive Disclosure alih-alih Modal Popups:**
  - Avoid popping modals for inline edits or sub-entity creation. Use expandable rows, sliding side sheets (drawers), or inline input switches.
  - Reserve dialogs strictly for destructive confirmations (delete, revoke) or complex isolated workflows (import wizard).

---

## 2. Interactive Controls & Action Semantics

- **Button Heights & Hierarchy:**
  - Primary button: `h-8` or `h-9` (32px–36px), solid semantic token (`bg-primary text-primary-foreground`).
  - Secondary button: `h-8` or `h-9`, outline or ghost (`border border-input bg-background hover:bg-muted`).
  - Icon-only buttons: Strict 1:1 aspect ratio (`h-8 w-8`), padded to meet the 44x44px touch target on touch devices.
- **Keyboard Affordances:**
  - Display keyboard shortcuts next to menu items and tooltips (`⌘K`, `Esc`, `↵`).
  - Full keyboard tabbing through tables and forms without trapped focus.
- **Inline Filter Bars:**
  - Place search inputs, filter dropdowns, and date range pickers in a cohesive horizontal toolbar directly above data grids.
  - Show active filter count chips with single-click dismissal (`Active (3) [×]`).

---

## 3. Status Badges & Telemetry

- **Semantic Indicator Pattern:**
  - Always pair a color with a text label or icon (never rely on color alone).
  - Use subtle tinted badge backgrounds with high-contrast text:
    - Success: `bg-emerald-500/10 text-emerald-700 dark:text-emerald-400`
    - Warning: `bg-amber-500/10 text-amber-700 dark:text-amber-400`
    - Danger: `bg-rose-500/10 text-rose-700 dark:text-rose-400`
    - Neutral/Inactive: `bg-muted text-muted-foreground`
- **Zero Decorative Halos:**
  - Never wrap status dots or cards in glowing radial blurs (`shadow-[0_0_12px_#10b981]`). Keep indicators solid and functional.

---

## 4. Audit & Inspection Finding Rows (Action Affordance Invariant)

- **Interactive Row Contract:**
  - Finding rows, audit line items, and checklist items must never be rendered as dead, static text blocks.
  - Every finding row (e.g. `FT-01: Bukti fisik belum dilampirkan`) must provide:
    1. **Primary Action Affordance:** Explicit inline trigger button (e.g. `Periksa Bukti`, `Minta Rincian`, or expandable chevron).
    2. **Attachment Badge:** File type badge (`PDF`, `XLSX`), byte size, and upload timestamp.
    3. **Status Pill:** High-contrast semantic pill (`Perlu Tindak Lanjut`, `Menunggu Konfirmasi`, `Selesai`).
    4. **Hover State:** `hover:bg-muted/40 transition-colors` across the entire row bounding box.

---

## 5. Dual-Navigation De-Confliction (Lenses vs Lifecycle)

- **Separation of Mental Models:**
  - **Horizontal Tabs**: View-Port Filter Lenses (switching data views, e.g. *Ringkasan*, *Rubrik Domain*, *Temuan*, *Riwayat*). These change what information is rendered on the stage.
  - **Vertical Rail**: Immutable Lifecycle Progression (e.g. *1. Unggah Dokumen $\to$ 2. Verifikasi $\to$ 3. Penilaian $\to$ 4. Konfirmasi Fisik $\to$ 5. Rangkuman*). This reflects where the entity is in its operational state.
- **Accenting Active Lifecycle Step:**
  - Never let the current active step in the lifecycle rail look identical to future unstarted steps.
  - Active step: highlighted with high-contrast accent ring or filled circle (`bg-primary text-primary-foreground`) with an active descriptor ("Tahap aktif verifikasi").
  - Completed steps: clear muted checks (`text-emerald-600` with subtle strike or timestamp).
  - Pending steps: muted borders (`border-border text-muted-foreground`).


