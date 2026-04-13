# Agentic-Senior-Core FAQ

## What is a Stack?
A "Stack" refers to the core programming language or technology framework your project uses (e.g., TypeScript, Python, Go). The agent compiles different rules based on the stack.

## What is a Blueprint?
A "Blueprint" is an architectural starting point. If you use Next.js, the blueprint contains structural rules about Next.js components, file routing, and data fetching loops so your agent doesn't hallucinate outdated paradigms.

## What are Guardrails?
Guardrails are built-in workflow rules (like `scripts/llm-judge.mjs` and GitHub Actions) that enforce our rule sets before any PR is merged. The agent knows these exist and won't write "lazy" code knowing it will be blocked.

## Does `init` copy this repository's GitHub workflows into my project?
No. By default, `init` does not copy repository workflows from Agentic-Senior-Core into your target repository. The workflow files in this repository are for this repository's own release and maintenance lifecycle.

## Is MCP server setup automatic?
No. MCP server registration is manual in your IDE. If you want a starter MCP configuration file in your project, run `init` with `--mcp-template`, then open `MCP: Open Workspace Folder Configuration` and confirm `.vscode/mcp.json` (server command: `npx -y @ryuenn3123/agentic-senior-core mcp`).

## Why is there no "pick file" option when I add MCP server?
That is expected. VS Code MCP setup uses server registration (command/http/npm), not arbitrary file import. The recommended flow is:

1. Generate `.vscode/mcp.json` using `--mcp-template`.
2. Open MCP workspace configuration from Command Palette.
3. Start and trust the server from Chat Customizations.

## Why does MCP stay on "Waiting for server to respond to initialize request"?
That means the MCP handshake did not complete. Use this recovery flow:

1. Upgrade to the latest package version.
2. Regenerate workspace MCP config with `init --mcp-template`.
3. Confirm `.vscode/mcp.json` still points to `npx -y @ryuenn3123/agentic-senior-core mcp`.
4. Restart the MCP server from Chat Customizations.

If the issue persists, run `agentic-senior-core mcp` directly in terminal to verify the process starts without local environment errors.

## Why do I see untrusted schema warning in root mcp.json?
The root `mcp.json` is governance metadata for this repository, not the VS Code MCP workspace registration file. The actual VS Code MCP config is `.vscode/mcp.json`, which uses the trusted built-in schema (`vscode://schemas/mcp`).

## Why does my agent still output bad code occasionally?
While Agentic-Senior-Core aggressively curates the agent's system prompt and workspace rules (`.cursorrules`, `AGENTS.md`, etc.), some models can still hallucinate under high context load or complex queries. Make sure you are using top-tier models (GPT-4o, Claude 3.5 Sonnet, Gemini 2.0 Pro) and try to chunk your prompts.

## Can I define my own exceptions?
Yes, use the `.agent-override.md` file in your repository root to declare explicit scoped exceptions to the rules.

## Does this support Copilot?
Yes, for GitHub Copilot in VS Code or Visual Studio, the repository supports importing `.github/copilot-instructions.md`.

## Can I run the CLI before npm publish and still choose options interactively?
Yes. Use GitHub source execution:

```bash
npm exec --yes --package=github:fatidaprilian/Agentic-Senior-Core agentic-senior-core init .
```

This still shows interactive choices for profile, stack, blueprint, and CI.

You can also use repository bootstrap scripts:
- Windows: `scripts/init-project.ps1`
- Linux/macOS: `scripts/init-project.sh`

After the package is published, the shorter equivalent is:

```bash
npx @ryuenn3123/agentic-senior-core init
```
