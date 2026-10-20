// Native Kilo / OpenCode Plugin for Agentic Senior Core
// Hooks into system prompt transform, session compaction, and shell environment.

const ASC_GUARDRAILS = `
# Agentic Senior Core Rules
- Write code like a staff engineer. Efficient, safe, maintainable.
- Before writing code: 1) Need built? 2) Codebase reuse? 3) Stdlib? 4) Dependency? 5) One function? 6) Minimum code.
- Parameterize all queries. Validate inputs at trust boundaries. Never commit secrets.
- Early returns over deep nesting. Delete code that carries no value.
`;

const setup = async (ctx) => {
  if (ctx.session?.hook) {
    await ctx.session.hook("context", (event) => {
      if (Array.isArray(event.system)) {
        const hasASC = event.system.some(item =>
          (typeof item === 'string' && item.includes('Agentic Senior Core')) ||
          (item && typeof item === 'object' && item.text && item.text.includes('Agentic Senior Core'))
        );
        if (!hasASC) {
          event.system.push({ type: "text", text: ASC_GUARDRAILS.trim() });
        }
      }
    });

    await ctx.session.hook("compaction", (event) => {
      if (Array.isArray(event.context)) {
        event.context.push(
          "## Agentic Senior Core (Persisted Context)\n" +
          "- Maintain strict security guardrails and non-breaking API contracts.\n" +
          "- Prefer clean minimal logic over premature abstractions."
        );
      }
    });
  }

  if (ctx.shell?.hook) {
    await ctx.shell.hook("create.before", (event) => {
      if (event.env) {
        event.env.ASC_ENABLED = "1";
      }
    });
  }
};

const server = async ({ project, directory, worktree }) => {
  return {
    "experimental.chat.system.transform": async (input, output) => {
      if (Array.isArray(output.system)) {
        const hasASC = output.system.some(item => typeof item === 'string' && item.includes('Agentic Senior Core'));
        if (!hasASC) {
          output.system.push(ASC_GUARDRAILS.trim());
        }
      }
    },
    "experimental.session.compacting": async (input, output) => {
      if (Array.isArray(output.context)) {
        output.context.push(
          "## Agentic Senior Core (Persisted Context)\n" +
          "- Maintain strict security guardrails and non-breaking API contracts.\n" +
          "- Prefer clean minimal logic over premature abstractions."
        );
      }
    },
    "shell.env": async (input, output) => {
      if (output.env) {
        output.env.ASC_ENABLED = "1";
      }
    },
  };
};

export default {
  id: "agentic-senior-core",
  setup,
  server,
};

