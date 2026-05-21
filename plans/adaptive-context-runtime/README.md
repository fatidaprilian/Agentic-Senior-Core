# Adaptive Context Runtime Plan

Status: in progress, live hardening.
Last updated: 2026-05-22.

Adaptive Context Runtime is the foundation plan for making Agentic-Senior-Core (ASC) choose the smallest sufficient context for each coding-agent request.

It answers this question:

```text
Which ASC rules, prompts, docs, state, and retrieval paths does this request need?
```

It does not answer provider account routing, dashboard, or prompt-cache mechanics. Those stay in later layers.

## Product Thesis

ASC already has a governed intent taxonomy:

```text
SEC-*   security, auth, secrets, permissions
ARCH-*  architecture, boundaries, structure
FE-*    frontend, UI, UX, design
DATA-*  persistence, data shape, schema
API-*   public contracts, CLI, API docs
TEST-*  testing and validation
ERR-*   error handling and failure contracts
MIG-*   migrations
OBS-*   observability
RES-*   resilience
CFG-*   config and flags
```

Most intent classifiers need a taxonomy before they can route requests. ASC already has one, and each label has defined scope, triggers, and rule files.

That makes ASC's first runtime advantage context selection, not model routing.

## Target Pipeline

The planned local-first pipeline is:

```text
User request
  -> deterministic trigger rules
  -> implication rules and repository context signals
  -> local multi-label classifier
  -> uncertainty check
  -> selected rules/prompts/docs/state
  -> optional retrieval
  -> model
  -> deterministic validation when available
```

Use a large language model (LLM) only for uncertain or open-world cases. Do not add a second LLM call as the default front door.

## Live Runtime Hardening

The current implementation must move beyond literal keyword matching before later token-saving layers become the focus:

1. Keep a fixture set of real user prompts, including implicit and Indonesian phrasing.
2. Label each fixture with required ASC rule families.
3. Add high-precision deterministic triggers for obvious cases.
4. Add implication rules for common combinations, such as migration plus failure, query plus slow, config plus exposed key, and auth middleware plus duplication.
5. Use repository context signals from known touched file paths when available.
6. Keep a context budget in the manifest so broad requests are visible before they load too many rule families.
7. Test embedding k-nearest-neighbor or SetFit-style classification as the local semantic layer after deterministic misses are measured.
8. Report missed required labels, extra labels, budget status, and ambiguous prompts.
9. Produce a selected context manifest for each fixture.

The runtime path does not need to call a model by default. It must prove that ASC can choose the right context pack locally and fall back only when uncertainty is genuinely high.

Current MVP files:

- `lib/cli/adaptive-context.mjs`: deterministic rule-family classifier and manifest builder.
- `lib/cli/adaptive-context/catalog.mjs`: rule-family triggers and selected docs/state catalogs.
- `lib/cli/adaptive-context/implications.mjs`: cross-label implication rules for natural phrasing.
- `lib/cli/adaptive-context/file-signals.mjs`: file path signals for repository-context-aware selection.
- `lib/cli/commands/context.mjs`: public CLI resolver for non-MCP usage.
- `scripts/adaptive-context/fixtures.mjs`: labeled fixture prompts.
- `scripts/adaptive-context-benchmark.mjs`: machine-readable fixture benchmark.
- `tests/adaptive-context.test.mjs`: behavior tests for label selection, fallback mode, and catalog coverage.

## Context Manifest

Each classified request should produce a manifest like:

```json
{
  "requestId": "fixture-auth-review-001",
  "labels": ["SEC", "API", "ERR", "TEST"],
  "selectedRules": [
    ".agent-context/rules/security.md",
    ".agent-context/rules/api-docs.md",
    ".agent-context/rules/error-handling.md",
    ".agent-context/rules/testing.md"
  ],
  "selectedPrompts": ["review-code.md"],
  "skippedRules": ["frontend-architecture.md", "docker-runtime.md"],
  "uncertainty": "low",
  "budget": {
    "status": "within-budget",
    "selectedRuleCount": 4,
    "maxRecommendedRuleCount": 5
  },
  "fallbackRequired": false
}
```

The manifest is a planning contract. The exact runtime shape can change after the validation spike.

## Relationship To Existing Plans

```text
Adaptive Context Runtime
  decides what stable context should be active.

PrefixBridge
  caches selected stable context after selection.

ASCX Runtime Token Saver
  compresses dynamic tool output after tools run.

Quality Routing
  chooses model strength later, after enough request and validation data exists.
```

## Non-Goals

Do not build these in the MVP:

- provider routing
- model marketplace
- account rotation
- dashboard
- OpenAI-to-Anthropic translation
- generic gateway runtime
- universal codebase graph retrieval
- semantic compression of active diffs or exact code under edit

## Validation Gates

Before implementation:

1. Fixtures cover docs, review, refactor, UI, API, security, data, test, and error-handling prompts.
2. Multi-label output handles overlapping requests such as auth review plus API contract plus tests.
3. Missed required labels are treated as higher severity than extra labels.
4. Selected context never omits mandatory security or testing rules for risky coding tasks.
5. Ambiguous requests can fall back to manual or LLM-assisted classification.
6. Normal fixtures stay within the recommended rule budget unless the request is intentionally broad.

Before release:

1. `npm run validate` passes.
2. The fixture benchmark is committed with expected manifests.
3. The runtime path can explain why each selected rule was loaded.
4. PrefixBridge integration is optional and disabled unless cache behavior is proven.
