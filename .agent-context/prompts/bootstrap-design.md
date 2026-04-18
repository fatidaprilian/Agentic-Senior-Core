
# Bootstrap DESIGN.md (UI/UX Art Direction)

When a user requests frontend design or redesign, the agent should automatically synthesize a complete DESIGN.md covering:
- Visual identity (color palette, typography, spacing, iconography)
- Layout and navigation principles
- Component library and atomic design system
- Accessibility and responsive guidelines
- User journey and interaction flows
- Design tokens and handoff notes for developers

The agent must:
1. Read [AGENTS.md](../AGENTS.md) for project context and team roles.
2. Scan all files in [.agent-context/rules/](../.agent-context/rules/) for UI/UX and accessibility standards.
3. Reference [docs/deep-dive.md](../docs/deep-dive.md) and [docs/faq.md](../docs/faq.md) for architecture and product background.
4. If [docs/DESIGN.md](../docs/DESIGN.md) exists, check for drift and propose improvements instead of rewriting from scratch.
5. All references to docs or rules must be clickable markdown links.

Output:
- Write a full DESIGN.md in markdown, with clear sections and clickable links to referenced docs/rules.
- Use practical, modern, and accessible design language.
- Wait for user approval before generating Figma or code assets.
