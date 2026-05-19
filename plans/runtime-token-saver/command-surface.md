# Planned Command Surface

Status: planned, unshipped.
Last updated: 2026-05-18.

## Short Alias

Add `asc` as the preferred short alias.

Keep `agentic-senior-core` for backward compatibility.

## Core Commands

Planned public commands:

```bash
asc init
asc upgrade
asc optimize install
asc optimize status
asc optimize off
asc optimize doctor
asc mcp
```

Backward-compatible commands:

```bash
agentic-senior-core init
agentic-senior-core upgrade
agentic-senior-core optimize --show
agentic-senior-core mcp
```

## `asc optimize install`

Purpose: enable ASC runtime token saving.

Expected behavior:

1. Verify the project is initialized.
2. Install or expose `ascx`.
3. Write runtime token saver state.
4. Add project guidance for supported agents.
5. Detect RTK and 9Router.
6. Warn if another runtime compressor appears active.
7. Print the exact commands to test the wrapper.

It must not:

- install 9Router
- install RTK
- manage provider keys
- edit global shell aliases without explicit opt-in
- claim transparent hook support unless tested

## `asc optimize status`

Purpose: show current optimization mode.

Expected output fields:

```text
mode: policy-only | runtime-on | runtime-off | external-runtime-detected | conflict-risk
ascx: found | missing
tee: writable | not-writable | disabled
rtk: detected | not-detected
9router: reachable | unreachable | not-checked
warnings: [...]
next_action: ...
```

This replaces or complements `agentic-senior-core optimize --show`.

## `asc optimize off`

Purpose: disable ASC runtime compression.

Expected behavior:

1. Preserve existing governance files.
2. Disable ASC runtime token saver state.
3. Leave policy guidance intact unless the user asks to remove it.
4. Print how to re-enable with `asc optimize install`.

Use case:

- User wants to use RTK.
- User wants to use 9Router Token Saver.
- User is debugging compression behavior.

## `asc optimize doctor`

Purpose: diagnose runtime token saving risks.

Checks:

- project initialized
- `ascx` available
- `ascx` executable from PATH or local npm bin
- tee folder writable
- raw tee cleanup status
- RTK binary present
- 9Router endpoint reachable
- likely double-compression risk
- supported shell detected
- native Windows limitations
- unsupported built-in tool warning
- benchmark fixture availability

The doctor command should prefer clear remediation:

```text
Conflict risk: 9Router Token Saver appears reachable.
Action: keep ASC runtime saver off, or disable 9Router Token Saver before enabling ASC runtime saver.
```

## `ascx`

Purpose: execute and compact a supported command.

Examples:

```bash
ascx git status
ascx git diff
ascx rg "TODO"
ascx npm test
ascx npm run build
```

Exit code behavior:

- Preserve the original command exit code.
- Never return success if the original command failed.
- If compression fails, return raw output and preserve exit code.

Passthrough behavior:

- Unknown commands pass through.
- Unsafe shell constructs pass through.
- Piped or redirected output should pass through unless explicitly supported.

## Compatibility Rule

Use one runtime compressor by default.

Recommended states:

```text
ASC runtime saver on, RTK off, 9Router Token Saver off
ASC runtime saver off, RTK on
ASC runtime saver off, 9Router Token Saver on
```

Advanced users can override this later, but the default CLI should warn hard.
