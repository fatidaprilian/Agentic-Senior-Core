# PrefixBridge Architecture

Status: planned, unshipped.
Last updated: 2026-05-18.

## Overview

PrefixBridge is a local user-space cache bridge.

```text
project guidance
  -> asc cache compile
  -> stable prefix manifest
  -> IDE sends request to localhost bridge
  -> bridge detects matching stable prefix
  -> bridge injects provider cache markers
  -> upstream provider returns usage fields
  -> asc cache doctor reports cache hit/miss evidence
```

## Core Components

### 1. Stable Prefix Compiler

The compiler reads static context and emits a deterministic prefix manifest.

Inputs:

- `AGENTS.md`
- `CLAUDE.md`
- `GEMINI.md`
- selected stable rules
- stable tool policy
- stable project profile
- optional skill pack

Outputs:

- stable prefix text or block sequence
- source file hashes
- normalized block ordering
- cache boundary manifest
- invalidation reasons when a source changes

It must keep volatile content out of the prefix:

- current timestamp
- current branch status
- live file tree
- current diff
- recent command output
- active user task
- tool result
- changing chat history

### 2. Cache Bridge

The bridge listens on localhost and forwards requests to the provider.

MVP path:

```text
Anthropic-compatible inbound
  -> Anthropic upstream
```

Later path:

```text
OpenAI-compatible inbound
  -> OpenAI upstream with stable prompt_cache_key

OpenAI-compatible inbound
  -> Anthropic upstream translation
```

The later translation path is high risk and should not be MVP.

### 3. Cache Boundary Protocol

The bridge needs a deterministic boundary. Use a sidecar manifest first.

MVP should avoid in-prompt markers because markers can be copied, reordered, or interpreted by tools. Sidecar JSON is easier to test.

### 4. Cache Warm

`asc cache warm` sends the stable prefix before the user begins the real task.

The command should:

- compile the prefix
- send the smallest legal provider request
- record prefix hash
- record provider
- record model
- record cache creation usage when visible
- record time and expected time-to-live

Do not assume `max_tokens: 0` works everywhere. Probe provider behavior and use the smallest legal output budget when needed.

### 5. Cache Doctor

`asc cache doctor` reports:

- bridge reachable
- traffic observed
- prefix hash stable or drifting
- cache creation tokens
- cache read tokens
- cached token ratio
- time to first token trend
- volatile content found before the boundary
- unsupported payload features

Classify evidence:

```text
direct: provider usage fields prove cache write/read
indirect: stable prefix hash and latency trend support the conclusion
inferred: traffic shape suggests a hit, but provider usage is unavailable
```

## Request Handling Rules

The bridge must not change prompt meaning.

Allowed transformations:

- split a known stable prefix block from dynamic suffix when the manifest proves an exact match
- add Anthropic `cache_control` to cacheable blocks
- set OpenAI `prompt_cache_key` when supported
- preserve request body semantics and ordering

Forbidden transformations:

- arbitrary prompt reordering
- deleting user content
- deleting tool output
- rewriting instructions
- injecting behavior changes
- changing model output style
- storing raw prompts by default

## Provider Handling

### Anthropic

Anthropic is the best first target because prompt caching supports explicit block-level cache control.

The bridge maps stable blocks to:

```json
{"cache_control": {"type": "ephemeral"}}
```

The bridge must report:

- `cache_creation_input_tokens`
- `cache_read_input_tokens`
- `input_tokens`
- `output_tokens`

### OpenAI

OpenAI prompt caching is automatic for long repeated prefixes. PrefixBridge can help by preserving exact stable prefix structure and setting `prompt_cache_key` where supported.

The bridge must report:

- `usage.prompt_tokens_details.cached_tokens`
- input token count
- output token count

Do not claim explicit cache insertion for OpenAI. Treat it as stable-prefix discipline plus routing hints.

## Failure Behavior

If PrefixBridge cannot prove a safe cache boundary:

1. Forward the request unchanged.
2. Report `cache_mode: passthrough`.
3. Explain why no cache marker was injected.

Cache optimization must never break the agent session.
