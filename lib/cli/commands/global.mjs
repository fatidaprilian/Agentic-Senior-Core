import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import { fileURLToPath } from 'node:url';

const currentFilePath = fileURLToPath(import.meta.url);
const currentDirectoryPath = path.dirname(currentFilePath);
const REPOSITORY_ROOT = path.resolve(currentDirectoryPath, '..', '..', '..');
const HOME = os.homedir();

const ASC_MARKER = '# Agentic Senior Core';

function vscodeUserPromptsDirectory() {
  if (process.platform === 'win32') {
    return path.join(process.env.APPDATA ?? path.join(HOME, 'AppData', 'Roaming'), 'Code', 'User', 'prompts');
  }
  if (process.platform === 'darwin') {
    return path.join(HOME, 'Library', 'Application Support', 'Code', 'User', 'prompts');
  }
  return path.join(HOME, '.config', 'Code', 'User', 'prompts');
}

const GLOBAL_TARGETS = {
  antigravity: {
    label: 'Google Antigravity (2.0, IDE, CLI)',
    kind: 'antigravity-ide',
    pluginSourcePath: '.agents/plugins/agentic-senior-core',
    rulesSourcePath: '.agents/plugins/agentic-senior-core/rules/agentic-senior-core.md',
    pluginTargetPath: () => path.join(HOME, '.gemini', 'config', 'plugins', 'agentic-senior-core'),
    rulesTargetPath: () => path.join(HOME, '.gemini', 'GEMINI.md'),
    targetPath: () => path.join(HOME, '.gemini', 'config', 'plugins', 'agentic-senior-core'),
    note: 'Plugin bundle (rules + skills) in ~/.gemini/config/plugins/.',
  },
  codex: {
    label: 'Codex CLI / Extension',
    kind: 'codex-global',
    rulesSourcePath: '.agents/plugins/agentic-senior-core/rules/agentic-senior-core.md',
    pluginSourcePath: '.agents/plugins',
    targetPath: () => path.join(HOME, '.codex', 'AGENTS.md'),
    pluginTargetPath: () => path.join(HOME, '.agents', 'plugins'),
    note: 'Installs global rules to ~/.codex/AGENTS.md and plugin marketplace to ~/.agents/plugins/.',
  },
  cline: {
    label: 'Cline',
    kind: 'file',
    sourcePath: '.agents/plugins/agentic-senior-core/rules/agentic-senior-core.md',
    targetPath: () => path.join(HOME, 'Documents', 'Cline', 'Rules', 'agentic-senior-core.md'),
    note: 'Toggleable in the Cline rules panel.',
  },
  roo: {
    label: 'Roo Code',
    kind: 'file',
    sourcePath: '.agents/plugins/agentic-senior-core/rules/agentic-senior-core.md',
    targetPath: () => path.join(HOME, '.roo', 'rules', 'agentic-senior-core.md'),
    note: 'Roo Code was discontinued in May 2026; kept for existing installs.',
  },
  kilocode: {
    label: 'Kilo Code',
    kind: 'file',
    sourcePath: '.agents/plugins/agentic-senior-core/rules/agentic-senior-core.md',
    targetPath: () => path.join(HOME, '.kilocode', 'rules', 'agentic-senior-core.md'),
    note: 'Kilo v7+: prefer adding the file path to the instructions array in ~/.config/kilo/kilo.jsonc (auto-updates with npm).',
  },
  kiro: {
    label: 'Kiro',
    kind: 'file',
    sourcePath: '.agents/plugins/agentic-senior-core/rules/agentic-senior-core.md',
    targetPath: () => path.join(HOME, '.kiro', 'steering', 'agentic-senior-core.md'),
    note: 'Global steering has known loading bugs in some Kiro builds; fall back to asc adapter --kiro if rules are not picked up.',
  },
  openhands: {
    label: 'OpenHands',
    kind: 'file',
    sourcePath: '.agents/plugins/agentic-senior-core/rules/agentic-senior-core.md',
    targetPath: () => path.join(HOME, '.openhands', 'microagents', 'agentic-senior-core.md'),
    note: 'Works in CLI/headless/dev modes. Docker runs need the directory mounted.',
  },
  windsurf: {
    label: 'Windsurf / Devin Desktop',
    kind: 'windsurf-global',
    sourcePath: '.agents/plugins/agentic-senior-core/rules/agentic-senior-core.md',
    targetPath: () => path.join(HOME, '.windsurf', 'rules', 'agentic-senior-core.md'),
    legacyTargetPath: () => path.join(HOME, '.codeium', 'windsurf', 'memories', 'global_rules.md'),
    note: 'Writes to modern ~/.windsurf/rules/ and legacy ~/.codeium/windsurf/memories/.',
  },
  copilot: {
    label: 'GitHub Copilot (VS Code)',
    kind: 'copilot-user-instructions',
    sourcePath: '.agents/plugins/agentic-senior-core/rules/agentic-senior-core.md',
    targetPath: () => path.join(vscodeUserPromptsDirectory(), 'agentic-senior-core.instructions.md'),
    note: 'Installs into the VS Code default profile. Other profiles need their own copy.',
  },
};

