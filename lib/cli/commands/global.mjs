import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import { fileURLToPath } from 'node:url';
import { installGlobalGitPreCommitHook } from './git-hook-generator.mjs';

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
    kind: 'roo-global',
    rulesSourcePath: '.agents/plugins/agentic-senior-core/rules/agentic-senior-core.md',
    skillsSourcePath: '.agents/plugins/agentic-senior-core/skills',
    targetPath: () => path.join(HOME, '.roo', 'rules', 'agentic-senior-core.md'),
    skillsTargetPath: () => path.join(HOME, '.roo', 'skills'),
    note: 'Installs global rules to ~/.roo/rules/ and skills to ~/.roo/skills/.',
  },
  kilocode: {
    label: 'Kilo Code',
    kind: 'kilo-global',
    rulesSourcePath: '.agents/plugins/agentic-senior-core/rules/agentic-senior-core.md',
    pluginSourcePath: 'lib/kilo-plugin/agentic-senior-core.js',
    targetPath: () => path.join(HOME, '.config', 'kilo', 'rules', 'agentic-senior-core.md'),
    legacyTargetPath: () => path.join(HOME, '.kilocode', 'rules', 'agentic-senior-core.md'),
    pluginTargetPath: () => path.join(HOME, '.config', 'kilo', 'plugin', 'agentic-senior-core.js'),
    note: 'Installs global plugin to ~/.config/kilo/plugin/ and rules to ~/.config/kilo/rules/.',
  },
  opencode: {
    label: 'OpenCode',
    kind: 'opencode-global',
    rulesSourcePath: '.agents/plugins/agentic-senior-core/rules/agentic-senior-core.md',
    pluginSourcePath: 'lib/opencode-plugin/agentic-senior-core.js',
    skillsSourcePath: '.agents/plugins/agentic-senior-core/skills',
    targetPath: () => path.join(HOME, '.config', 'opencode', 'AGENTS.md'),
    pluginTargetPath: () => path.join(HOME, '.config', 'opencode', 'plugins', 'agentic-senior-core.js'),
    skillsTargetPath: () => path.join(HOME, '.config', 'opencode', 'skills'),
    note: 'Installs global rules to ~/.config/opencode/AGENTS.md, plugin to plugins/, and skills.',
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
  { label: 'Cursor', hint: 'Settings > Rules > User Rules: paste the contents of .agents/plugins/agentic-senior-core/rules/agentic-senior-core.md (plain text only, no global rules file support).' },
  { label: 'Zed', hint: 'Rules Library (Agent Panel): create a rule from .agents/plugins/agentic-senior-core/rules/agentic-senior-core.md and mark it as default (paper clip icon).' },
  { label: 'Continue', hint: 'Global config.yaml: add a rules block referencing .agents/plugins/agentic-senior-core/rules/agentic-senior-core.md content.' },
  { label: 'Aider', hint: `~/.aider.conf.yml: add "read: ${path.join(REPOSITORY_ROOT, '.agents', 'plugins', 'agentic-senior-core', 'rules', 'agentic-senior-core.md')}" (absolute path auto-updates with npm).` },
];

async function pathExists(filePath) {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

async function copyDirRecursive(src, dest, ignoreNames = []) {
  await fs.mkdir(dest, { recursive: true });
  const srcEntries = await fs.readdir(src, { withFileTypes: true });
  const srcNames = srcEntries.map(e => e.name);

  // Prune stale files or directories in dest that no longer exist in src
  const destEntries = await fs.readdir(dest, { withFileTypes: true });
  for (const destEntry of destEntries) {
    if (ignoreNames.includes(destEntry.name)) continue;
    if (!srcNames.includes(destEntry.name)) {
      const destPath = path.join(dest, destEntry.name);
      await fs.rm(destPath, { recursive: true, force: true });
    }
  }

  for (const entry of srcEntries) {
    if (ignoreNames.includes(entry.name)) continue;
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);
    if (entry.isDirectory()) {
      await copyDirRecursive(srcPath, destPath, ignoreNames);
    } else {
      await fs.copyFile(srcPath, destPath);
    }
  }
}

async function ensureCodexConfigEnabled() {
  const configPath = path.join(HOME, '.codex', 'config.toml');
  const agentsPluginsDir = path.join(HOME, '.agents', 'plugins').replace(/\\/g, '/');
  try {
    let content = '';
    if (await pathExists(configPath)) {
      content = await fs.readFile(configPath, 'utf8');
    }
    
    let additions = '';

    if (!content.includes('[plugins."agentic-senior-core"]')) {
      additions += `\n[plugins."agentic-senior-core"]\nenabled = true\n`;
    }

    if (!content.includes('agentic-senior-core-marketplace')) {
      additions += `\n[marketplaces."agentic-senior-core-marketplace"]\nsource = "local"\npath = "${agentsPluginsDir}"\n`;
    }

    if (additions) {
      await fs.mkdir(path.dirname(configPath), { recursive: true });
      await fs.appendFile(configPath, additions, 'utf8');
    }
  } catch {
    // Best-effort config registration
  }
}

