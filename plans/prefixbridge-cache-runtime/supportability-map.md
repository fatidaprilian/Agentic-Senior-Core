# PrefixBridge Supportability Map

Status: planned, unshipped.
Last updated: 2026-05-18.

## Support Tiers

### Tier 1: Direct Support

Requirements:

- custom Anthropic-compatible base URL, or
- direct use of PrefixBridge test client

Expected support:

- text requests
- system prompt blocks
- streaming
- explicit Anthropic cache control
- usage diagnostics

MVP target: Tier 1 only.

### Tier 2: OpenAI-Compatible Support

Requirements:

- custom OpenAI-compatible base URL
- stable request shape
- compatible text and tool-call subset

Possible behaviors:

- OpenAI upstream with stable prefix discipline and `prompt_cache_key`
- later OpenAI-to-Anthropic translation

Risk:

- translation edge cases
- tool-call mismatch
- stream format mismatch
- model alias assumptions

Do not make this MVP.

### Tier 3: Prefix Hygiene Fallback

Requirements:

- local instruction files only
- no local endpoint control

Possible behavior:

- compile stable instruction files
- remove volatile content from static context
- preserve AGENTS/CLAUDE/GEMINI ordering
- improve automatic caching odds where provider already caches repeated prefixes

Limitations:

- no explicit Anthropic cache marker
- no cache time-to-live control
- no direct proof if provider usage is hidden

### Tier 4: Unsupported

Unsupported without vendor support:

- hardcoded vendor-hosted backends
- no custom base URL
- no proxy setting
- certificate-pinned opaque traffic
- cloud-only agent path with no local insertion point

## Agent Claims Rule

Do not claim support by brand name until tested.

Use language like:

```text
Potentially supportable when the tool can route requests through a local Anthropic-compatible or OpenAI-compatible endpoint.
```

Do not say:

```text
Works with Codex/Cursor/Claude Code/Cline
```

until the repo has verified setup steps and captured request evidence.

## Codex Path

Potential paths:

1. OpenAI automatic prompt caching through stable AGENTS.md prefix.
2. Local bridge if Codex supports custom base URL or provider routing.
3. Fallback-only prefix hygiene if no payload insertion point exists.

Validation needed:

- actual Codex CLI config support
- request path control
- usage field visibility
- whether `cached_tokens` can be observed

## Claude Path

Potential paths:

1. Anthropic-compatible local bridge when base URL can be configured.
2. Prefix hygiene through `CLAUDE.md`.
3. Cache doctor proof through Anthropic usage fields when traffic is bridged.

Validation needed:

- base URL override behavior
- request shape
- stream shape
- tool-call behavior

## Cursor, Cline, Roo, Windsurf

Treat these as validation candidates, not confirmed support.

Evidence needed:

- custom endpoint setting
- payload format
- stream format
- tool-call format
- whether request bodies preserve stable instruction ordering

## Final Principle

PrefixBridge can be broad only where tools expose an insertion point. When the IDE is closed, the product must downgrade honestly to prefix hygiene.
