# Mobile Ergonomics & Responsive Reflow

Mobile interfaces are governed by physical human constraints: thumb reach, screen boundaries, variable virtual keyboards, and shifting viewport chrome.

---

## 1. Viewport Units: The Dynamic Viewport Rule

Mobile browsers dynamically hide and reveal top address bars and bottom navigation chrome during scrolling.

- **Banned:** `height: 100vh` or `h-screen`. Causes bottom controls to hide under the browser navigation bar on iOS Safari and Android Chrome.
- **Enforced:** `min-height: 100dvh` (dynamic viewport height) or modern fallback cascade:

```css
.full-screen-container {
  min-height: 100vh;   /* Fallback for legacy webviews */
  min-height: 100dvh;  /* Dynamic viewport for modern browsers */
}
```

In Tailwind CSS: `min-h-dvh` or `h-dvh`.

---

## 2. Touch Target Geometry: 44px Floor & 8px Clearance

Every interactive element on a touchscreen must provide a physical target large enough for human fingertip variance without accidental trigger of adjacent controls (WCAG 2.5.5 / 2.5.8).

- **Minimum bounding box:** 44 × 44 physical pixels (or CSS pixels at standard DPI).
- **Minimum clearance:** $\ge 8\text{px}$ between adjacent interactive tap targets.

### Visual Size vs. Hit Target
If an icon or button must visually appear smaller than 44px (e.g. a 20px close `×` button), expand the tap target via pseudo-elements or padding:

```html
<!-- Visual size 20px, hit target 44px -->
<button 
  type="button" 
  class="relative p-3 -m-3 inline-flex items-center justify-center text-muted-foreground hover:text-foreground"
  aria-label="Close dialog"
>
  <svg class="w-5 h-5" aria-hidden="true">...</svg>
</button>
```

---

## 3. Zero Horizontal Scroll Leaks

Unintended horizontal scrolling destroys mobile ergonomics.

1. **Root Containment:**
   Set `overflow-x: clip` on the outermost app shell or `body`. Prefer `clip` over `hidden` because `clip` prevents horizontal spill without breaking `position: sticky`.

2. **Contain Preformatted and Table Content:**
   Never let wide tables or code blocks stretch the page width:
   ```html
   <!-- Code block isolation -->
   <div class="w-full max-w-full overflow-x-auto rounded-md border border-border">
     <pre class="p-4 text-xs"><code>...</code></pre>
   </div>

   <!-- Table container isolation -->
   <div class="w-full max-w-full overflow-x-auto">
     <table class="w-full min-w-[600px] text-left">...</table>
   </div>
   ```

3. **Break Long Strings:**
   Apply `break-words` or `overflow-wrap: anywhere` on user-generated content, URLs, commit hashes, and file paths.

---

## 4. Mobile Reflow Strategies

Desktop density cannot be shrunk linearly to fit mobile screens; it must be refactored into mobile-native structures.

### 4.1 Dense Table to Stacked Card Reflow
On screens `< 640px` (`sm:` breakpoint), convert dense multi-column tabular rows into stacked card summaries:

```html
<!-- Responsive Table Reflow -->
<div class="block sm:hidden space-y-3">
  <!-- Mobile Card Representation -->
  <div class="p-4 rounded-lg border border-border bg-card">
    <div class="flex items-center justify-between font-medium">
      <span>INV-2048</span>
      <span class="text-xs px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-500">Paid</span>
    </div>
    <div class="mt-2 text-sm text-muted-foreground flex justify-between">
      <span>Acme Corp</span>
      <span class="font-mono tabular-nums text-foreground">$1,200.00</span>
    </div>
  </div>
</div>

<div class="hidden sm:block overflow-x-auto">
  <table class="w-full">
    <!-- Desktop Table Representation -->
  </table>
</div>
```

### 4.2 The Thumb Zone & Sticky Action Bars
Position high-frequency primary actions within natural one-handed thumb sweep:
- Place primary conversion buttons or form submission bars at the bottom of the viewport on mobile:
```html
<div class="sm:static fixed bottom-0 inset-x-0 p-4 bg-background/80 backdrop-blur-md border-t border-border z-20">
  <button class="w-full py-3 bg-primary text-primary-foreground font-medium rounded-lg">
    Confirm order ($48.00)
  </button>
</div>
```
- Account for iOS bottom home indicator safe area using `pb-[env(safe-area-inset-bottom,1rem)]`.

