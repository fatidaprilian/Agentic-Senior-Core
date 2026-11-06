# Accessibility Engineering & WCAG 2.2 Compliance

Accessibility is not an afterthought or an optional overlay. It is the structural floor of web engineering. Every component must be perceivable, operable, understandable, and robust.

---

## 1. Contrast Ratios & WCAG Compliance

All text and critical visual indicators must meet WCAG 2.2 Level AA mathematical contrast floors.

### 1.1 Contrast Floors
- **Normal Body Text (< 18pt / 24px regular, < 14pt bold):** Minimum `4.5:1` contrast ratio against its background.
- **Large Text ($\ge$ 18pt / 24px regular, $\ge$ 14pt bold):** Minimum `3:1` contrast ratio.
- **UI Components & Graphical Boundaries:** Active input borders, toggle switches, and focus indicators require minimum `3:1` against adjacent background colors.

### 1.2 Avoiding Low-Contrast Surfaces
A frequent aesthetic failure is using low-contrast grey text for "subtle elegance":
- **Failing example:** `text-zinc-500` (`#71717a`) on `bg-zinc-900` (`#18181b`) = **3.8:1** (Fails 4.5:1 AA for body copy).
- **Compliant fix:** `text-zinc-400` (`#a1a1aa`) on `bg-zinc-900` = **6.2:1** (Passes AA).
- **Light mode equivalent:** `text-zinc-400` (`#a1a1aa`) on `bg-white` = **2.6:1** (Fails). Must use `text-zinc-600` (`#52525b`, 5.7:1) or darker for readable secondary copy.

---

## 2. Focus Management & Keyboard Operability

Every capability available via pointer must be fully operable via keyboard alone.

### 2.1 The Focus-Visible Rule
Never remove browser focus indicators without providing an immediate high-contrast replacement:

```html
<!-- BANNED: Strips focus visibility entirely -->
<button class="outline-none">Action</button>

<!-- ENFORCED: High-contrast focus ring on keyboard interaction -->
<button class="focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background">
  Action
</button>
```

### 2.2 Dialog Focus Traps & Escape Key Contract
Any modal, drawer, or sheet must obey the modal contract:
1. **Focus Trap:** When opened, focus moves to the first focusable element inside the modal. Keyboard `Tab` cycles strictly inside the dialog.
2. **Escape Key Dismissal:** Pressing `Escape` must immediately close the dialog.
3. **Return Focus:** Upon closing, focus must return to the element that triggered the dialog open event.
4. **ARIA Metadata:** Outer container must declare `role="dialog"`, `aria-modal="true"`, and `aria-labelledby="dialog-title-id"`.

---

## 3. Accessible Form Controls

Forms must convey intent, association, and error states programmatically.

```html
<div class="space-y-1.5">
  <label for="user-email" class="text-sm font-medium text-foreground">
    Work email
  </label>
  <input
    id="user-email"
    name="email"
    type="email"
    aria-invalid="true"
    aria-describedby="email-error-msg"
    class="w-full px-3 py-2 rounded-md border border-destructive bg-background text-foreground focus-visible:ring-2 focus-visible:ring-destructive"
  />
  <p id="email-error-msg" class="text-xs text-destructive flex items-center gap-1" role="alert">
    <svg class="w-3.5 h-3.5" aria-hidden="true">...</svg>
    <span>Enter a valid corporate email address (e.g. name@company.com).</span>
  </p>
</div>
```

- Every `<input>` must be explicitly linked via `for` and `id` to a `<label>`. Do not rely solely on `placeholder`.
- Errors must use `role="alert"` and link via `aria-describedby`.
- When invalid, set `aria-invalid="true"`.

---

## 4. Icon & Image Semantics

1. **Decorative Icons:**
   All decorative SVG icons alongside visible text must be hidden from screen readers:
   ```html
   <button>
     <svg aria-hidden="true" class="w-4 h-4">...</svg>
     <span>Download receipt</span>
   </button>
   ```

2. **Standalone Icon Buttons:**
   Buttons containing only an icon must supply an accessible name via `aria-label`:
   ```html
   <button type="button" aria-label="Delete document" class="p-2">
     <svg aria-hidden="true" class="w-4 h-4">...</svg>
   </button>
   ```

3. **Images:**
   - Informative graphics, charts, and photos: descriptive `alt="Graph showing 42% revenue increase in Q3"`.
   - Purely aesthetic background patterns or decorative dividers: empty `alt=""` so screen readers ignore them.

