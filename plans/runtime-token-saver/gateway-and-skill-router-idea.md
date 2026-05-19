# Gateway And Skill Router Idea

Status: idea, separate from ASC runtime token saver.
Last updated: 2026-05-18.

## Why This Exists

9Router shows why a gateway is attractive:

- one local endpoint
- provider routing
- fallback
- dashboard
- usage visibility
- token saver toggles
- model list abstraction
- skill entrypoints

That is useful, but it is not the same product as Agentic-Senior-Core.

The idea here is a possible future separate repo, not part of the next ASC runtime token saver MVP.

## Separate Repo Direction

Possible repo name:

```text
agentic-skill-router
```

or:

```text
agentic-gateway-core
```

Recommended focus if built:

```text
gateway/router + skill-pack discovery + ASC skill bridge
```

Do not put this into the main ASC package unless there is strong evidence that users need one npm package for both governance and gateway runtime.

## Product Split

```text
Agentic-Senior-Core
  owns project guidance, rules, skill packs, runtime token saver.

Agentic Skill Router
  owns gateway-like runtime, skill selection, provider routing, and optional dashboard.

9Router
  remains the best external reference for routing, dashboard, and multi-account behavior.
```

## Skill Direction

The useful idea from 9Router is not just routing. It is the possibility of selecting skill packs.

Future router idea:

```text
User selects:
- ASC senior-engineer pack
- frontend design pack
- runtime token saver policy
- project-specific generated pack

Router injects or exposes the right skill to the active agent/tool.
```

ASC could export a skill pack that a gateway or router can consume:

```bash
asc export-skill codex
asc export-skill claude
asc export-skill router
```

This keeps ASC as the source of governance truth without forcing ASC to own provider accounts.

## Why Not Now

Do not build this before the ASC runtime token saver.

Reasons:

- It creates a second runtime product.
- It introduces provider key and account concerns.
- It creates daemon lifecycle work.
- It competes with 9Router before ASC has a real runtime differentiator.
- It risks distracting from the stronger MVP: safe command output compression.

## If Built Later

Minimum requirements:

1. Never store provider secrets in ASC project state.
2. Keep skill packs explicit and inspectable.
3. Allow users to choose packs, not silently inject all guidance.
4. Detect external 9Router and avoid port conflicts.
5. Keep ASC runtime saver and gateway token saver mutually aware.
6. Provide a clear uninstall path.
7. Keep raw request/response logging off by default.

## Relationship To 9Router

9Router can remain recommended for users who need:

- multi-account support
- provider fallback
- usage dashboard
- OpenAI-compatible local endpoint
- gateway-level token saver

ASC should not duplicate those until there is a clear unmet need.

The better near-term integration is documentation and doctor detection:

```text
If 9Router is active, ASC doctor reports it.
If 9Router Token Saver is enabled, ASC runtime saver should stay off by default.
If the user only wants routing, ASC does not interfere.
```

## Long-Term Opportunity

The long-term opportunity is a skill-aware gateway:

```text
router chooses provider/model
ASC chooses governance/skill pack
runtime saver preserves debugging evidence
```

That is powerful, but it should be treated as a future product line, not the next ASC release.
