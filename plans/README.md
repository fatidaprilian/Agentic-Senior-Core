# Agentic-Senior-Core Runtime Plans

Status: active roadmap with Phase 1 through Phase 3 runtime work in progress.
Last updated: 2026-05-22.

This folder contains runtime plans and implementation notes. A plan changes the stable package surface only after the corresponding runtime path exists and passes validation.

## Current Build Order

Build the runtime stack in this order:

```text
1. Adaptive Context Runtime
2. ASCX Runtime Token Saver
3. Compact Natural Mode
4. PrefixBridge Cache Runtime
5. Quality Routing
6. Gateway or dashboard control plane
```

## Why This Order Changed

The earlier split between PrefixBridge and ASCX is still valid:

```text
PrefixBridge
  saves repeated static-prefix processing cost through provider prompt caching.

ASCX Runtime Token Saver
  saves bulky dynamic tool-output tokens before they enter agent context.
```

The newer research adds a more basic foundation:

```text
Adaptive Context Runtime
  decides which rules, prompts, docs, and retrieval paths should be active for a request.
```

PrefixBridge can cache stable context only after the right context has been selected. That makes PrefixBridge an optimization layer, not the foundation for the full stack.

## Plan Roles

### 1. Adaptive Context Runtime

Path: `plans/adaptive-context-runtime/`

Owns:

- local intent classification over the ASC rule taxonomy
- selective rule and prompt injection
- selective docs and state routing
- uncertainty fallback for ambiguous requests
- benchmark fixtures for classification and context selection quality

This is the first build target because ASC already has governed labels such as `SEC-*`, `ARCH-*`, `FE-*`, `DATA-*`, `API-*`, `TEST-*`, `ERR-*`, and `MIG-*`.

### 2. ASCX Runtime Token Saver

Path: `plans/runtime-token-saver/`

Owns:

- evidence-aware command-output compression
- raw-output tee files for failed commands
- preservation rules for errors, stack traces, assertions, paths, line numbers, and exit codes
- runtime conflict detection with RTK or 9Router token savers

This comes after adaptive context because tool-output compression should follow the same evidence policy chosen for the request type.

### 3. Compact Natural Mode

Path: `plans/compact-natural-mode/`

Owns later:

- task-aware response compression
- filler removal without caveman-style dialect
- preservation rules for commands, paths, errors, assumptions, validation status, decisions, risks, and next actions
- benchmarks for semantic equivalence, actionability, evidence preservation, register quality, and token reduction

Do not build this inside ASCX. ASCX compresses command output before it enters the agent context. Compact Natural Mode compresses the agent's final user-facing response after the command-output layer is stable.

### 4. PrefixBridge Cache Runtime

Path: `plans/prefixbridge-cache-runtime/`

Owns:

- stable prefix compilation
- cache boundary manifests
- provider cache marker injection where supported
- cache warm and cache doctor commands
- cache-hit diagnostics

This is still useful, but it should accelerate selected stable context rather than decide which context belongs in the prompt.

### 5. Quality Routing

Path: not created yet.

Owns later:

- model choice by predicted quality and cost
- escalation thresholds
- compile, lint, test, and validation feedback as routing evidence

Do not build this first. Routing can backfire if it sends nearly every coding request to the strongest model or routes risky requests to weak models.

### 6. Gateway Or Dashboard

Path: separate future repo or late-stage plan.

Do not put provider account routing, dashboards, subscription rotation, or multi-provider fallback into the Agentic-Senior-Core (ASC) minimum viable product. Those concerns are gateway-shaped and should stay separate until there is strong product evidence.

## Next Validation Action

Current next action:

1. Keep Adaptive Context Runtime as the context-selection foundation.
2. Keep the ASCX whitelist frozen at `git status`, `git diff`, and `npm test` until the next adapter has its own evidence and continuation fixtures.
3. Keep Compact Natural Mode enabled through the installed prompt only while benchmark gates stay green.
4. Treat ASCX and Compact Natural as default-on init behavior; keep MCP and PrefixBridge separate.
5. Defer PrefixBridge until selected context, dynamic output compression, and response compression are all stable.
