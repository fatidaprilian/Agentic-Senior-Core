# Surface Mode: Read (Documentation, Knowledge & Articles)

Use for: Documentation, API references, technical blogs, guides, knowledge bases, and changelogs.

> **Core Principle:** The visitor understands something. Structure for sustained comprehension, visual calm, and rapid scanning. The reading experience must minimize eye fatigue while providing effortless navigation through dense hierarchies.

---

## 1. Ergonomic Reading Measure & Spacing

- **Optimal Line Measure:**
  - Cap prose line length strictly at **65–75 characters per line** (`max-w-prose` / ~680px). Unbounded line lengths cause cognitive fatigue and line-tracking errors.
  - Generous body line height: `leading-relaxed` (1.625) to `leading-loose` (1.75).
  - Body font size: 16px minimum (`text-base`). Never drop body prose below 16px on desktop.
- **Asymmetric Vertical Rhythm:**
  - Headings must have noticeably more breathing room above than below:
    - `H2`: `mt-10` to `mt-12`, `mb-3` to `mb-4`.
    - `H3`: `mt-6` to `mt-8`, `mb-2`.
  - This anchors the heading visually to the paragraph it introduces, preventing it from floating ambiguously between sections.

---

## 2. Navigation & Wayfinding

- **Dual-Rail Navigation:**
  - *Left Sidebar:* Hierarchical navigation tree (collapsible categories, active section indicator with bold text and subtle left border or background pill).
  - *Right Rail:* Table of contents ("On this page") highlighting current scroll position via `IntersectionObserver`.
  - Top breadcrumb path for orientation: `Docs / Authentication / OAuth2 Providers`.
- **In-Content Anchor Links:**
  - Headings must carry permalink anchor buttons (`#`) visible on hover, allowing users to copy direct section URLs.

---

## 3. Code Blocks & Callout Discipline

- **Code Block Engineering:**
  - Wrap code blocks in dedicated horizontal scroll containers (`overflow-x-auto`) to prevent viewport blowout.
  - Provide a one-click "Copy Code" button with visual feedback (`Copied!`).
  - Monospace font paired with consistent syntax highlighting; never use hardcoded inline style colors.
- **Callout Hierarchy:**
  - Use GitHub-style or standard alert cards (`[!NOTE]`, `[!TIP]`, `[!WARNING]`, `[!IMPORTANT]`) with subtle background tints and 1px borders.
  - Never nest callouts inside callouts or place 3 consecutive callout boxes in a row.

