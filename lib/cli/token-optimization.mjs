import fs from 'node:fs/promises';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { platform } from 'node:process';

import { pathExists } from './utils.mjs';

export const TOKEN_OPTIMIZATION_STATE_FILE_NAME = 'token-optimization.json';
export const TOKEN_OPTIMIZATION_REPORT_FILE_NAME = 'token-optimization-report.json';

const TOKEN_OPTIMIZATION_SCHEMA_VERSION = 'token-optimization-v1';
const FALLBACK_AGENT_NAME = 'copilot';

const SUPPORTED_AGENT_NAMES = new Set([
  'copilot',
  'claude',
  'cursor',
  'windsurf',
  'gemini',
  'codex',
  'cline',
]);

const COMMAND_REWRITE_MAPPINGS = [
  {
    rawCommand: 'ls -la',
    optimizedCommand: 'rtk ls .',
    reason: 'Directory listings are grouped and compacted before entering the model context.',
  },
  {
    rawCommand: 'tree',
    optimizedCommand: 'rtk ls .',
    reason: 'Large trees are summarized without losing high-signal structure.',
  },
  {
    rawCommand: 'cat file.ext',
    optimizedCommand: 'rtk read file.ext',
    reason: 'File reads keep signatures and relevant lines while trimming boilerplate.',
  },
  {
    rawCommand: 'rg pattern .',
    optimizedCommand: 'rtk grep "pattern" .',
    reason: 'Search hits are grouped and deduplicated for faster reasoning.',
  },
  {
    rawCommand: 'git status',
    optimizedCommand: 'rtk git status',
    reason: 'Status output is condensed to actionable file changes.',
  },
  {
    rawCommand: 'git diff',
    optimizedCommand: 'rtk git diff',
    reason: 'Diff noise is trimmed while preserving code-review context.',
  },
  {
    rawCommand: 'git log -n 10',
    optimizedCommand: 'rtk git log -n 10',
    reason: 'History is converted to compact one-line summaries.',
  },
  {
    rawCommand: 'npm test',
    optimizedCommand: 'rtk test npm test',
    reason: 'Test results emphasize failures and suppress repetitive pass logs.',
  },
  {
    rawCommand: 'npm run build',
    optimizedCommand: 'rtk err npm run build',
    reason: 'Build runs return errors and warnings only for quicker remediation.',
  },
  {
    rawCommand: 'tsc --noEmit',
    optimizedCommand: 'rtk tsc',
    reason: 'TypeScript diagnostics are grouped by file with less repetition.',
  },
  {
    rawCommand: 'eslint .',
    optimizedCommand: 'rtk lint',
    reason: 'Lint output is grouped by rule and location to reduce token churn.',
  },
  {
    rawCommand: 'docker ps',
    optimizedCommand: 'rtk docker ps',
    reason: 'Container state is summarized into compact rows.',
  },
  {
    rawCommand: 'kubectl get pods',
    optimizedCommand: 'rtk kubectl pods',
    reason: 'Kubernetes output is condensed and stable for agent consumption.',
  },
];

function parseRtkVersion(versionOutput) {
  const versionMatch = versionOutput.match(/\d+\.\d+\.\d+/);
  return versionMatch ? versionMatch[0] : null;
}

export function normalizeAgentName(rawAgentName = FALLBACK_AGENT_NAME) {
  const normalizedAgentName = String(rawAgentName || '')
    .trim()
    .toLowerCase();

  if (!normalizedAgentName) {
    return FALLBACK_AGENT_NAME;
  }

  if (!SUPPORTED_AGENT_NAMES.has(normalizedAgentName)) {
    throw new Error(
      `Unsupported agent "${rawAgentName}". Supported values: ${Array.from(SUPPORTED_AGENT_NAMES).join(', ')}`
    );
  }

  return normalizedAgentName;
}

export function detectRtkBinary() {
  try {
    const versionResult = spawnSync('rtk', ['--version'], {
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'pipe'],
    });

    if (versionResult.status !== 0) {
      return {
        isAvailable: false,
        version: null,
        detectionError: (versionResult.stderr || versionResult.stdout || 'Unknown external proxy detection error').trim(),
      };
    }

    const detectedVersion = parseRtkVersion(versionResult.stdout || '');
    return {
      isAvailable: true,
      version: detectedVersion,
      detectionError: null,
    };
  } catch (detectionError) {
    return {
      isAvailable: false,
      version: null,
      detectionError: detectionError instanceof Error ? detectionError.message : String(detectionError),
    };
  }
}

