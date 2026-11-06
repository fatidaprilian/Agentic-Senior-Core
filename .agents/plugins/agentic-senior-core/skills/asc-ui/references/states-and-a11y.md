# Data States, Mutation Feedback & Accessibility Floor

Every interactive interface must enforce deterministic state coverage and WCAG 2.2 AA accessibility invariants before handoff.

---

## 1. The 4-State Data Contract

Every asynchronous view, table, or list must explicitly handle all four states:

1. **Loading State:** Render layout-preserving skeletons matching actual row/column heights (`animate-pulse bg-muted`). Avoid full-screen blocking spinners on incremental refetches.
2. **Empty State:** State factually what is absent and provide one direct primary action when applicable (for example: *"No API keys created." -> `[Create API Key]`). Never write poetic or motivational empty-state essays.
3. **Error State:** Display a safe, specific failure reason (`role="alert"`) paired with an immediate `[Retry]` button that re-triggers the failed query without losing form inputs.
4. **Populated State:** Handle text overflow (`truncate` or `line-clamp-2` with accessible full value), missing optional fields (`—`), and pagination/virtualization when rows exceed 100 items.

---

## 2. Mutation & Form Safety

1. **Immediate Pending Lock:** Disable submit/destructive buttons (`disabled={isPending}` + `aria-busy="true"`) on click to prevent duplicate submissions.
2. **Preserve User Input on Failure:** Never clear form fields when a server request fails. Surface field-level validation errors adjacent to each input via `aria-describedby` and `aria-invalid="true"`.
3. **Explicit Outcome Notification:** Confirm non-obvious background mutations via a concise status banner or toast; never swallow caught errors silently.
4. **Destructive Confirmations Only:** Reserve modal dialogs strictly for irreversible destructive actions (delete, revoke) or isolated multi-step imports. Use inline forms or drawers for routine edits.

---

## 3. WCAG 2.2 AA & Keyboard Operability

1. **Contrast Ratios:**
   - Normal text (`< 18pt` / `< 14pt bold`): minimum **4.5:1** against its background.
   - Large text, icons, and input boundaries: minimum **3:1**.
2. **Visible Focus Ring:** Never apply `outline-none` or `focus:outline-none` without pairing `focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2`.
3. **Semantic Landmarks & Controls:**
   - Use `<button type="button">` for actions and `<a href="...">` for navigation. Never attach `onClick` to non-interactive `<div>` or `<span>`.
   - Pair every `<input>`, `<select>`, and `<textarea>` with an explicit `<label htmlFor="...">` or `aria-label`.
   - Icon-only buttons require `aria-label` describing the action (`aria-label="Close panel"`), with inner SVG marked `aria-hidden="true"`.
4. **Reduced Motion:** Wrap non-essential CSS transitions and keyframe animations in `@media (prefers-reduced-motion: reduce)` fallbacks (`transition: none; animation: none;`).

