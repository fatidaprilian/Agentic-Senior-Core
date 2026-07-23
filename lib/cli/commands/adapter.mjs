import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const currentFilePath = fileURLToPath(import.meta.url);
const currentDirectoryPath = path.dirname(currentFilePath);
const REPOSITORY_ROOT = path.resolve(currentDirectoryPath, '..', '..', '..');

const ADAPTER_TARGETS = {
  cursor: {
    label: 'Cursor',
    targetPath: '.cursor/rules/agentic-senior-core.mdc',
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
    targetPath: '.kilocode/rules/agentic-senior-core.md',
    sourcePath: '.agents/plugins/agentic-senior-core/rules/agentic-senior-core.md',
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

  if (adapterKey === 'copilot') {
    const rulesContent = await fs.readFile(sourcePath, 'utf8');
    const instructionsContent = `---\napplyTo: '**'\n---\n\n${rulesContent}`;
    await fs.writeFile(targetPath, instructionsContent);
  } else {
    await fs.copyFile(sourcePath, targetPath);
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
    console.log('Usage: asc adapter [--cursor] [--devin] [--cline] [--copilot] [--kiro] [--continue] [--zed] [--aider] [--kilocode] [--roo] [--openhands] [--windsurf] [--all]\n');
    console.log('Generates instruction-tier adapter files for IDEs without plugin support.');
    console.log('Each adapter is a single file containing the universal coding rules.\n');
    console.log('Available adapters:');
    for (const [key, adapter] of Object.entries(ADAPTER_TARGETS)) {
      console.log(`  --${key.padEnd(10)} ${adapter.label.padEnd(20)} -> ${adapter.targetPath}`);
    }
    return;
  }

  console.log('Agentic Senior Core -- Generating adapters\n');

  let successCount = 0;
  for (const adapterKey of requestedAdapters) {
    const success = await generateAdapter(targetDirectory, adapterKey);
    if (success) successCount++;
  }

  console.log(`\n${successCount}/${requestedAdapters.length} adapter(s) generated.`);
}
