#!/usr/bin/env node
/**
 * Agentic-Senior-Core CLI v5 -- Universal plugin system.
 *
 * Commands:
 *   adapter     Generate instruction-tier adapter files for IDEs without plugin support
 *   uninstall   Remove ASC adapter files from the current project
 *   clean       Remove v4 per-project artifacts (.agent-context/, bridge files)
 *   status      Show detected IDEs and install hints
 *   mcp         Start MCP stdio server
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
  console.log('Adapter install (one file per project):');
  console.log('  asc adapter --cursor --devin --cline --copilot --kiro --continue --zed --aider --kilocode --roo --openhands --windsurf --all\n');
  console.log('Commands:');
  console.log('  adapter       Generate instruction-tier adapter files');
  console.log('  uninstall     Remove ASC adapter files from this project');
  console.log('  clean         Remove v4 per-project artifacts');
  console.log('  status        Show detected IDEs and install hints');
  console.log('  mcp           Start MCP stdio server');
  console.log('  --version     Show version');
  console.log('  --help        Show this help');
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

  if (commandArgument === 'adapter') {
    const { runAdapterCommand } = await import('../lib/cli/commands/adapter.mjs');
    await runAdapterCommand(commandArguments);
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

  if (commandArgument === 'mcp') {
    const { runMcpServerCommand } = await import('../lib/cli/commands/mcp.mjs');
    await runMcpServerCommand();
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
