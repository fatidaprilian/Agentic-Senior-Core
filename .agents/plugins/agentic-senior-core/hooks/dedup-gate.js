#!/usr/bin/env node
// Agentic Senior Core — PostToolUse duplicate-code detection hook
// Fires after Edit/Write on qualifying source files. Runs a scoped jscpd scan
// to detect near-duplicate code blocks. Advisory by default; configurable to block.
// Supports Claude Code, Codex CLI, GitHub Copilot CLI, and Antigravity IDE.

const fs = require('fs');
const path = require('path');
const os = require('os');
const { execSync } = require('child_process');

const {
  SOURCE_EXTENSIONS,
  LOC_DELTA_THRESHOLD,
  NEW_FILE_LINE_THRESHOLD,
} = require('./constants.cjs');

const JSCPD_TIMEOUT_MS = 10000;

// Recognized source root directories — scan scope walks up to the first match
const SOURCE_ROOTS = ['src', 'lib', 'app'];

let inputBuffer = '';
process.stdin.setEncoding('utf8');
process.stdin.on('data', chunk => {
  inputBuffer += chunk;
  try {
    const data = JSON.parse(inputBuffer);

    let toolName = '';
    let toolInput = {};
    let isAntigravity = false;

    if (data.toolCall) {
      // Antigravity PreToolUse shape (has toolCall directly)
      isAntigravity = true;
      toolName = data.toolCall.name;
      toolInput = data.toolCall.args || {};
    } else if (data.stepIdx !== undefined && data.transcriptPath) {
      // Antigravity PostToolUse shape — no toolCall in payload,
      // read the tool call details from the transcript at stepIdx
      isAntigravity = true;
      var extracted = extractToolCallFromTranscript(data.transcriptPath, data.stepIdx);
      if (!extracted) { process.exit(0); return; }
      toolName = extracted.toolName;
      toolInput = extracted.toolInput;
    } else {
      // Claude Code / Codex / Copilot path
      toolName = data.tool_name || data.toolName || '';
      toolInput = data.tool_input || data.toolInput || {};
    }

    const filePath = toolInput.file_path || toolInput.TargetFile || toolInput.path || toolInput.target_file || '';
    if (!filePath) { process.exit(0); return; }

    const ext = path.extname(filePath).slice(1);
    if (!SOURCE_EXTENSIONS.has(ext)) { process.exit(0); return; }

    const config = loadDedupConfig();
    if (!isQualifyingEdit(toolName, toolInput, config)) { process.exit(0); return; }

    const scanDir = resolveScanDir(filePath, config);
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'asc-dedup-'));

    const ignoreFlags = (config.ignoreDirs || []).map(function (d) { return '--ignore "' + d + '"'; }).join(' ');
    const minTokens = config.minTokens || 30;
    const scanCmd = ' "' + scanDir + '" --min-tokens ' + minTokens
      + ' --reporters json --silent --output "' + tmpDir + '" ' + ignoreFlags;

    const report = runJscpdScan(scanCmd, tmpDir);
    if (!report) { cleanup(tmpDir); process.exit(0); return; }

    const finding = checkForDuplicates(report, filePath);
    if (!finding) { cleanup(tmpDir); process.exit(0); return; }

    const nudge = '[ASC Dedup] ' + path.basename(filePath) + ' looks similar to '
      + finding.matchedFile + ' (' + finding.percent + '% overlap, '
      + finding.lines + ' lines). Ladder step 2: does the codebase already have this? '
      + 'Reuse it, or confirm this is intentional.';

    if (config.mode === 'block') {
      emitDeny(nudge, isAntigravity);
    } else {
      emitAdvisory(nudge, isAntigravity);
    }

    cleanup(tmpDir);
    process.exit(0);
  } catch (e) {
    // incomplete json, wait for more chunks
  }
});

// Extract tool call details from the Antigravity transcript at a given step index.
// PostToolUse on Antigravity only provides stepIdx — the actual tool call args
// must be recovered from the transcript log. Same approach as post-edit-enforce.js.
function extractToolCallFromTranscript(transcriptPath, stepIdx) {
  try {
    if (!fs.existsSync(transcriptPath)) return null;
    var lines = fs.readFileSync(transcriptPath, 'utf8').split('\n').filter(Boolean);

    // Find the step with matching step_index that contains tool_calls
    for (var i = lines.length - 1; i >= 0; i--) {
      try {
        var step = JSON.parse(lines[i]);
        if (step.step_index !== stepIdx || !step.tool_calls) continue;

        for (var j = 0; j < step.tool_calls.length; j++) {
          var tc = step.tool_calls[j];
          if (tc.name === 'replace_file_content' || tc.name === 'multi_replace_file_content') {
            return {
              toolName: 'Edit',
              toolInput: {
                file_path: tc.args.TargetFile || '',
                new_string: tc.args.ReplacementContent || '',
                old_string: tc.args.TargetContent || '',
              },
            };
          } else if (tc.name === 'write_to_file') {
            return {
              toolName: 'Write',
              toolInput: {
                file_path: tc.args.TargetFile || '',
                content: tc.args.CodeContent || '',
              },
            };
          }
        }
      } catch (lineErr) {
        if (process.env.ASC_DEBUG) {
          console.error('[ASC Debug] Transcript line parse failed line ' + i + ':', lineErr.message);
        }
        // Skip malformed line and keep scanning
      }
    }
    return null;
  } catch (err) {
    if (process.env.ASC_DEBUG) {
      console.error('[ASC Debug] extractToolCallFromTranscript failed:', err.message);
    }
    return null;
  }
}

