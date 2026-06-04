# Token Usage Benchmark

Measures rules-pack delivery cost per provider per fixture. Phase 0 captures the unmodified baseline.

## Status

| Component | Status |
|-----------|--------|
| Fixtures (Task 0.2) | Done |
| Token counter (Task 0.3) | Done |
| Runners + orchestrator (Task 0.4) | Done |

## Folder Structure

```
token-usage/
├── fixtures/    10 representative task fixtures (JSON)
├── runners/     Per-provider token measurement runners (claude, openai, gemini, _shared)
├── lib/         Shared token counter and tests
├── run-baseline.mjs  Orchestrator that aggregates all runners
└── README.md
```

## Fixture Coverage Matrix

10 fixtures covering 19 distinct rules, prompts, and checklists. Distribution per `phase-0-baseline.md`: 3 scaffolding, 2 design-ui, 2 backend, 1 security, 1 refactor, 1 review.

Rules covered: `testing`, `architecture`, `error-handling`, `database-design`, `api-docs`, `performance`, `security`, `frontend-architecture`, `init-project`, `bootstrap-design`, `microservices`, `docker-runtime`, `event-driven`, `refactor`, `review-code`, `pr-checklist`, `architecture-review`.

Known gap: the `realtime` rule has no fixture in the Phase 0 set. Add one in Phase 3 if evaluation needs that signal. Phase 0 baseline does not block on this.

## Usage

Run the full baseline (writes to `benchmarks/results/baseline-{YYYY-MM-DD}.json`):

```
node benchmarks/token-usage/run-baseline.mjs
```

Print to stdout without writing the file:

```
node benchmarks/token-usage/run-baseline.mjs --stdout-only
```

Run one provider in isolation (useful for debugging):

```
node benchmarks/token-usage/runners/openai-runner.mjs
node benchmarks/token-usage/runners/claude-runner.mjs
node benchmarks/token-usage/runners/gemini-runner.mjs
```

## Measurement Methodology

For each fixture the runners measure two scenarios:

1. **`always_included`** — the system prompt is `AGENTS.md` only. Lower-bound view of what every task ships.
2. **`with_loaded_rules`** — the system prompt is `AGENTS.md` plus rule files resolved from the fixture's `expected_rules_triggered` list. Resolution searches `.agent-context/rules/`, `.agent-context/prompts/`, and `.agent-context/review-checklists/` in that order. This represents the realistic on-demand-routed delivery per the AGENTS.md routing table.

Each scenario yields `total = system_prompt + user_message` plus per-component byte counts.

## Providers Covered

| Provider | Counting Method | Accurate Flag |
|----------|-----------------|---------------|
| Anthropic Claude | `@anthropic-ai/sdk` `messages.countTokens` (free endpoint, requires API key) | true with key, false without |
| OpenAI | `tiktoken` matched encoder per model (offline) | true |
| Google Gemini | `@google/genai` `models.countTokens` (free endpoint, requires API key) | true with key, false without |
| xAI Grok | `tiktoken` cl100k_base estimate | false |
| DeepSeek | `tiktoken` cl100k_base estimate | false |
| Qwen | `tiktoken` cl100k_base estimate | false |

## Required Environment Variables

| Variable | Effect |
|----------|--------|
| `ANTHROPIC_API_KEY` | Enables native `messages.countTokens` for Claude. Without it the runner falls back to a tiktoken cl100k_base estimate and reports `accurate: false`. |
| `GOOGLE_API_KEY` or `GEMINI_API_KEY` | Enables native `models.countTokens` for Gemini. Same fallback behavior as above. |
| `ANTHROPIC_MODEL` | Override the Claude model id (default `claude-sonnet-4-5-20250929`). |
| `OPENAI_MODEL` | Override the OpenAI model id (default `gpt-4o-2024-08-06`). OpenAI counting is fully offline via tiktoken — no key required. |
| `GEMINI_MODEL` | Override the Gemini model id (default `gemini-2.5-flash`). |

This benchmark NEVER calls a generation API. Network calls are limited to the free count-tokens endpoints when an API key is supplied.

## Constraint Reminder

- Phase 0 is measurement-only. Do not modify rules pack content.
- Do not call any generation API. Counting only.
- SDKs live in `devDependencies`, never in `dependencies`.
