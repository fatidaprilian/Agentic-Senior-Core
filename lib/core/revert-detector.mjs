import { execSync } from 'child_process';

/**
 * Detects recent git file rollbacks or reverts in the workspace to trigger signal denoising.
 * @param {Object} options
 * @param {string} [options.cwd] Working directory.
 * @returns {{ hasReverts: boolean, revertedFiles: Array<string>, prompt: string }} Denoising status payload.
 */
export function detectRevertedFiles({ cwd = process.cwd() } = {}) {
  try {
    // Check unstaged or staged diffs showing file deletions/rollbacks
    const statusOutput = execSync('git status --porcelain', { cwd, encoding: 'utf8' });
    const lines = statusOutput.split('\n').map(l => l.trim()).filter(Boolean);

    // Filter modified or deleted files
    const modifiedOrDeleted = lines
      .filter(line => line.startsWith(' M') || line.startsWith(' D') || line.startsWith('D '))
      .map(line => line.substring(3).trim());

    if (modifiedOrDeleted.length === 0) {
      return { hasReverts: false, revertedFiles: [], prompt: '' };
    }

    const firstFile = modifiedOrDeleted[0];
    const prompt = `[ASC Signal Denoising] Revert/edit detected on ${firstFile}. Was this caused by a specific UI/code slop pattern? (Run /asc-learn to log or press Enter to skip)`;

    return {
      hasReverts: true,
      revertedFiles: modifiedOrDeleted,
      prompt
    };
  } catch (err) {
    return { hasReverts: false, revertedFiles: [], prompt: '' };
  }
}
