#!/usr/bin/env node
// Agentic Senior Core — PostToolUse enforcement hook
// Fires after Edit/Write. Checks for ladder violations and injects a nudge.
// Supports Claude Code, Codex CLI, and GitHub Copilot CLI.

const fs = require('fs');
const path = require('path');

let STDLIB_DUPLICATES = new Set();
let REVIEW_DUPLICATES = new Set();

try {
  const knownPath = path.join(__dirname, 'lib', 'known-duplicates.json');
  if (fs.existsSync(knownPath)) {
    const raw = JSON.parse(fs.readFileSync(knownPath, 'utf8'));
    // Tiered structure (v5): 'block' + 'review'. This hook is advisory, so both
    // tiers land here; the pre-tool gate is what distinguishes them.
    if (Array.isArray(raw.block) || Array.isArray(raw.review)) {
      STDLIB_DUPLICATES = new Set(raw.block || []);
      REVIEW_DUPLICATES = new Set(raw.review || []);
    } else if (Array.isArray(raw.duplicates)) {
      REVIEW_DUPLICATES = new Set(raw.duplicates);
    }
  }
} catch (_) { }

let SECURITY_PATTERNS = { patterns: [], fileSpecific: {} };
try {
  const secPath = path.join(__dirname, 'lib', 'known-security-patterns.json');
  if (fs.existsSync(secPath)) {
    SECURITY_PATTERNS = JSON.parse(fs.readFileSync(secPath, 'utf8'));
  }
} catch (_) { }

let UI_SLOP_PATTERNS = { patterns: [] };
try {
  const slopPath = path.join(__dirname, 'lib', 'known-ui-slop-patterns.json');
  if (fs.existsSync(slopPath)) {
    UI_SLOP_PATTERNS = JSON.parse(fs.readFileSync(slopPath, 'utf8'));
  }
} catch (_) { }

let STUB_PATTERNS = { patterns: [] };
try {
  const stubPath = path.join(__dirname, 'lib', 'known-stub-patterns.json');
  if (fs.existsSync(stubPath)) {
    STUB_PATTERNS = JSON.parse(fs.readFileSync(stubPath, 'utf8'));
  }
} catch (_) { }

const {
  SOURCE_EXTENSIONS,
  LOC_DELTA_THRESHOLD,
  NEW_FILE_LINE_THRESHOLD,
  SESSION_DRIFT_THRESHOLD,
  LADDER_PULSE_INTERVAL,
} = require('./constants.cjs');
const {
  isAntigravityPayload,
  resolveWorkspaceRoot,
  normalizeEditToolCall,
} = require('./path-util.cjs');

let sourceEditCount = 0;

// Module-level counter for Claude Code path (resets per process spawn)
function logHook(event, msg) {
  try {
    const os = require('os');
    const logDir = path.join(os.homedir(), '.asc');
    if (!fs.existsSync(logDir)) fs.mkdirSync(logDir, { recursive: true });
    const logFile = path.join(logDir, 'hooks.log');
    try {
      if (fs.existsSync(logFile)) {
        const stats = fs.statSync(logFile);
        if (stats.size > 100 * 1024) {
          const content = fs.readFileSync(logFile, 'utf8');
          const trimmed = content.slice(-50 * 1024);
          const firstNewline = trimmed.indexOf('\n');
          fs.writeFileSync(logFile, firstNewline >= 0 ? trimmed.slice(firstNewline + 1) : trimmed, 'utf8');
        }
      }
    } catch (_) {}
    fs.appendFileSync(logFile, `[${new Date().toISOString()}] [post-edit-enforce] [${event}] ${msg}\n`, 'utf8');
  } catch (_) {}
}

logHook('ScriptStart', `pid=${process.pid} cwd=${process.cwd()}`);

if (process.stdin.isTTY) {
  logHook('StdinTTY', 'Exiting because stdin is a TTY');
  process.exit(0);
}

const stdinTimeout = setTimeout(() => {
  logHook('StdinTimeout', `No input after 3s, exiting bufferLen=${inputBuffer.length}`);
  process.exit(0);
}, 3000);

let handled = false;
let inputBuffer = '';

