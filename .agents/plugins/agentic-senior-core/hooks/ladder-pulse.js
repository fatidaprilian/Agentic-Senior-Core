#!/usr/bin/env node
// Agentic Senior Core — PreInvocation ladder persistence hook
// Counters context rot by re-injecting a concise decision-ladder + security pin
// periodically during long Antigravity sessions.

const { getThresholds } = require('./constants.cjs');
const { resolveWorkspaceRoot } = require('./path-util.cjs');
const { scanComponentRegistry } = require('./component-registry.cjs');

const SECURITY_REMINDER = '[ASC SECURITY & EPISTEMIC PIN — verbatim, do not paraphrase] '
  + 'NEVER: interpolate input into SQL/shell · commit secrets/tokens/credentials '
  + '· store plaintext passwords · leak stack traces/internals/PII in responses '
  + '· flip a technical DISAGREE verdict on user insistence without new evidence (execute explicit overrides with "Verdict unchanged. Executing your decision."). '
  + 'ALWAYS: parameterize queries · enforce resource-level authz · rate-limit public endpoints.';

if (process.stdin.isTTY) {
  process.stdout.write('{}\n');
  process.exit(0);
}

let handled = false;
let inputBuffer = '';

function finish(payload) {
  if (handled) return;
  handled = true;
  clearTimeout(timer);

  try {
    const workspaceRoot = resolveWorkspaceRoot(payload);
    const thresholds = getThresholds(workspaceRoot);
    const interval = thresholds.LADDER_PULSE_INTERVAL || 3;
    const invNum = payload && typeof payload.invocationNum === 'number' ? payload.invocationNum : 0;
    const promptText = String((payload && payload.lastUserInput) || '');
    const isUiTask = /\b(ui|page|dashboard|component|form|table|modal|card|navbar|sidebar|layout|css|tsx|jsx|vue|svelte|razor|tampilan|halaman|komponen)\b/i.test(promptText);
    const shouldPulse = invNum > 0 && invNum % interval === 0;

    if (shouldPulse || (invNum === 0 && isUiTask)) {
      const registry = scanComponentRegistry(workspaceRoot);
      const parts = [];
      if (shouldPulse) {
        parts.push('**ASC LADDER PULSE**: Review the 1-6 decision ladder before writing new abstractions. Document deferred debt if taking shortcuts.\n\n' + SECURITY_REMINDER);
      }
      if (registry.formatted && (isUiTask || shouldPulse)) {
        parts.push(registry.formatted);
      }
      if (parts.length > 0) {
        process.stdout.write(JSON.stringify({
          injectSteps: [{ ephemeralMessage: parts.join('\n\n') }],
        }) + '\n');
      } else {
        process.stdout.write('{}\n');
      }
    } else {
      process.stdout.write('{}\n');
    }
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
    const payload = JSON.parse(inputBuffer);
    finish(payload);
  } catch (_) {}
});

process.stdin.on('end', function () {
  let payload = null;
  if (inputBuffer.trim()) {
    try { payload = JSON.parse(inputBuffer); } catch (_) {}
  }
  finish(payload);
});
