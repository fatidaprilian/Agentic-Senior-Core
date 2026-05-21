# Product Decision: PrefixBridge

Status: planned, unshipped.
Last updated: 2026-05-21.

## Decision

Build PrefixBridge as a planned cache-aware runtime layer. Keep it complementary to Adaptive Context Runtime and the ASCX runtime token saver.

Priority order:

1. Adaptive Context Runtime.
2. ASCX runtime token saver.
3. PrefixBridge cache runtime.
4. Quality routing.
5. Optional dashboard or control plane.

Reason: PrefixBridge is differentiated, but it optimizes selected stable context. The foundation should first decide which ASC rules, prompts, docs, and state belong in context for each request.

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

Adaptive Context Runtime, PrefixBridge, and ASCX should all exist eventually.

```text
Adaptive Context Runtime: context selection
ASCX: bulky dynamic tool output
PrefixBridge: repeated static input cost for selected stable context
```

If only one is built first, build Adaptive Context Runtime first because it improves correctness before cost optimization.

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

The product should not compete on provider count. It should compete on deterministic cache boundaries and selected project-context stability.

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

Build a narrow MVP after the Adaptive Context Runtime validation spike proves selected rule packs are stable enough to cache.

Do not build a general router or universal OpenAI-to-Anthropic translator first. Prove the cache boundary idea with a Claude-only path and official cache usage fields.
