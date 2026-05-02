# Deep Dive: Dynamic Rules Engine (Governance Engine)

Agentic-Senior-Core operates as a **Dynamic Rules Engine (Governance Engine)** that merges generalized best practices with project-specific structural definitions into files agents naturally read.

The canonical source is `.instructions.md`. Init and upgrade generate `.agent-instructions.md` as the compiled project rulebook. Tool-specific entrypoints such as `AGENTS.md`, `CLAUDE.md`, `GEMINI.md`, Cursor rules, Windsurf rules, Copilot instructions, and Gemini instructions stay thin.

## The Compiler Workflow
When you run the init command through `npm exec --package=github:fatidaprilian/Agentic-Senior-Core agentic-senior-core init` or `npx @ryuenn3123/agentic-senior-core init` after npm publish, the delivery CLI:
1. **Scans** your working directory heuristically out-of-the-box (looking for `package.json`, `pom.xml`, etc.).
2. **Prompts** you to confirm the Stack and Blueprint only when repository evidence is weak.
3. **Compiles** modular knowledge components into `.agent-instructions.md`.
4. **Writes** thin discovery adapters for supported tools and legacy root compatibility.

### Distribution Modes
- **Pre-publish mode**: use GitHub source execution (`npm exec --package=github:...`).
- **Post-publish mode**: use `npx @ryuenn3123/agentic-senior-core init` as the shortest path.
- **Engine parity**: all modes run the same CLI entrypoint (`bin/agentic-senior-core.js`) and produce the same output files.

### Upgrade Assistant (V1.6)
- The CLI now includes `upgrade` mode for existing repositories.
- `agentic-senior-core upgrade --dry-run` previews migration impact without writing files.
- Apply mode rewrites `.agent-instructions.md`, refreshes thin adapters, refreshes policy thresholds, and records onboarding telemetry with `operationMode: upgrade`.
- Upgrade previews include line-count delta and selected stack/blueprint/CI state before write.

### Component Breakdown
- **Universals (`.agent-context/rules/`)**: Non-negotiable laws. No floating `any` types, strict variable naming, event-driven designs.
- **Stack strategies (dynamic)**: Language and runtime guidance resolved from project evidence, repository context, and lightweight keyword hints.
- **Structural planning signals (dynamic)**: Directory, boundary, and doc-bootstrap guidance resolved from repo evidence, live research, and explicit user choices.

## Review Threshold Strategies
Agentic-Senior-Core keeps review thresholds as internal policy, not as a noisy user-facing mode system:
- **beginner**: Safe fallback for power users who want the least blocking review surface.
- **balanced**: Default behavior. CI enforces `critical` and `high` findings.
- **strict**: Power-user override for tighter enforcement when a repo explicitly wants it.

### Detection Transparency (V1.6)
- Auto-detection now records confidence score, confidence gap, ranked candidates, and a plain-language reasoning summary.
- Detection metadata is written into `.agent-context/state/onboarding-report.json` for later audits and upgrade decisions.
- Detection benchmark snapshots can be generated with `npm run benchmark:detection`.

## System Intelligence & MCP
We bundle Model Context Protocol capabilities with a local stdio runtime (`scripts/mcp-server.mjs`) and a workspace registration template (`.vscode/mcp.json`). IDE MCP server registration is still manual for trust/start lifecycle, but `init --mcp-template` writes the workspace configuration in the exact location VS Code expects, using command `node ./scripts/mcp-server.mjs` with `cwd: ${workspaceFolder}`.

## CI Annotation Contract (V1.6)
- `scripts/llm-judge.mjs` now emits a machine-readable payload line: `JSON_REPORT: {...}`.
- The same payload is written to `.agent-context/state/llm-judge-report.json` (override path with `LLM_JUDGE_OUTPUT_PATH`).
- Severity values are normalized to `critical|high|medium|low` for consistent behavior in GitHub Actions and GitLab CI parsing.

## Frontend Usability Gate (V1.7)
- Frontend governance release adds `.agent-context/review-checklists/frontend-usability.md` as the release quality baseline.
- `scripts/frontend-usability-audit.mjs` validates required frontend execution assets and outputs a machine-readable audit report.
- `.github/workflows/frontend-usability-gate.yml` runs the audit and publishes report artifacts per workflow run.

## Release Operations and Compliance (V1.8)
- `scripts/release-gate.mjs` enforces version/changelog/roadmap consistency and required operations assets.
- `.github/workflows/release-gate.yml` publishes machine-readable release-gate reports for every CI run.
- `scripts/generate-sbom.mjs` emits a CycloneDX 1.5 JSON payload for supply-chain evidence.
- `.github/workflows/sbom-compliance.yml` publishes SBOM artifacts for audit traceability.
- `.agent-context/review-checklists/architecture-review.md`, `.github/workflows/release-gate.yml`, and `scripts/release-gate.mjs` define operational release controls.

Use `.agent-override.md` carefully to carve explicit exceptions bounded by `reason` and `expiry` parameters.
