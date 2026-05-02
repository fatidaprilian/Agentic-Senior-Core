/**
 * CLI Utilities — Shared helper functions.
 * Depends on: constants.mjs
 */
import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';

import {
  REPOSITORY_ROOT,
  ALLOWED_SEVERITY_LEVELS,
  PROFILE_PRESETS,
  INIT_PRESETS,
  entryPointFiles,
  directoryCopies,
} from './constants.mjs';
import {
  pathExists,
  ensureDirectory,
  syncFile,
} from './utils/filesystem.mjs';
import {
  collectRelativeTreeEntries,
  analyzeManagedGovernanceSurface,
} from './utils/managed-surface.mjs';
export {
  pathExists,
  ensureDirectory,
  copyDirectory,
  isAgenticManagedContent,
  syncFile,
} from './utils/filesystem.mjs';
export {
  analyzeManagedGovernanceSurface,
} from './utils/managed-surface.mjs';
export {
  askChoice,
  askYesNo,
} from './utils/prompting.mjs';

export function printUsage() {
  const presetNames = Object.keys(INIT_PRESETS).join(', ');

  console.log('Agentic-Senior-Core CLI');
  console.log('');
  console.log('Local runtime:');
  console.log('  npm exec --yes @ryuenn3123/agentic-senior-core init');
  console.log('  npx @ryuenn3123/agentic-senior-core init');
  console.log('  npm install -g @ryuenn3123/agentic-senior-core && agentic-senior-core init');
  console.log('  bunx @ryuenn3123/agentic-senior-core init   # optional Bun path');
  console.log('');
  console.log('Usage:');
  console.log('  agentic-senior-core launch');
  console.log('  agentic-senior-core init [target-directory] [--preset <name>] [--stack <name>] [--blueprint <name>] [--project-description <text>] [--ci <true|false>] [--token-optimize] [--no-token-optimize] [--token-agent <name>] [--memory-continuity] [--no-memory-continuity] [--scaffold-docs] [--no-scaffold-docs] [--docs-lang <en|id>] [--project-config <path>] [--runtime-env <auto|linux-wsl|linux|windows|macos>]');
  console.log('  agentic-senior-core upgrade [target-directory] [--dry-run] [--yes] [--mcp-template] [--no-mcp-template] [--prune] [--no-prune]');
  console.log('  agentic-senior-core optimize [target-directory] [--agent <copilot|claude|cursor|windsurf|gemini|codex|cline>] [--enable|--disable] [--show]');
  console.log('  agentic-senior-core mcp');
  console.log('  agentic-senior-core rollback [target-directory]');
  console.log('  agentic-senior-core --version');
  console.log('');
  console.log('Options:');
  console.log('  --help       Show help');
  console.log('  --version    Show CLI version');
  console.log(`  --preset     Use a scope hint preset; it does not choose stack/framework (${presetNames})`);
  console.log('  --stack      Explicit runtime constraint from the user');
  console.log('  --blueprint  Explicit architecture constraint from the user');
  console.log('  --project-description  Project intent text used to build an offline architecture brief before agent-led live research');
  console.log('  --ci         Override CI/CD quality checks (guardrails) (true|false)');
  console.log('  --token-optimize  Explicitly enable token optimization policy during init (default behavior)');
  console.log('  --token-agent     Set token optimization agent target (copilot, claude, cursor, windsurf, gemini, codex, cline)');
  console.log('  --no-token-optimize  Disable token optimization policy during init');
  console.log('  --memory-continuity  Explicitly enable cross-session memory continuity policy during init (default behavior)');
  console.log('  --no-memory-continuity  Disable memory continuity policy during init');
  console.log('  --mcp-template   Explicitly enable cross-IDE MCP auto-configuration (default behavior)');
  console.log('  --no-mcp-template Disable automatic MCP configuration across your IDEs');
  console.log('  --scaffold-docs  Force project documentation scaffolding (architecture, database, API, flow)');
  console.log('  --no-scaffold-docs  Skip project documentation scaffolding');
  console.log('  --docs-lang      Optional override for bootstrap docs synthesis language (default: en)');
  console.log('  --project-config Path to a project config file for non-interactive doc scaffolding');
  console.log('  --runtime-env   Override runtime environment hint (auto, linux-wsl, linux, windows, macos)');
  console.log('  --dry-run    Preview upgrade without writing files');
  console.log('  --yes        Skip confirmation prompts for upgrade');
  console.log('  --prune      Keep managed governance files synchronized 1:1 (default in upgrade)');
  console.log('  --no-prune   Do not remove stale managed governance files during upgrade');
  console.log('  --agent      Target agent integration for token optimization mode');
  console.log('  --enable     Enable token optimization policy and rebuild compiled rules');
  console.log('  --disable    Disable token optimization policy and rebuild compiled rules');
  console.log('  --show       Print current token optimization state as JSON');
}

