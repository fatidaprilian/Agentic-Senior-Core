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
    let lastCmdCommandLine = '';

    for (let i = startIdx; i < steps.length; i++) {
      const step = steps[i];
      if (!step || step.type !== 'PLANNER_RESPONSE' || !Array.isArray(step.tool_calls)) continue;

      for (let j = 0; j < step.tool_calls.length; j++) {
        const tc = step.tool_calls[j];
        if (!tc || !tc.name) continue;

        if (tc.name === 'run_command' || tc.name === 'Bash' || tc.name === 'run_shell_command') {
          lastVerifyCmdIdx = i;
          const args = tc.args || {};
          lastCmdCommandLine = args.CommandLine || args.command || args.cmd || '';
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

    if (lastSourceEditIdx !== -1) {
      // Collect all commands executed after lastSourceEditIdx
      const postEditCommands = [];
      for (let i = lastSourceEditIdx + 1; i < steps.length; i++) {
        const step = steps[i];
        if (!step || step.type !== 'PLANNER_RESPONSE' || !Array.isArray(step.tool_calls)) continue;
        for (let j = 0; j < step.tool_calls.length; j++) {
          const tc = step.tool_calls[j];
          if (tc && (tc.name === 'run_command' || tc.name === 'Bash' || tc.name === 'run_shell_command')) {
            const args = tc.args || {};
            const cmdLine = args.CommandLine || args.command || args.cmd || '';
            let output = '';
            let failed = false;
            for (let k = i + 1; k < steps.length; k++) {
              const resStep = steps[k];
              if (!resStep) continue;
              if (resStep.type === 'PLANNER_RESPONSE') break;
              if (resStep.status === 'ERROR' || resStep.type === 'ERROR_MESSAGE') {
                failed = true;
                output += (resStep.content || '') + '\n';
                break;
              }
              if (typeof resStep.content === 'string') {
                output += resStep.content + '\n';
              }
            }
            const exitMatch = output.match(/Command exited with code (\d+)/i);
            if (exitMatch && parseInt(exitMatch[1], 10) !== 0) {
              failed = true;
            }
            postEditCommands.push({ stepIdx: i, cmdLine, failed, output });
          }
        }
      }

      // Case 1: No command executed at all after source edit
      if (postEditCommands.length === 0) {
        process.stdout.write(JSON.stringify({
          decision: 'continue',
          reason: '[ASC Verification Gate] Source code was modified this turn without running a fresh verification or test command afterward. Iron Law: No completion claims without fresh verification evidence. Execute the relevant test, build, or syntax check command and confirm exit code 0 before concluding.',
        }) + '\n');
        process.exit(0);
        return;
      }

      // Case 2: Filter out inspection-only commands (git status, diff, ls, dir, cd, etc.)
      function isInspection(cmd) {
        const unascx = (cmd || '').trim().toLowerCase().replace(/^ascx\s+/, '');
        return /^(?:git\s+status|git\s+diff|dir|ls|pwd|cd|echo|cat|type)\b/i.test(unascx);
      }

      const nonInspectionCmds = postEditCommands.filter(c => !isInspection(c.cmdLine));

      if (nonInspectionCmds.length === 0) {
        process.stdout.write(JSON.stringify({
          decision: 'continue',
          reason: '[ASC Verification Gate] Source code was modified this turn, but only inspection commands were executed (' + postEditCommands.map(c => c.cmdLine).join(', ') + '). An inspection command is not verification. Execute the test suite, build, or syntax check and confirm exit code 0 before concluding.',
        }) + '\n');
        process.exit(0);
        return;
      }

      // Case 3: The last verification/execution command failed
      const lastExecution = nonInspectionCmds[nonInspectionCmds.length - 1];
      if (lastExecution.failed) {
        process.stdout.write(JSON.stringify({
          decision: 'continue',
          reason: '[ASC Self-Healing Gate] The last verification command (' + (lastExecution.cmdLine || 'test/build') + ') exited with a non-zero exit code. Iron Law: No completion claims without fresh passing evidence. Follow the 4-phase repair loop: (1) Isolate failure trace from output, (2) Apply minimal implementation fix without weakening test assertions, (3) Re-run verification until exit code 0.',
        }) + '\n');
        process.exit(0);
        return;
      }
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

