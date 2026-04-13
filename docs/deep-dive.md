# Deep Dive: Dynamic Governance Engine

Agentic-Senior-Core operates as a **Dynamic Governance Engine** that merges generalized best practices with project-specific structural definitions into files agents naturally read (like `.cursorrules`, `.windsurfrules`, or `AGENTS.md`).

## The Compiler Workflow
When you run the init command (for example through `npm exec --package=github:fatidaprilian/Agentic-Senior-Core agentic-senior-core init`, `scripts/init-project.ps1`, `scripts/init-project.sh`, or `npx @ryuenn3123/agentic-senior-core init` after npm publish), the delivery CLI:
1. **Scans** your working directory heuristically out-of-the-box (looking for `package.json`, `pom.xml`, etc.).
2. **Prompts** you to refine the Stack, Blueprint, and enforcement Profile if auto-detection confidence is low.
3. **Compiles** modular knowledge components into dense rule files injected directly into your project.

### Distribution Modes
- **Pre-publish mode**: use GitHub source execution (`npm exec --package=github:...`) or bootstrap scripts in this repository.
- **Post-publish mode**: use `npx @ryuenn3123/agentic-senior-core init` as the shortest path.
- **Engine parity**: all modes run the same CLI entrypoint (`bin/agentic-senior-core.js`) and produce the same output files.

### Upgrade Assistant (V1.6)
- The CLI now includes `upgrade` mode for existing repositories.
- `agentic-senior-core upgrade --dry-run` previews migration impact without writing files.
- Apply mode rewrites `.cursorrules` and `.windsurfrules`, refreshes policy profile alignment, and records onboarding telemetry with `operationMode: upgrade`.
- Upgrade previews include line-count delta and selected profile/stack/blueprint/CI state before write.

### Component Breakdown
- **Universals (`.agent-context/rules/`)**: Non-negotiable laws. No floating `any` types, strict variable naming, event-driven designs.
- **Stacks (`.agent-context/stacks/`)**: Paradigm instructions specific to a language ecosystem. (e.g. In Python, strictly enforce Pydantic over untyped dicts).
- **Blueprints (`.agent-context/blueprints/`)**: Directory generation patterns. Instructs the agent on where a `/repository` layer goes versus a `/controller` layer.

## Profile Enforcement Strategies
Agentic-Senior-Core enables configurable rigidness:
- **beginner**: The CLI opts out of difficult architectural prompts, setting safe defaults (`node`, `balanced` guardrails, lenient AI reviews).
- **balanced**: Standard operation. The CI enforces `critical` and `high` violations via LLM judge, skipping nitpicks around style.
- **strict**: Fails on any deviation. Enforces test isolation, architectural violations, security problems, and fails standard CI runs when the AI Judge API becomes unresponsive.

### Team Profile Packs (V1.6)
- Team profiles are defined in `.agent-context/profiles/` and can be applied with `--profile-pack`.
- Packs control default profile, stack, blueprint, and CI behavior while preserving local override options.
- Current packs: `startup`, `regulated`, `platform`.

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
- `scripts/release-gate.mjs` enforces version/changelog/roadmap consistency and required enterprise assets.
- `.github/workflows/release-gate.yml` publishes machine-readable release-gate reports for every CI run.
- `scripts/generate-sbom.mjs` emits a CycloneDX 1.5 JSON payload for supply-chain evidence.
- `.github/workflows/sbom-compliance.yml` publishes SBOM artifacts for audit traceability.
- `.agent-context/review-checklists/release-operations.md` and `docs/v1.8-operations-playbook.md` define operational release controls.

Use `.agent-override.md` carefully to carve explicit exceptions bounded by `reason` and `expiry` parameters.
