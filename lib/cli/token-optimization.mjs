import { existsSync } from 'node:fs';
import fs from 'node:fs/promises';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { platform } from 'node:process';

import { REPOSITORY_ROOT } from './constants.mjs';
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
    optimizedCommand: 'ascx git status',
    reason: 'ASCX condenses status output while preserving changed-file evidence and raw tee safety.',
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
    optimizedCommand: 'ascx npm test',
    reason: 'ASCX preserves exit code, failing tests, assertions, file paths, and raw tee safety.',
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

const OUTPUT_FOLDING_STRATEGY = {
  mode: 'compact-high-signal-output',
  appliesTo: [
    'shell-command-output',
    'test-output',
    'build-output',
    'diff-output',
    'log-output',
  ],
  preserveAlways: [
    'exit-code',
    'failing-command',
    'file-and-line',
    'error-message',
    'actionable-warning',
  ],
  foldByDefault: [
    'repeated-success-lines',
    'large-unchanged-diff-context',
    'verbose-install-progress',
    'duplicated-stack-frames',
    'low-signal-directory-noise',
  ],
  nativeFallback: [
    'prefer --stat or --name-only before full diff',
    'prefer focused rg queries before broad file dumps',
    'prefer failure-focused test reporters when available',
    'summarize long logs before hydrating full detail',
  ],
  safetyBoundary: [
    'never hide failing checks',
    'never drop the command that produced output',
    'never persist secrets into summaries',
    'hydrate full output only when the compact summary is insufficient',
  ],
};

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

