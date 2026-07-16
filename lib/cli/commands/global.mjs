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
    label: 'Google Antigravity IDE',
    kind: 'directory',
    sourcePath: '.agents/plugins/agentic-senior-core',
    targetPath: () => path.join(HOME, '.gemini', 'config', 'plugins', 'agentic-senior-core'),
    note: 'Full plugin bundle (rules + skills), always-on in every project.',
  },
  cline: {
    label: 'Cline',
    kind: 'file',
    sourcePath: '.clinerules/agentic-senior-core.md',
    targetPath: () => path.join(HOME, 'Documents', 'Cline', 'Rules', 'agentic-senior-core.md'),
    note: 'Toggleable in the Cline rules panel.',
  },
  roo: {
    label: 'Roo Code',
    kind: 'file',
    sourcePath: '.roo/rules/agentic-senior-core.md',
    targetPath: () => path.join(HOME, '.roo', 'rules', 'agentic-senior-core.md'),
    note: 'Roo Code was discontinued in May 2026; kept for existing installs.',
  },
  kilocode: {
    label: 'Kilo Code',
    kind: 'file',
    sourcePath: '.kilocode/rules/agentic-senior-core.md',
    targetPath: () => path.join(HOME, '.kilocode', 'rules', 'agentic-senior-core.md'),
    note: 'Kilo v7+: prefer adding the file path to the instructions array in ~/.config/kilo/kilo.jsonc (auto-updates with npm).',
  },
  kiro: {
    label: 'Kiro',
    kind: 'file',
    sourcePath: '.kiro/steering/agentic-senior-core.md',
    targetPath: () => path.join(HOME, '.kiro', 'steering', 'agentic-senior-core.md'),
    note: 'Global steering has known loading bugs in some Kiro builds; fall back to asc adapter --kiro if rules are not picked up.',
  },
  openhands: {
    label: 'OpenHands',
    kind: 'file',
    sourcePath: '.openhands/microagents/agentic-senior-core.md',
    targetPath: () => path.join(HOME, '.openhands', 'microagents', 'agentic-senior-core.md'),
    note: 'Works in CLI/headless/dev modes. Docker runs need the directory mounted.',
  },
  windsurf: {
    label: 'Windsurf / Devin Desktop',
    kind: 'guarded-file',
    sourcePath: '.windsurf/rules/agentic-senior-core.md',
    targetPath: () => path.join(HOME, '.codeium', 'windsurf', 'memories', 'global_rules.md'),
    note: 'Single global file (6,000 char limit). Skipped if you already have your own global_rules.md.',
  },
  copilot: {
    label: 'GitHub Copilot (VS Code)',
    kind: 'copilot-user-instructions',
    sourcePath: '.github/copilot-instructions.md',
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

async function installGlobalTarget(targetKey) {
  const target = GLOBAL_TARGETS[targetKey];
  const sourcePath = path.join(REPOSITORY_ROOT, target.sourcePath);
  const targetPath = target.targetPath();

  if (!(await pathExists(sourcePath))) {
    console.error(`  ${target.label}: source not found (${sourcePath}) ... FAIL`);
    return false;
  }

  if (target.kind === 'directory') {
    await fs.mkdir(path.dirname(targetPath), { recursive: true });
    await fs.cp(sourcePath, targetPath, { recursive: true, force: true });
    console.log(`  ${target.label}: ${targetPath} ... OK`);
    return true;
  }

  if (target.kind === 'guarded-file') {
    if (await pathExists(targetPath)) {
      const existingContent = await fs.readFile(targetPath, 'utf8');
      if (!existingContent.startsWith(ASC_MARKER)) {
        console.log(`  ${target.label}: existing ${path.basename(targetPath)} found (not ASC) ... SKIPPED`);
        console.log('    Append the contents of AGENTS.md manually to keep your own rules.');
        return false;
      }
    }
    await fs.mkdir(path.dirname(targetPath), { recursive: true });
    await fs.copyFile(sourcePath, targetPath);
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

function printGlobalUsage() {
  console.log('Agentic Senior Core -- Global Install\n');
  console.log('Installs rules to user-level locations. Applies to ALL projects, zero project files.\n');
  console.log('Usage: asc global [--antigravity] [--cline] [--kilocode] [--kiro] [--openhands] [--windsurf] [--copilot] [--roo] [--all]\n');
  console.log('Available targets:');
  for (const [key, target] of Object.entries(GLOBAL_TARGETS)) {
    console.log(`  --${key.padEnd(12)} ${target.label.padEnd(28)} -> ${target.targetPath()}`);
  }
  console.log('\nManual setup (no global rules file support):');
  for (const manual of MANUAL_TARGETS) {
    console.log(`  ${manual.label.padEnd(10)} ${manual.hint}`);
  }
  console.log('\nNote: these are static copies. After npm update -g, re-run asc global to refresh.');
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
      console.error(`Unknown option: ${argument}`);
      console.log(`Available targets: ${Object.keys(GLOBAL_TARGETS).map(k => `--${k}`).join(', ')}, --all`);
      process.exit(1);
    }
  }

  if (requestedTargets.length === 0) {
    printGlobalUsage();
    return;
  }

  console.log('Agentic Senior Core -- Installing global rules\n');

  let successCount = 0;
  for (const targetKey of requestedTargets) {
    const success = await installGlobalTarget(targetKey);
    if (success) successCount++;
    const note = GLOBAL_TARGETS[targetKey].note;
    if (note) console.log(`    ${note}`);
  }

  console.log(`\n${successCount}/${requestedTargets.length} global target(s) installed.`);
  console.log('Static copies do not auto-update: re-run asc global after npm update -g.');
}
