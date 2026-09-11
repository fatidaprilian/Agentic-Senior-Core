# ASC Benchmark Methodology

Measures the impact of ASC rules on AI-assisted coding sessions.

## Metrics

| Metric | Source | Unit |
|--------|--------|------|
| LOC delta | `git diff --stat` | Lines added/removed |
| Token usage | Session transcript | Input + output tokens |
| Session cost | Provider billing | USD |
| Session duration | Timestamp delta | Seconds |
| Safety violations | Manual review | Count (0 = pass) |

## Protocol (finalized 2026-09-11 from verified evidence)

Design template: Lulla et al. 2026, arXiv:2601.20404 (paired within-task, real-PR scope) — the closest published methodological precedent for rules-file intervention studies.

1. Select a real-world task set (minimum 4 tasks across different domains). Tasks written by the ASC author carry selection bias; mitigations: (a) derive at least 2 tasks from real open-source PRs/issues, (b) publish task prompts verbatim so others can audit.
2. Run each condition at least **n=5 times** (paired: same task, same seed, with/without ASC per repeat). Rationale: identical code-generation requests produce different outputs in 47-76% of runs (Ouyang et al., TOSEM 2023, doi:10.1145/3697010).
3. Use the same model, temperature, and seed for both conditions.
4. Statistics: **paired bootstrap with confidence intervals** (not p-values alone; standard power calculators misestimate paired-LLL comparisons by ~2x, arXiv:2606.30315). At n=5, parametric tests are underpowered and error distributions are non-normal (Kitchenham & Madeyski, EMSE 2024) — report probability of superiority / Cliff's d as effect sizes. Apply **Benjamini-Yekutieli FDR correction** across the 4 metrics. If a CI includes zero, report "no significant difference" — do not claim the point estimate.
5. Primary metrics (validity-ranked):
   - **Billed cost end-to-end** (dollars from the provider, not token counts) — required because compression that reduces tokens can raise cost by breaking prompt-cache locality (PointFive, arXiv:2607.12161, 2,908-run paired study).
   - **Test pass rate / task completion** (established automatic correctness metric).
   - **Token usage** (input, output, and cache-read split if the provider reports it).
6. Secondary metrics (noisy — never primary): static-analysis warning counts, jscpd duplication, LOC delta. Cyclomatic complexity is excluded as a primary metric (no meaningful defect correlation, Kendall tau 0.064, arXiv:1912.01142). LLM-as-judge is excluded as primary (GPT-4-turbo frequently misjudges code correctness, Crupi et al., IEEE TSE 2025); if ever used: different model family, position-swapped, human-calibrated.
7. **ascx precondition**: because ascx rewrites tool output before it enters context, it can perturb prompt-cache hit rates between turns. Benchmark runs must either (a) run without ascx in both conditions, or (b) run with ascx in both conditions AND report cache-hit accounting — never mixed. Measure the ascx-on vs ascx-off cost delta as its own paired experiment before trusting any token-reduction claim in results.
8. Safety tier runs separately: adversarial prompts that test whether security rules hold.
9. Current RESULTS.md (n=1-2, single model) is **directional only** and must be labeled as such until this protocol completes.
10. Cost control: at ~$0.15-0.30/run on a budget model, 4 tasks x 5 paired runs = 40 runs, roughly $6-12. Before self-funding, check eligibility for Anthropic "Claude for Open Source" (6 months Claude Max for OSS maintainers, Feb 2026) and research credits.

## Task categories

- **Greenfield**: Build a small feature from scratch.
- **Refactor**: Improve existing code without changing behavior.
- **Bug fix**: Diagnose and fix a reported bug.
- **Dependency**: Add or replace a third-party dependency.

## Running

Three runners exist:

0. **OpenCode runner (recommended for AgentRouter — verified working)**: spawns `opencode run` per session. OpenCode is a client AgentRouter's 401 gate accepts (plain HTTP clients are rejected), and its `--format json` event stream reports per-step usage including the cache read/write split. ASC condition is toggled by writing AGENTS.md (OpenCode's native rules file) into the sandbox work dir.

```sh
npm install -g opencode-ai
set AGENTROUTER_API_KEY=...
node benchmarks/harness/opencode-run.mjs --task benchmarks/tasks/greenfield-api --runs 5
node benchmarks/harness/opencode-run.mjs --task <dir> --condition with-asc --runs 1   # single condition
node benchmarks/harness/opencode-run.mjs --task <dir> --timeout 180                   # per-session timeout (seconds, default 600)
node benchmarks/harness/report.mjs                                                    # paired stats + bootstrap CI
```

Note on accounting: OpenCode's `tokens.input` **excludes** cached tokens; the parser recombines them into full prompt tokens before billing. Results are `benchmarks/.cache/opencode-<task>-<condition>-<timestamp>.json`; clean the directory before a fresh batch so stale records don't blend into the report.

1. **Headless harness (direct API — blocked on AgentRouter)**: talks directly to any OpenAI-compatible `/v1/chat/completions` endpoint via a built-in tool-calling loop (read_file / write_file / run_command). Works with providers that accept plain HTTP clients; AgentRouter 401-rejects them ("unauthorized client detected"), which is why the OpenCode runner exists.

```sh
# Requires: AGENTROUTER_API_KEY (or any OpenAI-compatible endpoint via AGENTROUTER_BASE_URL)
set AGENTROUTER_API_KEY=...
node benchmarks/harness/run.mjs --task benchmarks/tasks/greenfield-api --runs 5
node benchmarks/harness/run.mjs --task <dir> --condition with-asc --runs 1   # single condition
node benchmarks/harness/run.mjs --task <dir> --dry-run                      # no-network smoke test (mock transport)
node benchmarks/harness/report.mjs                                          # paired stats + bootstrap CI
```

Default rate card matches AgentRouter glm-5.3 (input $5/M, output $25/M, cache read $2.5/M, group ratio 1). Cached-token accounting requires the provider to report `prompt_tokens_details.cached_tokens`; if absent, cached tokens are counted as regular input (conservative).

2. **Claude CLI runner (legacy — requires the `claude` binary)**: original runner; kept for Claude Code users.

```sh
node benchmarks/run.mjs --task <task-dir> --with-asc --model <model-id>
node benchmarks/run.mjs --task <task-dir> --without-asc --model <model-id>
node benchmarks/report.mjs
```

## Output

Results are written to `benchmarks/.cache/results-<timestamp>.json` and summarized as:

```
| Metric         | With ASC | Without ASC | Delta   |
|----------------|----------|-------------|---------|
| LOC added      | ...      | ...         | -X%     |
| Tokens used    | ...      | ...         | -X%     |
| Cost           | ...      | ...         | -X%     |
| Duration       | ...      | ...         | -X%     |
| Safety pass    | ...      | ...         | ...     |
```
