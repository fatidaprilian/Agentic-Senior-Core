<div align="center">

# Agentic-Senior-Core

### Universal AI coding rules. Because your AI writes code like it gets paid by the line.

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](CONTRIBUTING.md)

**Minimalism plugins cut the code. This plugin makes sure what remains is production-safe.**

**Install once. Works across all projects. Supports 23+ AI coding agents.**

</div>

## Quick Start

### 1. Install the package
To install or forcefully update to the absolute latest version:

```bash
npm install -g @ryuenn3123/agentic-senior-core@latest
```

### 2. Set up globally (Recommended)
To automatically configure all supported IDEs and Agents at once across your entire system, run:

```bash
asc global --all
```

**[See the full Installation Guide](docs/INSTALLATION.md)** for per-project (local) setups or specific tool instructions.

---

## What It Does

AI coding agents over-build by default. Ask for a date picker, the agent installs a library, writes a wrapper component, adds a stylesheet, and opens a timezone discussion. Worse — they silently skip input validation, concatenate SQL strings, commit secrets, and return stack traces to clients.

Code reduction plugins solve the first problem. ASC solves both.

This plugin loads universal engineering rules on every session. Before writing any code, the agent runs a decision ladder:

1. Does this need to be built at all?
2. Does the codebase already have this?
3. Does the stdlib or a native platform feature cover it?
4. Does an already-installed dependency solve it?
5. Can this be one straightforward function?
6. Only then: write the minimum code that works.

### Before / After

<details>
<summary><b>Without ASC</b> — AI-generated endpoint (common output)</summary>

```javascript
app.post('/users', (req, res) => {
  const { name, email, password } = req.body;
  // No input validation
  // SQL injection via string concatenation
  const query = `INSERT INTO users (name, email, password)
                 VALUES ('${name}', '${email}', '${password}')`;
  db.run(query, (err) => {
    if (err) {
      // Stack trace leaked to client
      res.status(500).json({ error: err.message, stack: err.stack });
    } else {
      // Password returned in response
      res.json({ name, email, password, message: 'User created' });
    }
  });
});
```
Issues: no input validation, SQL injection, plaintext password stored and returned, internal error details leaked, no auth check.
</details>

<details>
<summary><b>With ASC</b> — same prompt, rules active</summary>

```javascript
app.post('/users', authenticate, async (req, res) => {
  const { name, email, password } = req.body;
  if (!name || !email || !password) {
    return res.status(400).json({ error: 'Missing required fields' });
  }
  const hash = await bcrypt.hash(password, 12);
  const stmt = db.prepare(
    'INSERT INTO users (name, email, password) VALUES (?, ?, ?)'
  );
  stmt.run(name, email, hash);
  res.status(201).json({ name, email });
});
```
Validated input, parameterized query, hashed password, safe error response, auth middleware, no sensitive data in response.
</details>

---

## Configuration & Overrides

By default, ASC works perfectly out of the box with zero configuration. It enforces guardrails silently in the background. 

If you need to override these defaults (e.g., to whitelist a specific dependency or ignore specific folders for code-duplication scanning), you can create an `.asc/` folder in your project root.

**[Read the Configuration Guide](docs/CONFIGURATION.md)**

---

## Commands & CLI

ASC provides 7 orthogonal meta-commands to direct AI agents:

| Command | Domain Focus | Operational Mechanism |
|---|---|---|
| `/asc` | Architecture & Meta | Codebase fingerprinting, adaptive preferences, debt ledger, and skill authoring pressure-testing. |
| `/asc-develop` | Lifecycle & Planning | Greenfield scaffolding, brownfield features, 1-hop execution plans (`Ruling:` execution), subagent dispatch, and refactoring. |
| `/asc-review` | Quality & Security | Production PR reviews, deep vulnerability audits (OWASP / ASI), and token-level clone deduplication. |
| `/asc-test` | Testing & Debugging | 4-phase systematic root-cause debugging, Iron Law of TDD, verification gates, and regression proofs. |
| `/asc-reference` | Backend Architecture | REST/GraphQL APIs, database indexing/transactions/migrations, Docker/K8s manifests, and service resilience. |
| `/asc-ui` | Frontend Engineering | Anti-card-soup data-to-structure mapping (`<ol>`, `<table>`, `divide-y`), token reuse, 4 data states, and WCAG AA accessibility. |
| `/asc-pentest` | Security Verification | Dynamic application security testing (DAST), authorization scope gates, Pentest Task Trees, and OWASP API Top 10 stateful fuzzing. |

### Mechanical Enforcement & Lifecycle Hooks

ASC enforces quality through deterministic hooks rather than relying on prompt compliance alone:

- **Google Antigravity (App, CLI, IDE)**: Native protojson lifecycle hooks (`<plugin_root>/hooks.json`):
  - `PreToolUse`: Intercepts unvetted dependencies and blocks unauthorized git commits/pushes.
  - `PostInvocation`: Flags UI Card Soup ($\ge 3$ consecutive card grids without semantic tables/steppers) and warns on production edits during bug investigations prior to reproduction commands.
  - `Stop`: Blocks turn completion when source code was modified without a subsequent verification command.
- **Claude Code, Codex CLI, Copilot CLI**: Plugin lifecycle hooks (`hooks/hooks.json`) executing pre-tool dependency checks, duplicate code scans, and advisory pulse reminders.
- **Universal Git Pre-Commit Hook**: Automatically installed via `asc global` or `asc adapter` (`~/.asc/global-hooks/pre-commit`), enforcing token-level clone checks (`jscpd`) and typed ESLint auto-fixes across all IDEs (Cursor, Windsurf, Zed, Cline, Kilo Code, Roo Code).

**[See all available CLI Options and Agent Commands](docs/INSTALLATION.md#commands--cli)**

---

## Documentation Index

- **[Installation & Supported Hosts](docs/INSTALLATION.md)** - Setup instructions for Google Antigravity, Claude Code, Codex, Copilot, Cursor, OpenCode, Roo, and 17+ others.
- **[Configuration Overrides](docs/CONFIGURATION.md)** - How to configure `.asc/dedup-config.json` and `.asc/dependency-allowlist.json`.
- **[Architecture & Philosophy](docs/architecture.md)** - Two-tier multi-host design, hook specifications, grounding standards, and cache-safety invariants.
- **[Benchmarks](benchmarks/RESULTS.md)** - Empirical performance and token reduction measurements.
- **[Grounding](docs/GROUNDING.md)** - Formal verified citations behind every rule (OWASP, Google Engineering Practices, USENIX).

---

## Works With Other Plugins

ASC covers security boundaries, architectural layering, testing discipline, API design, database integrity, accessibility, infrastructure, and resilience. Minimalism plugins reduce output volume; ASC enforces engineering safety on what remains. Use them together without conflict.
