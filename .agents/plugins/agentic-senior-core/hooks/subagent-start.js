#!/usr/bin/env node
// Agentic Senior Core — SubagentStart hook
// SessionStart context is parent-thread only and never reaches subagents.
// This injects the same ruleset into each subagent.

const fs = require('fs');
const path = require('path');

const pluginRoot = process.env.CLAUDE_PLUGIN_ROOT || path.resolve(__dirname, '..');
const isCopilot = Boolean(process.env.COPILOT_PLUGIN_DATA);
const isCodex = !isCopilot && Boolean(process.env.PLUGIN_DATA);

let content;
try {
  content = fs.readFileSync(path.join(pluginRoot, 'AGENTS.md'), 'utf8');
} catch (e) {
  process.exit(0);
}

try {
  if (isCodex) {
    process.stdout.write(JSON.stringify({
      hookSpecificOutput: {
        hookEventName: 'SubagentStart',
        additionalContext: content,
      },
    }));
  } else {
    process.stdout.write(JSON.stringify({
      hookSpecificOutput: {
        hookEventName: 'SubagentStart',
        additionalContext: content,
      },
    }));
  }
} catch (e) {
  // Silent fail
}
