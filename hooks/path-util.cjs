const crypto = require('crypto');
const path = require('path');
const os = require('os');

/**
 * Computes a stable path for the workflow gate file based on the project path.
 * Normalizes the path (resolves absolute, lowercase, forward slashes, no trailing slash)
 * to ensure identical hashes regardless of OS path separator or drive letter casing.
 * Note: .toLowerCase() deliberately treats Linux/Mac paths case-insensitively, 
 * accepting the negligible risk of collisions for the benefit of Windows stability.
 * 
 * @param {string} projectPath - The root path of the project.
 * @returns {string} Absolute path to the global workflow gate JSON file.
 */
function getWorkflowGatePath(projectPath) {
  const normalizedPath = path.resolve(projectPath).replace(/\\/g, '/').toLowerCase().replace(/\/$/, '');
  const projectHash = crypto.createHash('sha256').update(normalizedPath).digest('hex').substring(0, 16);
  return path.join(os.homedir(), '.config', 'agentic-senior-core', 'gates', `${projectHash}.json`);
}

module.exports = {
  getWorkflowGatePath
};