async function installCodexGlobal(target) {
  const rulesSource = path.join(REPOSITORY_ROOT, target.rulesSourcePath);
  const pluginSource = path.join(REPOSITORY_ROOT, target.pluginSourcePath);
  const hooksSource = path.join(REPOSITORY_ROOT, '.agents', 'plugins', 'agentic-senior-core', 'hooks', 'hooks.json');
  const singlePluginSource = path.join(REPOSITORY_ROOT, '.agents', 'plugins', 'agentic-senior-core');
  const rulesTarget = target.targetPath(); // ~/.codex/AGENTS.md
  const hooksTarget = path.join(HOME, '.codex', 'hooks.json');
  const pluginTarget = target.pluginTargetPath(); // ~/.agents/plugins
  const codexDirectPluginTarget = path.join(HOME, '.codex', 'plugins', 'agentic-senior-core');

  if (!(await pathExists(rulesSource)) || !(await pathExists(path.join(REPOSITORY_ROOT, '.agents')))) {
    console.error(`  ${target.label}: source not found ... FAIL`);
    return false;
  }

  // Copy global AGENTS.md instructions (~/.codex/AGENTS.md)
  await fs.mkdir(path.dirname(rulesTarget), { recursive: true });
  await fs.copyFile(rulesSource, rulesTarget);

  // Copy global hooks file (~/.codex/hooks.json) so Codex Settings -> Hooks tab detects it natively
  if (await pathExists(hooksSource)) {
    await fs.mkdir(path.dirname(hooksTarget), { recursive: true });
    await fs.copyFile(hooksSource, hooksTarget);
  }

  // Copy plugin bundle & marketplace catalog (~/.agents/plugins/)
  await fs.mkdir(pluginTarget, { recursive: true });
  await copyDirRecursive(pluginSource, pluginTarget, ['kilo-plugin']);

  // Copy direct plugin bundle to ~/.codex/plugins/agentic-senior-core/ for instant Codex discovery
  await fs.mkdir(codexDirectPluginTarget, { recursive: true });
  await copyDirRecursive(singlePluginSource, codexDirectPluginTarget, ['kilo-plugin']);

  // Clean up legacy kilo-plugin folder if present in Codex targets
  const legacyKiloCodex1 = path.join(pluginTarget, 'agentic-senior-core', 'kilo-plugin');
  const legacyKiloCodex2 = path.join(codexDirectPluginTarget, 'kilo-plugin');
  if (await pathExists(legacyKiloCodex1)) await fs.rm(legacyKiloCodex1, { recursive: true, force: true });
  if (await pathExists(legacyKiloCodex2)) await fs.rm(legacyKiloCodex2, { recursive: true, force: true });

  // Clean up standalone skill directories so skills remain 100% unified inside the plugin bundle
  const agentsSkillsTarget = path.join(HOME, '.agents', 'skills');
  const codexSkillsTarget = path.join(HOME, '.codex', 'skills');
  if (await pathExists(agentsSkillsTarget)) {
    await fs.rm(agentsSkillsTarget, { recursive: true, force: true });
  }
  if (await pathExists(codexSkillsTarget)) {
    await fs.rm(codexSkillsTarget, { recursive: true, force: true });
  }

  // Register enabled = true in ~/.codex/config.toml
  await ensureCodexConfigEnabled();

  console.log(`  ${target.label}: ${rulesTarget}, ${hooksTarget}, ${codexDirectPluginTarget} & ${pluginTarget} ... OK`);
  return true;
}

