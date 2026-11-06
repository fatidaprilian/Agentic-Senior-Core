#!/usr/bin/env node
// Agentic Senior Core — SessionStart hook
// Injects universal coding rules on session start for Claude Code, Codex CLI, and Copilot CLI.
// If invoked under Antigravity SessionStart, returns valid JSON (rules/agentic-senior-core.md
// is already loaded natively via plugin rules/).

const fs = require('fs');
const path = require('path');
const { isAntigravityPayload } = require('./path-util.cjs');

const pluginRoot = process.env.CLAUDE_PLUGIN_ROOT || path.resolve(__dirname, '..');
const isCopilot = Boolean(process.env.COPILOT_PLUGIN_DATA);
const isCodex = !isCopilot && Boolean(process.env.PLUGIN_DATA);
const isAntigravityEnv = Boolean(
  process.env.ANTIGRAVITY_LS_ADDRESS ||
  process.env.ANTIGRAVITY_CSRF_TOKEN ||
  process.env.ANTIGRAVITY_CLI
);

function emitForHost(stdinData) {
  if (isAntigravityEnv || isAntigravityPayload(stdinData)) {
    process.stdout.write('{}\n');
    return;
  }

  let content;
  try {
    content = fs.readFileSync(path.join(pluginRoot, 'rules', 'agentic-senior-core.md'), 'utf8');
  } catch (_) {
    return;
  }

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
}

if (process.stdin.isTTY) {
  try { emitForHost(null); } catch (_) {}
  process.exit(0);
}

let handled = false;
let inputBuffer = '';
const timer = setTimeout(function () {
  if (!handled) {
    handled = true;
    try { emitForHost(null); } catch (_) {}
    process.exit(0);
  }
}, 250);

process.stdin.setEncoding('utf8');
process.stdin.on('data', function (chunk) {
  inputBuffer += chunk;
  try {
    const parsed = JSON.parse(inputBuffer);
    if (!handled) {
      handled = true;
      clearTimeout(timer);
      emitForHost(parsed);
      process.exit(0);
    }
  } catch (_) {}
});

process.stdin.on('end', function () {
  if (handled) return;
  handled = true;
  clearTimeout(timer);
  let parsed = null;
  if (inputBuffer.trim()) {
    try { parsed = JSON.parse(inputBuffer); } catch (_) {}
  }
  try { emitForHost(parsed); } catch (_) {}
  process.exit(0);
});
