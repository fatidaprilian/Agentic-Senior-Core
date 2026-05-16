# Cache Provider Request Shapes

> Phase 2 blueprint. These examples describe downstream integration shapes only. This package does not call generation APIs, create paid provider caches, or store API keys.

## Scope

Use the Phase 2 contract from `benchmarks/token-usage/lib/cache-layer-contract.mjs`:

1. `layer_1_static_prefix`: stable package instructions and cache policy metadata.
2. `layer_2_semi_static_context`: selected rules, prompts, checklists, and stable task-family context.
3. `layer_3_dynamic_suffix`: current user request, diffs, command output, timestamps, and volatile retrieval.

Only Layer 1 and Layer 2 are cache candidates. Layer 3 must stay uncached.

## Claude / Anthropic

Official source: <https://platform.claude.com/docs/en/build-with-claude/prompt-caching>

Use `cache_control` on the last content block that remains identical across requests. For this repo's three-layer contract, downstream integrations should usually mark the end of Layer 1 and optionally the end of Layer 2.

```json
{
  "model": "claude-sonnet-4-5-20250929",
  "max_tokens": 1024,
  "system": [
    {
      "type": "text",
      "text": "<layer_1_static_prefix>",
      "cache_control": { "type": "ephemeral" }
    },
    {
      "type": "text",
      "text": "<layer_2_semi_static_context>",
      "cache_control": { "type": "ephemeral", "ttl": "1h" }
    }
  ],
  "messages": [
    {
      "role": "user",
      "content": "<layer_3_dynamic_suffix>"
    }
  ]
}
```

Observation:
- Read `usage.cache_creation_input_tokens` to see cache writes.
- Read `usage.cache_read_input_tokens` to see cache reads.
- Treat Layer 2 `ttl: "1h"` as a deliberate cost trade-off because the write multiplier is higher than the 5-minute cache.

Invalidation risks:
- Moving the user request, timestamp, command output, or diff before the cache breakpoint.
- Changing tool definitions, system instructions, selected rule text, or model.
- Placing the breakpoint on a block that changes every request.
- Exceeding provider breakpoint or lookback limits.

## OpenAI

Official source: <https://developers.openai.com/api/docs/guides/prompt-caching>

OpenAI prompt caching is automatic for supported models when prompts meet the provider threshold. Downstream integrations should maximize exact prefix reuse by placing Layer 1 first, Layer 2 second, and Layer 3 last.

```json
{
  "model": "gpt-4o-2024-08-06",
  "prompt_cache_key": "agentic-senior-core:v4:rules-pack:<stable-task-family>",
  "input": [
    {
      "role": "system",
      "content": "<layer_1_static_prefix>\n\n<layer_2_semi_static_context>"
    },
    {
      "role": "user",
      "content": "<layer_3_dynamic_suffix>"
    }
  ]
}
```

Observation:
- Read `usage.prompt_tokens_details.cached_tokens`.
- Cache hits require exact reusable prefixes; log cached-token ratios rather than claiming fixed savings.

Invalidation risks:
- Putting variable user-specific data before the stable prefix.
- Changing tools, structured output schema, image detail settings, model, or prompt prefix bytes.
- Using too many different `prompt_cache_key` values for the same reusable prefix.
- Exceeding routing-rate guidance for a single prefix/key pair.

## Gemini

Official source: <https://ai.google.dev/gemini-api/docs/caching>

Gemini supports explicit cached content. Downstream integrations can create a cache object for stable Layer 1 and Layer 2 content, then reference it from the dynamic request. The cache lifecycle belongs to the downstream integration, not this package.

Create cached content:

```json
{
  "model": "models/gemini-2.5-flash",
  "systemInstruction": {
    "parts": [
      {
        "text": "<layer_1_static_prefix>"
      }
    ]
  },
  "contents": [
    {
      "role": "user",
      "parts": [
        {
          "text": "<layer_2_semi_static_context>"
        }
      ]
    }
  ],
  "ttl": "300s"
}
```

Use cached content:

```json
{
  "contents": [
    {
      "role": "user",
      "parts": [
        {
          "text": "<layer_3_dynamic_suffix>"
        }
      ]
    }
  ],
  "cachedContent": "<cached-content-name>"
}
```

Observation:
- Read response `usage_metadata` / SDK `usageMetadata`.
- Read cache metadata for `usage_metadata`, `create_time`, `update_time`, and `expire_time` when inspecting cache objects.
- Report eligibility and observed metadata. Do not claim exact savings unless model-specific pricing and storage costs are encoded with source metadata.

Invalidation risks:
- Recreating cache objects for every request instead of reusing stable content.
- Mixing volatile user data into cached content.
- Letting TTL expire without refreshing the cache lifecycle.
- Changing model or stable corpus content.

## Non-Blocking Providers

Grok, DeepSeek, and Qwen remain `estimate-only` in Phase 2. Do not add request-shape examples until official provider caching docs and SDK/API affordances are verified.

## Integration Rules

- Keep API keys outside examples and logs.
- Keep Layer 3 dynamic content outside cached provider objects.
- Record provider, model, source URL, `verifiedAt`, and cache observation fields with every downstream measurement.
- Separate measured token counts from economic projections.
- Mark OpenAI and Gemini savings as unknown or model-specific until current official pricing metadata is encoded.
