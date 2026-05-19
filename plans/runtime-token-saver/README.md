# Runtime Token Saver Plan

Status: planned, unshipped.
Last updated: 2026-05-18.

This folder preserves the product and architecture decisions for the dynamic-output token saver. It is intentionally separate from `README.md` and `CHANGELOG.md` because the current stable release should not be changed until a real runtime feature exists.

See also `plans/prefixbridge-cache-runtime/` for the static-prefix cache runtime. The two plans are complementary:

```text
PrefixBridge
  reduces repeated static input cost and latency through provider prompt caching.

ASCX Runtime Token Saver
  reduces bulky dynamic command output before it enters agent context.
```

## Decision

Do not ship another token optimization release that only renames policy or adds documentation. The next meaningful update should make token saving real at runtime.

The dynamic-output feature is:

```text
ASC = agent governance + runtime token saver
```

The runtime token saver should focus on coding-agent evidence, not account routing or provider gateway behavior.

## Target Command Surface

Preferred short command names:

```bash
asc init
asc upgrade
asc optimize install
asc optimize status
asc optimize off
asc optimize doctor
```

Backward-compatible long names should continue to work:

```bash
agentic-senior-core init
agentic-senior-core upgrade
agentic-senior-core optimize --show
agentic-senior-core mcp
```

The current `optimize --show` behavior is a policy/status view. The future `optimize install` behavior must install or enable runtime compression.

## Product Positioning

Agentic-Senior-Core should not become a gateway.

Use this split:

```text
ASC: project guidance, skill/rule packs, runtime command output compression
RTK: external CLI token saver reference and competitor
9Router: external gateway/router/dashboard/multi-account runtime
```

9Router is valuable, but it solves a different layer. It can stay recommended for users who need routing, dashboards, provider fallback, and multi-account handling. ASC should solve agent governance and safe runtime evidence compression.

## Core Files

- `product-decision.md`: final product direction and non-goals.
- `architecture.md`: planned `ascx` runtime architecture.
- `command-surface.md`: CLI commands and expected behavior.
- `benchmark-plan.md`: fixtures and gates needed before release.
- `gateway-and-skill-router-idea.md`: separate-repo gateway or skill-router idea, including how it could point back to ASC.

## Priority Rule

PrefixBridge should be validated first if the goal is a more differentiated technology. ASCX remains important because prompt caching does not reduce dynamic tool-output bloat.

## Release Rule

Do not update public release messaging for this feature until the runtime path exists and can pass benchmarks.

Minimum release bar:

1. `ascx` can execute and compress a small whitelist of commands.
2. Failed commands write raw output to a local tee file.
3. Summaries preserve command, exit code, file path, line number, and root error.
4. `asc optimize doctor` detects double-compression risk with RTK or 9Router.
5. Benchmarks show token reduction without hiding debugging evidence.
