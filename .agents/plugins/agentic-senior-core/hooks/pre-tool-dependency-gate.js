#!/usr/bin/env node
// Agentic Senior Core — PreToolUse dependency & safety gate hook
// Gates edits/writes to dependency manifests AND shell commands (npm install/yarn add/ascx,
// git commit/push, unverified/insecure git clone).
// Supports Antigravity (App, CLI, IDE), Claude Code, Codex CLI, and Copilot CLI.

const fs = require('fs');
const path = require('path');
const {
  isAntigravityPayload,
  resolveWorkspaceRoot,
  normalizeEditToolCall,
} = require('./path-util.cjs');

let knownDuplicates = new Set();
let reviewDuplicates = new Set();
let reviewReasons = {};
try {
  const knownPath = path.join(__dirname, 'lib', 'known-duplicates.json');
  if (fs.existsSync(knownPath)) {
    const raw = JSON.parse(fs.readFileSync(knownPath, 'utf8'));
    if (Array.isArray(raw.block) || Array.isArray(raw.review)) {
      knownDuplicates = new Set(raw.block || []);
      reviewDuplicates = new Set(raw.review || []);
      reviewReasons = raw.reviewReasons || {};
    } else if (Array.isArray(raw.duplicates)) {
      reviewDuplicates = new Set(raw.duplicates);
    }
  }
} catch (_) {
  knownDuplicates = new Set(['left-pad', 'is-odd', 'mkdirp', 'rimraf', 'node-fetch', 'underscore']);
}

function emitAllow(isAntigravity) {
  if (isAntigravity) {
    process.stdout.write(JSON.stringify({ decision: 'allow' }) + '\n');
  }
  process.exit(0);
}

function emitGateDecision(antigravityDecision, reason, isAntigravity) {
  if (isAntigravity) {
    process.stdout.write(JSON.stringify({
      decision: antigravityDecision,
      reason: reason,
    }) + '\n');
    process.exit(0);
    return;
  }

  const output = {
    allow_tool: false,
    deny_reason: reason,
    hookSpecificOutput: {
      hookEventName: 'PreToolUse',
      permissionDecision: 'deny',
      permissionDecisionReason: reason,
    },
  };
  process.stdout.write(JSON.stringify(output) + '\n');
  process.exit(2);
}

function handlePayload(data) {
  const isAntigravity = isAntigravityPayload(data);
  if (!data || typeof data !== 'object') {
    emitAllow(isAntigravity);
    return;
  }

  const workspaceRoot = resolveWorkspaceRoot(data);
  const toolName = data.toolCall ? (data.toolCall.name || '') : (data.tool_name || data.toolName || '');
  const toolInput = data.toolCall ? (data.toolCall.args || {}) : (data.tool_input || data.toolInput || {});
  let added = [];

  const isTerminal = ['Bash', 'run_command', 'run_shell_command', 'terminal', 'execute_command'].includes(toolName);
  const normalizedEdit = !isTerminal ? normalizeEditToolCall(toolName, toolInput) : null;

  if (isTerminal) {
    const command = toolInput.command || toolInput.CommandLine || toolInput.cmd || toolInput.commandLine || '';

    if (isGitCommitOrPush(command)) {
      const reason = isAntigravity
        ? '[ASC Gate] Confirm git commit/push was explicitly requested by the user this turn.'
        : '[ASC Hard-Block] git commit/push detected. Never run git commit, git push, or git push --force unless the user explicitly requests it this turn.';
      emitGateDecision('force_ask', reason, isAntigravity);
      return;
    }

    const allowlist = loadAllowlist(workspaceRoot);

    const cloneCheck = checkGitClone(command, allowlist);
    if (cloneCheck && cloneCheck.blocked) {
      emitGateDecision('deny', cloneCheck.reason, isAntigravity);
      return;
    }

    added = extractCommandDeps(command);
  } else if (normalizedEdit) {
    const filePath = normalizedEdit.filePath || '';
    const manifestFiles = ['package.json', 'requirements.txt', 'pyproject.toml', 'go.mod', 'Cargo.toml', 'Gemfile'];
    const isManifest = manifestFiles.some(function (m) { return filePath.endsWith(m); });
    if (!isManifest) {
      emitAllow(isAntigravity);
      return;
    }

    const depPattern = /"([^"]+)"\s*:\s*"[~^>=<*]?\d/g;
    const newDeps = extractDeps(normalizedEdit.newContent, depPattern);
    const oldDeps = extractDeps(normalizedEdit.oldContent, depPattern);

    added = newDeps.filter(function (d) { return oldDeps.indexOf(d) === -1; });
  }

  if (added.length === 0) {
    emitAllow(isAntigravity);
    return;
  }

  const allowlist = loadAllowlist(workspaceRoot);
  const notAllowed = added.filter(function (dep) {
    return !allowlist.has(dep);
  });
  const forbidden = notAllowed.filter(function (dep) {
    return knownDuplicates.has(dep) || reviewDuplicates.has(dep);
  });

  const blocked = forbidden.filter(function (dep) {
    return knownDuplicates.has(dep);
  });
  const reviewOnly = forbidden.filter(function (dep) {
    return !knownDuplicates.has(dep) && reviewDuplicates.has(dep);
  });

  if (blocked.length > 0) {
    const reason = '[ASC Hard-Block] Dependency ' + blocked.map(function (d) { return "'" + d + "'"; }).join(', ')
      + ' duplicates standard library or native platform features. '
      + 'Ladder step 3: use stdlib/native features instead, or add to .asc/dependency-allowlist.json to override.';
    emitGateDecision('deny', reason, isAntigravity);
    return;
  }

  if (reviewOnly.length > 0) {
    const reasons = reviewOnly.map(function (dep) {
      return "'" + dep + "': " + (reviewReasons[dep] || 'native alternative exists; confirm the package-specific need');
    }).join(' ');
    const reason = '[ASC Review] Dependency ' + reviewOnly.join(', ')
      + ' may duplicate stdlib/native features. ' + reasons
      + ' If the need is real, add it to .asc/dependency-allowlist.json and retry.';
    emitGateDecision('deny', reason, isAntigravity);
    return;
  }

  emitAllow(isAntigravity);
}

