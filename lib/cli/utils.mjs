/**
 * CLI Utilities — Shared helper functions.
 * Depends on: constants.mjs
 */
import fs from 'node:fs/promises';
import path from 'node:path';

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
  console.log('  open GitHub template: https://github.com/fatidaprilian/Agentic-Senior-Core/generate');
  console.log('');
  console.log('Usage:');
  console.log('  agentic-senior-core launch');
  console.log('  agentic-senior-core init [target-directory] [--preset <name>] [--profile <beginner|balanced|strict>] [--profile-pack <name>] [--stack <name>] [--blueprint <name>] [--ci <true|false>] [--newbie] [--token-optimize] [--no-token-optimize] [--token-agent <name>] [--memory-continuity] [--no-memory-continuity] [--scaffold-docs] [--no-scaffold-docs] [--docs-lang <en|id>] [--project-config <path>] [--runtime-env <auto|linux-wsl|linux|windows|macos>]');
  console.log('  agentic-senior-core upgrade [target-directory] [--dry-run] [--yes] [--mcp-template]');
  console.log('  agentic-senior-core optimize [target-directory] [--agent <copilot|claude|cursor|windsurf|gemini|codex|cline>] [--enable|--disable] [--show]');
  console.log('  agentic-senior-core mcp');
  console.log('  agentic-senior-core rollback [target-directory]');
  console.log('  agentic-senior-core skill [domain] [--tier <standard|advance|expert|above>] [--json]');
  console.log('  agentic-senior-core --version');
  console.log('');
  console.log('Options:');
  console.log('  --help       Show help');
  console.log('  --version    Show CLI version');
  console.log('  --profile    Choose beginner, balanced, or strict');
  console.log(`  --preset     Use a plug-and-play starter preset (${presetNames})`);
  console.log('  --profile-pack  Apply a team profile pack (startup, regulated, platform)');
  console.log('  --newbie     Alias for --profile beginner');
  console.log('  --stack      Override stack selection');
  console.log('  --blueprint  Override blueprint selection');
  console.log('  --ci         Override CI/CD guardrails (true|false)');
  console.log('  --token-optimize  Explicitly enable token optimization policy during init (default behavior)');
  console.log('  --token-agent     Set token optimization agent target (copilot, claude, cursor, windsurf, gemini, codex, cline)');
  console.log('  --no-token-optimize  Disable token optimization policy during init');
  console.log('  --memory-continuity  Explicitly enable cross-session memory continuity policy during init (default behavior)');
  console.log('  --no-memory-continuity  Disable memory continuity policy during init');
  console.log('  --mcp-template   Create .vscode/mcp.json workspace template (MCP trust/start remains manual in IDE)');
  console.log('  --scaffold-docs  Force project documentation scaffolding (architecture, database, API, flow)');
  console.log('  --no-scaffold-docs  Skip project documentation scaffolding');
  console.log('  --docs-lang      Optional override for generated project docs language (default: en)');
  console.log('  --project-config Path to a project config file for non-interactive doc scaffolding');
  console.log('  --runtime-env   Override runtime environment hint (auto, linux-wsl, linux, windows, macos)');
  console.log('  --dry-run    Preview upgrade without writing files');
  console.log('  --yes        Skip confirmation prompts for upgrade');
  console.log('  --agent      Target agent integration for token optimization mode');
  console.log('  --enable     Enable token optimization policy and rebuild compiled rules');
  console.log('  --disable    Disable token optimization policy and rebuild compiled rules');
  console.log('  --show       Print current token optimization state as JSON');
  console.log('  --tier       Choose a skill tier for the skill selector');
  console.log('  --json       Emit machine-readable skill selection output');
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

export async function copyGovernanceAssetsToTarget(
  resolvedTargetDirectoryPath,
  options = {}
) {
  const shouldIncludeMcpTemplate = options.includeMcpTemplate === true;

  for (const sourceDirectoryName of directoryCopies) {
    const sourceDirectoryPath = path.join(REPO_ROOT, sourceDirectoryName);
    if (!(await pathExists(sourceDirectoryPath))) {
      continue;
    }

    await copyDirectory(sourceDirectoryPath, path.join(resolvedTargetDirectoryPath, sourceDirectoryName));
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

    await ensureDirectory(path.dirname(targetFilePath));
    await fs.copyFile(sourceFilePath, targetFilePath);
  }

  if (shouldIncludeMcpTemplate) {
    const vscodeDirectoryPath = path.join(resolvedTargetDirectoryPath, '.vscode');
    const workspaceMcpConfigurationPath = path.join(vscodeDirectoryPath, 'mcp.json');

    const workspaceMcpConfiguration = {
      $schema: 'vscode://schemas/mcp',
      servers: {
        'agentic-senior-core': {
          type: 'stdio',
          command: 'node',
          cwd: '${workspaceFolder}',
          args: ['./scripts/mcp-server.mjs'],
        },
      },
    };

    if (!(await pathExists(workspaceMcpConfigurationPath))) {
      await ensureDirectory(vscodeDirectoryPath);
      await fs.writeFile(
        workspaceMcpConfigurationPath,
        JSON.stringify(workspaceMcpConfiguration, null, 2) + '\n',
        'utf8'
      );
    }
  }
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
  const fileNames = await fs.readdir(folderPath, { withFileTypes: true });
  return fileNames
    .filter((entry) => entry.isFile() && entry.name.endsWith('.md'))
    .map((entry) => entry.name)
    .sort((leftName, rightName) => leftName.localeCompare(rightName));
}

export function formatBlockingSeverities(blockingSeverities) {
  return blockingSeverities.join(', ');
}

export function formatDuration(durationMs) {
  const durationInSeconds = (durationMs / 1000).toFixed(1);
  return `${durationInSeconds}s`;
}
