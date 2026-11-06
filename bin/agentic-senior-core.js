#!/usr/bin/env node
/**
 * Agentic-Senior-Core CLI v5 -- Universal plugin system.
 *
 * Commands:
 *   adapter     Generate instruction-tier adapter files for IDEs without plugin support
 *   global      Install rules to user-level (global) locations, applies to all projects
 *   uninstall   Remove ASC adapter files from the current project
 *   clean       Remove v4 per-project artifacts (.agent-context/, bridge files)
 *   status      Show detected IDEs and install hints
 */
import { exit } from 'node:process';
import { readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const currentFilePath = fileURLToPath(import.meta.url);
const repositoryRoot = resolve(dirname(currentFilePath), '..');
const packageJson = JSON.parse(readFileSync(resolve(repositoryRoot, 'package.json'), 'utf8'));
const CLI_VERSION = packageJson.version;

function printUsage() {
  console.log(`Agentic-Senior-Core CLI v${CLI_VERSION}`);
  console.log('Universal AI coding rules. Write code like a staff engineer.\n');
  console.log('Plugin install (always-on, no per-project files):');
  console.log('  Claude Code:  /plugin marketplace add fatidaprilian/Agentic-Senior-Core');
  console.log('  Codex CLI:    codex plugins install agentic-senior-core\n');
  console.log('Global install (auto-detects installed tools, zero project files):');
  console.log('  asc global');
  console.log('  asc global --all\n');
  console.log('Adapter install (one file per project):');
  console.log('  asc adapter --cursor --devin --cline --copilot --kiro --continue --zed --aider --kilocode --roo --openhands --windsurf --all\n');
  console.log('Commands:');
  console.log('  global            Auto-detect and install rules to user-level (global) locations');
  console.log('  adapter           Generate instruction-tier adapter files');
  console.log('  status            Show detected IDEs and install hints');
  console.log('  dedup             Scan codebase for duplicate code blocks (Rule of Three)');
  console.log('  bootstrap         List or seed anti-slop preference rules');
  console.log('  install-git-hook  Install Git pre-commit hook for duplicate code enforcement');
  console.log('  uninstall         Remove ASC adapter files and git hooks from this project');
  console.log('  clean             Remove v4 per-project artifacts');
  console.log('  preview           Render zero-dependency multi-browser snapshot or preview');
  console.log('  --version         Show version');
  console.log('  --help            Show this help');
}

async function main() {
  const commandArgument = process.argv[2];
  const commandArguments = process.argv.slice(3);

  if (!commandArgument || commandArgument === '--help' || commandArgument === '-h') {
    printUsage();
    return;
  }

  if (commandArgument === '--version' || commandArgument === '-v') {
    console.log(CLI_VERSION);
    return;
  }

  if (commandArgument === 'install-git-hook' || commandArgument === 'git-hook') {
    const { runGitHookCommand } = await import('../lib/cli/commands/git-hook.mjs');
    await runGitHookCommand(commandArguments);
    return;
  }

  if (commandArgument === 'adapter') {
    const { runAdapterCommand } = await import('../lib/cli/commands/adapter.mjs');
    await runAdapterCommand(commandArguments);
    return;
  }

  if (commandArgument === 'global') {
    const { runGlobalCommand } = await import('../lib/cli/commands/global.mjs');
    await runGlobalCommand(commandArguments);
    return;
  }

  if (commandArgument === 'uninstall') {
    const { runUninstallCommand } = await import('../lib/cli/commands/uninstall.mjs');
    await runUninstallCommand(commandArguments);
    return;
  }

  if (commandArgument === 'clean') {
    const { runCleanCommand } = await import('../lib/cli/commands/clean.mjs');
    await runCleanCommand(commandArguments);
    return;
  }

  if (commandArgument === 'status') {
    const { runStatusCommand } = await import('../lib/cli/commands/status.mjs');
    await runStatusCommand();
    return;
  }

  if (commandArgument === 'dedup') {
    const { runDedupCommand } = await import('../lib/cli/commands/dedup.mjs');
    await runDedupCommand(commandArguments);
    return;
  }

  if (commandArgument === 'bootstrap') {
    const { runBootstrapCommand } = await import('../lib/cli/commands/bootstrap.mjs');
    await runBootstrapCommand(commandArguments);
    return;
  }

  if (commandArgument === 'preview') {
    const { runPreviewCommand } = await import('../lib/cli/commands/preview.mjs');
    await runPreviewCommand(commandArguments);
    return;
  }

  console.error(`Unknown command: ${commandArgument}`);
  printUsage();
  exit(1);
}

main().catch((error) => {
  console.error('CLI failed:', error);
  exit(1);
});
