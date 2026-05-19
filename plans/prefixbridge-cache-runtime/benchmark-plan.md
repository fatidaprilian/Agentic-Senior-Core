# PrefixBridge Benchmark Plan

Status: planned, unshipped.
Last updated: 2026-05-18.

## Benchmark Goal

Prove that PrefixBridge improves repeated static-prefix cost and latency without changing prompt meaning.

The benchmark must not claim reduced context size. Prompt caching reduces repeated input processing cost and latency when the prefix hits the provider cache.

## Conditions

Run at least these conditions:

1. Direct provider baseline.
2. PrefixBridge without prewarm.
3. PrefixBridge with prewarm.
4. Mutated-prefix negative control.

## Primary Metrics

For Anthropic:

- `cache_creation_input_tokens`
- `cache_read_input_tokens`
- `input_tokens`
- `output_tokens`
- time to first token
- total response latency
- prefix hash stability

For OpenAI:

- `usage.prompt_tokens_details.cached_tokens`
- prompt token count
- completion token count
- time to first token
- total response latency
- prompt cache key used
- prefix hash stability

## Success Criteria

Initial success:

1. First repeated request creates or uses a cache.
2. Later repeated requests report cache reads or cached tokens.
3. Dynamic tail changes do not change prefix hash.
4. Mutated prefix causes expected cache miss or lower cached-token count.
5. Streaming output remains compatible with the client.
6. Prompt text semantics remain unchanged except provider cache metadata.

## Negative Controls

Test misses deliberately:

- change a stable rule line
- insert timestamp before prefix boundary
- reorder stable blocks
- change tool schema ordering
- change model family
- change image detail or image position when multimodal support is added

The doctor must explain why cache reuse failed.

## IDE And Agent Validation

Test support tiers:

1. Direct Anthropic-compatible test client.
2. One agent or IDE with custom Anthropic base URL.
3. One OpenAI-compatible custom base URL client.
4. One fallback-only agent using stable instruction files.

Do not claim support for Codex, Claude Code, Cursor, Cline, Roo, or Windsurf until each path is verified with actual config and request evidence.

## Benchmark Report Shape

Future report:

```json
{
  "reportName": "prefixbridge-cache-benchmark",
  "generatedAt": "2026-05-18T00:00:00.000Z",
  "provider": "anthropic",
  "model": "claude-sonnet",
  "prefixId": "sha256:example",
  "conditions": [],
  "summary": {
    "cacheCreationInputTokens": 0,
    "cacheReadInputTokens": 0,
    "cachedTokens": 0,
    "ttftMedianMs": 0,
    "prefixStabilityRate": 0,
    "semanticRewriteCount": 0
  }
}
```

## Release Gate

Do not ship PrefixBridge until:

1. Anthropic-native path passes.
2. Streaming path passes.
3. Cache usage fields are captured.
4. Prefix mutation diagnostics work.
5. No raw prompt logging happens by default.
6. Bridge fails open to passthrough when boundary matching fails.
7. A threat model exists.
8. README claims are limited to measured results.
