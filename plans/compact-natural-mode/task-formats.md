# Compact Natural Task Formats

Status: installed format reference.
Last updated: 2026-05-22.

Use these as output shapes, not rigid templates. Omit fields that do not apply, except required safety fields.

## Debug Or Root Cause

```text
Root Cause: <one sentence>
Evidence: <exact error, file:line, command output, or observed behavior>
Fix: <exact command or code direction>
Risk: <only if relevant>
Next: <verification step>
```

Preserve exact error strings, file paths, line numbers, and commands.

## Test Failure

```text
Failed: <test name>
Expected: <value or condition>
Got: <value or condition>
At: <file:line>
Fix direction: <one sentence>
```

If the test runner crashed before tests ran, say that explicitly.

## Code Review Finding

```text
[critical|warn|nit] <file>:<line> - <concern>. <requested change>
```

Lead with blocking issues. Do not compress away impact or the concrete requested change.

## Implementation Or Refactor Summary

```text
Changed: <what changed>
Reason: <why>
Behavior change: <yes/no, with detail if yes>
Validation: <what ran or was not run>
Risk: <only if relevant>
```

Never imply behavior preservation if it was not verified.

## Planning Or Architecture

Use prose. Include:

- decision
- rationale
- alternatives considered
- tradeoffs
- assumptions
- open questions

Do not over-compress planning. The reasoning is part of the deliverable.

## Destructive Command

```text
WARNING: <what this destroys and whether it is reversible>
Command: <exact command>
Precondition: <what must be true before running>
```

Do not shorten the warning into a casual aside.

## Commit Message

```text
<type>(<scope>): <imperative summary>

<optional body only when motivation, migration, or breaking behavior is not obvious>
```

Use the body only when it changes what a future maintainer needs to know.

## PR Description

```text
Why: <motivation>
Changed: <short list>
Validation: <commands or checks>
Risk: <only if relevant>
Breaking change: <none or exact detail>
```

Keep reviewer context, not development narration.

## Security Finding

Use low compression:

```text
Severity: <critical|high|medium|low>
Class: <vulnerability class>
Location: <file:line>
Impact: <who or what is affected>
Evidence: <exact code, behavior, or command output>
Remediation: <specific fix direction>
Validation: <how to prove it is fixed>
```

Do not remove reproduction, impact, or remediation to save tokens.
