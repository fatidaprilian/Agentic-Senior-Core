# PrefixBridge Research Sources

Status: planned, unshipped.
Last updated: 2026-05-18.

This file records source-backed claims and research phrases. Do not treat product claims as shipped behavior until benchmarks exist.

## Research Phrases To Preserve

Use these phrases in future planning:

```text
Prompt caching does not reduce logical context size. It reduces repeated input processing cost and latency when an identical or provider-matched prefix is reused.
```

```text
PrefixBridge is a cache-control layer for coding-agent context, not a provider router and not a command-output compressor.
```

```text
The product moat is deterministic cache boundaries: compile stable context first, isolate volatile context later, and prove cache hits with usage diagnostics.
```

```text
Cache stable prefix first, compress dynamic tool output second, and lazy-load raw details only when the agent needs them.
```

```text
When an IDE gives no base URL, no proxy setting, and no visible payload path, PrefixBridge must downgrade to prefix hygiene. It cannot force explicit provider cache controls.
```

## Confirmed Source Claims

### Anthropic Prompt Caching

Source: https://docs.anthropic.com/en/docs/build-with-claude/prompt-caching

Claims to verify against this source before implementation:

- Anthropic prompt caching uses explicit `cache_control` markers.
- Cache usage fields include `cache_creation_input_tokens` and `cache_read_input_tokens`.
- Prompt caching does not affect output token generation.
- Cached content can include tools, system, and messages in provider-defined order up to the cache breakpoint.
- The 5-minute cache and 1-hour cache have different write pricing behavior.

Planning implication:

```text
Anthropic is the best first MVP target because it exposes explicit cache-control and direct cache usage fields.
```

### OpenAI Prompt Caching

Source: https://platform.openai.com/docs/guides/prompt-caching

Claims to verify against this source before implementation:

- OpenAI prompt caching works automatically for long repeated prefixes.
- Static content should be placed at the beginning and dynamic content at the end.
- `prompt_cache_key` can influence routing and improve hit rates.
- Usage can expose cached tokens via `usage.prompt_tokens_details.cached_tokens`.
- Prompt caching does not change output token generation.

Planning implication:

```text
OpenAI support should start as stable-prefix discipline plus diagnostics, not Anthropic-style cache marker injection.
```

### OpenAI API Reference

Source: https://platform.openai.com/docs/api-reference/chat/get

Claims to verify:

- `prompt_cache_key` and prompt cache retention parameters exist on supported surfaces.
- Extended retention support is model and API dependent.

Planning implication:

```text
PrefixBridge must probe model/API support instead of assuming every OpenAI-compatible path supports the same caching controls.
```

### RTK

Source: https://github.com/rtk-ai/rtk

Claims to verify:

- RTK is a CLI proxy/token saver focused on command output.
- It demonstrates the value and risk of runtime output compression.
- It is a reference point for ASCX, not for PrefixBridge.

Planning implication:

```text
Do not judge PrefixBridge by RTK command-output savings. They target different token surfaces.
```

### 9Router

Source: https://github.com/decolua/9router

Claims to verify:

- 9Router is a gateway/router product with token saver, dashboard, provider routing, and fallback behavior.
- It is a reference for gateway ergonomics, not the PrefixBridge MVP scope.

Planning implication:

```text
Do not build a general provider router in PrefixBridge. Keep routing and account management out of scope.
```

## Claims That Need Local Validation

These are not confirmed until a prototype proves them:

- Codex can route through PrefixBridge.
- Claude Code can route through PrefixBridge in the target environment.
- Cursor, Cline, Roo, or Windsurf preserve stable request order through a local endpoint.
- Prewarm can use zero-output requests across every target provider.
- OpenAI-compatible tool calls can be translated to Anthropic without semantic loss.
- Cache hit rates exceed a specific percentage in real IDE sessions.

## Research To Build Boundary

Research is enough to justify a spike, not enough to ship claims.

Spike proof required:

1. Anthropic cache create/read observed through official usage fields.
2. Prefix hash stays stable across repeated dynamic-tail turns.
3. Prefix mutation causes expected cache miss.
4. Streaming remains unbroken.
5. No raw prompt is logged by default.
