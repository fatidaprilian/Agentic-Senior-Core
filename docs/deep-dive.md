# Deep Dive: Dynamic Governance Engine

Agentic-Senior-Core operates as a **Dynamic Governance Engine** that merges generalized best practices with project-specific structural definitions into files agents naturally read (like `.cursorrules`, `.windsurfrules`, or `AGENTS.md`).

## The Compiler Workflow
When you run the init command (for example through `npm exec --package=github:fatidaprilian/Agentic-Senior-Core agentic-senior-core init`, `scripts/init-project.ps1`, `scripts/init-project.sh`, or `npx @fatidaprilian/agentic-senior-core init` after npm publish), the delivery CLI:
1. **Scans** your working directory heuristically out-of-the-box (looking for `package.json`, `pom.xml`, etc.).
2. **Prompts** you to refine the Stack, Blueprint, and enforcement Profile if auto-detection confidence is low.
3. **Compiles** modular knowledge components into dense rule files injected directly into your project.

### Distribution Modes
- **Pre-publish mode**: use GitHub source execution (`npm exec --package=github:...`) or bootstrap scripts in this repository.
- **Post-publish mode**: use `npx @fatidaprilian/agentic-senior-core init` as the shortest path.
- **Engine parity**: all modes run the same CLI entrypoint (`bin/agentic-senior-core.js`) and produce the same output files.

### Component Breakdown
- **Universals (`.agent-context/rules/`)**: Non-negotiable laws. No floating `any` types, strict variable naming, event-driven designs.
- **Stacks (`.agent-context/stacks/`)**: Paradigm instructions specific to a language ecosystem. (e.g. In Python, strictly enforce Pydantic over untyped dicts).
- **Blueprints (`.agent-context/blueprints/`)**: Directory generation patterns. Instructs the agent on where a `/repository` layer goes versus a `/controller` layer.

## Profile Enforcement Strategies
Agentic-Senior-Core enables configurable rigidness:
- **beginner**: The CLI opts out of difficult architectural prompts, setting safe defaults (`node`, `balanced` guardrails, lenient AI reviews).
- **balanced**: Standard operation. The CI enforces `critical` and `high` violations via LLM judge, skipping nitpicks around style.
- **strict**: Fails on any deviation. Enforces test isolation, architectural violations, security problems, and fails standard CI runs when the AI Judge API becomes unresponsive.

## System Intelligence & MCP
We bundle Model Context Protocol capabilities. `mcp.json` establishes diagnostic loops so your runtime AI can self-heal local configurations, understand system boundary maps (`dependency-map.md`), and patch configuration drift autonomously.

Use `.agent-override.md` carefully to carve explicit exceptions bounded by `reason` and `expiry` parameters.