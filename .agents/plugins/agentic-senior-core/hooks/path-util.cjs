const crypto = require('crypto');
const path = require('path');
const os = require('os');

/**
 * Computes a stable path for the workflow gate file based on the project path.
 * Normalizes the path (resolves absolute, lowercase, forward slashes, no trailing slash)
 * to ensure identical hashes regardless of OS path separator or drive letter casing.
 *
 * @param {string} projectPath - The root path of the project.
 * @returns {string} Absolute path to the global workflow gate JSON file.
 */
function getWorkflowGatePath(projectPath) {
  const normalizedPath = path.resolve(projectPath).replace(/\\/g, '/').toLowerCase().replace(/\/$/, '');
  const projectHash = crypto.createHash('sha256').update(normalizedPath).digest('hex').substring(0, 16);
  return path.join(os.homedir(), '.config', 'agentic-senior-core', 'gates', `${projectHash}.json`);
}

/**
 * Detects whether a hook stdin payload originates from Antigravity (App, CLI, or IDE).
 */
function isAntigravityPayload(data) {
  if (!data || typeof data !== 'object') return false;
  return Boolean(
    data.toolCall ||
    Array.isArray(data.workspacePaths) ||
    typeof data.transcriptPath === 'string' ||
    typeof data.invocationNum === 'number' ||
    typeof data.executionNum === 'number'
  );
}

/**
 * Resolves the active user workspace directory from hook stdin JSON.
 * Antigravity executes hooks with cwd set to the directory containing hooks.json,
 * so workspacePaths[0] or toolCall.args.Cwd must take precedence over process.cwd().
 */
function resolveWorkspaceRoot(data) {
  if (data && typeof data === 'object') {
    if (data.toolCall && data.toolCall.args && typeof data.toolCall.args.Cwd === 'string' && data.toolCall.args.Cwd.trim()) {
      return path.resolve(data.toolCall.args.Cwd);
    }
    if (Array.isArray(data.workspacePaths) && data.workspacePaths.length > 0 && typeof data.workspacePaths[0] === 'string' && data.workspacePaths[0].trim()) {
      return path.resolve(data.workspacePaths[0]);
    }
    if (typeof data.cwd === 'string' && data.cwd.trim()) {
      return path.resolve(data.cwd);
    }
  }
  return process.cwd();
}

/**
 * Normalizes file edit/write tool calls across Antigravity (edit_file, write_file,
 * replace_file_content, multi_replace_file_content, write_to_file) and Claude/Codex/Copilot (Edit, Write).
 */
function normalizeEditToolCall(toolName, rawArgs) {
  const args = rawArgs && typeof rawArgs === 'object' ? rawArgs : {};
  const name = String(toolName || '');

  if (name === 'edit_file') {
    return {
      canonicalTool: 'Edit',
      filePath: args.Path || args.file_path || '',
      newContent: args.Replacement || '',
      oldContent: args.Target || '',
    };
  }

  if (name === 'replace_file_content') {
    return {
      canonicalTool: 'Edit',
      filePath: args.TargetFile || args.file_path || '',
      newContent: args.ReplacementContent || '',
      oldContent: args.TargetContent || '',
    };
  }

  if (name === 'multi_replace_file_content') {
    const chunks = Array.isArray(args.ReplacementChunks) ? args.ReplacementChunks : [];
    return {
      canonicalTool: 'Edit',
      filePath: args.TargetFile || args.file_path || '',
      newContent: chunks.length > 0
        ? chunks.map(function (c) { return (c && c.ReplacementContent) || ''; }).join('\n')
        : (args.ReplacementContent || ''),
      oldContent: chunks.length > 0
        ? chunks.map(function (c) { return (c && c.TargetContent) || ''; }).join('\n')
        : (args.TargetContent || ''),
    };
  }

  if (name === 'Edit') {
    return {
      canonicalTool: 'Edit',
      filePath: args.file_path || args.path || args.TargetFile || args.Path || '',
      newContent: args.new_string || args.ReplacementContent || args.Replacement || args.content || '',
      oldContent: args.old_string || args.TargetContent || args.Target || '',
    };
  }

  if (name === 'write_file') {
    return {
      canonicalTool: 'Write',
      filePath: args.Path || args.file_path || '',
      newContent: args.Content || args.content || '',
      oldContent: '',
    };
  }

  if (name === 'write_to_file') {
    return {
      canonicalTool: 'Write',
      filePath: args.TargetFile || args.file_path || '',
      newContent: args.CodeContent || args.content || '',
      oldContent: '',
    };
  }

  if (name === 'Write') {
    return {
      canonicalTool: 'Write',
      filePath: args.file_path || args.path || args.TargetFile || args.Path || '',
      newContent: args.content || args.CodeContent || args.Content || '',
      oldContent: '',
    };
  }

  return null;
}

module.exports = {
  getWorkflowGatePath,
  isAntigravityPayload,
  resolveWorkspaceRoot,
  normalizeEditToolCall,
};