export function buildRtkInstallHint() {
  if (platform === 'win32') {
    return 'Install the external token optimizer binary for Windows, extract it, and ensure the executable is on PATH.';
  }

  if (platform === 'darwin') {
    return 'Install the external token optimizer with Homebrew, then verify the executable is available in your shell.';
  }

  return 'Install the external token optimizer with the vendor installer, then verify it is available in your shell PATH.';
}

export function buildRtkHookCommand(selectedAgentName) {
  const normalizedAgentName = normalizeAgentName(selectedAgentName);

  if (normalizedAgentName === 'copilot') {
    return 'rtk init -g --copilot';
  }

  if (normalizedAgentName === 'claude') {
    return 'rtk init -g';
  }

  if (normalizedAgentName === 'cursor') {
    return 'rtk init -g --agent cursor';
  }

  if (normalizedAgentName === 'windsurf') {
    return 'rtk init --agent windsurf';
  }

  if (normalizedAgentName === 'gemini') {
    return 'rtk init -g --gemini';
  }

  if (normalizedAgentName === 'codex') {
    return 'rtk init -g --codex';
  }

  if (normalizedAgentName === 'cline') {
    return 'rtk init --agent cline';
  }

  return 'rtk init -g --copilot';
}

export function createTokenOptimizationState({
  isEnabled,
  selectedAgentName,
  rtkDetection,
}) {
  return {
    schemaVersion: TOKEN_OPTIMIZATION_SCHEMA_VERSION,
    enabled: Boolean(isEnabled),
    selectedAgent: normalizeAgentName(selectedAgentName),
    preferredShellProxy: rtkDetection.isAvailable ? 'external-proxy' : 'native-fallback',
    externalProxy: {
      detected: Boolean(rtkDetection.isAvailable),
      version: rtkDetection.version,
      detectionError: rtkDetection.detectionError,
    },
    commandRewriteMappings: COMMAND_REWRITE_MAPPINGS.map((mapping) => ({ ...mapping })),
    generatedAt: new Date().toISOString(),
  };
}

export async function readTokenOptimizationState(targetDirectoryPath) {
  const stateFilePath = path.join(
    targetDirectoryPath,
    '.agent-context',
    'state',
    TOKEN_OPTIMIZATION_STATE_FILE_NAME
  );

  if (!(await pathExists(stateFilePath))) {
    return null;
  }

  try {
    const stateContent = await fs.readFile(stateFilePath, 'utf8');
    const parsedState = JSON.parse(stateContent);
    if (typeof parsedState.enabled !== 'boolean') {
      return null;
    }
    return parsedState;
  } catch {
    return null;
  }
}

export async function writeTokenOptimizationState(targetDirectoryPath, tokenOptimizationState) {
  const stateDirectoryPath = path.join(targetDirectoryPath, '.agent-context', 'state');
  const stateFilePath = path.join(stateDirectoryPath, TOKEN_OPTIMIZATION_STATE_FILE_NAME);

  await fs.mkdir(stateDirectoryPath, { recursive: true });
  await fs.writeFile(stateFilePath, JSON.stringify(tokenOptimizationState, null, 2) + '\n', 'utf8');
}

export function buildTokenOptimizationGuidanceBlock(tokenOptimizationState) {
  if (!tokenOptimizationState?.enabled) {
    return [
      'Token optimization mode is disabled for this repository.',
      'Use native shell commands with manual output limiting when needed.',
    ].join('\n');
  }

  const rewriteLines = (tokenOptimizationState.commandRewriteMappings || []).map(
    (mapping) => `- ${mapping.rawCommand} => ${mapping.optimizedCommand} (${mapping.reason})`
  );

  const fallbackGuidance = [
    '- Prefer command variants with bounded output (for example: git diff --stat, rg --max-count, and npm test -- --reporter=dot).',
    '- Request only the lines or sections required for the current decision.',
    '- If shell output is still large, summarize and continue iteratively instead of dumping full logs.',
  ];

  return [
    `Token optimization mode is enabled for agent: ${tokenOptimizationState.selectedAgent}.`,
    `Preferred shell proxy: ${tokenOptimizationState.preferredShellProxy}.`,
    '',
    'Apply command rewrites before running verbose shell commands:',
    ...rewriteLines,
    '',
    'Important scope note:',
    '- Shell rewrite hooks affect shell tool calls only.',
    '- Built-in read/grep/glob style tools may bypass shell rewrites, so explicit compact shell commands should be preferred in high-volume sessions.',
    '',
    'Fallback behavior when external proxy is unavailable:',
    ...fallbackGuidance,
  ].join('\n');
}