function dispatchInput(data) {
  if (handled) return;
  handled = true;
  clearTimeout(stdinTimeout);

  if (isAntigravityPayload(data)) {
    if (data.stepIdx !== undefined) {
      // Antigravity PostToolUse strictly expects {} on stdout
      process.stdout.write('{}\n');
      process.exit(0);
      return;
    }
    handleAntigravityPostInvocation(data);
    return;
  }

  const workspaceRoot = resolveWorkspaceRoot(data);
  const rawTool = data.tool_name || data.toolName || '';
  const rawInput = data.tool_input || data.toolInput || {};
  const norm = normalizeEditToolCall(rawTool, rawInput);

  if (norm) {
    const mappedInput = norm.canonicalTool === 'Edit'
      ? { file_path: norm.filePath, new_string: norm.newContent, old_string: norm.oldContent }
      : { file_path: norm.filePath, content: norm.newContent };
    processSingleEdit(norm.canonicalTool, mappedInput, function (nudge) {
      emitClaude(nudge);
    }, workspaceRoot, false);
  }
  process.exit(0);
}

process.stdin.setEncoding('utf8');
process.stdin.on('data', chunk => {
  inputBuffer += chunk;
  logHook('DataChunk', `len=${chunk.length} preview=${chunk.slice(0, 100).replace(/[\r\n]+/g, ' ')}`);
  try {
    const data = JSON.parse(inputBuffer);
    logHook('StdinData', 'keys=' + Object.keys(data).join(','));
    dispatchInput(data);
  } catch (e) {
    // incomplete json, wait for more chunks
  }
});

process.stdin.on('end', () => {
  if (handled) return;
  clearTimeout(stdinTimeout);
  logHook('StdinEnd', `bufferLen=${inputBuffer.length}`);
  if (inputBuffer.trim()) {
    try {
      const data = JSON.parse(inputBuffer);
      logHook('ParsedInputOnEnd', 'keys=' + Object.keys(data).join(','));
      dispatchInput(data);
    } catch (e) {
      logHook('JsonParseErrorOnEnd', e.message);
      process.exit(0);
    }
  } else {
    process.exit(0);
  }
});

