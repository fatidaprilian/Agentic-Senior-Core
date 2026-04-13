#!/usr/bin/env node
/**
 * Agentic-Senior-Core CLI — Thin entry point.
 *
 * All logic lives in lib/cli/ modules. This file only handles
 * argument dispatch and the top-level error boundary.
 */
import { exit } from 'node:process';

import { CLI_VERSION } from '../lib/cli/constants.mjs';
import { printUsage } from '../lib/cli/utils.mjs';
import { runLaunchCommand } from '../lib/cli/commands/launch.mjs';
import { runRollbackCommand } from '../lib/cli/commands/rollback.mjs';
import { runMcpServerCommand } from '../lib/cli/commands/mcp.mjs';
import { runOptimizeCommand, parseOptimizeArguments } from '../lib/cli/commands/optimize.mjs';
import { runInitCommand, parseInitArguments } from '../lib/cli/commands/init.mjs';
import { runUpgradeCommand, parseUpgradeArguments } from '../lib/cli/commands/upgrade.mjs';
import { runSkillCommand } from '../lib/cli/skill-selector.mjs';

async function main() {
  const commandArgument = process.argv[2];
  const commandArguments = process.argv.slice(3);

  if (!commandArgument || commandArgument === 'launch') {
    await runLaunchCommand();
    return;
  }

  if (commandArgument === '--help' || commandArgument === '-h') {
    printUsage();
    return;
  }

  if (commandArgument === '--version' || commandArgument === '-v') {
    console.log(CLI_VERSION);
    return;
  }

  if (commandArgument === 'skill') {
    await runSkillCommand(commandArguments);
    return;
  }

  if (commandArgument === 'upgrade') {
    const upgradeOptions = parseUpgradeArguments(commandArguments);
    await runUpgradeCommand(upgradeOptions.targetDirectory, upgradeOptions);
    return;
  }

  if (commandArgument === 'optimize') {
    const optimizeOptions = parseOptimizeArguments(commandArguments);
    await runOptimizeCommand(optimizeOptions.targetDirectory, optimizeOptions);
    return;
  }

  if (commandArgument === 'init') {
    const initOptions = parseInitArguments(commandArguments);
    await runInitCommand(initOptions.targetDirectory, initOptions);
    return;
  }

  if (commandArgument === 'rollback') {
    await runRollbackCommand(commandArguments);
    return;
  }

  if (commandArgument === 'mcp') {
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
