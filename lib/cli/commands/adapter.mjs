import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { installGitPreCommitHook } from './git-hook-generator.mjs';

const currentFilePath = fileURLToPath(import.meta.url);
const currentDirectoryPath = path.dirname(currentFilePath);
const REPOSITORY_ROOT = path.resolve(currentDirectoryPath, '..', '..', '..');

const ADAPTER_TARGETS = {
  cursor: {
    label: 'Cursor',
    targetPath: '.cursor/rules/agentic-senior-core.mdc',
    sourcePath: '.agents/plugins/agentic-senior-core/rules/agentic-senior-core.md',
  },
  codex: {
    label: 'Codex CLI / Extension',
    targetPath: '.codex/AGENTS.md',
    sourcePath: '.agents/plugins/agentic-senior-core/rules/agentic-senior-core.md',
  },
  windsurf: {
    label: 'Windsurf (legacy)',
    targetPath: '.windsurf/rules/agentic-senior-core.md',
    sourcePath: '.agents/plugins/agentic-senior-core/rules/agentic-senior-core.md',
  },
  devin: {
    label: 'Devin Desktop',
    targetPath: '.devin/rules/agentic-senior-core.md',
    sourcePath: '.agents/plugins/agentic-senior-core/rules/agentic-senior-core.md',
  },
  cline: {
    label: 'Cline',
    targetPath: '.clinerules/agentic-senior-core.md',
    sourcePath: '.agents/plugins/agentic-senior-core/rules/agentic-senior-core.md',
  },
  copilot: {
    label: 'GitHub Copilot',
    targetPath: '.github/copilot-instructions.md',
    sourcePath: '.agents/plugins/agentic-senior-core/rules/agentic-senior-core.md',
  },
  kiro: {
    label: 'Kiro',
    targetPath: '.kiro/steering/agentic-senior-core.md',
    sourcePath: '.agents/plugins/agentic-senior-core/rules/agentic-senior-core.md',
  },
  continue: {
    label: 'Continue',
    targetPath: '.continue/rules/agentic-senior-core.md',
    sourcePath: '.agents/plugins/agentic-senior-core/rules/agentic-senior-core.md',
  },
  zed: {
    label: 'Zed',
    targetPath: '.zed/rules/agentic-senior-core.md',
    sourcePath: '.agents/plugins/agentic-senior-core/rules/agentic-senior-core.md',
  },
  aider: {
    label: 'Aider',
    targetPath: 'CONVENTIONS.md',
    sourcePath: '.agents/plugins/agentic-senior-core/rules/agentic-senior-core.md',
  },
  kilocode: {
    label: 'Kilo Code',
    targetPath: '.kilo/rules/agentic-senior-core.md',
    legacyTargetPath: '.kilocode/rules/agentic-senior-core.md',
    pluginTargetPath: '.kilo/plugin/agentic-senior-core.js',
    sourcePath: '.agents/plugins/agentic-senior-core/rules/agentic-senior-core.md',
    pluginSourcePath: '.agents/plugins/agentic-senior-core/kilo-plugin/agentic-senior-core.js',
  },
  roo: {
    label: 'Roo Code',
    targetPath: '.roo/rules/agentic-senior-core.md',
    sourcePath: '.agents/plugins/agentic-senior-core/rules/agentic-senior-core.md',
  },
  openhands: {
    label: 'OpenHands',
    targetPath: '.openhands/microagents/agentic-senior-core.md',
    sourcePath: '.agents/plugins/agentic-senior-core/rules/agentic-senior-core.md',
  },
};

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