function handleAntigravityPostInvocation(data) {
  try {
    const workspaceRoot = resolveWorkspaceRoot(data);
    if (!data.transcriptPath || !fs.existsSync(data.transcriptPath)) {
      process.stdout.write('{}\n');
      process.exit(0);
      return;
    }

    const lines = fs.readFileSync(data.transcriptPath, 'utf8').split('\n').filter(Boolean);
    const findings = [];
    const minStep = typeof data.initialNumSteps === 'number' ? data.initialNumSteps : 0;

    const parsedSteps = [];
    let lastUserInputIdx = 0;
    for (let i = 0; i < lines.length; i++) {
      try {
        const s = JSON.parse(lines[i]);
        parsedSteps.push(s);
        if (s && s.type === 'USER_INPUT') {
          lastUserInputIdx = parsedSteps.length - 1;
        }
      } catch (_) {}
    }

    const isBugPrompt = /\b(bug|error|crash|fail(?:ing|ed|s)?|broken|500|exception|kenapa gagal|kok error|benerin)\b/i
      .test(String(data.lastUserInput || ''));
    const testPathRe = /(?:\.test\.|\.spec\.|_test\.|__tests__[\/\\]|tests?[\/\\])/i;

    let priorTurnReproOrTest = false;
    for (let i = lastUserInputIdx; i < parsedSteps.length; i++) {
      const s = parsedSteps[i];
      if (!s || s.step_index >= minStep || s.type !== 'PLANNER_RESPONSE' || !Array.isArray(s.tool_calls)) continue;
      for (let j = 0; j < s.tool_calls.length; j++) {
        const tc = s.tool_calls[j];
        if (!tc) continue;
        if (tc.name === 'run_command' || tc.name === 'Bash' || tc.name === 'run_shell_command') {
          priorTurnReproOrTest = true;
        }
        const n = normalizeEditToolCall(tc.name, tc.args);
        if (n && n.filePath && testPathRe.test(n.filePath)) {
          priorTurnReproOrTest = true;
        }
      }
    }

    let sourceEditsSinceStart = 0;
    let prodEditsThisInv = 0;
    let reproOrTestThisInv = false;

    for (let i = 0; i < parsedSteps.length; i++) {
      const step = parsedSteps[i];
      if (step && step.step_index >= minStep && step.type === 'PLANNER_RESPONSE' && Array.isArray(step.tool_calls)) {
        for (let j = 0; j < step.tool_calls.length; j++) {
          const tc = step.tool_calls[j];
          if (!tc) continue;
          if (tc.name === 'run_command' || tc.name === 'Bash' || tc.name === 'run_shell_command') {
            reproOrTestThisInv = true;
            continue;
          }
          if (tc.args && (tc.args.ArtifactMetadata || tc.args.IsArtifact)) continue;

          const norm = normalizeEditToolCall(tc.name, tc.args);
          if (!norm || !norm.filePath) continue;

          if (testPathRe.test(norm.filePath)) {
            reproOrTestThisInv = true;
          }

          const ext = path.extname(norm.filePath).slice(1);
          if (SOURCE_EXTENSIONS.has(ext)) {
            sourceEditsSinceStart++;
            if (!testPathRe.test(norm.filePath)) {
              prodEditsThisInv++;
            }
          }

          const mappedInput = norm.canonicalTool === 'Edit'
            ? { file_path: norm.filePath, new_string: norm.newContent, old_string: norm.oldContent }
            : { file_path: norm.filePath, content: norm.newContent };

          processSingleEdit(norm.canonicalTool, mappedInput, function (nudge) {
            findings.push(nudge);
          }, workspaceRoot, true);
        }
      }
    }

    if (isBugPrompt && prodEditsThisInv > 0 && !priorTurnReproOrTest && !reproOrTestThisInv) {
      findings.push('[ASC Systematic Debugging] Production code was edited for a bug/error report before running a reproduction command or writing a failing regression test. Follow skills/asc-test/references/systematic-debugging.md (investigate root cause and reproduce first).');
    }

    if (sourceEditsSinceStart >= SESSION_DRIFT_THRESHOLD) {
      findings.push('[ASC Session Drift] ' + sourceEditsSinceStart + ' source file edits this invocation. '
        + 'Re-read the decision ladder before continuing: (1) Does this need to be built? '
        + '(2) Does the codebase already have this? (3) Stdlib/native? (4) Existing dependency?');
    }

    logHook('AntigravityResult', `sourceEdits=${sourceEditsSinceStart}, findings=${findings.length}`);

    if (findings.length > 0) {
      const injectSteps = findings.map(function (f) { return { ephemeralMessage: f }; });
      process.stdout.write(JSON.stringify({ injectSteps: injectSteps }) + '\n');
    } else {
      process.stdout.write('{}\n');
    }
  } catch (e) {
    logHook('AntigravityError', e.message);
    process.stdout.write('{}\n');
  }
  process.exit(0);
}