/**
 * Intelligent MCP configuration synchronization.
 * Merges the agentic-senior-core server into existing config or creates new.
 */
async function syncMcpConfig(mcpJsonPath, templateConfig) {
  const topKey = Object.keys(templateConfig)[0]; // e.g. "mcpServers" or "servers"
  const serverName = 'agentic-senior-core';
  const templateServer = templateConfig[topKey][serverName];

  if (!(await pathExists(mcpJsonPath))) {
    await ensureDirectory(path.dirname(mcpJsonPath));
    await fs.writeFile(mcpJsonPath, JSON.stringify(templateConfig, null, 2) + '\n', 'utf8');
    return { status: 'created' };
  }

  try {
    const existingContent = await fs.readFile(mcpJsonPath, 'utf8');
    const config = JSON.parse(existingContent);
    
    if (!config[topKey]) config[topKey] = {};
    
    const existingServer = config[topKey][serverName];

    if (JSON.stringify(existingServer) === JSON.stringify(templateServer)) {
       return { status: 'unchanged' };
    }

    config[topKey][serverName] = templateServer;
    await fs.writeFile(mcpJsonPath, JSON.stringify(config, null, 2) + '\n', 'utf8');
    return { status: 'updated' };
  } catch {
    // If JSON is broken, overwrite it as a last resort to recovery
    await fs.writeFile(mcpJsonPath, JSON.stringify(templateConfig, null, 2) + '\n', 'utf8');
    return { status: 'updated' };
  }
}

