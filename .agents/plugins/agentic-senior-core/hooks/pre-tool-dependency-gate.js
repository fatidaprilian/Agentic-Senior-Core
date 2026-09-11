#!/usr/bin/env node
// Agentic Senior Core — PreToolUse dependency gate hook
// Hard-blocks edits/writes to package.json AND shell commands (npm install/yarn add/ascx)
// if new dependencies duplicate stdlib/platform features.
// Supports Claude Code, Antigravity IDE (run_command), and Copilot CLI hook response formats.

const fs = require('fs');
const path = require('path');

let knownDuplicates = new Set();
let reviewDuplicates = new Set();
let reviewReasons = {};
try {
  const knownPath = path.join(__dirname, 'lib', 'known-duplicates.json');
  if (fs.existsSync(knownPath)) {
    const raw = JSON.parse(fs.readFileSync(knownPath, 'utf8'));
    // Tiered structure (v5): 'block' = always redundant, 'review' = context-dependent.
    // Legacy flat 'duplicates' arrays are treated as review-tier for backward compatibility.
    if (Array.isArray(raw.block) || Array.isArray(raw.review)) {
      knownDuplicates = new Set(raw.block || []);
      reviewDuplicates = new Set(raw.review || []);
      reviewReasons = raw.reviewReasons || {};
    } else if (Array.isArray(raw.duplicates)) {
      reviewDuplicates = new Set(raw.duplicates);
    }
  }
} catch (_) {
  // Fallback if JSON loading fails: block only the always-redundant set
  knownDuplicates = new Set(['left-pad', 'is-odd', 'mkdirp', 'rimraf', 'node-fetch', 'underscore']);
}

