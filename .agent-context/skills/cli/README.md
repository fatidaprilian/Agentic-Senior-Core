# CLI Domain

Default tier: `advance`

This domain groups CLI guidance into operational topics so command behavior stays consistent and automation-friendly.

## Topics
- [Init Flow](init.md)
- [Upgrade Flow](upgrade.md)
- [Machine-Readable Output](output.md)

## Default Pack Behavior
- Use `advance` for day-to-day commands.
- Escalate to `expert` when commands mutate user state or need recovery semantics.