export async function copyGovernanceAssetsToTarget(
  resolvedTargetDirectoryPath,
  options = {}
) {
  const shouldIncludeMcpTemplate = options.includeMcpTemplate === true;
  const shouldPruneManagedSurface = options.pruneManagedSurface === true;
  const managedSurfacePlan = shouldPruneManagedSurface
    ? options.managedSurfacePlan || await analyzeManagedGovernanceSurface(resolvedTargetDirectoryPath, {
      includeMcpTemplate: shouldIncludeMcpTemplate,
    })
    : null;
  const deletedManagedFiles = [];
  const deletedManagedDirectories = [];
  const createdFiles = [];
  const updatedFiles = [];
  const unchangedFiles = [];
  const preservedFiles = [];

  for (const sourceDirectoryName of directoryCopies) {
    const sourceDirectoryPath = path.join(REPOSITORY_ROOT, sourceDirectoryName);
    if (!(await pathExists(sourceDirectoryPath))) {
      continue;
    }

    const sourceTree = await collectRelativeTreeEntries(sourceDirectoryPath, sourceDirectoryName);
    for (const relativeFilePath of sourceTree.files) {
      const sourcePath = path.join(REPOSITORY_ROOT, ...relativeFilePath.split('/'));
      const targetPath = path.join(resolvedTargetDirectoryPath, ...relativeFilePath.split('/'));
      const syncResult = await syncFile(sourcePath, targetPath, {
        preserveUserOwned: sourceDirectoryName === '.gemini',
      });
      
      if (syncResult.status === 'created') createdFiles.push(relativeFilePath);
      else if (syncResult.status === 'updated') updatedFiles.push(relativeFilePath);
      else if (syncResult.status === 'unchanged') unchangedFiles.push(relativeFilePath);
      else if (syncResult.status === 'preserved') preservedFiles.push(relativeFilePath);
    }
  }

  for (const entryPointFileName of entryPointFiles) {
    const sourceFilePath = path.join(REPOSITORY_ROOT, entryPointFileName);
    const targetFilePath = path.join(resolvedTargetDirectoryPath, entryPointFileName);

    if (!(await pathExists(sourceFilePath))) {
      continue;
    }

    if (path.resolve(sourceFilePath) === path.resolve(targetFilePath)) {
      continue;
    }

    const syncResult = await syncFile(sourceFilePath, targetFilePath, {
      preserveUserOwned: true,
    });
    if (syncResult.status === 'created') createdFiles.push(entryPointFileName);
    else if (syncResult.status === 'updated') updatedFiles.push(entryPointFileName);
    else if (syncResult.status === 'unchanged') unchangedFiles.push(entryPointFileName);
    else if (syncResult.status === 'preserved') preservedFiles.push(entryPointFileName);
  }

  if (shouldPruneManagedSurface && managedSurfacePlan) {
    for (const staleFileRelativePath of managedSurfacePlan.staleFiles) {
      const staleFilePath = path.join(resolvedTargetDirectoryPath, ...staleFileRelativePath.split('/'));
      if (!(await pathExists(staleFilePath))) {
        continue;
      }

      await fs.unlink(staleFilePath);
      deletedManagedFiles.push(staleFileRelativePath);
    }

    for (const staleDirectoryRelativePath of managedSurfacePlan.staleDirectories) {
      const staleDirectoryPath = path.join(resolvedTargetDirectoryPath, ...staleDirectoryRelativePath.split('/'));
      if (!(await pathExists(staleDirectoryPath))) {
        continue;
      }

      await fs.rm(staleDirectoryPath, { recursive: true, force: true });
      deletedManagedDirectories.push(staleDirectoryRelativePath);
    }
  }

  if (shouldIncludeMcpTemplate) {
    const projectName = path.basename(resolvedTargetDirectoryPath);
    const mcpArgs = ['./scripts/mcp-server.mjs'];

    const sourceMcpServerPath = path.join(REPOSITORY_ROOT, 'scripts', 'mcp-server.mjs');
    const targetMcpServerPath = path.join(resolvedTargetDirectoryPath, 'scripts', 'mcp-server.mjs');
    const mcpServerSync = await syncFile(sourceMcpServerPath, targetMcpServerPath);
    if (mcpServerSync.status === 'created') createdFiles.push('scripts/mcp-server.mjs');
    else if (mcpServerSync.status === 'updated') updatedFiles.push('scripts/mcp-server.mjs');

    const sourceMcpHelpersDirectoryPath = path.join(REPOSITORY_ROOT, 'scripts', 'mcp-server');
    if (await pathExists(sourceMcpHelpersDirectoryPath)) {
      const mcpHelperTreeEntries = await collectRelativeTreeEntries(
        sourceMcpHelpersDirectoryPath,
        'scripts/mcp-server'
      );

      for (const relativeHelperFilePath of mcpHelperTreeEntries.files) {
        const sourceHelperFilePath = path.join(REPOSITORY_ROOT, ...relativeHelperFilePath.split('/'));
        const targetHelperFilePath = path.join(resolvedTargetDirectoryPath, ...relativeHelperFilePath.split('/'));
        const helperSyncResult = await syncFile(sourceHelperFilePath, targetHelperFilePath);

        if (helperSyncResult.status === 'created') createdFiles.push(relativeHelperFilePath);
        else if (helperSyncResult.status === 'updated') updatedFiles.push(relativeHelperFilePath);
        else if (helperSyncResult.status === 'unchanged') unchangedFiles.push(relativeHelperFilePath);
      }
    }

    // 1. VS Code (Workspace Local Settings)
    const vscodeMcpJsonPath = path.join(resolvedTargetDirectoryPath, '.vscode', 'mcp.json');
    const vscodeWorkspaceMcpConfig = {
      servers: {
        'agentic-senior-core': {
          type: 'stdio',
          command: 'node',
          cwd: '${workspaceFolder}',
          args: mcpArgs,
        },
      },
    };
    const vscodeSync = await syncMcpConfig(vscodeMcpJsonPath, vscodeWorkspaceMcpConfig);
    if (vscodeSync.status === 'created') createdFiles.push('.vscode/mcp.json');
    else if (vscodeSync.status === 'updated') updatedFiles.push('.vscode/mcp.json');

    // 2. Cursor (Workspace Local Settings)
    const cursorMcpJsonPath = path.join(resolvedTargetDirectoryPath, '.cursor', 'mcp.json');
    const cursorWorkspaceMcpConfig = {
      mcpServers: {
        'agentic-senior-core': {
          command: 'node',
          args: mcpArgs,
          cwd: '${workspaceFolder}',
        },
      },
    };
    const cursorSync = await syncMcpConfig(cursorMcpJsonPath, cursorWorkspaceMcpConfig);
    if (cursorSync.status === 'created') createdFiles.push('.cursor/mcp.json');
    else if (cursorSync.status === 'updated') updatedFiles.push('.cursor/mcp.json');

    // 3. Zed IDE (Workspace Local Settings)
    const zedSettingsPath = path.join(resolvedTargetDirectoryPath, '.zed', 'settings.json');
    const zedMcpConfig = {
      context_servers: {
        'agentic-senior-core': {
          command: 'node',
          env: {},
          args: mcpArgs,
        },
      },
    };

    if (!(await pathExists(zedSettingsPath))) {
      await ensureDirectory(path.dirname(zedSettingsPath));
      await fs.writeFile(zedSettingsPath, JSON.stringify(zedMcpConfig, null, 2) + '\n', 'utf8');
      createdFiles.push('.zed/settings.json');
    } else {
      try {
        const existingZedContent = await fs.readFile(zedSettingsPath, 'utf8');
        const parsedZedSettings = JSON.parse(existingZedContent);
        if (!parsedZedSettings.context_servers) parsedZedSettings.context_servers = {};
        
        const templateServer = zedMcpConfig.context_servers['agentic-senior-core'];
        if (JSON.stringify(parsedZedSettings.context_servers['agentic-senior-core']) !== JSON.stringify(templateServer)) {
          parsedZedSettings.context_servers['agentic-senior-core'] = templateServer;
          await fs.writeFile(zedSettingsPath, JSON.stringify(parsedZedSettings, null, 2) + '\n', 'utf8');
          updatedFiles.push('.zed/settings.json');
        }
      } catch { /* Ignore malformed Zed JSON */ }
    }

    // 4. Antigravity / Gemini (Global Settings)
    const isTmpDir = resolvedTargetDirectoryPath.startsWith(os.tmpdir());
    if (!isTmpDir) {
      try {
        const globalGeminiDir = path.join(os.homedir(), '.gemini', 'antigravity');
        const globalGeminiMcpPath = path.join(globalGeminiDir, 'mcp_config.json');
        const targetMcpServerScript = path.join(resolvedTargetDirectoryPath, 'scripts', 'mcp-server.mjs');

        // Only inject if the MCP server script will actually exist at the target.
        // When the script is missing, Antigravity blocks all chat instead of degrading gracefully.
        const targetHasMcpServer = await pathExists(targetMcpServerScript);

        if (targetHasMcpServer && await pathExists(globalGeminiDir)) {
          let geminiConfig = { mcpServers: {} };
          if (await pathExists(globalGeminiMcpPath)) {
            const content = await fs.readFile(globalGeminiMcpPath, 'utf8');
            if (content.trim()) {
              try { geminiConfig = JSON.parse(content); } catch {}
            }
          }
          if (!geminiConfig.mcpServers) geminiConfig.mcpServers = {};

          // Prune stale agentic-senior-core entries whose workspace no longer exists
          let configChanged = false;
          for (const serverName of Object.keys(geminiConfig.mcpServers)) {
            if (!serverName.startsWith('agentic-senior-core-')) continue;
            const serverEntry = geminiConfig.mcpServers[serverName];
            if (!serverEntry?.cwd) continue;
            const staleMcpScript = path.join(serverEntry.cwd, 'scripts', 'mcp-server.mjs');
            if (!(await pathExists(staleMcpScript))) {
              delete geminiConfig.mcpServers[serverName];
              configChanged = true;
            }
          }

          const safeProjectName = projectName.replace(/[^a-zA-Z0-9_-]/g, '-');
          const uniqueServerName = `agentic-senior-core-${safeProjectName}`;
          const templateServer = {
            command: 'node',
            args: mcpArgs,
            cwd: resolvedTargetDirectoryPath,
          };
          
          if (JSON.stringify(geminiConfig.mcpServers[uniqueServerName]) !== JSON.stringify(templateServer)) {
             geminiConfig.mcpServers[uniqueServerName] = templateServer;
             configChanged = true;
          }

          if (configChanged) {
            await fs.writeFile(globalGeminiMcpPath, JSON.stringify(geminiConfig, null, 2) + '\n', 'utf8');
          }
        }
      } catch { /* Ignore global injection errors */ }
    }
  }

  return {
    deletedManagedFiles,
    deletedManagedDirectories,
    createdFiles,
    updatedFiles,
    unchangedFiles,
    preservedFiles,
    managedSurfacePlan,
  };
}