if (process.stdin.isTTY) {
  process.exit(0);
}

let handled = false;
let inputBuffer = '';
const stdinTimer = setTimeout(function () {
  if (!handled) {
    handled = true;
    process.exit(0);
  }
}, 3000);

process.stdin.setEncoding('utf8');
process.stdin.on('data', function (chunk) {
  inputBuffer += chunk;
  try {
    const data = JSON.parse(inputBuffer);
    if (!handled) {
      handled = true;
      clearTimeout(stdinTimer);
      handlePayload(data);
    }
  } catch (_) {
    // Wait for remaining chunks
  }
});

process.stdin.on('end', function () {
  if (handled) return;
  handled = true;
  clearTimeout(stdinTimer);
  if (!inputBuffer.trim()) {
    process.exit(0);
    return;
  }
  try {
    handlePayload(JSON.parse(inputBuffer));
  } catch (_) {
    process.exit(0);
  }
});

function isGitCommitOrPush(command) {
  if (!command || typeof command !== 'string') return false;

  const subcommands = command.split(/[\r\n;&|]+/);

  for (let i = 0; i < subcommands.length; i++) {
    const sub = subcommands[i].trim();
    if (!sub || !/\b(?:git|git\.exe)\b/i.test(sub)) continue;

    const tokens = sub.match(/(?:[^\s"']+|"[^"]*"|'[^']*')+/g) || [];
    let gitIdx = -1;

    for (let j = 0; j < tokens.length; j++) {
      const clean = tokens[j].replace(/^['"]|['"]$/g, '').toLowerCase();
      if (clean === 'git' || clean === 'git.exe') {
        gitIdx = j;
        break;
      }
    }

    if (gitIdx === -1) continue;

    for (let k = gitIdx + 1; k < tokens.length; k++) {
      let tok = tokens[k].replace(/^['"]|['"]$/g, '');
      if (!tok) continue;

      if (tok.startsWith('-')) {
        if (['-C', '-c', '--git-dir', '--work-tree', '--namespace', '--exec-path'].includes(tok)) {
          k++;
        }
        continue;
      }

      const gitSub = tok.toLowerCase();
      if (gitSub === 'commit' || gitSub === 'push' || gitSub === 'commit-tree') {
        return true;
      }

      break;
    }
  }

  return false;
}

function checkGitClone(command, allowlist) {
  if (!command || typeof command !== 'string') return null;

  const subcommands = command.split(/[\r\n;&|]+/);

  for (let i = 0; i < subcommands.length; i++) {
    const sub = subcommands[i].trim();
    if (!sub || !/\b(?:git|git\.exe)\b/i.test(sub)) continue;

    const tokens = sub.match(/(?:[^\s"']+|"[^"]*"|'[^']*')+/g) || [];
    let gitIdx = -1;

    for (let j = 0; j < tokens.length; j++) {
      const clean = tokens[j].replace(/^['"]|['"]$/g, '').toLowerCase();
      if (clean === 'git' || clean === 'git.exe') {
        gitIdx = j;
        break;
      }
    }

    if (gitIdx === -1) continue;

    let isClone = false;
    let nextIdx = gitIdx + 1;
    for (; nextIdx < tokens.length; nextIdx++) {
      let tok = tokens[nextIdx].replace(/^['"]|['"]$/g, '');
      if (!tok) continue;

      if (tok.startsWith('-')) {
        if (['-C', '-c', '--git-dir', '--work-tree', '--namespace', '--exec-path'].includes(tok)) {
          nextIdx++;
        }
        continue;
      }

      if (tok.toLowerCase() === 'clone') {
        isClone = true;
        nextIdx++;
      }
      break;
    }

    if (!isClone) continue;

    let repoArg = '';
    for (let k = nextIdx; k < tokens.length; k++) {
      let tok = tokens[k].replace(/^['"]|['"]$/g, '');
      if (!tok) continue;

      if (tok.startsWith('-')) {
        if (['-b', '--branch', '--depth', '--origin', '-o', '--reference', '--filter', '-u', '--upload-pack', '--template'].includes(tok)) {
          k++;
        }
        continue;
      }

      repoArg = tok;
      break;
    }

    if (!repoArg) continue;

    if (repoArg.startsWith('git://') || repoArg.startsWith('http://')) {
      return {
        blocked: true,
        reason: '[ASC Hard-Block] Insecure git clone protocol detected (' + repoArg + '). '
          + 'Use secure HTTPS or SSH (git@) with verified TLS.',
      };
    }

    const normalized = repoArg.toLowerCase().replace(/\.git$/, '');

    let ownerRepo = '';
    const ghMatch = repoArg.match(/(?:github\.com|gitlab\.com|bitbucket\.org)[:\/]([^\/\s]+\/[^\/\s#?]+)/i);
    if (ghMatch) {
      ownerRepo = ghMatch[1].toLowerCase().replace(/\.git$/, '');
    }

    const isAllowed = allowlist && (
      (allowlist.has && (allowlist.has(repoArg) || allowlist.has(normalized) || (ownerRepo && allowlist.has(ownerRepo)))) ||
      (allowlist.repositories && (allowlist.repositories.has(repoArg.toLowerCase()) || allowlist.repositories.has(normalized) || (ownerRepo && allowlist.repositories.has(ownerRepo))))
    );

    if (!isAllowed) {
      return {
        blocked: true,
        reason: '[ASC Hard-Block] Unverified git clone target: \'' + repoArg + '\'. '
          + 'Verify repository provenance against trusted sources (mitigate HalluSquatting) '
          + 'or add to allowedRepositories in .asc/dependency-allowlist.json to allow.',
      };
    }
  }

  return null;
}

function extractDeps(text, pattern) {
  const matches = [];
  let match;
  while ((match = pattern.exec(text)) !== null) {
    matches.push(match[1]);
  }
  return matches;
}

function extractCommandDeps(command) {
  const installRegex = /(?:npm|yarn|pnpm|bun|ascx|pip3?|uv|poetry|cargo|gem|bundle)\s+(?:install|i|add|get)(?:\s+[^\s]+)*/i;
  if (!installRegex.test(command)) return [];

  const parts = command.split(/\s+/);
  const pkgIndex = parts.findIndex(p => ['install', 'i', 'add'].includes(p.toLowerCase()));
  if (pkgIndex === -1 || pkgIndex >= parts.length - 1) return [];

  const rawArgs = parts.slice(pkgIndex + 1);
  const deps = [];
  for (const arg of rawArgs) {
    if (arg.startsWith('-')) continue;
    if (arg.startsWith('http://') || arg.startsWith('https://') || arg.startsWith('git+')) continue;

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

function loadAllowlist(workspaceRoot) {
  const root = workspaceRoot || process.cwd();
  const allowed = new Set();
  allowed.repositories = new Set();
  const candidates = [
    path.join(root, '.asc', 'dependency-allowlist.json'),
    path.join(root, '.agents', 'dependency-allowlist.json'),
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

        const repos = content.allowedRepositories || content.allowedRepos || [];
        if (Array.isArray(repos)) {
          repos.forEach(function (r) {
            allowed.add(r);
            allowed.repositories.add(r.toLowerCase());
            allowed.repositories.add(r.toLowerCase().replace(/\.git$/, ''));
          });
        }
      }
    } catch (_) { }
  }
  return allowed;
}