function processSingleEdit(toolName, toolInput, emitFn, workspaceRoot, skipSessionCounter) {
  const rawFilePath = toolInput.file_path || toolInput.TargetFile || toolInput.Path || toolInput.filePath || '';
  if (!rawFilePath) return;
  const root = workspaceRoot || process.cwd();
  const filePath = path.isAbsolute(rawFilePath) ? rawFilePath : path.resolve(root, rawFilePath);
  const findings = [];

  const isEdit = toolName === 'Edit' || toolName === 'edit_file' || toolName === 'replace_file_content' || toolName === 'multi_replace_file_content';
  const isWrite = toolName === 'Write' || toolName === 'write_file' || toolName === 'write_to_file';

  const ext = path.extname(filePath).slice(1);
  if (!skipSessionCounter && SOURCE_EXTENSIONS.has(ext)) {
    sourceEditCount++;
    if (sourceEditCount === SESSION_DRIFT_THRESHOLD) {
      findings.push('[ASC Session Drift] ' + SESSION_DRIFT_THRESHOLD + '+ source file edits this session. '
        + 'Re-read the decision ladder before continuing: (1) Does this need to be built? '
        + '(2) Does the codebase already have this? (3) Stdlib/native? (4) Existing dependency?');
    } else if (sourceEditCount > 0 && sourceEditCount % LADDER_PULSE_INTERVAL === 0) {
      findings.push('[ASC] Ladder check: (1) needed? (2) exists already \u2014 reuse? '
        + '(3) stdlib/native? (4) existing dep? (5) one function? Then minimal code.');
    }
  }

  if (filePath.endsWith('package.json')) {
    checkDependencyAddition(toolName, toolInput, findings);
  }

  if (SOURCE_EXTENSIONS.has(ext)) {
    if (isEdit) {
      checkLocDelta(toolInput, filePath, findings);
    } else if (isWrite) {
      checkNewFileSize(toolInput, filePath, findings);
    }
  }

  checkSecurityPatterns(toolName, toolInput, filePath, findings);
  checkStubPatterns(toolName, toolInput, filePath, findings);

  if (ext === 'html' || ext === 'css' || ext === 'jsx' || ext === 'tsx' || ext === 'vue' || ext === 'svelte' || filePath.toLowerCase().endsWith('.blade.php')) {
    checkUiSlopPatterns(toolName, toolInput, filePath, findings);
  }

  checkUniversalLinter(filePath, ext, findings, root);

  checkLivingDocNudge(filePath, findings);
  checkTestTampering(filePath, findings, root);

  if (ext !== 'md') {
    checkWorkflowGate(toolName, filePath, ext, findings, root);
  }

  logHook('ProcessSingleEdit', 'tool=' + toolName + ', file=' + filePath + ', findings=' + findings.length);

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
  } catch (_) { }
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
  var reviewDupes = added.filter(function (d) { return REVIEW_DUPLICATES.has(d); });
  if (stdlibDupes.length > 0) {
    findings.push(
      'Dependency ' + stdlibDupes.join(', ') + ' duplicates stdlib/platform features. '
      + 'Ladder step 3: use the standard library instead.'
    );
  }
  if (reviewDupes.length > 0) {
    findings.push(
      'Dependency ' + reviewDupes.join(', ') + ' may duplicate stdlib/native features (context-dependent). '
      + 'Ladder step 3: confirm the package-specific need, or use the native equivalent.'
    );
  }
  if (stdlibDupes.length === 0 && reviewDupes.length === 0) {
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
  var newLines = (toolInput.new_string || toolInput.ReplacementContent || '').split('\n').length;
  var oldLines = (toolInput.old_string || toolInput.TargetContent || '').split('\n').length;
  var delta = newLines - oldLines;
  if (delta > LOC_DELTA_THRESHOLD) {
    findings.push(
      'Edit added ' + delta + ' net lines to ' + path.basename(filePath) + '. '
      + 'Ladder step 5: can this be one straightforward function?'
    );
  }
}

function checkNewFileSize(toolInput, filePath, findings) {
  var lines = (toolInput.content || toolInput.CodeContent || '').split('\n').length;
  if (lines > NEW_FILE_LINE_THRESHOLD) {
    // Step 1-2 coverage ("does this already exist?") moved to dedup-gate.js
    // which provides concrete file-name + overlap-percentage feedback.
    findings.push(
      'New file ' + path.basename(filePath) + ' created with ' + lines + ' lines. '
      + 'Ladder step 5: can this be one straightforward function?'
    );
  }
}

function logPatternCheck(checkType, patternId, isMatch) {
  try {
    var result = isMatch ? 'match' : 'no-match';
    process.stderr.write('[pattern-check] ' + patternId + ': ' + result + '\n');
  } catch (_) { }
}

