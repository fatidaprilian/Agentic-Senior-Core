#!/usr/bin/env node
// Agentic Senior Core — PreToolUse dependency gate hook
// Hard-blocks edits/writes to package.json if new dependencies duplicate stdlib/platform features.
// Supports Claude Code hookSpecificOutput permissionDecision deny response format.

const fs = require('fs');
const path = require('path');

let knownDuplicates = new Set();
try {
  const knownPath = path.join(__dirname, 'lib', 'known-duplicates.json');
  if (fs.existsSync(knownPath)) {
    const raw = JSON.parse(fs.readFileSync(knownPath, 'utf8'));
    if (Array.isArray(raw.duplicates)) {
      knownDuplicates = new Set(raw.duplicates);
    }
  }
} catch (_) {
  // Fallback set if JSON loading fails
  knownDuplicates = new Set(['lodash', 'underscore', 'moment', 'dayjs', 'uuid', 'axios', 'rimraf']);
}

let inputBuffer = '';
process.stdin.setEncoding('utf8');
process.stdin.on('data', function (chunk) { inputBuffer += chunk; });
process.stdin.on('end', function () {
  try {
    const data = JSON.parse(inputBuffer);
    const toolName = data.tool_name || '';
    const toolInput = data.tool_input || {};
    const filePath = toolInput.file_path || '';

    if (!filePath.endsWith('package.json')) {
      process.exit(0);
      return;
    }

    const target = toolName === 'Edit' ? (toolInput.new_string || '') : (toolInput.content || '');
    const baseline = toolName === 'Edit' ? (toolInput.old_string || '') : '';

    const depPattern = /"([^"]+)"\s*:\s*"[~^>=<*]?\d/g;
    const newDeps = extractDeps(target, depPattern);
    const oldDeps = extractDeps(baseline, depPattern);

    const added = newDeps.filter(function (d) { return oldDeps.indexOf(d) === -1; });
    if (added.length === 0) {
      process.exit(0);
      return;
    }

    const allowlist = loadAllowlist();
    const forbidden = added.filter(function (dep) {
      return knownDuplicates.has(dep) && !allowlist.has(dep);
    });

    if (forbidden.length > 0) {
      const reason = '[ASC Hard-Block] Dependency ' + forbidden.map(function(d){ return "'" + d + "'"; }).join(', ') 
        + ' duplicates standard library or native platform features. '
        + 'Ladder step 3: use stdlib/native features instead, or add to .asc/dependency-allowlist.json to override.';
      
      const output = {
        hookSpecificOutput: {
          hookEventName: 'PreToolUse',
          permissionDecision: 'deny',
          permissionDecisionReason: reason
        }
      };
      process.stdout.write(JSON.stringify(output));
      process.exit(0);
      return;
    }
  } catch (_) {
    // Silent fail to ensure session stability
  }
  process.exit(0);
});

function extractDeps(text, pattern) {
  const matches = [];
  let match;
  while ((match = pattern.exec(text)) !== null) {
    matches.push(match[1]);
  }
  return matches;
}

function loadAllowlist() {
  const allowed = new Set();
  const candidates = [
    path.join(process.cwd(), '.asc', 'dependency-allowlist.json'),
    path.join(process.cwd(), '.agents', 'dependency-allowlist.json')
  ];

  for (let i = 0; i < candidates.length; i++) {
    try {
      if (fs.existsSync(candidates[i])) {
        const content = JSON.parse(fs.readFileSync(candidates[i], 'utf8'));
        const deps = content.allowedDependencies || content.allowed || {};
        if (Array.isArray(deps)) {
          deps.forEach(function (d) { allowed.add(d); });
        } else if (typeof deps === 'object') {
          Object.keys(deps).forEach(function (d) { allowed.add(d); });
        }
      }
    } catch (_) {}
  }
  return allowed;
}
