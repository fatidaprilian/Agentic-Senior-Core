# Product Decision: PrefixBridge

Status: planned, unshipped.
Last updated: 2026-05-18.

## Decision

Build PrefixBridge as a planned cache-aware runtime layer. Keep the previous runtime token saver plan, but treat it as a complementary dynamic-output saver.

Priority order:

1. PrefixBridge cache runtime.
2. ASCX runtime token saver.
3. Optional dashboard or control plane.

Reason: PrefixBridge is more differentiated. RTK-like command compression is useful, but the category already exists. PrefixBridge targets a newer gap: provider prompt caching is powerful, but many AI coding tools do not expose cache controls or stable prefix diagnostics.

## What PrefixBridge Owns

PrefixBridge owns:

- stable prefix compilation
- cache boundary manifests
- local cache bridge runtime
- provider cache marker injection where possible
- prewarm requests
- cache-hit diagnostics
- invalidation reporting

It does not own:

- provider account rotation
- model marketplace
- free-provider routing
- multi-account dashboards
- command-output compression
- terminal hook rewriting

## Relationship To Other Plans

PrefixBridge and ASCX should both exist eventually.

```text
PrefixBridge: repeated static input cost
ASCX: bulky dynamic tool output
```

If only one is built first, build PrefixBridge first because it creates a stronger product distinction.

## Why This Is Not 9Router

9Router is a broad gateway and routing product. PrefixBridge is deliberately narrow.

9Router asks:

```text
Which provider/model/account should serve this request?
```

PrefixBridge asks:

```text
Which part of this prompt is stable enough to cache, and can we prove the cache hit?
```

The product should not compete on provider count. It should compete on deterministic cache boundaries and project-context stability.

## Why This Is Not RTK

RTK compresses command output before it reaches the model.

PrefixBridge does not rewrite command output. It preserves the prompt semantics and maps stable context into provider cache behavior.

RTK saves dynamic command output tokens. PrefixBridge saves repeated static input processing cost.

## User-Facing Promise

Use this wording:

```text
PrefixBridge makes stable coding-agent context cache-aware.
It reduces repeated input cost and latency when provider prompt caching hits.
It does not reduce the logical context window and does not replace tool-output compression.
```

Do not claim total session savings until measured.

## Build Recommendation

Build a narrow MVP.

Do not build a general router or universal OpenAI-to-Anthropic translator first. Prove the cache boundary idea with a Claude-only path and official cache usage fields.
