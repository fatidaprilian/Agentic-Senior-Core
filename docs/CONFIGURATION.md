# Configuration Overrides

By default, Agentic Senior Core's hooks (Duplicate-Code detection and Dependency protection) are **ON** and actively running. They use sane default configurations that work perfectly for most projects.

> [!NOTE]
> **You do NOT need to create a configuration file to turn features on.** 
> All hooks operate silently in the background with their default settings as soon as you install ASC in your agent.

You only need to configure `.asc/` if you want to **override** the default behavior (e.g., ignoring specific folders or whitelisting a specific dependency).

## The `.asc` Folder

To customize the rules for your specific project, create an `.asc/` folder in the root directory of your repository. 

### `dedup-config.json`

This file controls the behavior of the Duplicate-Code gate (`jscpd` scanner) that runs every time an AI agent edits a file.

Create `.asc/dedup-config.json`:
```json
{
  "mode": "advisory",
  "minTokens": 30,
  "ignoreDirs": ["tests", "migrations", "generated", "node_modules"]
}
```

- **`mode`**: `advisory` (default) provides a soft nudge via an ephemeral message. `block` enforces a hard rejection, forcing the agent to stop and think before proceeding.
- **`minTokens`**: The minimum token match threshold for considering a block of code duplicated (default: 30).
- **`ignoreDirs`**: Folders to skip during scanning to improve performance and avoid false positives.

### `dependency-allowlist.json`

This file provides an escape hatch for the Dependency Gate and Git Clone Gate:
1. **Dependencies**: By default, ASC hard-blocks agents from installing dependencies that unnecessarily duplicate standard library or platform features (e.g., `lodash`, `moment`, `uuid`).
2. **Repositories (HalluSquatting Mitigation)**: ASC hard-blocks `git clone` to unverified repositories. Whitelist trusted repositories here.

Create `.asc/dependency-allowlist.json`:
```json
{
  "allowedDependencies": [
    "lodash",
    "uuid"
  ],
  "allowedRepositories": [
    "https://github.com/my-org/my-private-lib",
    "trusted-org/common-utils"
  ]
}
```

Any dependency or repository listed here will bypass the hard-block and proceed successfully.

---

## Static Analysis & SAST Recommendations (P7)

While ASC provides zero-dependency real-time security pattern detection (scanning for unvalidated SSRF destinations, direct log injection, and hardcoded credentials), for deep repository-wide SAST scanning we recommend integrating:

- **Semgrep (OWASP Top 10 ruleset)**: Add `semgrep --config p/owasp-top-ten` to your CI pipeline or local git pre-commit hooks for comprehensive taint tracking.
- **`eslint-plugin-security` (Node/TypeScript)**: Catch prototype pollution, unsafe regular expressions, and non-literal fs/child_process calls at lint time.
- **Bandit (Python)**: Static analysis for Python AST security vulnerabilities.
