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

async function copyDirRecursive(src, dest, ignoreNames = []) {
  await fs.mkdir(dest, { recursive: true });
  const entries = await fs.readdir(src, { withFileTypes: true });
  for (const entry of entries) {
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
  const hooksSource = path.join(REPOSITORY_ROOT, '.agents', 'plugins', 'agentic-senior-core', 'hooks.json');
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
  await copyDirRecursive(pluginSource, pluginTarget);

  // Copy direct plugin bundle to ~/.codex/plugins/agentic-senior-core/ for instant Codex discovery
  await fs.mkdir(codexDirectPluginTarget, { recursive: true });
  await copyDirRecursive(singlePluginSource, codexDirectPluginTarget);

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

async function installAntigravityIde(target) {
  const pluginSource = path.join(REPOSITORY_ROOT, target.pluginSourcePath);
  const rulesSource = path.join(REPOSITORY_ROOT, target.rulesSourcePath);
  const pluginTargetPath = target.pluginTargetPath();
  const cliTargetPath = path.join(HOME, '.gemini', 'antigravity-cli', 'plugins', 'agentic-senior-core');

  if (!(await pathExists(pluginSource)) || !(await pathExists(rulesSource))) {
    console.error(`  ${target.label}: plugin source not found ... FAIL`);
    return false;
  }

  // Filter out .codex-plugin and .app.json so ~/.gemini/ remains 100% clean without Codex-specific files/folders
  await fs.mkdir(path.dirname(pluginTargetPath), { recursive: true });
  await copyDirRecursive(pluginSource, pluginTargetPath, ['.codex-plugin', '.app.json']);
  
  await fs.mkdir(path.dirname(cliTargetPath), { recursive: true });
  await copyDirRecursive(pluginSource, cliTargetPath, ['.codex-plugin', '.app.json']);

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

  // Antigravity CLI also uses a different hooks.json schema:
  // IDE format: { "hooks": { "PreToolUse": [...] } }
  // CLI format: { "hook-name": { "PreToolUse": [...] } }
  // Convert and add CLI plugin path to command fallback chains.
  await convertHooksForCli(cliTargetPath);

  console.log(`  ${target.label}: ${pluginTargetPath} + ${cliTargetPath} ... OK`);
  return true;
}

/**
 * Convert IDE-format hooks.json to Antigravity CLI format.
 * IDE wraps everything under a "hooks" key; CLI uses named hook keys.
 * Also strips commandWindows (not used on Linux/WSL) and patches
 * command fallback chains to include the CLI plugin path.
 */
async function convertHooksForCli(cliPluginDir) {
  const hooksPath = path.join(cliPluginDir, 'hooks.json');
  if (!(await pathExists(hooksPath))) return;

  const raw = JSON.parse(await fs.readFile(hooksPath, 'utf8'));
  const ideHooks = raw.hooks || raw;

  // CLI path for the hook script fallback chain
  const cliHooksBase = path.join(HOME, '.gemini', 'antigravity-cli', 'plugins', 'agentic-senior-core', 'hooks');

  const cliHooks = {};
  let hookIndex = 0;

  for (const [eventName, eventEntries] of Object.entries(ideHooks)) {
    const entries = Array.isArray(eventEntries) ? eventEntries : [eventEntries];

    for (const entry of entries) {
      hookIndex++;
      const hookName = `asc-${eventName.toLowerCase()}-${hookIndex}`;

      // Entry might be a hook config directly or a matcher+hooks wrapper
      const hookItems = entry.hooks || [entry];
      const convertedItems = hookItems.map(item => {
        const converted = { type: item.type || 'command', timeout: item.timeout || 10 };
        if (item.statusMessage) {
          converted.statusMessage = item.statusMessage;
        }
        // Patch command to include CLI plugin path in fallback chain
        if (item.command) {
          converted.command = patchCommandForCliPath(item.command, cliHooksBase);
        }
        return converted;
      });

      const cliEntry = { [eventName]: [{ hooks: convertedItems }] };
      if (entry.matcher) {
        cliEntry[eventName][0].matcher = entry.matcher;
      }
      if (entry.if) {
        cliEntry[eventName][0].if = entry.if;
      }

      cliHooks[hookName] = cliEntry;
    }
  }

  await fs.writeFile(hooksPath, JSON.stringify(cliHooks, null, 2) + '\n', 'utf8');
}

/**
 * Add ~/.gemini/antigravity-cli/plugins/agentic-senior-core/hooks/ to the
 * require() fallback chain in hook commands. The original commands only check
 * local .agents/, ~/.agents/, and ~/.gemini/config/ paths — CLI path is missing.
 */
function patchCommandForCliPath(command, cliHooksBase) {
  // The hook commands use a pattern like:
  // const g2=p.join(os.homedir(),'.gemini','config','plugins','agentic-senior-core','hooks','<script>');
  // require(fs.existsSync(local)?local:(fs.existsSync(g1)?g1:g2));
  //
  // Add g3 for CLI path after g2:
  const g2Pattern = /const g2=p\.join\(os\.homedir\(\),'\.gemini','config','plugins','agentic-senior-core','hooks','([^']+)'\);/;
  const match = command.match(g2Pattern);
  if (!match) return command;

  const scriptName = match[1];
  const cliPathNormalized = cliHooksBase.replace(/\\/g, '/');

  // Add g3 variable and update require chain
  const g3Def = `const g3=p.join(os.homedir(),'.gemini','antigravity-cli','plugins','agentic-senior-core','hooks','${scriptName}');`;
  const patched = command
    .replace(
      `require(fs.existsSync(local)?local:(fs.existsSync(g1)?g1:g2));`,
      `${g3Def}require(fs.existsSync(local)?local:(fs.existsSync(g1)?g1:(fs.existsSync(g2)?g2:g3)));`
    );

  return patched;
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

  // Automatically setup global Git hook runner in ~/.asc/hooks and configure git config --global core.hooksPath
  try {
    const { execSync } = await import('node:child_process');
    const { generatePreCommitRunnerScript } = await import('./git-hook-generator.mjs');

    const ascGlobalHooksDir = path.join(HOME, '.asc', 'hooks');
    await fs.mkdir(ascGlobalHooksDir, { recursive: true });

    const globalRunnerPath = path.join(ascGlobalHooksDir, 'pre-commit-runner.cjs');
    const runnerContent = generatePreCommitRunnerScript();
    await fs.writeFile(globalRunnerPath, runnerContent, { encoding: 'utf8', mode: 0o755 });

    const globalHookPath = path.join(ascGlobalHooksDir, 'pre-commit');
    const hookContent = `#!/bin/sh\n# Agentic Senior Core Global Git Pre-Commit Hook\nnode "${globalRunnerPath.replace(/\\/g, '/')}"\n`;
    await fs.writeFile(globalHookPath, hookContent, { encoding: 'utf8', mode: 0o755 });

    execSync(`git config --global core.hooksPath "${ascGlobalHooksDir.replace(/\\/g, '/')}"`, { stdio: 'ignore' });
    console.log(`  Global Git Pre-Commit Hook: ~/.asc/hooks (via git config --global) ... OK`);
  } catch (err) {
    // Best effort global git hook registration
  }

  console.log(`\nInstalled ${successCount}/${requestedTargets.length} global target(s) and configured Global Git Hook.`);
}
