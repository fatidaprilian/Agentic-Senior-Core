#!/usr/bin/env node
// Agentic Senior Core — PostToolUse enforcement hook
// Fires after Edit/Write. Checks for ladder violations and injects a nudge.
// Supports Claude Code, Codex CLI, and GitHub Copilot CLI.

const fs = require('fs');
const path = require('path');

const STDLIB_DUPLICATES = new Set([
  'lodash', 'lodash-es', 'underscore',
  'moment', 'dayjs',
  'uuid', 'nanoid',
  'chalk', 'kleur', 'colorette',
  'axios', 'got', 'node-fetch', 'superagent',
  'mkdirp', 'rimraf', 'del',
  'glob', 'globby',
  'left-pad', 'pad-left',
  'is-odd', 'is-even', 'is-number', 'is-string',
  'path-exists', 'fs-extra',
]);

const SOURCE_EXTENSIONS = new Set([
  'js', 'ts', 'mjs', 'cjs', 'jsx', 'tsx',
  'py', 'rb', 'go', 'rs', 'java', 'kt', 'swift', 'cs',
]);

const LOC_DELTA_THRESHOLD = 30;
const NEW_FILE_LINE_THRESHOLD = 50;

let inputBuffer = '';
process.stdin.setEncoding('utf8');
process.stdin.on('data', function (chunk) { inputBuffer += chunk; });
process.stdin.on('end', function () {
  try {
    const data = JSON.parse(inputBuffer);
    const toolName = data.tool_name || '';
    const toolInput = data.tool_input || {};
    const filePath = toolInput.file_path || '';
    const findings = [];

    if (filePath.endsWith('package.json') || filePath.endsWith('package.json5')) {
      checkDependencyAddition(toolName, toolInput, findings);
    }

    const ext = path.extname(filePath).slice(1);
    if (SOURCE_EXTENSIONS.has(ext)) {
      if (toolName === 'Edit') {
        checkLocDelta(toolInput, filePath, findings);
      } else if (toolName === 'Write') {
        checkNewFileSize(toolInput, filePath, findings);
      }
    }

    if (ext !== 'md') {
      checkWorkflowGate(toolName, filePath, ext, findings);
    }

    if (findings.length === 0) return;

    const nudge = '[ASC enforcement] ' + findings.join(' ') + ' Review the decision ladder before continuing.';
    emit(nudge);
  } catch (_) {
    // Silent fail — enforcement must not break the session
  }
});

function checkDependencyAddition(toolName, toolInput, findings) {
  var target = toolName === 'Edit' ? (toolInput.new_string || '') : (toolInput.content || '');
  var baseline = toolName === 'Edit' ? (toolInput.old_string || '') : '';

  var depPattern = /"([^"]+)"\s*:\s*"[~^>=<*]?\d/g;
  var newDeps = extractDeps(target, depPattern);
  var oldDeps = extractDeps(baseline, depPattern);

  var added = newDeps.filter(function (d) { return oldDeps.indexOf(d) === -1; });
  if (added.length === 0) return;

  var stdlibDupes = added.filter(function (d) { return STDLIB_DUPLICATES.has(d); });
  if (stdlibDupes.length > 0) {
    findings.push(
      'Dependency ' + stdlibDupes.join(', ') + ' may duplicate stdlib/platform features. '
      + 'Ladder step 3: does the standard library cover this?'
    );
  } else {
    findings.push(
      'New dependency added: ' + added.join(', ') + '. '
      + 'Ladder step 3-4: stdlib or already-installed alternative?'
    );
  }
}

function extractDeps(text, pattern) {
  var matches = [];
  var match;
  while ((match = pattern.exec(text)) !== null) {
    matches.push(match[1]);
  }
  return matches;
}

function checkLocDelta(toolInput, filePath, findings) {
  var newLines = (toolInput.new_string || '').split('\n').length;
  var oldLines = (toolInput.old_string || '').split('\n').length;
  var delta = newLines - oldLines;
  if (delta > LOC_DELTA_THRESHOLD) {
    findings.push(
      'Edit added ' + delta + ' net lines to ' + path.basename(filePath) + '. '
      + 'Ladder step 5: can this be one straightforward function?'
    );
  }
}

function checkNewFileSize(toolInput, filePath, findings) {
  var lines = (toolInput.content || '').split('\n').length;
  if (lines > NEW_FILE_LINE_THRESHOLD) {
    findings.push(
      'New file ' + path.basename(filePath) + ' created with ' + lines + ' lines. '
      + 'Ladder step 1-2: does this need to be built? Does the codebase already have this?'
    );
  }
}

function checkWorkflowGate(toolName, filePath, ext, findings) {
  try {
    var pathUtil = require('./path-util.cjs');
    var gatePath = pathUtil.getWorkflowGatePath(process.cwd());
    if (!fs.existsSync(gatePath)) return;
    
    var gateStr = fs.readFileSync(gatePath, 'utf8');
    var gate = JSON.parse(gateStr);
    
    if (gate.updatedAt) {
      var ageHours = (Date.now() - new Date(gate.updatedAt).getTime()) / (1000 * 60 * 60);
      if (ageHours > 4) {
        fs.unlinkSync(gatePath);
        findings.push('Cleared stale workflow gate (' + gate.workflow + ').');
        return;
      }
    }
    
    if (gate.phase === 'research' || gate.phase === 'plan') {
      findings.push(
        'Workflow gate bypass: ' + gate.workflow + ' is in ' + gate.phase + ' phase but source code was edited. '
        + 'Stop and wait for phase approval. If you must proceed, log this bypass to the debt ledger.'
      );
    }
  } catch (_) {
    // Silent fail
  }
}

function emit(nudge) {
  try {
    var isCopilot = Boolean(process.env.COPILOT_PLUGIN_DATA);
    var output = {
      hookSpecificOutput: {
        hookEventName: 'PostToolUse',
        additionalContext: nudge,
      },
    };
    if (isCopilot) {
      output = { additionalContext: nudge };
    }
    process.stdout.write(JSON.stringify(output));
  } catch (_) {
    // EPIPE — silent
  }
}
