/**
 * CLI Utilities — Shared helper functions.
 * Depends on: constants.mjs
 */
import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';

import {
  REPO_ROOT,
  ALLOWED_SEVERITY_LEVELS,
  PROFILE_PRESETS,
  INIT_PRESETS,
  entryPointFiles,
  directoryCopies,
} from './constants.mjs';

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

export async function pathExists(targetPath) {
  try {
    await fs.stat(targetPath);
    return true;
  } catch {
    return false;
  }
}

export async function ensureDirectory(directoryPath) {
  await fs.mkdir(directoryPath, { recursive: true });
}

export async function copyDirectory(sourceDirectoryPath, targetDirectoryPath) {
  if (path.resolve(sourceDirectoryPath) === path.resolve(targetDirectoryPath)) {
    return;
  }

  await ensureDirectory(targetDirectoryPath);
  const directoryEntries = await fs.readdir(sourceDirectoryPath, { withFileTypes: true });

  for (const directoryEntry of directoryEntries) {
    const sourceEntryPath = path.join(sourceDirectoryPath, directoryEntry.name);
    const targetEntryPath = path.join(targetDirectoryPath, directoryEntry.name);

    if (directoryEntry.isDirectory()) {
      await copyDirectory(sourceEntryPath, targetEntryPath);
      continue;
    }

    if (path.resolve(sourceEntryPath) === path.resolve(targetEntryPath)) {
      continue;
    }

    await fs.copyFile(sourceEntryPath, targetEntryPath);
  }
}

/**
 * Synchronizes a single file between source and target, returning the operation status.
 */
