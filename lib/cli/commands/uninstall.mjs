import fs from 'node:fs/promises';
import path from 'node:path';

const ASC_SIGNATURE = '# Agentic Senior Core';

const ADAPTER_FILES = [
  { label: 'Cursor', path: '.cursor/rules/agentic-senior-core.mdc' },
  { label: 'Windsurf (legacy)', path: '.windsurf/rules/agentic-senior-core.md' },
  { label: 'Devin Desktop', path: '.devin/rules/agentic-senior-core.md' },
  { label: 'Cline', path: '.clinerules/agentic-senior-core.md' },
  { label: 'GitHub Copilot', path: '.github/copilot-instructions.md' },
  { label: 'Kiro', path: '.kiro/steering/agentic-senior-core.md' },
  { label: 'Continue', path: '.continue/rules/agentic-senior-core.md' },
  { label: 'Zed', path: '.zed/rules/agentic-senior-core.md' },
  { label: 'Aider', path: 'CONVENTIONS.md' },
  { label: 'Kilo Code', path: '.kilocode/rules/agentic-senior-core.md' },
  { label: 'Roo Code', path: '.roo/rules/agentic-senior-core.md' },
  { label: 'OpenHands', path: '.openhands/microagents/agentic-senior-core.md' },
];

async function pathExists(filePath) {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

async function isAscFile(filePath) {
  try {
    const content = await fs.readFile(filePath, 'utf8');
    return content.includes(ASC_SIGNATURE);
  } catch {
    return false;
  }
}

export async function runUninstallCommand(commandArguments) {
  const targetDirectory = process.cwd();
  const dryRun = commandArguments.includes('--dry-run');

  console.log('Agentic Senior Core -- Uninstall adapters\n');
  console.log(`Target: ${targetDirectory}`);
  if (dryRun) console.log('Mode: dry-run (no files will be deleted)\n');
  else console.log('');

  let found = 0;
  let removed = 0;

  for (const adapter of ADAPTER_FILES) {
    const fullPath = path.join(targetDirectory, adapter.path);
    if (!(await pathExists(fullPath))) continue;
    if (!(await isAscFile(fullPath))) {
      console.log(`  skip: ${adapter.path} (not an ASC file)`);
      continue;
    }

    found++;

    if (dryRun) {
      console.log(`  would remove: ${adapter.path} (${adapter.label})`);
    } else {
      await fs.rm(fullPath);
      console.log(`  removed: ${adapter.path} (${adapter.label})`);
      removed++;
    }
  }

  if (found === 0) {
    console.log('No ASC adapter files found in this project.');
    return;
  }

  if (dryRun) {
    console.log(`\n${found} adapter file(s) found. Run without --dry-run to remove.`);
  } else {
    console.log(`\n${removed} adapter file(s) removed.`);
  }
}
