#!/usr/bin/env node
// Agentic Senior Core — Optional SessionStart / PreInvocation pulse helper.
// Note: Native Antigravity plugins already load rules/agentic-senior-core.md via always_on rules,
// so this helper safely emits {} unless standalone rule injection is explicitly requested.

const fs = require('fs');
const path = require('path');

const pluginRoot = process.env.CLAUDE_PLUGIN_ROOT || path.resolve(__dirname, '..');

if (process.stdin.isTTY) {
  process.stdout.write('{}\n');
  process.exit(0);
}

let handled = false;
let inputBuffer = '';

function finish(data) {
  if (handled) return;
  handled = true;
  clearTimeout(timer);

  try {
    if (!data || data.invocationNum !== 0 || !process.env.ASC_STANDALONE_PULSE) {
      process.stdout.write('{}\n');
      process.exit(0);
      return;
    }

    const agentsPath = path.join(pluginRoot, 'rules', 'agentic-senior-core.md');
    const content = fs.readFileSync(agentsPath, 'utf8');
    process.stdout.write(JSON.stringify({
      injectSteps: [{ ephemeralMessage: content }],
    }) + '\n');
  } catch (_) {
    process.stdout.write('{}\n');
  }
  process.exit(0);
}

const timer = setTimeout(function () { finish(null); }, 2000);

process.stdin.setEncoding('utf8');
process.stdin.on('data', function (chunk) {
  inputBuffer += chunk;
  try {
    finish(JSON.parse(inputBuffer));
  } catch (_) {}
});

process.stdin.on('end', function () {
  let parsed = null;
  if (inputBuffer.trim()) {
    try { parsed = JSON.parse(inputBuffer); } catch (_) {}
  }
  finish(parsed);
});
