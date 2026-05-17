# Agentic-Senior-Core FAQ

## What is a Stack?
A "Stack" refers to the core programming language or technology framework your project uses (e.g., TypeScript, Python, Go). The agent compiles different rules based on the stack.

## What is a Blueprint?
A "Blueprint" is an architectural starting point. If you use Next.js, the blueprint contains structural rules about Next.js components, file routing, and data fetching loops so your agent doesn't hallucinate outdated paradigms.

## What are Quality Checks (Guardrails)?
Quality checks (guardrails) are built-in workflow rules (like `scripts/llm-judge.mjs` and GitHub Actions) that enforce our rule sets before any PR is merged. The agent knows these exist and won't write "lazy" code knowing it will be blocked.

## My project is still on Laravel 12. Is it safe to use this repository?
Yes. It is safe to use this repository with Laravel 12 projects.

What this means in practice:
1. You can still run `init` and `upgrade` to get governance, rules, and checklists.
2. Keep your runtime dependencies on Laravel 12 until your app is ready for framework upgrade.
3. Do not apply Laravel-13-only code blindly into Laravel 12 apps.
4. Use version-aware edits during migration, especially around CSRF middleware names and other framework-specific APIs.

The Laravel 13 blueprint and stack profile are the default target-state for new projects and planned upgrades, not a forced runtime switch for existing Laravel 12 repositories.

## Does `init` copy this repository's GitHub workflows into my project?
No. By default, `init` does not copy repository workflows from Agentic-Senior-Core into your target repository. The workflow files in this repository are for this repository's own release and maintenance lifecycle.

## Is MCP server setup automatic?
Partially. MCP server trust/registration is manual in your IDE for the first start. If you want a starter MCP configuration file in your project, run `init` with `--mcp-template`, then open `MCP: Open Workspace Folder Configuration` and confirm `.vscode/mcp.json` (server command: `node ./scripts/mcp-server.mjs`, `cwd: ${workspaceFolder}`).

After that, you can enable VS Code setting `chat.mcp.autoStart` (Experimental) to auto-restart MCP servers when config changes are detected.

## Why is there no "pick file" option when I add MCP server?
That is expected. VS Code MCP setup uses server registration (command/http/npm), not arbitrary file import. The supported flow is:

1. Generate `.vscode/mcp.json` using `--mcp-template`.
2. Open MCP workspace configuration from Command Palette.
3. Start and trust the server from Chat Customizations.

## Why does MCP stay on "Waiting for server to respond to initialize request"?
That means the MCP handshake did not complete. Use this recovery flow:

1. Upgrade to the latest package version.
2. Regenerate workspace MCP config with `init --mcp-template`.
3. Confirm `.vscode/mcp.json` points to `node ./scripts/mcp-server.mjs` and `cwd: ${workspaceFolder}`.
4. Restart the MCP server from Chat Customizations.

If the issue persists, run `agentic-senior-core mcp` directly in terminal to verify the process starts without local environment errors.

## Does this support Ollama?
Yes. The rules engine (Governance Engine) is model-agnostic and works with local-model workflows, including Ollama-based usage, as long as your IDE or toolchain can connect to your selected model provider.

## Why do I see untrusted schema warning in root mcp.json?
The root `mcp.json` is governance metadata for this repository, not the VS Code MCP workspace registration file. The actual VS Code MCP config is `.vscode/mcp.json`, which uses the trusted built-in schema (`vscode://schemas/mcp`).

## Why does `.vscode/mcp.json` show `Property $schema is not allowed`?
This can happen on newer VS Code MCP schema validation where `$schema` is not required. For workspace MCP config, remove `$schema` and keep the `servers` object. MCP discovery and startup still work.

## Why does my agent still output bad code occasionally?
While Agentic-Senior-Core curates the agent's workspace rules (`AGENTS.md`, `CLAUDE.md`, `GEMINI.md`, and `.agent-context/`), some models can still hallucinate under high context load or complex queries. Use a strong current model and chunk broad work into smaller requests.

## Can I define my own exceptions?
Yes, but keep exceptions inside the relevant project docs or `.agent-context/` rule updates so agents see the same contract everyone reviews. Agentic-Senior-Core no longer ships a separate root override file.

## Does this support Copilot?
For the default install, use `AGENTS.md`. GitHub Copilot also supports `.github/copilot-instructions.md` and path-specific `.github/instructions/*.instructions.md`, but Agentic-Senior-Core no longer generates those extra files by default.

## Can I run the CLI before npm publish and still choose options interactively?
Yes. Use GitHub source execution:

```bash
npm exec --yes --package=github:fatidaprilian/Agentic-Senior-Core agentic-senior-core init .
```

This still shows interactive choices for profile, stack, blueprint, and CI.

After the package is published, the shorter equivalent is:

```bash
npx @ryuenn3123/agentic-senior-core init
```

## Does v4 save 89% on caching for me?
The 89.31% effective-token reduction reported in `benchmarks/results/cache-phase-2-2026-05-16.json` is a direct provider API number. It is computed against Anthropic's documented prompt-caching multipliers using `cache_control` breakpoints that the integrator controls. It applies to direct Anthropic API integration and Claude Code SDK programmatic mode.

If you use the rules pack through an IDE wrapper (Cursor, Windsurf, Codex CLI, Kiro), the wrapper controls the request path. The pack contributes prefix stability, which is not the same as a measurable per-pack saving. There is no honest way to attribute a single universal saving figure to those integrations.

For the per-tool matrix and the required JSON shape when reporting caching numbers, see `docs/integration-playbook.md` "Per-Tool Caching Scope" and `docs/benchmark-reference.md` "Caching Effectiveness Reporting Format".

## Why does v4 break v3 prose-shape parsers?
v4 converts the internal `.agent-context/rules/` pack from prose Markdown to numbered Markdown with YAML frontmatter and stable section IDs (e.g. `FE-004`, `ARCH-009`, `API-006`). Consumers that only import `AGENTS.md`, `CLAUDE.md`, or `GEMINI.md` do not need code changes; the routing table is intact. Consumers that parse `.agent-context/rules/*.md` directly need to switch to the new format: parse YAML frontmatter, then use `## <PREFIX>-NNN: <Title>` headings as stable anchors. The full migration guide lives in `CHANGELOG.md` under `4.0.0-rc.1`. The breaking change is intentional; v3 prose-shape compatibility was dropped because rule citability requires stable IDs (see `docs/architecture/decisions-foundation.md` D1).