function checkSecurityPatterns(toolName, toolInput, filePath, findings) {
  var target = toolName === 'Edit' ? (toolInput.new_string || toolInput.ReplacementContent || '') : (toolInput.content || toolInput.CodeContent || '');
  if (!target) return;

  var ext = path.extname(filePath).slice(1);

  if (SECURITY_PATTERNS.patterns) {
    SECURITY_PATTERNS.patterns.forEach(function (p) {
      try {
        // Language-aware filtering: skip patterns that don't apply to this file type
        var langs = p.languages || [];
        var isUniversal = langs.length === 0 || langs.indexOf('universal') !== -1;
        if (!isUniversal && langs.indexOf(ext) === -1) return;

        var regex = new RegExp(p.regex, 'ig');
        var isMatch = regex.test(target);
        logPatternCheck('security', p.id || 'sec-pattern', isMatch);
        if (isMatch) {
          findings.push('[ASC Security] ' + p.message);
        }
      } catch (_) { }
    });
  }

  var basename = path.basename(filePath);
  if (SECURITY_PATTERNS.fileSpecific && SECURITY_PATTERNS.fileSpecific[basename]) {
    var spec = SECURITY_PATTERNS.fileSpecific[basename];
    try {
      var regex = new RegExp(spec.require, 'g');
      if (target.trim().length > 0) {
        var isMatch = !regex.test(target);
        logPatternCheck('security', spec.id || 'sec-file-specific', isMatch);
        if (isMatch) {
          findings.push('[ASC Security] ' + spec.message);
        }
      }
    } catch (_) { }
  }
}

function checkUiSlopPatterns(toolName, toolInput, filePath, findings) {
  var target = toolName === 'Edit' ? (toolInput.new_string || toolInput.ReplacementContent || '') : (toolInput.content || toolInput.CodeContent || '');
  if (!target) return;

  if (UI_SLOP_PATTERNS.patterns) {
    UI_SLOP_PATTERNS.patterns.forEach(function (p) {
      try {
        var regex = new RegExp(p.regex, 'ig');
        var isMatch = regex.test(target);
        logPatternCheck('ui-slop', p.id || 'ui-pattern', isMatch);
        if (isMatch) {
          findings.push('[ASC UI Note] ' + p.message);
        }
      } catch (_) { }
    });
  }

  var cardGridRe = /<(?:section|div)[^>]*\bgrid\b[\s\S]{0,260}?rounded-(?:xl|2xl)[^>]*\bborder\b/ig;
  var cardGrids = target.match(cardGridRe) || [];
  var hasSemanticTableOrList = /<(?:table|ol)[\s>]/i.test(target);
  if (cardGrids.length >= 3 && !hasSemanticTableOrList) {
    findings.push(
      '[ASC Card Soup Alert] ' + cardGrids.length + ' bordered card-grid sections detected in ' + path.basename(filePath)
      + ' with zero semantic <table> or <ol> containers. Convert sequential steps to <ol> steppers, criteria/records to <table>, and rosters to divide-y lists (skills/asc-ui/references/data-to-structure.md).'
    );
  }
}

function checkStubPatterns(toolName, toolInput, filePath, findings) {
  var target = toolName === 'Edit' ? (toolInput.new_string || toolInput.ReplacementContent || '') : (toolInput.content || toolInput.CodeContent || '');
  if (!target) return;

  var ext = path.extname(filePath).slice(1);
  if (STUB_PATTERNS.patterns) {
    STUB_PATTERNS.patterns.forEach(function (p) {
      try {
        var langs = p.languages || [];
        var isUniversal = langs.length === 0 || langs.indexOf('universal') !== -1;
        if (!isUniversal && langs.indexOf(ext) === -1) return;

        var regex = new RegExp(p.regex, 'im');
        var isMatch = regex.test(target);
        logPatternCheck('stub', p.id || 'stub-pattern', isMatch);
        if (isMatch) {
          findings.push('[ASC Stub/Fake-Done Alert] ' + p.message);
        }
      } catch (_) { }
    });
  }
}

