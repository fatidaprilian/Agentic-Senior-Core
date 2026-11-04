# Craft: Motion & Micro-Interactions

Grounded in: W3C Motion Specifications, Google Material Motion, and Apple HIG Fluid Interfaces.

---

## 1. The Core Motion Philosophy: "One Authored Moment"

- **Choreography Over Chaos:**
  - Limit motion to **one authored focal moment** per view (e.g. an interactive slider responding smoothly, or a key metric settling into place).
  - Never scatter uncoordinated entrance animations across every section. Staggered fade-ins on 10 consecutive cards signal generic AI generation and slow down task execution.
- **Ease-Out from a Visible Default:**
  - Content should be visible and readable by default if scripts or animation fail to execute.
  - Motion must feel natural and physical: fast deceleration / exponential ease-out (`cubic-bezier(0.16, 1, 0.3, 1)`). Avoid linear or cartoonish bouncy transitions.

---

## 2. Technical Performance Floor

- **The Absolute Ban on `transition: all`:**
  - Never write `transition: all` or `transition-all` in production CSS/Tailwind.
  - `transition: all` forces the browser engine to recalculate geometry, repaints, and layout costs on every frame whenever any property shifts.
  - **The Law:** Target only specific, GPU-accelerated compositing properties:
    ```css
    /* Good */
    transition: transform 150ms cubic-bezier(0.16, 1, 0.3, 1), opacity 150ms ease-out;
    ```
    ```html
    <!-- Good Tailwind -->
    <button class="transition-colors duration-150 active:scale-[0.98]">
    ```
- **Never Animate Layout Properties:**
  - Never animate `width`, `height`, `top`, `left`, `margin`, or `padding`. Animate `transform: scale()` or `transform: translate3d()` instead.

---

## 3. Accessibility & Reduced Motion

- **Mandatory Reduced Motion Fallback:**
  - Every CSS animation and transition must respect the user's operating system preferences:
    ```css
    @media (prefers-reduced-motion: reduce) {
      *, ::before, ::after {
        animation-duration: 0.01ms !important;
        animation-iteration-count: 1 !important;
        transition-duration: 0.01ms !important;
        scroll-behavior: auto !important;
      }
    }
    ```
    ```html
    <!-- Tailwind -->
    <div class="transition-transform duration-200 motion-reduce:transition-none">
    ```

