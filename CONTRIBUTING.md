# Contributing to Agentic-Senior-Core

Thanks for wanting to make AI agents write better code. Here's how to contribute.

---

## What You Can Contribute

| Type | Where | Description |
|------|-------|-------------|
| New rule | `.agent-context/rules/` | Universal engineering standard |
| New stack | `.agent-context/stacks/` | Language-specific profile (Python, Go, Java, etc.) |
| New blueprint | `.agent-context/blueprints/` | Project scaffolding template |
| New checklist | `.agent-context/review-checklists/` | Self-audit guide |
| Bug fix | Any file | Typos, broken links, incorrect examples |
| Improvement | Any file | Sharper wording, better examples |

---

## Content Quality Standard

This is the single most important rule: **every file must be "galak" (strict/fierce).**

Your contribution MUST be opinionated, specific, and enforceable. We reject generic advice.

```
BAD  (generic, useless):
  "Use descriptive variable names."

GOOD (specific, enforceable):
  "NEVER use single-letter variables except `i` in `for(let i=0; i<n; i++)`.
   Function names MUST start with a verb. Booleans MUST use is/has/can prefix."
```

### The Litmus Test
- Does your rule include concrete BANNED / REQUIRED examples?
- Would an AI agent be able to enforce it without ambiguity?
- Does it teach the reader WHY, not just WHAT?

If all three are "yes", it belongs here.

---

## How to Add a New Stack Profile (e.g., Python)

1. Create `.agent-context/stacks/python.md`
2. Follow the structure of `stacks/typescript.md`:
   - Compiler/linter configuration (non-negotiable settings)
   - Type system rules (the equivalent of "ban any")
   - Validation at boundaries (Pydantic, marshmallow, etc.)
   - Import conventions
   - Async patterns
   - Preferred libraries with justification
   - Banned patterns with alternatives
3. Update `AGENTS.md` to add the new stack to the manifest table
4. Run `bun scripts/validate.ts` to verify everything links correctly
5. Open a PR

---

## How to Add a New Blueprint

1. Create `.agent-context/blueprints/<framework-name>.md`
2. Include:
   - Tech stack summary
   - Complete directory structure
   - Code patterns for each layer (with full examples)
   - Environment validation setup
   - Error handling setup
   - Scaffolding checklist
3. Update `AGENTS.md` manifest
4. Update `prompts/init-project.md` available blueprints table
5. Validate and PR

---

## How to Add a New Rule

1. Create `.agent-context/rules/<rule-name>.md`
2. Structure:
   - Opening quote (sets the tone)
   - Core principle (1-2 sentences)
   - BANNED / REQUIRED sections with code examples
   - Decision tree or quick reference (if applicable)
3. Update `AGENTS.md` rules manifest table
4. Update `review-checklists/pr-checklist.md` if the rule should be checked in reviews
5. Validate and PR

---

## PR Process

1. **Fork** the repository
2. **Branch** from `main`: `feat/add-python-stack` or `docs/fix-security-typo`
3. **Write** your content following the quality standard above
4. **Validate**: `bun scripts/validate.ts` must pass
5. **Commit** with Conventional Commits: `feat(stacks): add Python profile`
6. **Open PR** with:
   - What you added/changed
   - Why it matters
   - Which manifest files you updated

---

## What We Don't Accept

- Generic content that reads like it was auto-generated without thought
- Rules without concrete code examples
- Stack profiles for languages the author doesn't actually use in production
- Blueprints that are just folder structures without code patterns
- PRs that don't update the relevant manifest files (AGENTS.md, checklists)

---

## Local Development

```bash
# Clone
git clone https://github.com/fatidaprilian/Agentic-Senior-Core.git
cd Agentic-Senior-Core

# Validate
bun scripts/validate.ts

# Test init script
./scripts/init-project.sh /tmp/test-project
```

---

## Questions?

Open an issue. Describe what you want to add and why. We'll help you shape it before you write 500 lines of documentation nobody asked for.
