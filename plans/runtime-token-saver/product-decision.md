# Product Decision: Runtime Token Saver

Status: ASCX MVP implemented locally; broader install/off lifecycle remains planned.
Last updated: 2026-05-23.

## Current State

The original token optimization feature was mostly guidance:

- It can write token optimization state.
- It can tell agents to prefer compact commands.
- It can detect external tools when present.
- It could not guarantee that a coding agent actually followed the guidance.
- It could not compress raw command output unless the runtime path was controlled by another tool.

The first runtime path now exists as the explicit `ascx` wrapper. It compresses only the measured MVP command set: `git status`, `git diff`, and `npm test`. Unknown commands and unsafe shell syntax still pass through without compression.

## Decision

Keep the runtime surface conservative. Do not expand ASCX beyond the measured command whitelist until each adapter has fixtures, evidence-preservation checks, and continuation checks.

Keep `asc optimize status` and `asc optimize doctor` as readiness surfaces. The full `asc optimize install` and `asc optimize off` lifecycle remains planned.

The product should become:

```text
Agentic-Senior-Core
= agent governance
+ adaptive context selection
+ safe runtime token saving for coding-agent evidence
```

## Why Build It

RTK proves that CLI command compression is a real product category. 9Router proves that runtime token saving plus observability is valuable. The missing ASC-specific opportunity is evidence preservation.

ASC should not compete by claiming the highest compression ratio. It should compete by preserving the evidence a coding agent needs to debug safely.

The product promise:

```text
Compress less blindly. Preserve the evidence that matters.
```

## Differentiator

ASCX Token Saver should stay evidence-preserving:

- Preserve failing command.
- Preserve exit code.
- Preserve file paths.
- Preserve line numbers.
- Preserve root error messages.
- Preserve assertion details.
- Preserve changed file summaries where relevant.
- Preserve truncation markers.
- Preserve raw output through a tee file.

The output should be smaller, but it must still be enough for the agent to take the next correct step.

## What Not To Build Now

Do not build a gateway in this repo.

Do not manage:

- API keys.
- OAuth sessions.
- Provider accounts.
- Subscription rotation.
- Model routing.
- Multi-provider fallback.
- Network proxy dashboards.

Those are 9Router-shaped concerns. They belong in a separate repo if ASC ever needs its own gateway.

Do not try to beat RTK by cloning every parser and every agent adapter in the first milestone. Start with a conservative command whitelist and a strong safety model.

## External Runtime Compatibility

Use one runtime compressor at a time.

ASC policy can coexist with external tools, but ASC runtime compression should not be enabled at the same time as another runtime compressor unless the user explicitly opts into advanced mode.

Default compatibility rule:

```text
If RTK runtime compression is active, keep ASC runtime saver off.
If 9Router Token Saver is active, keep ASC runtime saver off.
If ASC runtime saver is active, warn about RTK or 9Router Token Saver.
```

9Router can still be recommended for routing, dashboard, usage tracking, and multi-account workflows.

## Product Modes

Product modes:

```text
policy-only
runtime-on
runtime-off
external-runtime-detected
conflict-risk
```

Meanings:

- `policy-only`: guidance exists but no runtime wrapper is active.
- `runtime-on`: ASC wrapper is available and configured.
- `runtime-off`: ASC runtime saver is intentionally disabled.
- `external-runtime-detected`: RTK or 9Router appears active.
- `conflict-risk`: more than one runtime compressor may touch the same output.

## User-Facing Rule

The product should stay easy to explain:

```text
Run asc init for governance.
Run ascx for explicit evidence-preserving command compression.
Run asc optimize doctor if you use RTK, 9Router, Cursor, Claude Code, Codex, or another agent runtime.
```
