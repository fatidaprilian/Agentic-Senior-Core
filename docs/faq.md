# Agentic-Senior-Core FAQ

## What is a Stack?
A "Stack" refers to the core programming language or technology framework your project uses (e.g., TypeScript, Python, Go). The agent compiles different rules based on the stack.

## What is a Blueprint?
A "Blueprint" is an architectural starting point. If you use Next.js, the blueprint contains structural rules about Next.js components, file routing, and data fetching loops so your agent doesn't hallucinate outdated paradigms.

## What are Guardrails?
Guardrails are built-in workflow rules (like `scripts/llm-judge.mjs` and GitHub Actions) that enforce our rule sets before any PR is merged. The agent knows these exist and won't write "lazy" code knowing it will be blocked.

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
npx @fatidaprilian/agentic-senior-core init
```
