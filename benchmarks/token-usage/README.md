# Token Usage Benchmark

Measure token consumption rules pack delivery per provider per fixture. Phase 0 mengukur baseline tanpa modifikasi rules pack.

## Status

| Component | Status |
|-----------|--------|
| Fixtures (Task 0.2) | Pending |
| Token counter (Task 0.3) | Pending |
| Runners + orchestrator (Task 0.4) | Pending |

## Folder Structure

```
token-usage/
├── fixtures/    10 representative task fixtures (JSON)
├── runners/     Per-provider token measurement runners
├── lib/         Shared token counter + utilities
└── README.md
```

## Usage (akan diisi setelah Task 0.4)

```
node benchmarks/token-usage/run-baseline.mjs
```

Output: `benchmarks/results/baseline-{YYYY-MM-DD}.json`.

## Providers Covered

| Provider | Counting Method | Accurate Flag |
|----------|-----------------|---------------|
| Anthropic Claude | `@anthropic-ai/sdk` `countTokens()` | true |
| OpenAI | `tiktoken` (matched encoder per model) | true |
| Google Gemini | `@google/genai` `countTokens()` | true |
| xAI Grok | `tiktoken` cl100k_base estimate | false |
| DeepSeek | `tiktoken` cl100k_base estimate | false |
| Qwen | `tiktoken` cl100k_base estimate | false |

## Required Environment Variables

Akan didokumentasikan di Task 0.4. Token counting Anthropic dan Gemini butuh API key (count_tokens endpoint mereka authenticated, walaupun tidak charge per call). OpenAI tiktoken offline.

## Constraint Reminder

- Phase 0 = measurement-only. Tidak boleh modify rules pack content.
- Tidak boleh actually call generation API — cukup count tokens.
- SDK masuk `devDependencies`, bukan `dependencies`.
