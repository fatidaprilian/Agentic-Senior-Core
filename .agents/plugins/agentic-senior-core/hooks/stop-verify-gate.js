#!/usr/bin/env node
// Antigravity Stop hook — enforces fresh verification command execution
// after source-code modifications before allowing turn completion.

const fs = require('fs');
const path = require('path');
const { SOURCE_EXTENSIONS } = require('./constants.cjs');
const { normalizeEditToolCall } = require('./path-util.cjs');

function allowStop() {
  process.stdout.write(JSON.stringify({ decision: 'allow' }) + '\n');
  process.exit(0);
}

if (process.stdin.isTTY) {
  allowStop();
}

let handled = false;
let inputBuffer = '';

function evaluateStop(data) {
  if (handled) return;
  handled = true;
  clearTimeout(timer);

  try {
    if (!data || typeof data !== 'object') {
      allowStop();
      return;
    }

    // Never block when background tasks/subagents are still active
    if (data.fullyIdle !== true) {
      allowStop();
      return;
    }

    // Only gate normal model completion, never system errors or step limits
    if (data.terminationReason && data.terminationReason !== 'model_stop') {
      allowStop();
      return;
    }

    // Single-retry cap prevents infinite continuation loops
    if (typeof data.executionNum === 'number' && data.executionNum >= 2) {
      allowStop();
      return;
    }

    if (!data.transcriptPath || !fs.existsSync(data.transcriptPath)) {
      allowStop();
      return;
    }

    const lines = fs.readFileSync(data.transcriptPath, 'utf8').split('\n').filter(Boolean);
    const steps = [];
    for (let i = 0; i < lines.length; i++) {
      try {
        steps.push(JSON.parse(lines[i]));
      } catch (_) {}
    }

    let startIdx = 0;
    for (let i = steps.length - 1; i >= 0; i--) {
      if (steps[i] && steps[i].type === 'USER_INPUT') {
        startIdx = i + 1;
        break;
      }
    }

    const artifactDir = typeof data.artifactDirectoryPath === 'string' && data.artifactDirectoryPath
      ? path.resolve(data.artifactDirectoryPath).toLowerCase()
      : '';

    let lastSourceEditIdx = -1;
    let lastVerifyCmdIdx = -1;

    for (let i = startIdx; i < steps.length; i++) {
      const step = steps[i];
      if (!step || step.type !== 'PLANNER_RESPONSE' || !Array.isArray(step.tool_calls)) continue;

      for (let j = 0; j < step.tool_calls.length; j++) {
        const tc = step.tool_calls[j];
        if (!tc || !tc.name) continue;

        if (tc.name === 'run_command' || tc.name === 'Bash' || tc.name === 'run_shell_command') {
          lastVerifyCmdIdx = i;
          continue;
        }

        const args = tc.args || {};
        if (args.ArtifactMetadata || args.IsArtifact) continue;

        const norm = normalizeEditToolCall(tc.name, args);
        if (!norm || !norm.filePath) continue;

        if (artifactDir) {
          const resolvedEdit = path.resolve(norm.filePath).toLowerCase();
          if (resolvedEdit.startsWith(artifactDir)) continue;
        }

        const ext = path.extname(norm.filePath).slice(1).toLowerCase();
        if (SOURCE_EXTENSIONS.has(ext)) {
          lastSourceEditIdx = i;
        }
      }
    }

    if (lastSourceEditIdx !== -1 && lastVerifyCmdIdx < lastSourceEditIdx) {
      process.stdout.write(JSON.stringify({
        decision: 'continue',
        reason: '[ASC Verification Gate] Source code was modified this turn without running a fresh verification or test command afterward. Execute the relevant test, build, or syntax check command and confirm exit code 0 before concluding.',
      }) + '\n');
      process.exit(0);
      return;
    }

    allowStop();
  } catch (_) {
    allowStop();
  }
}

const timer = setTimeout(function () { evaluateStop(null); }, 2500);

process.stdin.setEncoding('utf8');
process.stdin.on('data', function (chunk) {
  inputBuffer += chunk;
  try {
    const parsed = JSON.parse(inputBuffer);
    evaluateStop(parsed);
  } catch (_) {}
});

process.stdin.on('end', function () {
  if (handled) return;
  if (!inputBuffer.trim()) {
    evaluateStop(null);
    return;
  }
  try {
    evaluateStop(JSON.parse(inputBuffer));
  } catch (_) {
    evaluateStop(null);
  }
});