const MANUAL_TARGETS = [
  { label: 'Cursor', hint: 'Settings > Rules > User Rules: paste the contents of AGENTS.md (plain text only, no global rules file support).' },
  { label: 'Zed', hint: 'Rules Library (Agent Panel): create a rule from AGENTS.md and mark it as default (paper clip icon).' },
  { label: 'Continue', hint: 'Global config.yaml: add a rules block referencing AGENTS.md content.' },
  { label: 'Aider', hint: `~/.aider.conf.yml: add "read: ${path.join(REPOSITORY_ROOT, 'CONVENTIONS.md')}" (absolute path auto-updates with npm).` },
];

async function pathExists(filePath) {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

async function copyDirRecursive(src, dest) {
  await fs.mkdir(dest, { recursive: true });
  const entries = await fs.readdir(src, { withFileTypes: true });
  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);
    if (entry.isDirectory()) {
      await copyDirRecursive(srcPath, destPath);
    } else {
      await fs.copyFile(srcPath, destPath);
    }
  }
}

async function installCodexGlobal(target) {
  const rulesSource = path.join(REPOSITORY_ROOT, target.rulesSourcePath);
  const pluginSource = path.join(REPOSITORY_ROOT, target.pluginSourcePath);
  const rulesTarget = target.targetPath();
  const pluginTarget = target.pluginTargetPath();

  if (!(await pathExists(rulesSource)) || !(await pathExists(pluginSource))) {
    console.error(`  ${target.label}: source not found ... FAIL`);
    return false;
  }

  // Copy global AGENTS.md instructions (~/.codex/AGENTS.md)
  await fs.mkdir(path.dirname(rulesTarget), { recursive: true });
  await fs.copyFile(rulesSource, rulesTarget);

  // Copy plugin bundle & marketplace catalog (~/.agents/plugins/)
  await fs.mkdir(pluginTarget, { recursive: true });
  await copyDirRecursive(pluginSource, pluginTarget);

  console.log(`  ${target.label}: ${rulesTarget} & ${pluginTarget} ... OK`);
  return true;
}

async function installAntigravityIde(target) {
  const pluginSource = path.join(REPOSITORY_ROOT, target.pluginSourcePath);
  const rulesSource = path.join(REPOSITORY_ROOT, target.rulesSourcePath);
  const pluginTargetPath = target.pluginTargetPath();
  const cliTargetPath = path.join(HOME, '.gemini', 'antigravity-cli', 'plugins', 'agentic-senior-core');

  if (!(await pathExists(pluginSource)) || !(await pathExists(rulesSource))) {
    console.error(`  ${target.label}: plugin source not found ... FAIL`);
    return false;
  }

  await fs.mkdir(path.dirname(pluginTargetPath), { recursive: true });
  await copyDirRecursive(pluginSource, pluginTargetPath);
  
  await fs.mkdir(path.dirname(cliTargetPath), { recursive: true });
  await copyDirRecursive(pluginSource, cliTargetPath);

  console.log(`  ${target.label}: ${pluginTargetPath} ... OK`);
  return true;
}

