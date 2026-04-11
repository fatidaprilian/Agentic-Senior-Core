# Semantic Redundancy Scan (Phase 2) — 2026-04-11

## Scope

This scan targets semantic overlap (not exact hash duplicates) across markdown content in:
- repository root markdown files
- `docs/`
- `.agent-context/`
- instruction entry files (`AGENTS.md`, `.instructions.md`, `.github/copilot-instructions.md`, `.gemini/instructions.md`)

Method:
- n-gram similarity and lexical overlap scoring
- filtered for high-overlap pairs and governance hotspots

## Top Redundancy Hotspots

### Instruction Layer Duplication (High)

Very high overlap cluster:
- `.github/copilot-instructions.md` ↔ `AGENTS.md` (0.787)
- `.gemini/instructions.md` ↔ `.github/copilot-instructions.md` (0.804)
- `.instructions.md` ↔ `AGENTS.md` (0.680)

Interpretation:
- Governance directives are repeated across multiple instruction entry points.
- Current structure increases maintenance overhead and drift risk.

Recommendation:
- Keep one canonical instruction source and reduce other files to thin adapters/references.
- Move duplicated policy text into `.agent-context/rules/` and reference it.

### Compiled Rule Duplication (Expected)

Expected and intentional:
- `.cursorrules` ↔ `.windsurfrules` (1.000)

Interpretation:
- Compiled output is intentionally mirrored for tool compatibility.
- Not a cleanup target.

### Docs Overlap (Medium)

Notable medium overlap pairs:
- `docs/roadmap.md` ↔ `README.md` (0.582)
- `CHANGELOG.md` ↔ `docs/roadmap.md` (0.572)
- `docs/deep-dive.md` ↔ `docs/roadmap.md` (0.539)
- `docs/analysis-priority-matrix.md` ↔ `docs/roadmap.md` (0.528)

Interpretation:
- Strategic narrative is spread across README, roadmap, deep-dive, and matrix docs.
- Information is useful, but some paragraphs are near-duplicated.

Recommendation:
- Keep `README.md` as concise index and quickstart.
- Keep `docs/roadmap.md` as single source of milestone truth.
- Keep `docs/analysis-priority-matrix.md` focused on prioritization rationale only.

### Rules, Skills, and Checklists Overlap (Medium)

Notable medium overlap pairs:
- `.agent-context/rules/security.md` ↔ `.agent-context/review-checklists/security-audit.md` (0.500)
- `.agent-context/rules/architecture.md` ↔ `.agent-context/skills/backend/architecture.md` (0.497)
- `.agent-context/rules/microservices.md` ↔ `.agent-context/skills/backend/architecture.md` (0.510)

Interpretation:
- Some duplication is intentional (rule + applied skill + audit checklist).
- Boundaries are mostly correct but should stay explicit to avoid drift.

Recommendation:
- Rules: normative constraints.
- Skills: applied examples and decision guidance.
- Checklists: verifiable gate criteria.
- Avoid copy-pasting full rule paragraphs into skill files.

## Action Plan (Practical)

1. Consolidate instruction entry files into reference model:
   - Canonical policy in one source.
   - Tool-specific files become short adapters.
2. Trim README and roadmap overlap:
   - README links to roadmap sections rather than repeating long milestone text.
3. Add drift checks for instruction adapters:
   - Detect if adapter files include duplicated policy blocks beyond threshold.
4. Keep compiled dual-rule files unchanged:
   - required for tool compatibility.

## Result

- Redundancy risk is highest in instruction-layer documents.
- Operational docs have moderate overlap and are manageable with source-of-truth discipline.
- Domain content (rules vs skills vs checklists) is mostly healthy with acceptable intentional overlap.
