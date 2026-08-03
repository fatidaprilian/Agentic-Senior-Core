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

ASC provides powerful commands to steer your agents (e.g. `/asc-refactor`, `/asc-audit`). 
It also provides a CLI to manage your local setup (e.g. `asc adapter --all`, `asc global --all`).

### Git Pre-Commit Hook

ASC automatically installs a native Git pre-commit hook when you run `asc adapter`. This hook runs via Git's own hook system — independent of any AI host's plugin runtime — so it works on **every** host, including adapter-only hosts (Cursor, Cline, Copilot IDE extension, etc.) and hosts where agent lifecycle hooks are unreliable.

The hook:
- Runs `jscpd` on directories containing staged files, using policy from `.asc/dedup-config.json`
- Auto-fixes ESLint issues (including `no-confusing-void-expression`) and re-stages, if the target project has a typed ESLint config
- Blocks the commit if a staged file duplicates existing code, with a clear message citing the match
- Bypass with `git commit --no-verify` when duplication is intentional

Supports both `.husky/` (appends without overwriting) and `.git/hooks/` (direct install). Remove with `asc uninstall`. To install the hook standalone without generating adapter files: `asc install-git-hook`.

> **Known limitation — Antigravity IDE hooks**: Agent lifecycle hooks (`hooks.json`) are documented but do not execute on Antigravity IDE's chat surface as of August 2026. The git pre-commit hook is the recommended primary enforcement mechanism for Antigravity users.

**[See all available CLI Options and Agent Commands](docs/INSTALLATION.md#commands--cli)**

---

## Documentation Index

- **[Installation & Supported Hosts](docs/INSTALLATION.md)** - Setup instructions for Claude Code, Copilot, Antigravity, Cursor, Windsurf, Zed, Aider, and more.
- **[Configuration Overrides](docs/CONFIGURATION.md)** - How to use `.asc/dedup-config.json` and `.asc/dependency-allowlist.json`.
- **[Architecture & Philosophy](docs/ARCHITECTURE.md)** - How the hooks work, our engineering principles, and Migration guide from v4.x.
- **[Benchmarks](benchmarks/RESULTS.md)** - ASC produces **18% less code**, uses **30% fewer tokens**, costs **42% less**, and finishes **18% faster**.

---

## Works With Other Plugins

ASC covers security, architecture, testing, API design, database safety, accessibility, infrastructure, and resilience — domains that code-reduction and minimalism plugins explicitly leave out of scope. They reduce volume; ASC enforces safety on what remains. Use them together. No conflicts — ASC is designed to be complementary.
