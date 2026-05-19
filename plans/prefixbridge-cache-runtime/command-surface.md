# PrefixBridge Command Surface

Status: planned, unshipped.
Last updated: 2026-05-18.

## Commands

Planned commands:

```bash
asc cache compile
asc cache bridge
asc cache warm
asc cache doctor
asc cache status
asc cache off
```

These are separate from runtime output compression:

```bash
asc optimize install
asc optimize status
asc optimize off
asc optimize doctor
```

## `asc cache compile`

Purpose: build a deterministic stable prefix and cache boundary manifest.

Expected behavior:

1. Read stable guidance sources.
2. Normalize stable text.
3. Exclude volatile state.
4. Write prefix hash and block hashes.
5. Emit `.agent-context/state/cache-boundary-manifest.json`.
6. Report invalidation inputs.

Output example:

```text
prefix_id: sha256:...
cacheable_blocks: 3
dynamic_blocks: 1
volatile_inputs_excluded: git status, timestamp, task runtime
next_action: asc cache warm
```

## `asc cache bridge`

Purpose: start the local bridge.

Expected behavior:

1. Bind only to loopback by default.
2. Accept Anthropic-compatible inbound requests for MVP.
3. Match stable prefix against the manifest.
4. Inject provider cache controls only when exact match is proven.
5. Forward request to official provider endpoint.
6. Preserve streaming.
7. Emit non-sensitive diagnostics.

## `asc cache warm`

Purpose: prewarm the provider cache for the current stable prefix.

Expected behavior:

1. Compile or load current prefix manifest.
2. Send a minimal legal request.
3. Record provider, model, prefix hash, and usage fields.
4. Report whether cache creation was observed.

Do not promise warm success when provider usage is hidden.

## `asc cache doctor`

Purpose: diagnose cache hit and prefix stability.

Checks:

- bridge running
- traffic observed
- provider target
- model target
- prefix hash current
- prefix hash seen in recent requests
- cache creation tokens
- cache read tokens
- cached token ratio
- time to first token trend
- volatile content before boundary
- IDE bypassing bridge
- unsupported payload features

Output should separate:

```text
direct evidence
indirect evidence
inferred evidence
```

## `asc cache status`

Purpose: quick state view.

Expected fields:

```text
mode: off | compiled | bridge-on | warmed | passthrough | unsupported
prefix_id: sha256:...
provider: anthropic | openai | unknown
last_cache_creation_tokens: 0
last_cache_read_tokens: 0
last_cached_tokens: 0
warnings: []
```

## `asc cache off`

Purpose: stop or disable cache bridge behavior.

Expected behavior:

- do not delete governance files
- do not delete manifests unless requested
- print how to restore direct provider endpoint settings

## Environment Variables

Possible future variables:

```text
ASC_CACHE_BRIDGE_PORT
ASC_CACHE_PROVIDER
ASC_CACHE_DEBUG
ASC_CACHE_TRACE_REDACTED
ANTHROPIC_API_KEY
OPENAI_API_KEY
```

Do not store API keys in project state.