async function generateAdapter(targetDirectory, adapterKey) {
  const adapter = ADAPTER_TARGETS[adapterKey];
  if (!adapter) {
    console.error(`Unknown adapter: ${adapterKey}. Available: ${Object.keys(ADAPTER_TARGETS).join(', ')}`);
    return false;
  }

  const sourcePath = path.join(REPOSITORY_ROOT, adapter.sourcePath);
  const targetPath = path.join(targetDirectory, adapter.targetPath);
  const targetDir = path.dirname(targetPath);

  if (!(await pathExists(sourcePath))) {
    console.error(`Adapter source not found: ${sourcePath}`);
    return false;
  }

  await fs.mkdir(targetDir, { recursive: true });

  const rawRules = await fs.readFile(sourcePath, 'utf8');
  let finalContent = rawRules;

  // Format IDE-specific YAML frontmatter for official compliance
  if (adapterKey === 'cursor') {
    finalContent = `---\ndescription: "Agentic Senior Core Coding Rules"\nalwaysApply: true\n---\n\n${rawRules}`;
  } else if (adapterKey === 'copilot') {
    finalContent = `---\napplyTo: '**'\n---\n\n${rawRules}`;
  } else if (adapterKey === 'kiro') {
    finalContent = `---\ninclusion: always\n---\n\n${rawRules}`;
  } else if (adapterKey === 'windsurf' || adapterKey === 'devin') {
    finalContent = `---\ntrigger: always_on\n---\n\n${rawRules}`;
  }

  await fs.writeFile(targetPath, finalContent, 'utf8');

  if (adapterKey === 'kilocode') {
    if (adapter.pluginSourcePath && adapter.pluginTargetPath) {
      const pluginSource = path.join(REPOSITORY_ROOT, adapter.pluginSourcePath);
      const pluginTarget = path.join(targetDirectory, adapter.pluginTargetPath);
      if (await pathExists(pluginSource)) {
        await fs.mkdir(path.dirname(pluginTarget), { recursive: true });
        await fs.copyFile(pluginSource, pluginTarget);
      }
    }
    const skillsSource = path.join(REPOSITORY_ROOT, '.agents', 'plugins', 'agentic-senior-core', 'skills');
    const localSkillsTarget = path.join(targetDirectory, '.kilo', 'skills');
    if (await pathExists(skillsSource)) {
      await copyDirRecursive(skillsSource, localSkillsTarget);
    }
    if (adapter.legacyTargetPath) {
      const legacyTarget = path.join(targetDirectory, adapter.legacyTargetPath);
      await fs.mkdir(path.dirname(legacyTarget), { recursive: true });
      await fs.writeFile(legacyTarget, finalContent, 'utf8');
    }
  }

  console.log(`  ${adapter.label}: ${adapter.targetPath} ... OK`);
  return true;
}

export async function runAdapterCommand(commandArguments) {
  const targetDirectory = process.cwd();
  const requestedAdapters = [];

  for (const argument of commandArguments) {
    if (argument === '--all') {
      requestedAdapters.push(...Object.keys(ADAPTER_TARGETS));
      break;
    }

    const adapterKey = argument.replace(/^--/, '');
    if (ADAPTER_TARGETS[adapterKey]) {
      requestedAdapters.push(adapterKey);
    } else if (argument.startsWith('--')) {
      console.error(`Unknown option: ${argument}`);
      console.log(`Available adapters: ${Object.keys(ADAPTER_TARGETS).map(k => `--${k}`).join(', ')}, --all`);
      process.exit(1);
    }
  }

  if (requestedAdapters.length === 0) {
    console.log('Agentic Senior Core -- Adapter Generator\n');
    console.log('Usage: asc adapter [--cursor] [--codex] [--devin] [--cline] [--copilot] [--kiro] [--continue] [--zed] [--aider] [--kilocode] [--roo] [--openhands] [--windsurf] [--all]\n');
    console.log('Generates instruction-tier adapter files for IDEs without plugin support.');
    console.log('Each adapter is a single file containing the universal coding rules.\n');
    process.exit(0);
  }

  console.log('Generating IDE adapters...\n');
  let successCount = 0;

  for (const adapterKey of requestedAdapters) {
    const success = await generateAdapter(targetDirectory, adapterKey);
    if (success) successCount++;
  }

  // Automatically install Git pre-commit hook for non-hook host backstop
  const hookResult = installGitPreCommitHook({ cwd: targetDirectory });
  if (hookResult.installed) {
    const relPath = path.relative(targetDirectory, hookResult.hookPath) || hookResult.hookPath;
    console.log(`  Git Pre-Commit Hook: ${relPath} ... OK`);
  }

  console.log(`\nGenerated ${successCount}/${requestedAdapters.length} adapter file(s) and configured Git pre-commit hook.`);
}