export function toTitleCase(fileName) {
  return fileName
    .replace(/\.md$/i, '')
    .split(/[-_]/g)
    .map((wordPart) => wordPart.charAt(0).toUpperCase() + wordPart.slice(1))
    .join(' ');
}

export function normalizeChoiceInput(rawInput) {
  return rawInput.trim().toLowerCase().replace(/\s+/g, '-');
}

export function matchFileNameFromInput(rawInput, fileNames) {
  const normalizedInput = normalizeChoiceInput(rawInput);

  return fileNames.find((fileName) => {
    const normalizedFileName = normalizeChoiceInput(fileName.replace(/\.md$/i, ''));
    const normalizedTitle = normalizeChoiceInput(toTitleCase(fileName));
    return normalizedInput === normalizedFileName || normalizedInput === normalizedTitle;
  });
}

export function matchProfileNameFromInput(rawInput) {
  const normalizedInput = normalizeChoiceInput(rawInput);
  return Object.keys(PROFILE_PRESETS).find((profileName) => profileName === normalizedInput) || null;
}

export function parseBooleanSetting(rawBooleanValue, contextLabel) {
  const normalizedValue = normalizeChoiceInput(rawBooleanValue);

  if (normalizedValue === 'true') {
    return true;
  }

  if (normalizedValue === 'false') {
    return false;
  }

  throw new Error(`Invalid boolean value for ${contextLabel}: ${rawBooleanValue}`);
}

