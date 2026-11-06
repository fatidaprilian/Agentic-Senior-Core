import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const CURRENT_DIR = path.dirname(fileURLToPath(import.meta.url));
const REPOSITORY_ROOT = path.resolve(CURRENT_DIR, '..', '..', '..');
const ASC_BIN_PATH = path.join(REPOSITORY_ROOT, 'bin', 'agentic-senior-core.js');
const ASCX_BIN_PATH = path.join(REPOSITORY_ROOT, 'bin', 'ascx.js');

const CMD_BUILTINS = new Set([
  'assoc', 'call', 'cd', 'chdir', 'cls', 'color', 'copy', 'date', 'del', 'dir',
  'echo', 'endlocal', 'erase', 'exit', 'for', 'ftype', 'goto', 'if', 'md',
  'mkdir', 'mklink', 'move', 'path', 'pause', 'popd', 'prompt', 'pushd', 'rd',
  'rem', 'ren', 'rename', 'rmdir', 'set', 'setlocal', 'shift', 'start', 'time',
  'title', 'type', 'ver', 'verify', 'vol',
]);

const POWERSHELL_CMDLET_PATTERN = /^[A-Za-z]+-[A-Za-z0-9]+$/;

/**
 * Finds the canonical PATH key in an environment object (handles Windows `Path` vs `PATH`).
 */
export function getPathEnvKey(env = process.env) {
  for (const key of Object.keys(env)) {
    if (key.toUpperCase() === 'PATH') {
      return key;
    }
  }
  return process.platform === 'win32' ? 'Path' : 'PATH';
}

/**
 * Collects local `node_modules/.bin` directories walking up from `cwd`.
 */
export function collectLocalNodeBinDirs(cwd) {
  const dirs = [];
  let current = path.resolve(cwd);

  while (true) {
    const candidate = path.join(current, 'node_modules', '.bin');
    if (fs.existsSync(candidate)) {
      dirs.push(candidate);
    }
    const parent = path.dirname(current);
    if (parent === current) {
      break;
    }
    current = parent;
  }

  return dirs;
}

/**
 * Returns a copy of `env` with local `node_modules/.bin` prepended to PATH without duplicating Path/PATH keys.
 */
export function buildAugmentedEnvironment(baseEnv, assignments = [], cwd = process.cwd()) {
  const env = { ...baseEnv };
  const pathKey = getPathEnvKey(env);
  const localBins = collectLocalNodeBinDirs(cwd);

  if (localBins.length > 0) {
    const currentPath = env[pathKey] || '';
    const existingSet = new Set(
      currentPath.split(path.delimiter).map(p => (process.platform === 'win32' ? p.toLowerCase() : p))
    );
    const toPrepend = localBins.filter(
      dir => !existingSet.has(process.platform === 'win32' ? dir.toLowerCase() : dir)
    );
    if (toPrepend.length > 0) {
      env[pathKey] = [...toPrepend, currentPath].filter(Boolean).join(path.delimiter);
    }
  }

  if (Array.isArray(assignments)) {
    for (const assignment of assignments) {
      const separatorIndex = assignment.indexOf('=');
      if (separatorIndex === -1) continue;
      const variableName = assignment.slice(0, separatorIndex);
      const variableValue = assignment.slice(separatorIndex + 1);
      if (variableName.toUpperCase() === 'PATH') {
        env[pathKey] = variableValue;
      } else {
        env[variableName] = variableValue;
      }
    }
  } else if (assignments && typeof assignments === 'object') {
    for (const [variableName, variableValue] of Object.entries(assignments)) {
      if (variableName.toUpperCase() === 'PATH') {
        env[pathKey] = String(variableValue);
      } else {
        env[variableName] = String(variableValue);
      }
    }
  }

  return env;
}

/**
 * Resolves an executable on Windows across PATH and PATHEXT, prioritizing native `.exe`/`.com` before `.cmd`/`.bat`/`.ps1`.
 */