export function detectAscxRuntime() {
  const localBinPath = path.join(REPOSITORY_ROOT, 'bin', 'ascx.js');
  const pathDetection = spawnSync('ascx', [], {
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  const pathBinaryLooksAvailable = pathDetection.error == null
    && typeof pathDetection.status === 'number'
    && /command is required/i.test(`${pathDetection.stdout || ''}\n${pathDetection.stderr || ''}`);

  if (pathBinaryLooksAvailable) {
    return {
      isAvailable: true,
      source: 'path',
      command: 'ascx',
      localBinPath,
      detectionError: null,
    };
  }

  if (existsSync(localBinPath)) {
    return {
      isAvailable: true,
      source: 'package-bin',
      command: `node ${localBinPath}`,
      localBinPath,
      detectionError: pathDetection.error ? pathDetection.error.message : null,
    };
  }

  return {
    isAvailable: false,
    source: 'missing',
    command: null,
    localBinPath,
    detectionError: pathDetection.error
      ? pathDetection.error.message
      : (pathDetection.stderr || pathDetection.stdout || 'ascx binary was not detected').trim(),
  };
}

export async function checkAscxTeeReadiness(targetDirectoryPath, options = {}) {
  const shouldWriteProbe = options.writeProbe === true;
  const stateDirectoryPath = path.join(targetDirectoryPath, '.agent-context', 'state');
  const teeDirectoryPath = path.join(stateDirectoryPath, 'token-saver', 'tee');

  try {
    if (shouldWriteProbe) {
      await fs.mkdir(teeDirectoryPath, { recursive: true });
      const probeFilePath = path.join(teeDirectoryPath, `.ascx-probe-${process.pid}.tmp`);
      await fs.writeFile(probeFilePath, 'ascx tee probe\n', 'utf8');
      await fs.rm(probeFilePath, { force: true });
    } else {
      await fs.access(stateDirectoryPath);
    }

    return {
      status: 'writable',
      path: teeDirectoryPath,
      error: null,
    };
  } catch (readinessError) {
    return {
      status: 'not-writable',
      path: teeDirectoryPath,
      error: readinessError instanceof Error ? readinessError.message : String(readinessError),
    };
  }
}

export function resolveRuntimeTokenSaverMode({
  tokenOptimizationState,
  ascxDetection,
  rtkDetection,
}) {
  const stateEnabled = tokenOptimizationState?.enabled === true;
  const rtkDetected = rtkDetection?.isAvailable === true;

  if (stateEnabled && ascxDetection?.isAvailable && rtkDetected) {
    return 'conflict-risk';
  }

  if (stateEnabled && ascxDetection?.isAvailable) {
    return 'runtime-on';
  }

  if (stateEnabled) {
    return 'policy-only';
  }

  if (rtkDetected) {
    return 'external-runtime-detected';
  }

  return 'runtime-off';
}

export function buildRuntimeTokenSaverWarnings({
  mode,
  onboardingReport,
  ascxDetection,
  teeReadiness,
  rtkDetection,
}) {
  const warnings = [];

  if (!onboardingReport) {
    warnings.push('project is not initialized; run init before enabling runtime token saving');
  }

  if (!ascxDetection?.isAvailable) {
    warnings.push('ascx binary is missing; supported commands will not be compressed');
  }

  if (teeReadiness?.status !== 'writable') {
    warnings.push('raw tee folder is not writable; failing commands may lose safety logs');
  }

  if (mode === 'conflict-risk') {
    warnings.push('ASCX and an external runtime compressor both appear active; avoid double compression');
  } else if (rtkDetection?.isAvailable) {
    warnings.push('external runtime compressor detected; keep only one runtime compressor enabled by default');
  }

  return warnings;
}

export function buildRuntimeTokenSaverNextAction({ mode, warnings }) {
  if (warnings.some((warning) => warning.includes('not initialized'))) {
    return 'Run agentic-senior-core init before enabling ASCX runtime saving.';
  }

  if (warnings.some((warning) => warning.includes('tee folder'))) {
    return 'Fix .agent-context/state write access, then rerun optimize doctor.';
  }

  if (mode === 'conflict-risk') {
    return 'Disable either ASCX runtime saving or the external compressor before using compressed command output.';
  }

  if (mode === 'runtime-on') {
    return 'Use ascx git status and ascx npm test for supported high-volume command output.';
  }

  if (mode === 'policy-only') {
    return 'Install or expose the ascx binary, then rerun optimize doctor.';
  }

  return 'Run agentic-senior-core optimize install to enable ASCX guidance for this repository.';
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
    outputFoldingStrategy: {
      ...OUTPUT_FOLDING_STRATEGY,
      appliesTo: [...OUTPUT_FOLDING_STRATEGY.appliesTo],
      preserveAlways: [...OUTPUT_FOLDING_STRATEGY.preserveAlways],
      foldByDefault: [...OUTPUT_FOLDING_STRATEGY.foldByDefault],
      nativeFallback: [...OUTPUT_FOLDING_STRATEGY.nativeFallback],
      safetyBoundary: [...OUTPUT_FOLDING_STRATEGY.safetyBoundary],
    },
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
    '- Use ascx git status and ascx npm test when the ascx binary is available.',
    '- Use command variants with bounded output such as git diff --stat, rg --max-count, and npm test -- --reporter=dot.',
    '- Request only the lines or sections required for the current decision.',
    '- If shell output is still large, summarize and continue iteratively instead of dumping full logs.',
  ];

  const outputFoldingStrategy = tokenOptimizationState.outputFoldingStrategy || OUTPUT_FOLDING_STRATEGY;
  const outputFoldingLines = [
    `- Mode: ${outputFoldingStrategy.mode || OUTPUT_FOLDING_STRATEGY.mode}.`,
    `- Preserve always: ${(outputFoldingStrategy.preserveAlways || OUTPUT_FOLDING_STRATEGY.preserveAlways).join(', ')}.`,
    `- Fold by default: ${(outputFoldingStrategy.foldByDefault || OUTPUT_FOLDING_STRATEGY.foldByDefault).join(', ')}.`,
    `- Safety boundary: ${(outputFoldingStrategy.safetyBoundary || OUTPUT_FOLDING_STRATEGY.safetyBoundary).join(', ')}.`,
  ];

  return [
    `Token optimization mode is enabled for agent: ${tokenOptimizationState.selectedAgent}.`,
    `Preferred shell proxy: ${tokenOptimizationState.preferredShellProxy}.`,
    '',
    'Apply command rewrites before running verbose shell commands:',
    ...rewriteLines,
    '',
    'Important scope note:',
    '- ASCX wrappers are explicit local command wrappers, not provider gateways.',
    '- Shell rewrite hooks affect shell tool calls only.',
    '- Built-in read/grep/glob style tools may bypass shell rewrites, so explicit compact shell commands should be preferred in high-volume sessions.',
    '',
    'Output folding policy:',
    ...outputFoldingLines,
    '',
    'Fallback behavior when external proxy is unavailable:',
    ...fallbackGuidance,
  ].join('\n');
}
