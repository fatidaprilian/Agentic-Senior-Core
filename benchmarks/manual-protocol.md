# Manual Roo Code Benchmark Protocol

Measures ASC impact in the user's actual setup: Roo Code + AgentRouter + GLM 5.3.
Valid specifically for that stack — which is the point: no model substitution, no
client-gate workarounds. Statistics come from the AgentRouter console log
(provider-billed), which is the primary metric per benchmarks/METHODOLOGY.md rule 5.

## What you need

- Roo Code with the AgentRouter profile configured and working (already done).
- AgentRouter console open: https://agentrouter.org/console/token — the "Log details"
  view per request (input tokens / cache tokens / output tokens / cost), like the
  example you already pasted.
- ~30-60 minutes of agent time across two sessions.

## Task set

Use the 4 existing tasks in `benchmarks/tasks/` (prompts are in each `prompt.md`).
Each task repo is self-contained; copy the `repo/` folder contents into a fresh
empty folder per run (e.g. `benchmarks/manual-run/<task>-<condition>-<n>/`).

## Conditions

Two conditions, toggled by whether ASC rules are active in the session:

- **with-asc**: your normal setup (ASC plugin rules active in Roo Code).
- **without-asc**: start a NEW Roo Code session with ASC rules disabled.
  Fastest toggle: in the Roo Code context, start the task in a folder that has
  no ASC-installed rules injected — or temporarily disable the ASC extension
  rules input — as long as the method is the same for every without-asc run.

Important: never mix conditions within one session. One session = one condition.

## Procedure (per task, per run)

1. Copy `benchmarks/tasks/<task>/repo/*` into a fresh empty folder.
2. Open that folder in a new VS Code window with a new Roo Code conversation.
3. Paste the task prompt from `benchmarks/tasks/<task>/prompt.md` verbatim.
4. Let the agent finish (cap at ~10 minutes or when it stops making progress).
5. Record from the AgentRouter console log for THIS session:
   - input tokens, cache tokens, output tokens, billed cost (USD)
   - number of requests (turns) in the session
6. Optionally measure the result: `git diff --stat` in the folder if you init'd
   a git repo first (recommended: `git init && git add -A && git commit -m base`
   before pasting the prompt).

## Run matrix (minimum for reportable stats)

n=5 pairs per task, 4 tasks = 40 sessions total. If budget/time constrained:

- Minimum viable: 2 tasks x 3 pairs = 12 sessions (report as pilot, n=3).
- Full: 4 tasks x 5 pairs = 40 sessions (reportable per METHODOLOGY.md).

Suggested order: alternate conditions (A B A B...) rather than all-A-then-all-B,
so time-of-day/model drift affects both conditions equally.

## Data template (fill per session)

```
task: greenfield-api
condition: with-asc
run: 1
date/time: 2026-09-11 18:00
input_tokens: 
cache_tokens: 
output_tokens: 
billed_cost_usd: 
requests: 
turns_est: 
notes: (agent finished / gave up / errors)
```

Paste the filled rows back into the ASC agent and it will compute paired stats
(median deltas, bootstrap CI) with `benchmarks/harness/report.mjs` conventions.

## What counts as a valid comparison

- Same task, same model, same profile, only ASC on/off differs.
- If the agent failed the task in one condition (broken code, gave up), note it —
  completion rate is a primary metric alongside cost (METHODOLOGY.md rule 5).
- Do not reroll a bad run; nondeterminism is expected and part of the data
  (Ouyang et al. 2023: 47-76% run-to-run variance — that is why n>=3).

## Known limitations

- Roo Code's own system prompt and tool surface differ from the headless harness;
  results here are valid for Roo Code + AgentRouter + GLM 5.3, and directional
  for other stacks.
- Manual logging means small n; treat single-task results as anecdote, not claim.
- If you use ascx-wrapped commands inside a session, keep it identical across
  conditions (METHODOLOGY.md rule 7: never mix ascx on/off between arms).
