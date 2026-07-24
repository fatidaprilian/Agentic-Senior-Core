#!/usr/bin/env node
// Agentic Senior Core — PostToolUse enforcement hook
// Fires after Edit/Write. Checks for ladder violations and injects a nudge.
// Supports Claude Code, Codex CLI, and GitHub Copilot CLI.

const fs = require('fs');
const path = require('path');

let STDLIB_DUPLICATES = new Set([
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

try {
  const knownPath = path.join(__dirname, 'lib', 'known-duplicates.json');
  if (fs.existsSync(knownPath)) {
    const raw = JSON.parse(fs.readFileSync(knownPath, 'utf8'));
    if (Array.isArray(raw.duplicates)) {
      STDLIB_DUPLICATES = new Set(raw.duplicates);
    }
  }
} catch (_) {}

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
    
    if (data.invocationNum !== undefined && data.transcriptPath) {
      handleAntigravityPostInvocation(data);
      return;
    }

    const toolName = data.tool_name || '';
    const toolInput = data.tool_input || {};
    processSingleEdit(toolName, toolInput, function(nudge) {
      emitClaude(nudge);
    });
  } catch (_) {
    // Silent fail
  }
});

function handleAntigravityPostInvocation(data) {
  try {
    if (!fs.existsSync(data.transcriptPath)) return;
    const lines = fs.readFileSync(data.transcriptPath, 'utf8').split('\n').filter(Boolean);
    const findings = [];
    
    for (let i = 0; i < lines.length; i++) {
      const step = JSON.parse(lines[i]);
      if (step.step_index >= data.initialNumSteps && step.type === 'PLANNER_RESPONSE' && step.tool_calls) {
        for (let j = 0; j < step.tool_calls.length; j++) {
          const tc = step.tool_calls[j];
          let toolName = '';
          let toolInput = {};
          
          if (tc.name === 'replace_file_content' || tc.name === 'multi_replace_file_content') {
            toolName = 'Edit';
            toolInput = {
              file_path: tc.args.TargetFile || '',
              new_string: tc.args.ReplacementContent || '',
              old_string: tc.args.TargetContent || ''
            };
          } else if (tc.name === 'write_to_file') {
            toolName = 'Write';
            toolInput = {
              file_path: tc.args.TargetFile || '',
              content: tc.args.CodeContent || ''
            };
          }
          
          if (toolName) {
            processSingleEdit(toolName, toolInput, function(nudge) {
              findings.push(nudge);
            }, true);
          }
        }
      }
    }
    
    if (findings.length > 0) {
      const injectSteps = findings.map(function(f) { return { ephemeralMessage: f }; });
      process.stdout.write(JSON.stringify({ injectSteps: injectSteps }) + '\n');
    } else {
      process.stdout.write(JSON.stringify({}) + '\n');
    }
  } catch (e) {
    process.stdout.write(JSON.stringify({}) + '\n');
  }
}

function processSingleEdit(toolName, toolInput, emitFn, skipArray) {
  const filePath = toolInput.file_path || '';
  if (!filePath) return;
  const findings = [];

  if (filePath.endsWith('package.json')) {
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

  checkLivingDocNudge(filePath, findings);

  if (ext !== 'md') {
    checkWorkflowGate(toolName, filePath, ext, findings);
  }

  if (findings.length === 0) return;

  const nudge = '[ASC enforcement] ' + findings.join(' ') + ' Review the decision ladder before continuing.';
  emitFn(nudge);
}

function emitClaude(nudge) {
  try {
    const isCopilot = Boolean(process.env.COPILOT_PLUGIN_DATA);
    let output = {
      hookSpecificOutput: {
        hookEventName: 'PostToolUse',
        additionalContext: nudge,
      },
    };
    if (isCopilot) {
      output = { additionalContext: nudge };
    }
    process.stdout.write(JSON.stringify(output) + '\n');
  } catch (_) {}
}

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

function checkLivingDocNudge(filePath, findings) {
  var lower = filePath.toLowerCase();
  if (lower.includes('schema') || lower.includes('migration') || lower.includes('model') || lower.includes('prisma')) {
    findings.push(
      '[ASC Living Doc] Data contract/model modified in ' + path.basename(filePath) + '. '
      + 'Ensure docs/Schema.md and docs/Architecture.md are kept in sync to prevent spec drift.'
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
    } else if (gate.phase === 'implement') {
      validateDocSpecs(gate.workflow, findings);
    }
  } catch (_) {
    // Silent fail
  }
}

function validateDocSpecs(workflow, findings) {
  try {
    var cwd = process.cwd();
    var docsDir = path.join(cwd, 'docs');
    
    // Anti-typo check for common doc typos (e.g. Architectyre.md)
    var searchDirs = [cwd, docsDir];
    var typoFound = false;
    searchDirs.forEach(function (d) {
      if (fs.existsSync(d)) {
        var files = fs.readdirSync(d);
        files.forEach(function (f) {
          if (f.toLowerCase() !== f && /architect[y|u]re/i.test(f) && f !== 'Architecture.md') {
            findings.push('[ASC Spec Typo Alert] Typo detected in doc filename "' + f + '". Rename to "Architecture.md".');
            typoFound = true;
          }
        });
      }
    });

    if (workflow === 'asc-new-project') {
      var requiredDocs = ['PRD.md', 'Architecture.md', 'Design.md', 'Schema.md'];
      var missing = requiredDocs.filter(function (doc) {
        return !fs.existsSync(path.join(cwd, doc)) && !fs.existsSync(path.join(docsDir, doc));
      });
      if (missing.length > 0) {
        findings.push(
          '[ASC 5-Doc SDD Gate] Greenfield project missing spec document(s): ' + missing.join(', ') + '. '
          + 'Create them in docs/ to align requirements before continuing implementation.'
        );
      }
    } else if (workflow === 'asc-add-feature') {
      var hasPrd = fs.existsSync(path.join(cwd, 'PRD.md')) || fs.existsSync(path.join(docsDir, 'PRD.md'));
      if (!hasPrd) {
        findings.push(
          '[ASC SDD Gate] Feature addition missing docs/PRD.md. Define goals and non-goals before coding.'
        );
      }
    }
  } catch (_) {}
}


