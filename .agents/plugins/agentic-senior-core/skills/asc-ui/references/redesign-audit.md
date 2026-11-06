# Structured UI Audit & Redesign Protocols

Modifying an existing interface requires clear intent. Audits must provide actionable engineering findings rather than subjective aesthetic commentary.

---

## 1. Scope Classification: The 3 Redesign Depths

Never split the difference into cosmetic polish on a discarded look. Before touching code, explicitly classify the depth of work:

| Depth | Scope & Intent | What Stays Intact | What Changes |
|---|---|---|---|
| **`polish`** | Resolve bugs, contrast, microcopy, states. | Layout structure, DOM hierarchy, and design system tokens. | Padding rhythm, WCAG AA contrast, missing state quad (empty/error/loading), focus rings, microcopy brevity, lint fixes. |
| **`restyle`** | Upgrade design system without breaking layout. | Layout grid, component hierarchy, and DOM structure. | Color palette (60-30-10), typographic scale, corner radiuses, elevation shadows, button and input styles. |
| **`full`** | Total visual and structural overhaul. | Factual content, data bindings (`$variables`, loops), routes, form handlers. | **Spatial geometry, grid ratios, surface posture, and typography.** Treated as fresh build from subject truth. |

---

## 2. The Decoupled Redesign Protocol (For Full Redesigns)

When executing a **Full Redesign** on an existing template or page (`.blade.php`, `.tsx`, `.vue`, `.html`), editing in-place is forbidden because the AI's attention mechanism will anchor to the old DOM structure. Execute this 4-step decoupled sequence:

1. **Step 1: Extract Data Contracts & Factual Inventory**
   - Parse the incumbent file and extract all dynamic variables, loops, route helpers, form submission endpoints, and real text/assets into a clean data list.
   - Separate product truth (names, prices, verified claims) from discarded markup.
2. **Step 2: Isolate / Discard Old Markup**
   - Treat the old layout as an anti-reference. Do not perform incremental class swapping on it.
3. **Step 3: Author Isolated Prototype / Structural Layout**
   - When building a complex new surface, draft the isolated DOM layout first using 1 of the 4 Structural Postures (`references/modes/persuade.md` or `operate.md`).
   - Use design tokens and realistic sample data.
   - Verify typographic scale ($Display \ge 3.5\times Body$) and full-field spatial grounding before production injection.
4. **Step 4: Re-inject Data Contracts into Production**
   - Transfer the proven clean geometry into the project file (`welcome.blade.php`, `Page.tsx`).
   - Re-bind the dynamic data loops, Blade/React variables, and event handlers.
   - Confirm project test suite and linters pass cleanly.

---

## 3. Structured Audit Matrix

When auditing an existing interface or PR, generate a structured findings table categorized by severity:

| Severity | Definition | Examples |
|---|---|---|
| `CRITICAL` | Breaks usability, violates WCAG AA contrast floors, or clips content horizontally. | 2.5:1 text contrast, missing `:focus-visible`, button overflow on mobile, form submission with no pending state. |
| `MAJOR` | Degrades scannability, lacks essential states, or violates design token consistency. | Missing empty or error states, hardcoded hex colors, generic modal instead of inline drawer, layout shift during load. |
| `MINOR` | Polish deficiency, verbose marketing copy, or suboptimal rhythm. | Verbose button label ("Click here to save"), slight margin imbalance, decorative character banners in code. |

### Audit Output Template
```markdown
### UI Audit Findings

| Severity | Location / Element | Finding | Root Cause | Concrete Remediation |
|---|---|---|---|---|
| CRITICAL | `BillingTable.tsx:42` | Primary CTA lacks focus ring | `outline-none` stripped default ring | Add `focus-visible:ring-2 focus-visible:ring-primary` |
| MAJOR | `ProjectList.tsx:110` | Empty state shows 4-paragraph essay | Marketing copy inserted into app view | Replace with 1-sentence description + "Create project" CTA |
| MINOR | `UserProfile.tsx:18` | Button fixed width `w-[120px]` | Rigid dimension causes German overflow | Change to `px-4 min-w-[5rem]` |
```

---

## 4. Systematic Audit Checklist

Audit screens systematically against four engineering vectors:

### 4.1 Ergonomics & Responsiveness
- [ ] Render at `375px` width (mobile viewport) and `1280px` (desktop viewport).
- [ ] Verify zero horizontal scrollbars on mobile (`overflow-x: clip`).
- [ ] Confirm all touch targets meet minimum $44 \times 44\text{px}$ bounding box.
- [ ] Verify mobile layout uses `dvh` instead of `vh` to prevent browser chrome clipping.

### 4.2 Accessibility & Contrast (WCAG 2.2 AA)
- [ ] Check normal text against backgrounds ($\ge 4.5:1$).
- [ ] Check input borders, active toggles, and large headings ($\ge 3:1$).
- [ ] Cycle through entire screen using `Tab` and `Shift+Tab` with mouse disconnected.
- [ ] Press `Escape` while dialog/modal is open; verify closure and focus restoration.

### 4.3 State Coverage
- [ ] Inspect loading state: does it use proportional skeletons matching final dimensions?
- [ ] Inspect empty state: is it actionable with a 1-sentence explanation?
- [ ] Inspect error state: does it diagnose the issue and provide an inline retry button?
- [ ] Inspect mutation triggers: do buttons lock and display spinners during network latency?

### 4.4 Microcopy & Token Hygiene
- [ ] Run 50% word reduction sweep across headings and explanatory paragraphs.
- [ ] Confirm all buttons follow `Verb + Noun` grammar.
- [ ] Verify zero banned buzzwords (*seamless*, *empower*, *robust*).
- [ ] Verify zero hardcoded hex codes (`#...`) or arbitrary pixel values in style markup.

