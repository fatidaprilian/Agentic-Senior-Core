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

// Framework-conventional filenames that MUST be identical across directories by design.
// Matches where both files share one of these basenames in different dirs are not duplication.
const FRAMEWORK_CONVENTIONAL_BASENAMES = new Set([
  // Next.js App Router
  'page.tsx', 'page.jsx', 'page.ts', 'page.js',
  'layout.tsx', 'layout.jsx', 'layout.ts', 'layout.js',
  'loading.tsx', 'loading.jsx', 'loading.ts', 'loading.js',
  'error.tsx', 'error.jsx', 'error.ts', 'error.js',
  'not-found.tsx', 'not-found.jsx', 'not-found.ts', 'not-found.js',
  'template.tsx', 'template.jsx', 'template.ts', 'template.js',
  'route.tsx', 'route.ts', 'route.js',
  'default.tsx', 'default.jsx', 'default.ts', 'default.js',
  // Remix
  'root.tsx', 'root.jsx', 'root.ts', 'root.js',
  'entry.server.tsx', 'entry.server.ts', 'entry.client.tsx', 'entry.client.ts',
  // Expo Router
  '_layout.tsx', '_layout.jsx', '_layout.ts', '_layout.js',
  // Nuxt
  'index.vue', 'app.vue',
  // SvelteKit
  '+page.svelte', '+layout.svelte', '+page.server.ts', '+page.server.js',
  '+error.svelte', '+layout.server.ts', '+layout.server.js',
  // Common convention / barrel files
  'index.ts', 'index.js', 'index.tsx', 'index.jsx',
  'types.ts', 'types.d.ts',
  // Config files (declarative, structurally similar across projects)
  'tailwind.config.ts', 'tailwind.config.js', 'tailwind.config.mjs',
  'postcss.config.js', 'postcss.config.mjs', 'postcss.config.cjs',
  'next.config.ts', 'next.config.js', 'next.config.mjs',
  'vite.config.ts', 'vite.config.js', 'vite.config.mjs',
  'tsconfig.json', 'jest.config.ts', 'jest.config.js', 'vitest.config.ts',
]);

// Suffix patterns for frameworks that mandate a naming convention (e.g. Angular).
// Files matching the same suffix in different dirs are structural, not copy-paste.
const FRAMEWORK_CONVENTIONAL_SUFFIXES = [
  // Angular (*.component.ts, *.module.ts, *.service.ts, *.pipe.ts, *.directive.ts)
  '.component.ts', '.component.js', '.module.ts', '.service.ts',
  '.pipe.ts', '.directive.ts', '.guard.ts', '.resolver.ts',
  // Storybook
  '.stories.tsx', '.stories.jsx', '.stories.ts', '.stories.js',
  // Test / spec (structurally similar boilerplate across suites)
  '.spec.ts', '.spec.tsx', '.spec.js', '.spec.jsx',
  '.test.ts', '.test.tsx', '.test.js', '.test.jsx',
];

function hasConventionalSuffix(basename) {
  for (var i = 0; i < FRAMEWORK_CONVENTIONAL_SUFFIXES.length; i++) {
    if (basename.endsWith(FRAMEWORK_CONVENTIONAL_SUFFIXES[i])) return true;
  }
  return false;
}

function isFrameworkConventional(basename) {
  return FRAMEWORK_CONVENTIONAL_BASENAMES.has(basename) || hasConventionalSuffix(basename);
}

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
  return {
    mode: 'advisory',
    minTokens: 30,
    ignoreDirs: [
      'tests', 'test', '__tests__', 'migrations', 'generated', 'node_modules',
      'dist', 'build', '.next', '.nuxt', '.expo', 'coverage', '.storybook',
      'prisma/migrations', 'android', 'ios',
    ],
  };
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
  var targetBasename = path.basename(filePath);

  for (var i = 0; i < duplicates.length; i++) {
    var dup = duplicates[i];
    var firstName = path.resolve(dup.firstFile.name).replace(/\\/g, '/').toLowerCase();
    var secondName = path.resolve(dup.secondFile.name).replace(/\\/g, '/').toLowerCase();

    if (firstName === normalizedTarget || secondName === normalizedTarget) {
      var otherRaw = firstName === normalizedTarget ? dup.secondFile.name : dup.firstFile.name;
      var otherBasename = path.basename(otherRaw);

      // Skip framework-conventional filenames in different directories — identical names
      // are mandated by the framework (e.g. Next.js page.tsx, Angular *.component.ts),
      // not copy-paste duplication.
      if (isFrameworkConventional(targetBasename)
          && isFrameworkConventional(otherBasename)
          && path.dirname(path.resolve(filePath)) !== path.dirname(path.resolve(otherRaw))) {
        continue;
      }

      // Show relative path instead of bare basename so the developer knows WHICH file.
      var cwd = process.cwd();
      var matchedFile = path.relative(cwd, path.resolve(otherRaw)).replace(/\\/g, '/');
      var lines = dup.lines || 0;
      var totalFileLines = 1;
      try {
        totalFileLines = fs.readFileSync(path.resolve(filePath), 'utf8').split('\n').length || 1;
      } catch (_) {
        totalFileLines = dup.firstFile.lines || dup.secondFile.lines || lines || 1;
      }
      var percent = Math.round((lines / totalFileLines) * 100);

      // Skip trivial matches (import boilerplate, small overlaps)
      if (lines < 10 && percent < 10) {
        continue;
      }

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
