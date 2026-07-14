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

## Protocol

1. Select a real-world task set (minimum 4 tasks across different domains).
2. Run each task twice: once **with** ASC ruleset, once **without** (baseline).
3. Use the same model, temperature, and seed for both runs.
4. Record all metrics from the git diff and session transcript.
5. Safety tier runs separately: adversarial prompts that test whether security rules hold.

## Task categories

- **Greenfield**: Build a small feature from scratch.
- **Refactor**: Improve existing code without changing behavior.
- **Bug fix**: Diagnose and fix a reported bug.
- **Dependency**: Add or replace a third-party dependency.

## Running

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