export function resolveWindowsExecutable(executable, env = process.env, cwd = process.cwd()) {
  if (!executable) return null;

  const hasPathSep = executable.includes('/') || executable.includes('\\');
  const rawPathExt = env.PATHEXT || '.COM;.EXE;.BAT;.CMD;.PS1';
  const parsedExts = rawPathExt
    .split(';')
    .map(ext => ext.trim().toLowerCase())
    .filter(Boolean);
  const priorityExts = ['.exe', '.com', '.cmd', '.bat', '.ps1', ...parsedExts.filter(
    e => !['.exe', '.com', '.cmd', '.bat', '.ps1'].includes(e)
  )];

  const checkCandidateBase = (basePath) => {
    const lowerExt = path.extname(basePath).toLowerCase();
    if (lowerExt && fs.existsSync(basePath) && fs.statSync(basePath).isFile()) {
      return basePath;
    }
    for (const ext of priorityExts) {
      const withExt = `${basePath}${ext}`;
      try {
        if (fs.existsSync(withExt) && fs.statSync(withExt).isFile()) {
          return withExt;
        }
      } catch {
        // Ignore inaccessible paths
      }
    }
    return null;
  };

  if (hasPathSep || path.isAbsolute(executable)) {
    const fullBase = path.isAbsolute(executable) ? executable : path.resolve(cwd, executable);
    return checkCandidateBase(fullBase);
  }

  const pathKey = getPathEnvKey(env);
  const searchDirs = (env[pathKey] || '')
    .split(path.delimiter)
    .map(dir => dir.replace(/^"+|"+$/g, '').trim())
    .filter(Boolean);

  for (const dir of searchDirs) {
    const resolved = checkCandidateBase(path.join(dir, executable));
    if (resolved) {
      return resolved;
    }
  }

  return null;
}

/**
 * Safely quotes a single argument for `cmd.exe /d /s /c "..."` execution on Windows,
 * preventing CVE-2024-27980 batch argument injection and `%VAR%` expansion.
 */
