# Runtime Token Saver Plan

Status: MVP implemented locally, pending release.
Last updated: 2026-05-22.

This folder preserves the product and architecture decisions for the dynamic-output token saver. The first local runtime path now exists as the explicit `ascx` wrapper for `git status`, `git diff`, and `npm test`.

See `plans/README.md` for the current build order. See also `plans/adaptive-context-runtime/` for context selection and `plans/prefixbridge-cache-runtime/` for the static-prefix cache runtime.

The plans are complementary:

```text
Adaptive Context Runtime
  chooses the rules, prompts, docs, and state needed for the request.

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

Later short product command names:

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

The current `optimize --show` behavior is a JSON policy view. `asc optimize status` and `asc optimize doctor` now provide human-readable ASCX readiness checks. Full install/off lifecycle behavior remains the later product surface.

Current MVP surface:

```bash
ascx git status
ascx git diff
ascx npm test
asc optimize status
asc optimize doctor
```

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

Adaptive Context Runtime should be validated first because it decides which evidence policy applies to each request. ASCX remains the next runtime-saving layer because prompt caching does not reduce dynamic tool-output bloat.

Compact Natural Mode belongs after ASCX is stable. It should optimize user-facing agent responses, not command output, and must not enter this phase until ASCX adapters have proven evidence preservation with fixtures.

## Release Rule

Do not expand public release messaging beyond measured local behavior.

MVP release bar:

1. `ascx` can execute and compress a small whitelist of commands.
2. Failed commands write raw output to a local tee file.
3. Summaries preserve command, exit code, file path, line number, and root error.
4. Unsafe shell syntax passes through without compression.
5. Benchmarks show token reduction without hiding debugging evidence.
6. Continuation checks prove the compact output still supports the next correct agent action.

Later runtime bar:

1. `asc optimize doctor` can probe optional external runtimes only when the user opts in.
2. Additional adapters prove their own evidence contracts before entering the whitelist.