async function installGlobalTarget(targetKey) {
  const target = GLOBAL_TARGETS[targetKey];

  if (target.kind === 'antigravity-ide') {
    return await installAntigravityIde(target);
  }

  if (target.kind === 'codex-global') {
    return await installCodexGlobal(target);
  }

  const sourcePath = path.join(REPOSITORY_ROOT, target.sourcePath);
  const targetPath = target.targetPath();

  if (!(await pathExists(sourcePath))) {
    console.error(`  ${target.label}: source not found (${sourcePath}) ... FAIL`);
    return false;
  }

  if (target.kind === 'windsurf-global') {
    const rawRules = await fs.readFile(sourcePath, 'utf8');
    const formattedRules = `---\ntrigger: always_on\n---\n\n${rawRules}`;
    
    await fs.mkdir(path.dirname(targetPath), { recursive: true });
    await fs.writeFile(targetPath, formattedRules, 'utf8');

    const legacyPath = target.legacyTargetPath();
    if (!await pathExists(legacyPath)) {
      await fs.mkdir(path.dirname(legacyPath), { recursive: true });
      await fs.writeFile(legacyPath, rawRules, 'utf8');
    }

    console.log(`  ${target.label}: ${targetPath} ... OK`);
    return true;
  }

  if (target.kind === 'copilot-user-instructions') {
    const rulesContent = await fs.readFile(sourcePath, 'utf8');
    const instructionsContent = `---\napplyTo: '**'\n---\n\n${rulesContent}`;
    await fs.mkdir(path.dirname(targetPath), { recursive: true });
    await fs.writeFile(targetPath, instructionsContent);
    console.log(`  ${target.label}: ${targetPath} ... OK`);
    return true;
  }

  await fs.mkdir(path.dirname(targetPath), { recursive: true });
  await fs.copyFile(sourcePath, targetPath);
  console.log(`  ${target.label}: ${targetPath} ... OK`);
  return true;
}

export async function runGlobalCommand(commandArguments) {
  const requestedTargets = [];

  for (const argument of commandArguments) {
    if (argument === '--all') {
      requestedTargets.push(...Object.keys(GLOBAL_TARGETS));
      break;
    }

    const targetKey = argument.replace(/^--/, '');
    if (GLOBAL_TARGETS[targetKey]) {
      requestedTargets.push(targetKey);
    } else if (argument.startsWith('--')) {
      console.error(`Unknown global target: ${argument}`);
      console.log(`Available targets: ${Object.keys(GLOBAL_TARGETS).map(k => `--${k}`).join(', ')}, --all`);
      process.exit(1);
    }
  }

  if (requestedTargets.length === 0) {
    console.log('Agentic Senior Core -- Global Rules Installer\n');
    console.log('Usage: asc global [--antigravity] [--codex] [--cline] [--roo] [--kilocode] [--kiro] [--openhands] [--windsurf] [--copilot] [--all]\n');
    console.log('Installs user-level global rules that apply to ALL projects.\n');
    console.log('Supported automatic global targets:');
    for (const [key, target] of Object.entries(GLOBAL_TARGETS)) {
      console.log(`  --${key.padEnd(14)} ${target.label} (${target.note})`);
    }
    console.log('\nManual global setup tools:');
    for (const manual of MANUAL_TARGETS) {
      console.log(`  ${manual.label.padEnd(16)} ${manual.hint}`);
    }
    process.exit(0);
  }

  console.log('Installing global rules...\n');
  let successCount = 0;

  for (const targetKey of requestedTargets) {
    const success = await installGlobalTarget(targetKey);
    if (success) successCount++;
  }

  console.log(`\nInstalled ${successCount}/${requestedTargets.length} global target(s).`);
}
