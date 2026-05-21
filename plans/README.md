# Agentic-Senior-Core Runtime Plans

Status: planned, unshipped.
Last updated: 2026-05-21.

This folder contains future runtime plans only. These plans do not change the stable package surface until a real runtime feature exists and passes validation.

## Current Build Order

Build the runtime stack in this order:

```text
1. Adaptive Context Runtime
2. ASCX Runtime Token Saver
3. PrefixBridge Cache Runtime
4. Quality Routing
5. Gateway or dashboard control plane
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

### 3. PrefixBridge Cache Runtime

Path: `plans/prefixbridge-cache-runtime/`

Owns:

- stable prefix compilation
- cache boundary manifests
- provider cache marker injection where supported
- cache warm and cache doctor commands
- cache-hit diagnostics

This is still useful, but it should accelerate selected stable context rather than decide which context belongs in the prompt.

### 4. Quality Routing

Path: not created yet.

Owns later:

- model choice by predicted quality and cost
- escalation thresholds
- compile, lint, test, and validation feedback as routing evidence

Do not build this first. Routing can backfire if it sends nearly every coding request to the strongest model or routes risky requests to weak models.

### 5. Gateway Or Dashboard

Path: separate future repo or late-stage plan.

Do not put provider account routing, dashboards, subscription rotation, or multi-provider fallback into the Agentic-Senior-Core (ASC) minimum viable product. Those concerns are gateway-shaped and should stay separate until there is strong product evidence.

## Next Validation Action

Start with `plans/adaptive-context-runtime/`:

1. Build a fixture set of real user prompts mapped to ASC rule labels.
2. Test deterministic rules plus embedding k-nearest-neighbor or SetFit-style classification.
3. Measure label precision, missed required rules, and extra injected rules.
4. Only then decide whether PrefixBridge should cache the selected rule packs.
