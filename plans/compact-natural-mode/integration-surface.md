# Compact Natural Integration Surface

Status: installed prompt integration.
Last updated: 2026-05-22.

## Boundary

Compact Natural Mode enters the product as an instruction contract after benchmark validation.

It should not start as:

- a provider gateway
- a proxy
- a separate model call
- an ASCX adapter
- a shell command wrapper

## Initial Surface

The first safe surface is an agent-facing rule block under the canonical installed instructions.

Current placement:

```text
AGENTS.md
  Layer 5 prompt routing

.agent-context/prompts/
  compact-natural-mode.md
```

The root `AGENTS.md` should stay compact. Detailed examples and rubric text belong under `.agent-context/` or this plan folder.

## Runtime Behavior

The agent should:

1. Detect task type from the current request and work performed.
2. Select the matching task format.
3. Write the answer in compact natural prose.
4. Preserve mandatory evidence atoms exactly.
5. Run the second-pass check before final output.

No extra model call is required for the MVP.

## Relationship To ASCX

ASCX may produce compact command evidence with raw tee paths. Compact Natural Mode must preserve those paths and mention raw tee only when it matters for the next action.

Do not summarize away:

- ASCX exit code
- failing command
- raw tee path when the output was truncated or failure evidence exists
- truncation marker
- file path or line anchor

## Relationship To Token Optimization State

The existing token optimization state already describes compact high-signal output. Compact Natural Mode should refine that behavior only after benchmark coverage exists.

Do not add public claims about savings until the benchmark produces measured results for this repo.

## Later Surface

Possible later commands:

```bash
asc optimize compact status
asc optimize compact benchmark
```

Do not add these commands until the instruction-only mode has passed fixtures and proven that users need a CLI surface.
