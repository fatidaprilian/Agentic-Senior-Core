# Contributing to Agentic-Senior-Core

Thanks for wanting to make AI agents write better code. Here's how to contribute.

---

## What You Can Contribute

| Type | Where | Description |
|------|-------|-------------|
| New rule | `.agent-context/rules/` | Universal engineering standard |
| Stack strategy update | `.agent-context/rules/`, `.agent-context/state/stack-research-snapshot.json` | Dynamic language/runtime guidance and evidence |
| Structural planning guidance update | `.agent-context/prompts/`, `lib/cli/compiler.mjs` | Scope planning, docs bootstrap, and project-context guidance |
| New checklist | `.agent-context/review-checklists/` | Self-audit guide |
| State intelligence update | `.agent-context/state/` | Architecture boundaries and dependency map |
| Override policy update | `.agent-override.md` | Scoped rule exceptions |
| MCP workflow update | `mcp.json` | Self-healing automation flow |
| Bug fix | Any file | Typos, broken links, incorrect rules |
| Improvement | Any file | Sharper wording, stricter boundaries |

---

## Content Quality Standard

This is the single most important rule: **every file must be "galak" (strict/fierce).**

Your contribution MUST be opinionated, specific, and enforceable. We reject generic advice, externally anchored rules, and borrowed-pattern guidance that can become accidental style anchors.

### The Litmus Test
- Does your rule include concrete BANNED / REQUIRED boundaries?
- Would an AI agent be able to enforce it without ambiguity?
- Does it teach the reader WHY, not just WHAT?

If all three are "yes", it belongs here.

---

## How to Add or Adjust Stack Strategy Signals (e.g., Python)

1. Update relevant universal guidance in `.agent-context/rules/` (typing, validation, architecture constraints).
2. Add or adjust measurable stack evidence in `.agent-context/state/stack-research-snapshot.json`.
3. Update stack-facing wording in prompts or CLI output when behavior changes.
4. Run `npm run validate` to verify references and policy checks.
5. Open a PR.

---

## How to Add or Adjust Structural Planning Guidance

1. Update the planning guidance in `.agent-context/prompts/init-project.md` and related discovery guidance.
2. Update compiler/init behavior if generated project-context guidance or bootstrap flow changes.
3. Keep system boundaries, required docs, and validation boundaries explicit without silently recommending a framework from offline heuristics.
4. Run `npm run validate` and `npm test`.
5. Open a PR.

---

## How to Add a New Rule

1. Create `.agent-context/rules/<rule-name>.md`
2. Structure:
   - Opening quote (sets the tone)
   - Core principle (1-2 sentences)
   - BANNED / REQUIRED sections with enforceable boundaries
   - Decision tree or quick ruleset when it reduces ambiguity
3. Update `.instructions.md` or `.agent-context/` as the source, then regenerate thin adapters with `npm run sync:adapters`
4. Update `review-checklists/pr-checklist.md` when the rule is part of review scope
5. Validate and PR

---

## PR Process

1. **Fork** the repository
2. **Branch** from `main`: `feat/add-python-stack` or `docs/fix-security-typo`
3. **Write** your content following the quality standard above
4. **Validate**: `npm run validate` must pass
5. **Commit** with Conventional Commits: `feat(stacks): add Python profile`
6. **Open PR** with:
   - What you added/changed
   - Why it matters
   - Which manifest files you updated

---

## What We Don't Accept

- Generic content that reads like it was auto-generated without thought
- Rules without concrete enforcement boundaries
- Stack profiles for languages the author doesn't actually use in production
- PRs that don't update the relevant source files, generated adapters, and checklists

---

## Local Development

The npm package is published under `@ryuenn3123`, while the GitHub repository is hosted under `fatidaprilian`.

### Architecture Boundaries

When contributing code to the CLI or the maintenance tools, respect the boundary between `lib/` and `scripts/`:

- **`lib/`**: Contains the core CLI application logic. These files are executed by the package binary but are **never** copied into target user workspaces.
- **`scripts/`**: Contains standalone tools (like validators, audits, and benchmarks) AND the MCP server (`scripts/mcp-server.mjs`). Code here must not depend on `lib/` because some scripts (like the MCP server) are copied directly to target workspaces where `lib/` does not exist.

```bash
# Clone
git clone https://github.com/fatidaprilian/Agentic-Senior-Core.git
cd Agentic-Senior-Core

# Validate
npm run validate

# Clean ignored local reports/backups when the workspace gets noisy
npm run clean:local

# Test interactive CLI
node ./bin/agentic-senior-core.js init /tmp/test-project
```

---

## Questions?

Open an issue. Describe what you want to add and why. We'll help you shape it before you write 500 lines of documentation nobody asked for.
