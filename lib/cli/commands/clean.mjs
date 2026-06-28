import fs from 'node:fs/promises';
import path from 'node:path';

const V4_ARTIFACTS = [
  '.agent-context',
  'AGENTS.md',
  'CLAUDE.md',
  'GEMINI.md',
  'STAGE-CHECKPOINT.md',
  'mcp.json',
  'validate_output.txt',
  'release-gate-report.json',
];

async function pathExists(filePath) {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

export async function runCleanCommand(commandArguments) {
  const targetDirectory = process.cwd();
  const dryRun = commandArguments.includes('--dry-run');

  console.log('Agentic Senior Core -- Clean v4 artifacts\n');
  console.log(`Target: ${targetDirectory}`);
  if (dryRun) console.log('Mode: dry-run (no files will be deleted)\n');
  else console.log('');

  let found = 0;
  let removed = 0;

  for (const artifact of V4_ARTIFACTS) {
    const fullPath = path.join(targetDirectory, artifact);
    if (!(await pathExists(fullPath))) continue;

    found++;
    const stat = await fs.stat(fullPath);
    const label = stat.isDirectory() ? `${artifact}/` : artifact;

    if (dryRun) {
      console.log(`  would remove: ${label}`);
    } else {
      await fs.rm(fullPath, { recursive: true, force: true });
      console.log(`  removed: ${label}`);
      removed++;
    }
  }

  if (found === 0) {
    console.log('No v4 artifacts found. This project is clean.');
    return;
  }

  if (dryRun) {
    console.log(`\n${found} artifact(s) found. Run without --dry-run to remove.`);
  } else {
    console.log(`\n${removed} artifact(s) removed.`);
  }
}
