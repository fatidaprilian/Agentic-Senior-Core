# Cache Boundary Protocol

Status: planned, unshipped.
Last updated: 2026-05-18.

## Purpose

The Cache Boundary Protocol tells PrefixBridge which parts of a coding-agent prompt are stable enough to cache.

The protocol must be deterministic, inspectable, and provider-neutral.

## MVP Format

Use a sidecar JSON manifest first.

Suggested path:

```text
.agent-context/state/cache-boundary-manifest.json
```

Schema sketch:

```json
{
  "schema": "asc.cacheboundary.v1",
  "prefixId": "sha256:example",
  "createdAt": "2026-05-18T00:00:00.000Z",
  "providerTargets": ["anthropic", "openai"],
  "blocks": [
    {
      "id": "policy.core",
      "source": "AGENTS.md",
      "hash": "sha256:example",
      "cacheable": true,
      "ttlPreferenceSeconds": 300
    },
    {
      "id": "adapter.claude",
      "source": "CLAUDE.md",
      "hash": "sha256:example",
      "cacheable": true,
      "ttlPreferenceSeconds": 300
    },
    {
      "id": "project.profile",
      "source": ".agent-context/state/onboarding-report.json",
      "hash": "sha256:example",
      "cacheable": true,
      "ttlPreferenceSeconds": 300
    },
    {
      "id": "task.runtime",
      "source": "dynamic",
      "cacheable": false,
      "invalidateReason": "task_state"
    }
  ],
  "boundary": {
    "stableEndBlock": "project.profile",
    "dynamicStartBlock": "task.runtime"
  }
}
```

## Required Properties

Each cacheable block needs:

- stable ID
- source path
- content hash
- cacheable flag
- time-to-live preference

The boundary needs:

- last stable block
- first dynamic block
- invalidation reason when changed

## Normalization Rules

The compiler must normalize:

- line endings
- trailing whitespace
- block order
- heading labels
- repeated blank lines
- generated metadata order

The compiler must not normalize meaning:

- do not rewrite rules
- do not summarize rules
- do not delete safety constraints
- do not merge unrelated policy blocks

## Volatile Content Rules

Never include these in cacheable prefix blocks:

- current date/time
- git status
- git diff
- current task wording
- command output
- latest test result
- open editor tabs
- model response history
- web search results unless explicitly frozen with fetched-at metadata

## Provider Mapping

### Anthropic

Map stable blocks to Anthropic content blocks and add cache control at safe boundaries.

Provider behavior to verify:

- cache applies to `tools`, `system`, and `messages` in provider-defined order
- cache read/write token fields appear in usage
- cache time-to-live matches selected cache type

### OpenAI

Do not inject Anthropic-style fields.

Use:

- stable prefix ordering
- `prompt_cache_key` where available
- usage `cached_tokens` diagnostics

## Marker Format For Later

If sidecar matching is not enough, add harmless comment markers later:

```html
<!-- ASC_CACHE_BOUNDARY_START id="policy.core" -->
...
<!-- ASC_CACHE_BOUNDARY_END id="project.profile" -->
```

Do not use comment markers in the MVP unless a real IDE path needs them.

## Invalidation

Invalidate the prefix when:

- any cacheable source hash changes
- block order changes
- provider target changes
- model family changes in a way that changes tokenization or cache behavior
- tool schema changes
- cache policy changes

The doctor command should report the exact invalidation reason.
