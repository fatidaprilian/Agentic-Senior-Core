#!/usr/bin/env node
// Agentic Senior Core — PreToolUse dependency gate hook
// Hard-blocks edits/writes to package.json AND shell commands (npm install/yarn add/ascx)
// if new dependencies duplicate stdlib/platform features.
// Supports Claude Code, Antigravity IDE (run_command), and Copilot CLI hook response formats.

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
    const toolName = data.tool_name || data.toolName || '';
    const toolInput = data.tool_input || data.toolInput || {};
    let added = [];

    const isTerminal = ['Bash', 'run_command', 'run_shell_command', 'terminal', 'execute_command'].includes(toolName);
    const isFileEdit = ['Edit', 'Write', 'replace_file_content', 'write_to_file', 'write_file', 'multi_replace_file_content'].includes(toolName);

    if (isTerminal) {
      const command = toolInput.command || toolInput.CommandLine || toolInput.cmd || toolInput.commandLine || '';
      added = extractCommandDeps(command);
    } else if (isFileEdit) {
      const filePath = toolInput.file_path || toolInput.TargetFile || toolInput.path || toolInput.target_file || '';
      if (!filePath.endsWith('package.json')) {
        process.exit(0);
        return;
      }
      const target = (toolName === 'Edit' || toolName === 'replace_file_content')
        ? (toolInput.new_string || toolInput.ReplacementContent || toolInput.content || '')
        : (toolInput.content || toolInput.CodeContent || '');
      const baseline = (toolName === 'Edit' || toolName === 'replace_file_content')
        ? (toolInput.old_string || toolInput.TargetContent || '')
        : '';

      const depPattern = /"([^"]+)"\s*:\s*"[~^>=<*]?\d/g;
      const newDeps = extractDeps(target, depPattern);
      const oldDeps = extractDeps(baseline, depPattern);

      added = newDeps.filter(function (d) { return oldDeps.indexOf(d) === -1; });
    }

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
        allow_tool: false,
        deny_reason: reason,
        hookSpecificOutput: {
          hookEventName: 'PreToolUse',
          permissionDecision: 'deny',
          permissionDecisionReason: reason
        }
      };
      process.stdout.write(JSON.stringify(output) + '\n');
      process.exit(2);
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

function extractCommandDeps(command) {
  const installRegex = /(?:npm|yarn|pnpm|bun|ascx)\s+(?:install|i|add)(?:\s+[^\s]+)*/i;
  if (!installRegex.test(command)) return [];

  const parts = command.split(/\s+/);
  const pkgIndex = parts.findIndex(p => ['install', 'i', 'add'].includes(p.toLowerCase()));
  if (pkgIndex === -1 || pkgIndex >= parts.length - 1) return [];

  const rawArgs = parts.slice(pkgIndex + 1);
  const deps = [];
  for (let arg of rawArgs) {
    if (arg.startsWith('-')) continue; // Skip flags like -D, --save-dev
    if (arg.startsWith('http://') || arg.startsWith('https://') || arg.startsWith('git+')) continue;
    
    // Remove scope/version if any, e.g. lodash@^4.17 -> lodash, @types/node@18 -> @types/node
    let name = arg;
    if (name.startsWith('@')) {
      const slashIndex = name.indexOf('/');
      if (slashIndex !== -1) {
        const atIndex = name.indexOf('@', slashIndex);
        if (atIndex !== -1) name = name.substring(0, atIndex);
      }
    } else {
      const atIndex = name.indexOf('@');
      if (atIndex !== -1) name = name.substring(0, atIndex);
    }
    if (name) deps.push(name);
  }
  return deps;
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
