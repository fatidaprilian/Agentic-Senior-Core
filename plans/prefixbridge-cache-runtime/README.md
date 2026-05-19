# PrefixBridge Cache Runtime Plan

Status: planned, unshipped.
Last updated: 2026-05-18.

PrefixBridge is a planned cache-aware runtime for AI coding agents and chat IDEs. It is not a provider router and not a command-output compressor. It focuses on one job: make stable project guidance and skill context cache-friendly for providers that support prompt caching.

## Product Thesis

Many coding agents repeatedly send large static context:

- `AGENTS.md`
- `CLAUDE.md`
- `GEMINI.md`
- stable rules
- tool policy
- project profile
- skill pack

Provider prompt caching can make repeated static input much cheaper and faster, but many chat IDEs and agent command-line tools do not expose cache controls. PrefixBridge tries to close that gap by compiling stable prefixes and mapping them to provider cache semantics through a narrow local bridge.

## What Is New

Prompt caching itself is not new. Anthropic and OpenAI already provide it.

The new part is the combination:

```text
Stable Prefix Compiler
+ Cache Boundary Protocol
+ Local Cache Bridge
+ Cache Warm
+ Cache Doctor
```

The bridge does not reduce logical context size. It reduces repeated input processing cost and latency when a provider cache hit occurs.

## Layer Split

Use both plans:

```text
PrefixBridge
  saves repeated static prefix cost
  examples: rules, skills, system prompt, tool policy, project profile

ASCX Runtime Token Saver
  saves dynamic tool-output tokens
  examples: git diff, npm test, rg output, stack traces
```

They solve different problems and can be implemented in phases.

## Proposed Commands

```bash
asc cache compile
asc cache bridge
asc cache warm
asc cache doctor
```

Runtime token saving remains separate:

```bash
asc optimize install
asc optimize status
asc optimize off
asc optimize doctor
```

## Minimum Viable Prototype

Start narrow:

1. Claude-only upstream.
2. Anthropic-compatible inbound payload.
3. Text-only first.
4. Streaming preserved.
5. Tool calls only after text and streaming pass.
6. Sidecar manifest only; no in-prompt markers for MVP.
7. Usage report proves cache creation and cache read tokens.

Do not build OpenAI-to-Anthropic translation in the first cut. That is a later compatibility layer.

## Success Criteria

PrefixBridge is worth building if a prototype can show:

1. Stable prefix hash remains identical across repeated turns.
2. Anthropic usage reports cache creation on the first request.
3. Anthropic usage reports cache reads on later requests.
4. Time to first token improves on repeated turns.
5. Dynamic task content can change without invalidating the stable prefix.
6. The bridge does not change model-visible semantics.

## Source Files

- `product-decision.md`: product direction and priority relative to ASCX.
- `architecture.md`: runtime architecture and request path.
- `cache-boundary-protocol.md`: manifest and boundary format.
- `command-surface.md`: planned commands and user flows.
- `benchmark-plan.md`: validation spike and benchmark gates.
- `research-sources.md`: source-backed claims and research phrases.
- `supportability-map.md`: likely agent and IDE support tiers.
- `security.md`: local proxy, API key, and logging constraints.