function checkUniversalLinter(filePath, ext, findings, workspaceRoot) {
  var execSync = require('child_process').execSync;
  var cwd = workspaceRoot || process.cwd();

  if (ext === 'js' || ext === 'ts' || ext === 'jsx' || ext === 'tsx' || ext === 'mjs' || ext === 'cjs') {
    try {
      var hasBiome = fs.existsSync(path.join(cwd, 'biome.json')) || fs.existsSync(path.join(cwd, 'biome.jsonc'));
      if (hasBiome) {
        execSync('npx @biomejs/biome lint "' + filePath + '"', { cwd: cwd, stdio: 'pipe', timeout: 3000 });
        return;
      }
      var hasEslint = fs.existsSync(path.join(cwd, '.eslintrc.json')) ||
        fs.existsSync(path.join(cwd, '.eslintrc.js')) ||
        fs.existsSync(path.join(cwd, 'eslint.config.js')) ||
        fs.existsSync(path.join(cwd, 'eslint.config.mjs')) ||
        (fs.existsSync(path.join(cwd, 'package.json')) && fs.readFileSync(path.join(cwd, 'package.json'), 'utf8').includes('eslintConfig'));

      if (hasEslint) {
        execSync('npx eslint "' + filePath + '" --format json', { cwd: cwd, stdio: 'pipe', timeout: 4000 });
      }
    } catch (error) {
      if (error.stdout) {
        try {
          var out = JSON.parse(error.stdout.toString());
          if (Array.isArray(out) && out.length > 0 && out[0].messages && out[0].messages.length > 0) {
            var firstErr = out[0].messages[0];
            findings.push('[ASC Linter] ' + firstErr.message + ' at line ' + firstErr.line + '.');
          }
        } catch (_) {
          var msg = error.stdout.toString().split('\n')[0];
          if (msg) findings.push('[ASC Linter] ' + msg);
        }
      }
    }
  } else if (ext === 'py') {
    try {
      if (fs.existsSync(path.join(cwd, 'pyproject.toml')) || fs.existsSync(path.join(cwd, 'ruff.toml'))) {
        execSync('ruff check --quiet "' + filePath + '"', { cwd: cwd, stdio: 'pipe', timeout: 3000 });
      }
    } catch (error) {
      if (error.stdout) {
        var first = error.stdout.toString().split('\n')[0];
        if (first) findings.push('[ASC Python Linter] ' + first);
      }
    }
  } else if (ext === 'go') {
    try {
      if (fs.existsSync(path.join(cwd, 'go.mod'))) {
        execSync('go vet "' + filePath + '"', { cwd: cwd, stdio: 'pipe', timeout: 4000 });
      }
    } catch (error) {
      if (error.stderr) {
        var first = error.stderr.toString().split('\n')[0];
        if (first) findings.push('[ASC Go Vet] ' + first);
      }
    }
  } else if (ext === 'rs') {
    try {
      if (fs.existsSync(path.join(cwd, 'Cargo.toml'))) {
        execSync('cargo clippy --quiet --message-format=short', { cwd: cwd, stdio: 'pipe', timeout: 5000 });
      }
    } catch (error) {
      if (error.stderr) {
        var first = error.stderr.toString().split('\n')[0];
        if (first) findings.push('[ASC Clippy] ' + first);
      }
    }
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

function checkTestTampering(filePath, findings, workspaceRoot) {
  var isTest = /(?:\.test\.|\.spec\.|_test\.|__tests__[\/\\]|tests?[\/\\]).*\.(?:js|ts|jsx|tsx|py|go|rs|rb)$/i.test(filePath);
  if (!isTest) return;

  try {
    var root = workspaceRoot || process.cwd();
    var pathUtil = require('./path-util.cjs');
    var localGate = path.join(root, 'workflow-gate.json');
    var gatePath = fs.existsSync(localGate) ? localGate : pathUtil.getWorkflowGatePath(root);
    if (!fs.existsSync(gatePath)) return;

    var gate = JSON.parse(fs.readFileSync(gatePath, 'utf8'));
    if (gate.phase === 'implement' || gate.phase === 'bugfix') {
      findings.push(
        '[ASC Test Integrity Alert] Test file modified (' + path.basename(filePath) + ') during ' + gate.phase + ' phase. '
        + 'Ensure assertions were NOT weakened to force a pass; fix the underlying business logic instead.'
      );
    }
  } catch (_) { }
}

function checkWorkflowGate(toolName, filePath, ext, findings, workspaceRoot) {
  try {
    var root = workspaceRoot || process.cwd();
    var pathUtil = require('./path-util.cjs');
    var localGate = path.join(root, 'workflow-gate.json');
    var gatePath = fs.existsSync(localGate) ? localGate : pathUtil.getWorkflowGatePath(root);
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
      validateDocSpecs(gate.workflow, findings, root);
    }
  } catch (_) {
    // Silent fail
  }
}

function validateDocSpecs(workflow, findings, workspaceRoot) {
  try {
    var cwd = workspaceRoot || process.cwd();
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
  } catch (_) { }
}