async function installKiloGlobal(target) {
  const rulesSource = path.join(REPOSITORY_ROOT, target.rulesSourcePath);
  const pluginSource = path.join(REPOSITORY_ROOT, target.pluginSourcePath);
  const rulesTarget = target.targetPath();
  const pluginTarget = target.pluginTargetPath();
  const legacyRulesTarget = target.legacyTargetPath();

  if (!(await pathExists(rulesSource))) {
    console.error(`  ${target.label}: rules source not found ... FAIL`);
    return false;
  }

  await fs.mkdir(path.dirname(rulesTarget), { recursive: true });
  await fs.copyFile(rulesSource, rulesTarget);

  await fs.mkdir(path.dirname(legacyRulesTarget), { recursive: true });
  await fs.copyFile(rulesSource, legacyRulesTarget);

  if (await pathExists(pluginSource)) {
    await fs.mkdir(path.dirname(pluginTarget), { recursive: true });
    await fs.copyFile(pluginSource, pluginTarget);
  }

  const skillsSource = path.join(REPOSITORY_ROOT, '.agents', 'plugins', 'agentic-senior-core', 'skills');
  const globalSkillsTarget = path.join(HOME, '.kilo', 'skills');
  if (await pathExists(skillsSource)) {
    await copyDirRecursive(skillsSource, globalSkillsTarget);
  }

  if (process.env.APPDATA) {
    const appDataKiloPlugin = path.join(process.env.APPDATA, 'kilo', 'plugin', 'agentic-senior-core.js');
    const appDataKiloRules = path.join(process.env.APPDATA, 'kilo', 'rules', 'agentic-senior-core.md');
    try {
      if (await pathExists(pluginSource)) {
        await fs.mkdir(path.dirname(appDataKiloPlugin), { recursive: true });
        await fs.copyFile(pluginSource, appDataKiloPlugin);
      }
      await fs.mkdir(path.dirname(appDataKiloRules), { recursive: true });
      await fs.copyFile(rulesSource, appDataKiloRules);
    } catch (_) {}
  }

  console.log(`  ${target.label}: ${rulesTarget}, ${pluginTarget} & ${globalSkillsTarget} ... OK`);
  return true;
}

async function installRooGlobal(target) {
  const rulesSource = path.join(REPOSITORY_ROOT, target.rulesSourcePath);
  const skillsSource = path.join(REPOSITORY_ROOT, target.skillsSourcePath);
  const rulesTarget = target.targetPath();
  const skillsTarget = target.skillsTargetPath();

  if (!(await pathExists(rulesSource))) {
    console.error(`  ${target.label}: rules source not found ... FAIL`);
    return false;
  }

  await fs.mkdir(path.dirname(rulesTarget), { recursive: true });
  await fs.copyFile(rulesSource, rulesTarget);

  if (await pathExists(skillsSource)) {
    await copyDirRecursive(skillsSource, skillsTarget);
  }

  console.log(`  ${target.label}: ${rulesTarget} & ${skillsTarget} ... OK`);
  return true;
}

async function installOpenCodeGlobal(target) {
  const rulesSource = path.join(REPOSITORY_ROOT, target.rulesSourcePath);
  const pluginSource = path.join(REPOSITORY_ROOT, target.pluginSourcePath);
  const skillsSource = path.join(REPOSITORY_ROOT, target.skillsSourcePath);
  const rulesTarget = target.targetPath();
  const pluginTarget = target.pluginTargetPath();
  const skillsTarget = target.skillsTargetPath();

  if (!(await pathExists(rulesSource))) {
    console.error(`  ${target.label}: rules source not found ... FAIL`);
    return false;
  }

  await fs.mkdir(path.dirname(rulesTarget), { recursive: true });
  await fs.copyFile(rulesSource, rulesTarget);

  if (await pathExists(pluginSource)) {
    await fs.mkdir(path.dirname(pluginTarget), { recursive: true });
    await fs.copyFile(pluginSource, pluginTarget);
  }

  if (await pathExists(skillsSource)) {
    await copyDirRecursive(skillsSource, skillsTarget);
  }

  console.log(`  ${target.label}: ${rulesTarget}, ${pluginTarget} & ${skillsTarget} ... OK`);
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

  // Filter out .codex-plugin, kilo-plugin, and .app.json so ~/.gemini/ remains 100% clean without Codex/Kilo-specific files/folders
  await fs.mkdir(path.dirname(pluginTargetPath), { recursive: true });
  await copyDirRecursive(pluginSource, pluginTargetPath, ['.codex-plugin', '.app.json', 'kilo-plugin']);
  
  await fs.mkdir(path.dirname(cliTargetPath), { recursive: true });
  await copyDirRecursive(pluginSource, cliTargetPath, ['.codex-plugin', '.app.json', 'kilo-plugin']);

  const legacyKilo1 = path.join(pluginTargetPath, 'kilo-plugin');
  const legacyKilo2 = path.join(cliTargetPath, 'kilo-plugin');
  if (await pathExists(legacyKilo1)) await fs.rm(legacyKilo1, { recursive: true, force: true });
  if (await pathExists(legacyKilo2)) await fs.rm(legacyKilo2, { recursive: true, force: true });

  // Antigravity CLI enforces strict plugin.json schema (additionalProperties: false).
  // Only name, description, $schema are valid. Extra fields (version, rules, skills, hooks)
  // cause the CLI to reject the entire plugin — hooks.json never loads.
  // Overwrite CLI copy with minimal manifest; IDE copy keeps the full one.
  const cliManifest = {
    $schema: 'https://antigravity.google/schemas/v1/plugin.json',
    name: 'agentic-senior-core',
    description: 'Universal AI coding rules. Write code like a staff engineer.',
  };
  await fs.writeFile(
    path.join(cliTargetPath, 'plugin.json'),
    JSON.stringify(cliManifest, null, 2) + '\n',
    'utf8'
  );

  // Remove legacy global hooks.json entries (~/.gemini/config/hooks.json & ~/.gemini/antigravity-cli/hooks.json)
  // because Antigravity executes hooks with cwd set to the directory containing hooks.json, and automatically
  // discovers hooks.json inside ~/.gemini/config/plugins/agentic-senior-core/hooks.json without duplicate firing.
  await cleanupLegacyGlobalAntigravityHooks();

  // Automatically register the plugin with Antigravity CLI if agy binary is available
  try {
    const { execSync } = await import('node:child_process');
    const agyBin = await findAgyBinaryPath();
    execSync(`"${agyBin}" plugin install "${cliTargetPath}"`, { stdio: 'ignore' });
  } catch (_) {
    // Best effort agy plugin registration
  }

  console.log(`  ${target.label}: ${pluginTargetPath} + ${cliTargetPath} ... OK`);
  return true;
}

