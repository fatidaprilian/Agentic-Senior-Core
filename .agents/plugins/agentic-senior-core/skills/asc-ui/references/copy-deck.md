# Page Copy Deck & Data Assignment Protocol

Before writing JSX, TSX, HTML, Vue, Svelte, or Blade markup for any page or multi-section view, establish text purity and region ownership up front.

---

## 1. Lock One Page Language First

Declare one explicit page language (`id` or `en`) before drafting strings:

```
Page Language: <id | en>
```

Rules:
- Every visible heading, subtitle, button label, placeholder, table empty state, loading label, error message, and confirmation dialog MUST use the locked language.
- Never write bilingual mixed strings (e.g., `"Tambah New Item"`, `"Daftar Work Order"`, `"Failed memuat data"`).
- Never switch languages on secondary states (e.g., Indonesian main table with English `"Loading..."`, `"No data found"`, or `"Submit"`).
- Exempted tokens: short universal terms (`ID`, `Email`, `Status`, `Total`, `Unit`, `API`, `CSV`, `PDF`, `URL`) and exact column names explicitly requested in user prompt backticks (e.g., `` `Order ID` ``).

---

## 2. Author the Copy Deck Before Markup

Write a compact Copy Deck table listing every static UI string before writing component tags:

| Slot | Final Copy | Data Field |
| :--- | :--- | :--- |
| `PageHeader.title` | `Daftar Inspeksi Unit` | — |
| `PageHeader.subtitle` | `Pantau hasil pemeriksaan armada alat berat.` | — |
| `PrimaryCTA` | `Tambah Inspeksi` | — |
| `Summary.label` | `Total Skor Risiko` | `summary.totalRiskScore` |
| `EmptyState` | `Belum ada data inspeksi unit.` | — |
| `ErrorState` | `Gagal memuat daftar inspeksi. Muat ulang halaman.` | `retryAction` |

Constraints:
- Component code MUST only emit static strings declared in the Copy Deck.
- Never duplicate multi-word labels or descriptions across headers, banners, and empty cards.

---

## 3. Data Assignment Table (1 Field -> 1 Region)

Prevent data echoing and repeated summary stats by locking every computed or record field to a single DOM region:

| Data Field | Single Assigned Region | Prohibited Mirror |
| :--- | :--- | :--- |
| `summary.totalRiskScore` | Summary header strip only | Do not repeat inside table footer or detail drawer |
| `row.unitName` | Main table column only | Do not echo in subtitle or secondary side card |

Constraints:
- Keep exactly one `<h1>` per page (via `PageHeader` or top section title).
- Keep exactly one solid primary action button per viewport region (`bg-primary`). Move extra row or secondary triggers to quiet outline buttons or overflow menus.

---

## 4. Zero System Narration, Prompt Leakage & Developer Jargon

Prompts often specify internal formulas, backend mechanisms, or architecture instructions. Never copy those implementation details into end-user UI strings.

| Defect Class | Prohibited Example | Compliant End-User Replacement |
| :--- | :--- | :--- |
| Self-narrating chrome (`System-Centered Copy`) | `"Halaman ini menampilkan daftar inspeksi unit"`, `"Digunakan untuk mengelola data"`, `"This page lists work orders"` | Omit filler or state action directly: `"Daftar Inspeksi Unit"` |
| Prompt / formula leakage (`Instruction-to-UI Leakage`) | `"Perhitungan ini menggunakan perkalian bobot x faktor risiko 1.5 lalu dibulatkan ke atas"` | Show domain label and number only: `"Skor Risiko"` |
| Developer / runtime jargon (CWE-209) | `"NullReferenceException saat memuat"`, `"SQLSTATE[23000]"`, `"HTTP 500"`, `"req.body invalid"` | Actionable plain prose: `"Gagal memuat data inspeksi. Coba lagi."` |
