import path from 'node:path';
import { installGitPreCommitHook, installGlobalGitPreCommitHook } from './git-hook-generator.mjs';

/**
 * Runs the `asc install-git-hook` command to install Git pre-commit hooks.
 * @param {string[]} commandArguments
 */
export async function runGitHookCommand(commandArguments = []) {
  const targetDirectory = process.cwd();
  const isGlobal = Array.isArray(commandArguments) && (commandArguments.includes('--global') || commandArguments.includes('-g'));
  console.log('Agentic Senior Core -- Git Pre-Commit Hook Installer\n');

  if (isGlobal) {
    const result = installGlobalGitPreCommitHook();
    if (!result.installed) {
      console.error(`Failed: ${result.reason || 'Could not install global pre-commit hook'}`);
      process.exit(1);
    }
    console.log(`  Global Git Hook: ${result.hookPath} ... OK`);
    console.log(`  Git config core.hooksPath updated globally.`);
    console.log('\nGlobal smart Git pre-commit dispatcher successfully installed.');
    return;
  }

  const result = installGitPreCommitHook({ cwd: targetDirectory });

  if (!result.installed) {
    console.error(`Failed: ${result.reason || 'Could not install pre-commit hook'}`);
    process.exit(1);
  }

  console.log(`  Pre-commit hook: ${result.hookPath} ... OK`);
  if (result.runnerPath) {
    console.log(`  Runner script: ${result.runnerPath} ... OK`);
  }
  console.log('\nGit pre-commit hook successfully installed.');
}

