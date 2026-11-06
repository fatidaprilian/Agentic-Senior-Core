#!/usr/bin/env node
// Agentic Senior Core — PreInvocation ladder persistence hook
// Counters context rot by re-injecting a concise decision-ladder + security pin
// periodically during long Antigravity sessions.

const { getThresholds } = require('./constants.cjs');
const { resolveWorkspaceRoot } = require('./path-util.cjs');

const SECURITY_REMINDER = '[ASC SECURITY PIN — verbatim, do not paraphrase] '
  + 'NEVER: interpolate input into SQL/shell · commit secrets/tokens/credentials '
  + '· store plaintext passwords · leak stack traces/internals/PII in responses. '
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

    if (invNum > 0 && invNum % interval === 0) {
      process.stdout.write(JSON.stringify({
        injectSteps: [{
          ephemeralMessage: '**ASC LADDER PULSE**: Review the 1-6 decision ladder before writing new abstractions. Document deferred debt if taking shortcuts.\n\n' + SECURITY_REMINDER,
        }],
      }) + '\n');
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