function isQualifyingEdit(toolName, toolInput, config) {
  var isWrite = ['Write', 'write_to_file', 'write_file'].indexOf(toolName) !== -1;
  var isEdit = ['Edit', 'replace_file_content', 'multi_replace_file_content'].indexOf(toolName) !== -1;

  var newFileThreshold = (config && typeof config.NEW_FILE_LINE_THRESHOLD === 'number')
    ? config.NEW_FILE_LINE_THRESHOLD
    : NEW_FILE_LINE_THRESHOLD;
  var locDeltaThreshold = (config && typeof config.LOC_DELTA_THRESHOLD === 'number')
    ? config.LOC_DELTA_THRESHOLD
    : LOC_DELTA_THRESHOLD;

  if (isWrite) {
    var content = toolInput.content || toolInput.CodeContent || '';
    return content.split('\n').length > newFileThreshold;
  }
  if (isEdit) {
    var newStr = toolInput.new_string || toolInput.ReplacementContent || toolInput.content || '';
    var oldStr = toolInput.old_string || toolInput.TargetContent || '';
    var delta = newStr.split('\n').length - oldStr.split('\n').length;
    return delta > locDeltaThreshold;
  }
  return false;
}

function resolveScanDir(filePath, config) {
  var cwd = process.cwd();

  // User override takes priority
  if (config.scanRoot) {
    var override = path.resolve(cwd, config.scanRoot);
    if (fs.existsSync(override)) return override;
  }

  // Walk up from the file's directory to find a recognized source root
  var dir = path.dirname(path.resolve(filePath));
  while (dir.length >= cwd.length) {
    var basename = path.basename(dir);
    if (SOURCE_ROOTS.indexOf(basename) !== -1) return dir;
    var parent = path.dirname(dir);
    if (parent === dir) break;
    dir = parent;
  }

  // Fallback: project root
  return cwd;
}

function loadDedupConfig() {
  var candidates = [
    path.join(process.cwd(), '.asc', 'dedup-config.json'),
    path.join(process.cwd(), '.agents', 'dedup-config.json'),
  ];
  for (var i = 0; i < candidates.length; i++) {
    try {
      if (fs.existsSync(candidates[i])) {
        return JSON.parse(fs.readFileSync(candidates[i], 'utf8'));
      }
    } catch (_) {}
  }
  return { mode: 'advisory', minTokens: 30, ignoreDirs: ['tests', 'migrations', 'generated', 'node_modules'] };
}

// minimal: attempt-then-fallback — try scan directly, fall back on failure.
// No separate --version probes. Upgrade if jscpd provides a stable JS API.
function runJscpdScan(scanCmd, tmpDir) {
  var binaries = ['bunx jscpd', 'npx jscpd@5', 'npx jscpd'];
  for (var i = 0; i < binaries.length; i++) {
    try {
      execSync(binaries[i] + scanCmd, {
        timeout: JSCPD_TIMEOUT_MS,
        stdio: 'pipe',
        cwd: process.cwd(),
      });
      return loadReport(tmpDir);
    } catch (_) {
      // Try next binary
    }
  }
  return null;
}

function loadReport(tmpDir) {
  var reportPath = path.join(tmpDir, 'jscpd-report.json');
  if (!fs.existsSync(reportPath)) return null;
  try {
    return JSON.parse(fs.readFileSync(reportPath, 'utf8'));
  } catch (_) {
    return null;
  }
}

function checkForDuplicates(report, filePath) {
  var duplicates = report.duplicates || [];
  if (duplicates.length === 0) return null;

  var normalizedTarget = path.resolve(filePath).replace(/\\/g, '/').toLowerCase();

  for (var i = 0; i < duplicates.length; i++) {
    var dup = duplicates[i];
    var firstName = path.resolve(dup.firstFile.name).replace(/\\/g, '/').toLowerCase();
    var secondName = path.resolve(dup.secondFile.name).replace(/\\/g, '/').toLowerCase();

    if (firstName === normalizedTarget || secondName === normalizedTarget) {
      var matchedFile = firstName === normalizedTarget
        ? path.basename(dup.secondFile.name)
        : path.basename(dup.firstFile.name);
      var lines = dup.lines || 0;
      // jscpd v5 reports fragments; estimate overlap percentage from line count
      var totalLines = (report.statistics && report.statistics.total && report.statistics.total.lines) || 1;
      var percent = Math.round((lines / totalLines) * 100);
      return { matchedFile: matchedFile, lines: lines, percent: percent };
    }
  }
  return null;
}

function emitAdvisory(nudge, isAntigravity) {
  if (isAntigravity) {
    process.stdout.write(JSON.stringify({
      injectSteps: [{ ephemeralMessage: nudge }],
    }) + '\n');
  } else {
    var isCopilot = Boolean(process.env.COPILOT_PLUGIN_DATA);
    if (isCopilot) {
      process.stdout.write(JSON.stringify({ additionalContext: nudge }) + '\n');
    } else {
      process.stdout.write(JSON.stringify({
        hookSpecificOutput: {
          hookEventName: 'PostToolUse',
          additionalContext: nudge,
        },
      }) + '\n');
    }
  }
}

function emitDeny(reason, isAntigravity) {
  if (isAntigravity) {
    process.stdout.write(JSON.stringify({ decision: 'deny', reason: reason }) + '\n');
  } else {
    process.stdout.write(JSON.stringify({
      allow_tool: false,
      deny_reason: reason,
      hookSpecificOutput: {
        hookEventName: 'PostToolUse',
        permissionDecision: 'deny',
        permissionDecisionReason: reason,
      },
    }) + '\n');
  }
  process.exit(2);
}

function cleanup(tmpDir) {
  try { fs.rmSync(tmpDir, { recursive: true, force: true }); } catch (_) {}
}
