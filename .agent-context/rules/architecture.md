---
id_prefix: ARCH
domain: architecture
priority: critical
scope: all-tasks
applies_to: [backend, frontend, fullstack]
keywords: [architecture, arch, boundary, system]
---

# Architecture Boundary

## ARCH-001: Execution Rules
1. Rely on ESLint/Linters for structural enforcement.
2. Require README.md and docs/doc-index.md.
3. Run `npm run validate` to enforce architecture invariants.
4. Do not invent custom crypto, custom state management, or custom routing. Use standard libraries.