export function parseBlockingSeverities(rawSeverityValues, fileName) {
  const parsedSeverities = rawSeverityValues
    .split(',')
    .map((severityValue) => normalizeChoiceInput(severityValue))
    .filter(Boolean);

  if (parsedSeverities.length === 0) {
    throw new Error(`Profile pack ${fileName} must define at least one blocking severity.`);
  }

  const invalidSeverity = parsedSeverities.find((severityValue) => !ALLOWED_SEVERITY_LEVELS.has(severityValue));
  if (invalidSeverity) {
    throw new Error(`Profile pack ${fileName} uses unsupported severity: ${invalidSeverity}`);
  }

  return parsedSeverities;
}

export async function collectFileNames(folderPath) {
  try {
    const fileNames = await fs.readdir(folderPath, { withFileTypes: true });
    return fileNames
      .filter((entry) => entry.isFile() && entry.name.endsWith('.md'))
      .map((entry) => entry.name)
      .sort((leftName, rightName) => leftName.localeCompare(rightName));
  } catch (error) {
    if (error?.code === 'ENOENT') {
      return [];
    }

    throw error;
  }
}

export function formatBlockingSeverities(blockingSeverities) {
  return blockingSeverities.join(', ');
}

export function formatDuration(durationMs) {
  const durationInSeconds = (durationMs / 1000).toFixed(1);
  return `${durationInSeconds}s`;
}