export async function syncFile(sourcePath, targetPath) {
  if (!(await pathExists(sourcePath))) return { status: 'skipped' };

  if (!(await pathExists(targetPath))) {
    await ensureDirectory(path.dirname(targetPath));
    await fs.copyFile(sourcePath, targetPath);
    return { status: 'created' };
  }

  const sourceContent = await fs.readFile(sourcePath);
  const targetContent = await fs.readFile(targetPath);

  if (sourceContent.equals(targetContent)) {
    return { status: 'unchanged' };
  }

  await fs.copyFile(sourcePath, targetPath);
  return { status: 'updated' };
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

function toPosixRelativePath(relativePath) {
  return relativePath.split(path.sep).join('/');
}

function isPathWithinPrefix(relativePath, prefixPath) {
  const normalizedRelativePath = toPosixRelativePath(relativePath).replace(/\/+$/g, '');
  const normalizedPrefixPath = toPosixRelativePath(prefixPath).replace(/\/+$/g, '');

  if (!normalizedPrefixPath) {
    return false;
  }

  return normalizedRelativePath === normalizedPrefixPath
    || normalizedRelativePath.startsWith(`${normalizedPrefixPath}/`);
}

async function collectRelativeTreeEntries(baseDirectoryPath, relativeRootPath) {
  const files = [];
  const directories = [];

  if (!(await pathExists(baseDirectoryPath))) {
    return { files, directories };
  }

  const normalizedRootPath = toPosixRelativePath(relativeRootPath);
  directories.push(normalizedRootPath);

  async function walkDirectory(currentDirectoryPath, currentRelativePath) {
    const directoryEntries = await fs.readdir(currentDirectoryPath, { withFileTypes: true });

    for (const directoryEntry of directoryEntries) {
      const sourceEntryPath = path.join(currentDirectoryPath, directoryEntry.name);
      const relativeEntryPath = toPosixRelativePath(path.join(currentRelativePath, directoryEntry.name));

      if (directoryEntry.isDirectory()) {
        directories.push(relativeEntryPath);
        await walkDirectory(sourceEntryPath, relativeEntryPath);
        continue;
      }

      files.push(relativeEntryPath);
    }
  }

  await walkDirectory(baseDirectoryPath, normalizedRootPath);
  return { files, directories };
}

async function collectOptionalManagedEntries(baseDirectoryPath, options = {}) {
  const files = new Set();
  const directories = new Set();

  if (options.includeMcpTemplate === true) {
    const mcpServerEntrypointPath = path.join(baseDirectoryPath, 'scripts', 'mcp-server.mjs');
    if (await pathExists(mcpServerEntrypointPath)) {
      files.add('scripts/mcp-server.mjs');
    }

    const mcpServerHelpersDirectoryPath = path.join(baseDirectoryPath, 'scripts', 'mcp-server');
    const mcpServerTreeEntries = await collectRelativeTreeEntries(
      mcpServerHelpersDirectoryPath,
      'scripts/mcp-server'
    );

    for (const relativeFilePath of mcpServerTreeEntries.files) {
      files.add(relativeFilePath);
    }

    for (const relativeDirectoryPath of mcpServerTreeEntries.directories) {
      directories.add(relativeDirectoryPath);
    }
  }

  return { files, directories };
}

async function buildManagedSourceManifest(options = {}) {
  const sourceFiles = new Set();
  const sourceDirectories = new Set();

  for (const sourceDirectoryName of directoryCopies) {
    const sourceDirectoryPath = path.join(REPO_ROOT, sourceDirectoryName);
    const sourceTreeEntries = await collectRelativeTreeEntries(sourceDirectoryPath, sourceDirectoryName);

    for (const sourceFilePath of sourceTreeEntries.files) {
      sourceFiles.add(sourceFilePath);
    }

    for (const sourceDirectoryPathRelative of sourceTreeEntries.directories) {
      sourceDirectories.add(sourceDirectoryPathRelative);
    }
  }

  for (const entryPointFileName of entryPointFiles) {
    const sourceFilePath = path.join(REPO_ROOT, entryPointFileName);
    if (!(await pathExists(sourceFilePath))) {
      continue;
    }

    sourceFiles.add(toPosixRelativePath(entryPointFileName));
  }

  const optionalManagedEntries = await collectOptionalManagedEntries(REPO_ROOT, options);
  for (const sourceFilePath of optionalManagedEntries.files) {
    sourceFiles.add(sourceFilePath);
  }
  for (const sourceDirectoryPath of optionalManagedEntries.directories) {
    sourceDirectories.add(sourceDirectoryPath);
  }

  return {
    files: sourceFiles,
    directories: sourceDirectories,
  };
}

async function collectManagedTargetManifest(resolvedTargetDirectoryPath, options = {}) {
  const targetFiles = new Set();
  const targetDirectories = new Set();

  for (const sourceDirectoryName of directoryCopies) {
    const targetDirectoryPath = path.join(resolvedTargetDirectoryPath, sourceDirectoryName);
    const targetTreeEntries = await collectRelativeTreeEntries(targetDirectoryPath, sourceDirectoryName);

    for (const targetFilePath of targetTreeEntries.files) {
      targetFiles.add(targetFilePath);
    }

    for (const targetDirectoryPathRelative of targetTreeEntries.directories) {
      targetDirectories.add(targetDirectoryPathRelative);
    }
  }

  for (const entryPointFileName of entryPointFiles) {
    const targetFilePath = path.join(resolvedTargetDirectoryPath, entryPointFileName);
    if (!(await pathExists(targetFilePath))) {
      continue;
    }

    targetFiles.add(toPosixRelativePath(entryPointFileName));
  }

  const optionalManagedEntries = await collectOptionalManagedEntries(resolvedTargetDirectoryPath, options);
  for (const targetFilePath of optionalManagedEntries.files) {
    targetFiles.add(targetFilePath);
  }
  for (const targetDirectoryPath of optionalManagedEntries.directories) {
    targetDirectories.add(targetDirectoryPath);
  }

  return {
    files: targetFiles,
    directories: targetDirectories,
  };
}

export async function analyzeManagedGovernanceSurface(
  resolvedTargetDirectoryPath,
  options = {}
) {
  const preservePathPrefixes = Array.isArray(options.preservePathPrefixes)
    ? options.preservePathPrefixes
    : ['.agent-context/state'];

  const sourceManifest = await buildManagedSourceManifest(options);
  const targetManifest = await collectManagedTargetManifest(resolvedTargetDirectoryPath, options);

  const staleFiles = [];
  const staleDirectories = [];
  const preservedFiles = [];
  const preservedDirectories = [];

  const sortedTargetFiles = [...targetManifest.files].sort((leftPath, rightPath) => leftPath.localeCompare(rightPath));
  const sortedTargetDirectories = [...targetManifest.directories].sort(
    (leftPath, rightPath) => rightPath.length - leftPath.length || leftPath.localeCompare(rightPath)
  );

  for (const targetFilePath of sortedTargetFiles) {
    if (sourceManifest.files.has(targetFilePath)) {
      continue;
    }

    if (preservePathPrefixes.some((prefixPath) => isPathWithinPrefix(targetFilePath, prefixPath))) {
      preservedFiles.push(targetFilePath);
      continue;
    }

    staleFiles.push(targetFilePath);
  }

  for (const targetDirectoryPathRelative of sortedTargetDirectories) {
    if (sourceManifest.directories.has(targetDirectoryPathRelative)) {
      continue;
    }

    if (preservePathPrefixes.some((prefixPath) => isPathWithinPrefix(targetDirectoryPathRelative, prefixPath))) {
      preservedDirectories.push(targetDirectoryPathRelative);
      continue;
    }

    staleDirectories.push(targetDirectoryPathRelative);
  }

  return {
    staleFiles,
    staleDirectories,
    preservedFiles,
    preservedDirectories,
    managedSourceFileCount: sourceManifest.files.size,
    managedSourceDirectoryCount: sourceManifest.directories.size,
    managedTargetFileCount: targetManifest.files.size,
    managedTargetDirectoryCount: targetManifest.directories.size,
  };
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

  for (const sourceDirectoryName of directoryCopies) {
    const sourceDirectoryPath = path.join(REPO_ROOT, sourceDirectoryName);
    if (!(await pathExists(sourceDirectoryPath))) {
      continue;
    }

    const sourceTree = await collectRelativeTreeEntries(sourceDirectoryPath, sourceDirectoryName);
    for (const relativeFilePath of sourceTree.files) {
      const sourcePath = path.join(REPO_ROOT, ...relativeFilePath.split('/'));
      const targetPath = path.join(resolvedTargetDirectoryPath, ...relativeFilePath.split('/'));
      const syncResult = await syncFile(sourcePath, targetPath);
      
      if (syncResult.status === 'created') createdFiles.push(relativeFilePath);
      else if (syncResult.status === 'updated') updatedFiles.push(relativeFilePath);
      else if (syncResult.status === 'unchanged') unchangedFiles.push(relativeFilePath);
    }
  }

  for (const entryPointFileName of entryPointFiles) {
    const sourceFilePath = path.join(REPO_ROOT, entryPointFileName);
    const targetFilePath = path.join(resolvedTargetDirectoryPath, entryPointFileName);

    if (!(await pathExists(sourceFilePath))) {
      continue;
    }

    if (path.resolve(sourceFilePath) === path.resolve(targetFilePath)) {
      continue;
    }

    const syncResult = await syncFile(sourceFilePath, targetFilePath);
    if (syncResult.status === 'created') createdFiles.push(entryPointFileName);
    else if (syncResult.status === 'updated') updatedFiles.push(entryPointFileName);
    else if (syncResult.status === 'unchanged') unchangedFiles.push(entryPointFileName);
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

    const sourceMcpServerPath = path.join(REPO_ROOT, 'scripts', 'mcp-server.mjs');
    const targetMcpServerPath = path.join(resolvedTargetDirectoryPath, 'scripts', 'mcp-server.mjs');
    const mcpServerSync = await syncFile(sourceMcpServerPath, targetMcpServerPath);
    if (mcpServerSync.status === 'created') createdFiles.push('scripts/mcp-server.mjs');
    else if (mcpServerSync.status === 'updated') updatedFiles.push('scripts/mcp-server.mjs');

    const sourceMcpHelpersDirectoryPath = path.join(REPO_ROOT, 'scripts', 'mcp-server');
    if (await pathExists(sourceMcpHelpersDirectoryPath)) {
      const mcpHelperTreeEntries = await collectRelativeTreeEntries(
        sourceMcpHelpersDirectoryPath,
        'scripts/mcp-server'
      );

      for (const relativeHelperFilePath of mcpHelperTreeEntries.files) {
        const sourceHelperFilePath = path.join(REPO_ROOT, ...relativeHelperFilePath.split('/'));
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
        
        if (await pathExists(globalGeminiDir)) {
          let geminiConfig = { mcpServers: {} };
          if (await pathExists(globalGeminiMcpPath)) {
            const content = await fs.readFile(globalGeminiMcpPath, 'utf8');
            if (content.trim()) {
              try { geminiConfig = JSON.parse(content); } catch {}
            }
          }
          if (!geminiConfig.mcpServers) geminiConfig.mcpServers = {};
          
          const safeProjectName = projectName.replace(/[^a-zA-Z0-9_-]/g, '-');
          const uniqueServerName = `agentic-senior-core-${safeProjectName}`;
          const templateServer = {
            command: 'node',
            args: mcpArgs,
            cwd: resolvedTargetDirectoryPath,
          };
          
          if (JSON.stringify(geminiConfig.mcpServers[uniqueServerName]) !== JSON.stringify(templateServer)) {
             geminiConfig.mcpServers[uniqueServerName] = templateServer;
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
    managedSurfacePlan,
  };
}

export async function askChoice(promptMessage, options, userInterface) {
  console.log(`\n${promptMessage}`);
  options.forEach((choiceLabel, choiceIndex) => {
    console.log(`  ${choiceIndex + 1}. ${choiceLabel}`);
  });

  while (true) {
    const selectedRawInput = await userInterface.question('Choose a number (press Enter for 1): ');
    const normalizedInput = selectedRawInput.trim();

    if (!normalizedInput) {
      return options[0];
    }

    const selectedIndex = Number.parseInt(normalizedInput, 10) - 1;

    if (Number.isNaN(selectedIndex) || selectedIndex < 0 || selectedIndex >= options.length) {
      console.log('Invalid choice. Please select a valid number.');
      continue;
    }

    return options[selectedIndex];
  }
}

export async function askYesNo(promptMessage, userInterface, defaultValue) {
  const suffix = typeof defaultValue === 'boolean'
    ? defaultValue ? ' (Y/n): ' : ' (y/N): '
    : ' (y/n): ';

  while (true) {
    const answer = await userInterface.question(`\n${promptMessage}${suffix}`);
    const normalizedAnswer = answer.trim().toLowerCase();

    if (!normalizedAnswer && typeof defaultValue === 'boolean') {
      return defaultValue;
    }

    if (normalizedAnswer === 'y' || normalizedAnswer === 'yes') return true;
    if (normalizedAnswer === 'n' || normalizedAnswer === 'no') return false;

    console.log("Please answer with 'y' or 'n'.");
  }
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
