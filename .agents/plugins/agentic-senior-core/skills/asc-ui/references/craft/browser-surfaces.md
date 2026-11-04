# Craft: Themed Browser Surfaces

Grounded in: Impeccable Browser Surfaces Standard and Web Platform Craft.

> **Why This Matters:** The parts of the viewport you did not author still carry the design. Text selection, input carets, custom scrollbars, and focus rings all ship with unstyled browser defaults that belong to no design system. Theming these surfaces from the project palette is the clearest signal of intentional human craft.

---

## 1. Text Selection Highlight

- **Theme the Selection:**
  - Standard browser selection (harsh electric blue) frequently clashes with custom brand palettes.
  - Apply semantic selection tokens matching the brand accent:
    ```css
    ::selection {
      background-color: var(--primary);
      color: var(--primary-foreground);
    }
    ```
    ```html
    <!-- Tailwind root or body -->
    <body class="selection:bg-primary selection:text-primary-foreground">
    ```

---

## 2. Form Carets & Native Focus

- **Input Caret Color:**
  - Style the text cursor to match the primary brand token:
    ```css
    input, textarea {
      caret-color: var(--primary);
    }
    ```
- **Consistent Focus Visible:**
  - Never let the browser default blue outline show on interactive elements:
    ```css
    :focus-visible {
      outline: 2px solid var(--ring);
      outline-offset: 2px;
    }
    ```

---

## 3. Custom Scrollbar Theming

- **Subtle Scrollbars for Overflow Containers:**
  - Default browser scrollbars on Windows/Linux are bulky and intrusive.
  - Style internal scroll containers (`overflow-y-auto`, `overflow-x-auto`) with sleek, low-contrast scrollbars:
    ```css
    .custom-scrollbar {
      scrollbar-width: thin;
      scrollbar-color: var(--border) transparent;
    }
    .custom-scrollbar::-webkit-scrollbar {
      width: 6px;
      height: 6px;
    }
    .custom-scrollbar::-webkit-scrollbar-thumb {
      background-color: var(--border);
      border-radius: 9999px;
    }
    .custom-scrollbar::-webkit-scrollbar-track {
      background: transparent;
    }
    ```

