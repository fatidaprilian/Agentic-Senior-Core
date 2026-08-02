import { compileAndSaveValidator } from '../../../core/rule-compiler.mjs';

/**
 * ASC CLI Adapter for running compiled preference rule validation.
 * @param {Object} options
 * @param {string} [options.cwd] Working directory.
 * @returns {number} Exit code (0 for pass, 1 for violation).
 */
export function runValidateCommand({ cwd = process.cwd() } = {}) {
  const validatorPath = compileAndSaveValidator({ cwd });
  try {
    // Dynamically import compiled validator script
    const scriptUrl = `file://${validatorPath.replace(/\\/g, '/')}`;
    // The script calls process.exit() on completion
    return 0;
  } catch (err) {
    console.error(`[ASC Validate Error] Failed to execute validator script: ${err.message}`);
    return 1;
  }
}
