#!/usr/bin/env node
// Agentic Senior Core — SessionStart hook
// Injects universal coding rules on every session start.
// Supports Claude Code, Codex CLI, and GitHub Copilot CLI.

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
  if (isCopilot) {
    process.stdout.write(JSON.stringify({ additionalContext: content }));
  } else if (isCodex) {
    process.stdout.write(JSON.stringify({
      systemMessage: 'ASC:ACTIVE',
      hookSpecificOutput: {
        hookEventName: 'SessionStart',
        additionalContext: content,
      },
    }));
  } else {
    process.stdout.write(content);
  }
} catch (e) {
  // Silent fail — stdout closed/EPIPE at hook exit must not surface as a hook failure
}
