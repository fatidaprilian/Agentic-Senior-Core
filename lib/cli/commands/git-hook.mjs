import path from 'node:path';
import { installGitPreCommitHook } from './git-hook-generator.mjs';

/**
 * Runs the `asc install-git-hook` command to install Git pre-commit hooks.
 * @param {string[]} commandArguments
 */
export async function runGitHookCommand(commandArguments) {
  const targetDirectory = process.cwd();
  console.log('Agentic Senior Core -- Git Pre-Commit Hook Installer\n');

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
