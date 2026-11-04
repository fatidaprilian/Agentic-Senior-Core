# Structured UI Audit & Redesign Protocols

Modifying an existing interface requires clear intent. Audits must provide actionable engineering findings rather than subjective aesthetic commentary.

---

## 1. Refinement vs. Redesign Semantics

Before touching code, explicitly classify the scope of work:

| Mode | Objective | What Stays Intact | What Changes |
|---|---|---|---|
| **Refinement** | Polish craft, fix accessibility, eliminate slop, align spacing. | Layout structure, component APIs, color tokens, DOM tree, established brand identity. | Padding rhythm, contrast ratios, missing hover/focus rings, microcopy concision, state quad completeness. |
| **Redesign** | Overhaul visual hierarchy, modernize surface mode, eliminate fundamental architectural flaws. | Functional data bindings, event handlers, business rules, routing. | Visual posture, typography system, component composition, spatial elevation, color distribution. |

> [!WARNING]
> Never perform an unprompted redesign when asked to "fix", "clean up", or "refine" a component. Respect existing design tokens and architectural patterns unless the user explicitly mandates a redesign.

---

## 2. Structured Audit Matrix

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

## 3. Systematic Audit Checklist

Audit screens systematically against four engineering vectors:

### 3.1 Ergonomics & Responsiveness
- [ ] Render at `375px` width (mobile viewport) and `1280px` (desktop viewport).
- [ ] Verify zero horizontal scrollbars on mobile (`overflow-x: clip`).
- [ ] Confirm all touch targets meet minimum $44 \times 44\text{px}$ bounding box.
- [ ] Verify mobile layout uses `dvh` instead of `vh` to prevent browser chrome clipping.

### 3.2 Accessibility & Contrast (WCAG 2.2 AA)
- [ ] Check normal text against backgrounds ($\ge 4.5:1$).
- [ ] Check input borders, active toggles, and large headings ($\ge 3:1$).
- [ ] Cycle through entire screen using `Tab` and `Shift+Tab` with mouse disconnected.
- [ ] Press `Escape` while dialog/modal is open; verify closure and focus restoration.

### 3.3 State Quad Coverage
- [ ] Inspect loading state: does it use proportional skeletons matching final dimensions?
- [ ] Inspect empty state: is it actionable with a 1-sentence explanation?
- [ ] Inspect error state: does it diagnose the issue and provide an inline retry button?
- [ ] Inspect mutation triggers: do buttons lock and display spinners during network latency?

### 3.4 Microcopy & Token Hygiene
- [ ] Run 50% word reduction sweep across headings and explanatory paragraphs.
- [ ] Confirm all buttons follow `Verb + Noun` grammar.
- [ ] Verify zero banned buzzwords (*seamless*, *empower*, *robust*).
- [ ] Verify zero hardcoded hex codes (`#...`) or arbitrary pixel values in style markup.