export function escapeCmdArg(value, isExecutable = false) {
  const str = String(value);
  if (str.length === 0) {
    return '""';
  }

  // Escape % so cmd.exe does not expand %TEMP% or strip %tokens
  let escaped = str.replace(/%/g, '%%');

  if (isExecutable) {
    return /[\s&|<>()^"!;,]/.test(escaped) ? `"${escaped.replace(/"/g, '')}"` : escaped;
  }

  const needsQuotes = /[\s&|<>()^"!;,]/.test(escaped);
  if (!needsQuotes) {
    return escaped;
  }

  // Escape trailing backslashes before closing quote and internal double quotes
  escaped = escaped.replace(/(\\*)"/g, '$1$1\\"');
  escaped = escaped.replace(/(\\*)$/, '$1$1');
  return `"${escaped}"`;
}

/**
 * Safely quotes an argument for PowerShell `-Command` invocation.
 */
function escapePowerShellArg(value) {
  const str = String(value);
  if (/^[A-Za-z0-9_./:\\-]+$/.test(str)) {
    return str;
  }
  return `'${str.replace(/'/g, "''")}'`;
}

/**
 * Quotes tokens for POSIX / Windows `shell: true` command strings when shell operators are present.
 */
const SHELL_OPERATORS = new Set(['|', '||', '&', '&&', ';', '>', '>>', '<', '2>', '2>>']);

export function buildShellCommandString(executable, args) {
  const quoteToken = (token) => {
    if (SHELL_OPERATORS.has(token) || /^(?:[12]?>|[12]?>>|<)/.test(token)) {
      return token;
    }
    if (!/[\s"'`$\\]/.test(token)) {
      return token;
    }
    if (process.platform === 'win32') {
      return `"${token.replace(/"/g, '\\"')}"`;
    }
    return `'${token.replace(/'/g, "'\\''")}'`;
  };

  return [quoteToken(executable), ...args.map(quoteToken)].join(' ');
}

/**
 * Builds spawn parameters `{ command, args, options }` that work seamlessly across Windows and POSIX
 * without triggering Node DEP0190 warnings or CVE-2024-27980 `.cmd` EINVAL/ENOENT failures.
 */
export function prepareSpawnInvocation(parsedCommand, { cwd = process.cwd(), env = process.env, shell = false } = {}) {
  const augmentedEnv = buildAugmentedEnvironment(env, parsedCommand.environment, cwd);
  const rawExe = parsedCommand.executable;
  const rawArgs = parsedCommand.args;

  // Direct fast-path for ASC's own binaries on all platforms (zero shim overhead)
  if (!shell) {
    const normalizedBase = rawExe.toLowerCase();
    if (normalizedBase === 'asc' || normalizedBase === 'agentic-senior-core') {
      return {
        command: process.execPath,
        args: [ASC_BIN_PATH, ...rawArgs],
        options: { cwd, env: augmentedEnv, shell: false, windowsHide: true },
      };
    }
    if (normalizedBase === 'ascx') {
      return {
        command: process.execPath,
        args: [ASCX_BIN_PATH, ...rawArgs],
        options: { cwd, env: augmentedEnv, shell: false, windowsHide: true },
      };
    }
  }

  // Explicit shell pipeline / redirect mode: omit args array to avoid Node DEP0190
  if (shell) {
    const commandLine = buildShellCommandString(rawExe, rawArgs);
    return {
      command: commandLine,
      args: undefined,
      options: { cwd, env: augmentedEnv, shell: true, windowsHide: true },
    };
  }

  if (process.platform !== 'win32') {
    return {
      command: rawExe,
      args: rawArgs,
      options: { cwd, env: augmentedEnv, shell: false, windowsHide: true },
    };
  }

  // Windows resolution: native .exe/.com, .cmd/.bat shims, .ps1 scripts, CMD builtins, and PowerShell cmdlets
  const resolved = resolveWindowsExecutable(rawExe, augmentedEnv, cwd);
  const comspec = augmentedEnv.ComSpec || augmentedEnv.COMSPEC || 'cmd.exe';

  if (resolved) {
    const ext = path.extname(resolved).toLowerCase();

    if (ext === '.exe' || ext === '.com') {
      return {
        command: resolved,
        args: rawArgs,
        options: { cwd, env: augmentedEnv, shell: false, windowsHide: true },
      };
    }

    if (ext === '.js' || ext === '.mjs' || ext === '.cjs') {
      return {
        command: process.execPath,
        args: [resolved, ...rawArgs],
        options: { cwd, env: augmentedEnv, shell: false, windowsHide: true },
      };
    }

    if (ext === '.cmd' || ext === '.bat') {
      const innerCmd = [escapeCmdArg(resolved, true), ...rawArgs.map(a => escapeCmdArg(a, false))].join(' ');
      return {
        command: comspec,
        args: ['/d', '/s', '/c', `"${innerCmd}"`],
        options: {
          cwd,
          env: augmentedEnv,
          shell: false,
          windowsVerbatimArguments: true,
          windowsHide: true,
        },
      };
    }

    if (ext === '.ps1') {
      const psExe = resolveWindowsExecutable('pwsh', augmentedEnv, cwd)
        || resolveWindowsExecutable('powershell', augmentedEnv, cwd)
        || 'powershell.exe';
      return {
        command: psExe,
        args: ['-NoProfile', '-NonInteractive', '-ExecutionPolicy', 'Bypass', '-File', resolved, ...rawArgs],
        options: { cwd, env: augmentedEnv, shell: false, windowsHide: true },
      };
    }
  }

  // Check CMD builtins (dir, echo, type, where, etc.)
  if (CMD_BUILTINS.has(rawExe.toLowerCase())) {
    const innerCmd = [rawExe, ...rawArgs.map(a => escapeCmdArg(a, false))].join(' ');
    return {
      command: comspec,
      args: ['/d', '/s', '/c', `"${innerCmd}"`],
      options: {
        cwd,
        env: augmentedEnv,
        shell: false,
        windowsVerbatimArguments: true,
        windowsHide: true,
      },
    };
  }

  // Check PowerShell Verb-Noun cmdlets (Get-ChildItem, Select-String, Test-Path, etc.)
  if (POWERSHELL_CMDLET_PATTERN.test(rawExe)) {
    const psExe = resolveWindowsExecutable('pwsh', augmentedEnv, cwd)
      || resolveWindowsExecutable('powershell', augmentedEnv, cwd)
      || 'powershell.exe';
    const psCommand = [rawExe, ...rawArgs.map(escapePowerShellArg)].join(' ');
    return {
      command: psExe,
      args: ['-NoProfile', '-NonInteractive', '-ExecutionPolicy', 'Bypass', '-Command', psCommand],
      options: { cwd, env: augmentedEnv, shell: false, windowsHide: true },
    };
  }

  // Fallback for unknown binaries (preserves clean ENOENT behavior)
  return {
    command: rawExe,
    args: rawArgs,
    options: { cwd, env: augmentedEnv, shell: false, windowsHide: true },
  };
}

