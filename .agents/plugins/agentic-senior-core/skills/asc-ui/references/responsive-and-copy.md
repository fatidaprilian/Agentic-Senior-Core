# Token Reuse, Responsive Containment & Microcopy Hygiene

---

## 1. Brownfield Token & Component Reuse

1. **Inspect Existing Primitives First:** Before creating any markup or CSS, inspect `components/ui/`, `components/`, `app.css` / `globals.css`, and `tailwind.config.*`.
2. **Never Override Workspace Tokens:** When a repository already defines brand variables (`--primary`, `--background`, `--border`, `--radius`) or installed component primitives (Radix, Shadcn, Headless UI, Blade components), compose directly from them. Never introduce raw hex values (`#6366f1`) or competing neutral gray scales (do not mix `slate` with `stone` or `zinc` on the same surface).
3. **External Design Sources:** When Figma frames, design specs, or pre-built component blocks exist, translate those exact token and spacing contracts rather than inventing decorative CSS from scratch.

---

## 2. Responsive Layout & GPU Motion

1. **Dynamic Viewport Height:** Use `min-h-dvh` (`100dvh`) for full-height shells—never `h-screen` or `100vh`, which clip behind mobile browser toolbars.
2. **Horizontal Overflow Containment:** Apply `overflow-x: clip` on the root layout shell. Wrap wide data tables in `<div class="overflow-x-auto">` so tables scroll internally without breaking mobile page width.
3. **Touch Hit Targets:** Interactive controls on mobile/touch viewports must provide at least a **44x44px** hit area (`min-h-11 min-w-11` or equivalent padding) with $\ge$ 8px gap between adjacent actions.
4. **Expansion Buffer (+30% Text Length):** Never hardcode fixed pixel widths on text buttons (`w-[120px]`). Use `px-4 py-2` with `min-w-*` so localized strings (such as Indonesian or German) expand without clipping.
5. **GPU-Only Transitions:** Never use `transition-all`. Specify exact properties (`transition-colors`, `transition-opacity`, `transition-transform`) and never animate layout geometry (`width`, `height`, `top`, `left`, `margin`).

---

## 3. Microcopy & Single-Language Purity

1. **50% Word Reduction:** Cut ornamental filler. Write direct operational labels:
   - Button labels use `Verb + Object`: `Save Changes`, `Export CSV`, `Revoke Key` (avoid vague `Submit` or `Click Here`).
   - Omit small-caps kicker tags (`text-[11px] uppercase tracking-wider`) above headings; let headings stand on their own.
2. **Strict Single-Language Surface:** Keep every visible string on a page—headings, table headers, placeholders, empty states, validation messages, and buttons—in one language.
   - Never mix English and Indonesian (`meng-generate`, `di-submit`).
   - In Indonesian interfaces, use natural idiomatic terms established in the codebase (*panel samping*, *garis pemisah*, *jendela dialog*, *unggah berkas*) rather than awkward literal calques (*laci sembul*, *garis rambut*, *jendela sembul*).
3. **Zero Fabricated Content:** Never invent customer quotes, partner company names, fake user counts (`10,000+ teams`), or unbacked telemetry metrics. Omit absent marketing proof entirely.