async function cleanupLegacyGlobalAntigravityHooks() {
  const globalHooksPath = path.join(HOME, '.gemini', 'config', 'hooks.json');
  const legacyCliHooksPath = path.join(HOME, '.gemini', 'antigravity-cli', 'hooks.json');

  if (await pathExists(legacyCliHooksPath)) {
    try {
      await fs.rm(legacyCliHooksPath, { force: true });
    } catch (_) {}
  }

  if (await pathExists(globalHooksPath)) {
    try {
      const existingConfig = JSON.parse(await fs.readFile(globalHooksPath, 'utf8'));
      if (existingConfig && typeof existingConfig === 'object' && 'agentic-senior-core' in existingConfig) {
        delete existingConfig['agentic-senior-core'];
        if (Object.keys(existingConfig).length === 0) {
          await fs.rm(globalHooksPath, { force: true });
        } else {
          await fs.writeFile(globalHooksPath, JSON.stringify(existingConfig, null, 2) + '\n', 'utf8');
        }
      }
    } catch (_) {}
  }
}

async function findAgyBinaryPath() {
  const candidates = [
    // Windows AppData path
    path.join(HOME, 'AppData', 'Local', 'agy', 'bin', 'agy.exe'),
    path.join(HOME, 'AppData', 'Local', 'Programs', 'Antigravity', 'bin', 'agy.exe'),
    // Linux/WSL paths
    path.join(HOME, '.local', 'share', 'agy', 'bin', 'agy'),
    path.join(HOME, '.local', 'bin', 'agy'),
    path.join(HOME, '.gemini', 'antigravity-cli', 'bin', 'agy'),
    path.join(HOME, '.antigravity', 'bin', 'agy'),
  ];
  for (const candidate of candidates) {
    if (await pathExists(candidate)) return candidate;
  }
  return 'agy';
}