let inputBuffer = '';
process.stdin.setEncoding('utf8');
process.stdin.on('data', chunk => {
  inputBuffer += chunk;
  try {
    const data = JSON.parse(inputBuffer);
    const isAntigravity = !!data.toolCall;
    const toolName = isAntigravity ? data.toolCall.name : (data.tool_name || data.toolName || '');
    const toolInput = isAntigravity ? data.toolCall.args : (data.tool_input || data.toolInput || {});
    let added = [];

    const isTerminal = ['Bash', 'run_command', 'run_shell_command', 'terminal', 'execute_command'].includes(toolName);
    const isFileEdit = ['Edit', 'Write', 'replace_file_content', 'write_to_file', 'write_file', 'multi_replace_file_content'].includes(toolName);

    if (isTerminal) {
      const command = toolInput.command || toolInput.CommandLine || toolInput.cmd || toolInput.commandLine || '';

      // Hard-block git commit/push unless explicitly allowed
      if (isGitCommitOrPush(command)) {
        const reason = '[ASC Hard-Block] git commit/push detected. Never run git commit, git push, or git push --force unless the user explicitly requests it this turn.';
        let output;
        if (isAntigravity) {
          output = { decision: "deny", reason: reason };
        } else {
          output = {
            allow_tool: false,
            deny_reason: reason,
            hookSpecificOutput: {
              hookEventName: 'PreToolUse',
              permissionDecision: 'deny',
              permissionDecisionReason: reason
            }
          };
        }
        process.stdout.write(JSON.stringify(output) + '\n');
        process.exit(2);
        return;
      }

      const allowlist = loadAllowlist();

      // Hard-block unverified git clone targets (HalluSquatting mitigation)
      const cloneCheck = checkGitClone(command, allowlist);
      if (cloneCheck && cloneCheck.blocked) {
        const reason = cloneCheck.reason;
        let output;
        if (isAntigravity) {
          output = { decision: "deny", reason: reason };
        } else {
          output = {
            allow_tool: false,
            deny_reason: reason,
            hookSpecificOutput: {
              hookEventName: 'PreToolUse',
              permissionDecision: 'deny',
              permissionDecisionReason: reason
            }
          };
        }
        process.stdout.write(JSON.stringify(output) + '\n');
        process.exit(2);
        return;
      }

      added = extractCommandDeps(command);
    } else if (isFileEdit) {
      const filePath = toolInput.file_path || toolInput.TargetFile || toolInput.path || toolInput.target_file || '';
      const manifestFiles = ['package.json', 'requirements.txt', 'pyproject.toml', 'go.mod', 'Cargo.toml', 'Gemfile'];
      const isManifest = manifestFiles.some(function (m) { return filePath.endsWith(m); });
      if (!isManifest) {
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

      let output;
      if (isAntigravity) {
        output = {
          decision: "deny",
          reason: reason
        };
      } else {
        output = {
          allow_tool: false,
          deny_reason: reason,
          hookSpecificOutput: {
            hookEventName: 'PreToolUse',
            permissionDecision: 'deny',
            permissionDecisionReason: reason
          }
        };
      }
      process.stdout.write(JSON.stringify(output) + '\n');
      process.exit(2);
      return;
    }

    if (reviewOnly.length > 0) {
      // Context-dependent packages: nudge with the specific reason instead of blocking.
      // A PreToolUse deny is the only injection channel on some hosts, so deny with a
      // clear "allowed after review" message pointing at the allowlist escape hatch.
      const reasons = reviewOnly.map(function (dep) {
        return "'" + dep + "': " + (reviewReasons[dep] || 'native alternative exists; confirm the package-specific need');
      }).join(' ');
      const reason = '[ASC Review] Dependency ' + reviewOnly.join(', ')
        + ' may duplicate stdlib/native features. ' + reasons
        + ' If the need is real, add it to .asc/dependency-allowlist.json and retry.';

      let output;
      if (isAntigravity) {
        output = {
          decision: "deny",
          reason: reason
        };
      } else {
        output = {
          allow_tool: false,
          deny_reason: reason,
          hookSpecificOutput: {
            hookEventName: 'PreToolUse',
            permissionDecision: 'deny',
            permissionDecisionReason: reason
          }
        };
      }
      process.stdout.write(JSON.stringify(output) + '\n');
      process.exit(2);
      return;
    }
    process.exit(0);
  } catch (e) {
    // incomplete json, wait for more chunks
  }
});

function isGitCommitOrPush(command) {
  if (!command || typeof command !== 'string') return false;

  // Split multi-command strings (chained by &&, ||, ;, \n, |)
  const subcommands = command.split(/[\r\n;&|]+/);

  for (let i = 0; i < subcommands.length; i++) {
    const sub = subcommands[i].trim();
    if (!sub || !/\b(?:git|git\.exe)\b/i.test(sub)) continue;

    // Tokenize sub-command handling quotes
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

    // Parse tokens after 'git' to find the git subcommand
    for (let k = gitIdx + 1; k < tokens.length; k++) {
      let tok = tokens[k].replace(/^['"]|['"]$/g, '');
      if (!tok) continue;

      // If token is a flag (-C, --git-dir, -c, --no-pager, etc.)
      if (tok.startsWith('-')) {
        // Skip standalone argument for options expecting a value after whitespace
        if (['-C', '-c', '--git-dir', '--work-tree', '--namespace', '--exec-path'].includes(tok)) {
          k++;
        }
        continue;
      }

      // First non-flag token after git global options is the git subcommand
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

  // Split multi-command strings (chained by &&, ||, ;, \n, |)
  const subcommands = command.split(/[\r\n;&|]+/);

  for (let i = 0; i < subcommands.length; i++) {
    const sub = subcommands[i].trim();
    if (!sub || !/\b(?:git|git\.exe)\b/i.test(sub)) continue;

    // Tokenize sub-command handling quotes
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

    // Parse tokens after 'git' to find the git subcommand
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

    // Find the target repository token (skip clone options like --depth, -b, --branch, etc.)
    let repoArg = '';
    for (let k = nextIdx; k < tokens.length; k++) {
      let tok = tokens[k].replace(/^['"]|['"]$/g, '');
      if (!tok) continue;

      if (tok.startsWith('-')) {
        // Flags that take an argument after whitespace
        if (['-b', '--branch', '--depth', '--origin', '-o', '--reference', '--filter', '-u', '--upload-pack', '--template'].includes(tok)) {
          k++;
        }
        continue;
      }

      repoArg = tok;
      break;
    }

    if (!repoArg) continue;

    // 1. Block insecure protocols (git://, http://)
    if (repoArg.startsWith('git://') || repoArg.startsWith('http://')) {
      return {
        blocked: true,
        reason: '[ASC Hard-Block] Insecure git clone protocol detected (' + repoArg + '). '
          + 'Use secure HTTPS or SSH (git@) with verified TLS.'
      };
    }

    // 2. Allow checking against allowlist (exact URL, owner/repo, or repo name)
    const normalized = repoArg.toLowerCase().replace(/\.git$/, '');

    // Extract owner/repo if possible (e.g. from https://github.com/owner/repo or git@github.com:owner/repo)
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
          + 'or add to allowedRepositories in .asc/dependency-allowlist.json to allow.'
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
  // JS: npm/yarn/pnpm/bun/ascx install/add
  // Python: pip/pip3/uv install, poetry add
  // Go: go get
  // Rust: cargo add
  // Ruby: gem install, bundle add
  const installRegex = /(?:npm|yarn|pnpm|bun|ascx|pip3?|uv|poetry|cargo|gem|bundle)\s+(?:install|i|add|get)(?:\s+[^\s]+)*/i;
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
  allowed.repositories = new Set();
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