async function installGlobalTarget(targetKey) {
  const target = GLOBAL_TARGETS[targetKey];

  if (target.kind === 'antigravity-ide') {
    return await installAntigravityIde(target);
  }

  if (target.kind === 'codex-global') {
    return await installCodexGlobal(target);
  }

  if (target.kind === 'kilo-global') {
    return await installKiloGlobal(target);
  }

  if (target.kind === 'roo-global') {
    return await installRooGlobal(target);
  }

  if (target.kind === 'opencode-global') {
    return await installOpenCodeGlobal(target);
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

export async function detectInstalledGlobalTargets() {
  const isWin = process.platform === 'win32';
  const { resolveWindowsExecutable } = await import('../ascx/windows-spawn.mjs');
  const { execSync } = await import('node:child_process');

  const hasBinary = (cmd) => {
    if (isWin) {
      return Boolean(resolveWindowsExecutable(cmd, process.env, process.cwd()));
    }
    try {
      execSync(`command -v ${cmd}`, { stdio: 'ignore' });
      return true;
    } catch {
      return false;
    }
  };

  const checks = {
    antigravity: async () => (await pathExists(path.join(HOME, '.gemini'))) || hasBinary('agy'),
    codex: async () => (await pathExists(path.join(HOME, '.codex'))) || hasBinary('codex'),
    opencode: async () => (await pathExists(path.join(HOME, '.config', 'opencode')))
      || (await pathExists(path.join(HOME, '.opencode')))
      || hasBinary('opencode'),
    roo: async () => await pathExists(path.join(HOME, '.roo')),
    kilocode: async () => (await pathExists(path.join(HOME, '.config', 'kilo')))
      || (await pathExists(path.join(HOME, '.kilo')))
      || (await pathExists(path.join(HOME, '.kilocode')))
      || (process.env.APPDATA ? await pathExists(path.join(process.env.APPDATA, 'kilo')) : false)
      || hasBinary('kilo'),
    cline: async () => (await pathExists(path.join(HOME, '.cline')))
      || (await pathExists(path.join(HOME, 'Documents', 'Cline'))),
    kiro: async () => await pathExists(path.join(HOME, '.kiro')),
    openhands: async () => (await pathExists(path.join(HOME, '.openhands'))) || hasBinary('openhands'),
    windsurf: async () => (await pathExists(path.join(HOME, '.windsurf')))
      || (await pathExists(path.join(HOME, '.codeium')))
      || (isWin ? await pathExists(path.join(HOME, 'AppData', 'Roaming', 'Windsurf')) : false),
    copilot: async () => (await pathExists(path.join(HOME, '.config', 'github-copilot')))
      || (isWin ? await pathExists(path.join(HOME, 'AppData', 'Local', 'GitHub Copilot')) : false)
      || (await pathExists(path.dirname(vscodeUserPromptsDirectory()))),
  };

  const detected = [];
  for (const [key, check] of Object.entries(checks)) {
    if (GLOBAL_TARGETS[key] && (await check())) {
      detected.push(key);
    }
  }
  return detected;
}

function printGlobalHelp() {
  console.log('Agentic Senior Core -- Global Rules Installer\n');
  console.log('Usage:');
  console.log('  asc global              Auto-detect installed AI tools and install globally');
  console.log('  asc global --all        Install to all supported global targets');
  console.log('  asc global --<target>   Install to specific target(s)\n');
  console.log('Supported automatic global targets:');
  for (const [key, target] of Object.entries(GLOBAL_TARGETS)) {
    console.log(`  --${key.padEnd(14)} ${target.label} (${target.note})`);
  }
  console.log('\nManual global setup tools:');
  for (const manual of MANUAL_TARGETS) {
    console.log(`  ${manual.label.padEnd(16)} ${manual.hint}`);
  }
}

export async function runGlobalCommand(commandArguments = []) {
  if (commandArguments.includes('--help') || commandArguments.includes('-h')) {
    printGlobalHelp();
    return;
  }

  const requestedTargets = [];

  for (const argument of commandArguments) {
    if (argument === '--all') {
      requestedTargets.push(...Object.keys(GLOBAL_TARGETS));
      break;
    }

    const targetKey = argument.replace(/^--/, '');
    if (GLOBAL_TARGETS[targetKey]) {
      requestedTargets.push(targetKey);
    } else if (argument.startsWith('-')) {
      console.error(`Unknown global target: ${argument}`);
      console.log(`Available targets: ${Object.keys(GLOBAL_TARGETS).map(k => `--${k}`).join(', ')}, --all`);
      process.exit(1);
    } else {
      console.error(`Unknown global target: ${argument}`);
      console.log(`Available targets: ${Object.keys(GLOBAL_TARGETS).map(k => `--${k}`).join(', ')}, --all`);
      process.exit(1);
    }
  }

  if (requestedTargets.length === 0) {
    const autoDetected = await detectInstalledGlobalTargets();
    if (autoDetected.length === 0) {
      printGlobalHelp();
      return;
    }
    console.log(`Auto-detected ${autoDetected.length} installed AI host(s): ${autoDetected.join(', ')}\n`);
    requestedTargets.push(...autoDetected);
  }

  console.log('Installing global rules...\n');
  let successCount = 0;

  for (const targetKey of requestedTargets) {
    const success = await installGlobalTarget(targetKey);
    if (success) successCount++;
  }

  // Automatically configure Smart Global Git Hook dispatcher in ~/.asc/global-hooks
  try {
    const hookResult = installGlobalGitPreCommitHook();
    if (hookResult.installed) {
      console.log(`  Global Git Pre-Commit Hook: ~/.asc/global-hooks (via git config --global) ... OK`);
    }
  } catch (_) {
    // Best effort global git hook registration
  }

  console.log(`\nInstalled ${successCount}/${requestedTargets.length} global target(s) and configured Global Git Hook.`);
}
