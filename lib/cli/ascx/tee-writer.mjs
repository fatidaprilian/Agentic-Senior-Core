import fs from 'node:fs/promises';
import path from 'node:path';

export const MAX_TEE_FILES = 20;

function sanitizeFileNamePart(rawValue) {
  return String(rawValue || 'command')
    .toLowerCase()
    .replace(/[^a-z0-9._-]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60) || 'command';
}

export function getDefaultTeeDirectory(cwd = process.cwd()) {
  return path.resolve(cwd, '.agent-context', 'state', 'token-saver', 'tee');
}

async function sweepOldTeeFiles(directoryPath, maxFiles = MAX_TEE_FILES) {
  let entries;

  try {
    entries = await fs.readdir(directoryPath);
  } catch {
    return;
  }

  const logFiles = entries.filter((name) => name.endsWith('.log')).sort();
  const excess = logFiles.length - maxFiles;

  for (let i = 0; i < excess; i++) {
    try {
      await fs.unlink(path.join(directoryPath, logFiles[i]));
    } catch {
      // Best-effort cleanup; do not fail the write path.
    }
  }
}

export async function writeRawTeeFile({
  commandText,
  cwd = process.cwd(),
  exitCode,
  rawOutput,
  teeDirectoryPath = getDefaultTeeDirectory(cwd),
}) {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const commandName = sanitizeFileNamePart(commandText);
  const teeFilePath = path.resolve(teeDirectoryPath, `${timestamp}-${commandName}.log`);
  const fileContent = [
    `[ascx raw output]`,
    `command: ${commandText}`,
    `exit: ${exitCode}`,
    '',
    rawOutput,
  ].join('\n');

  await fs.mkdir(path.dirname(teeFilePath), { recursive: true });
  await fs.writeFile(teeFilePath, fileContent, 'utf8');
  await sweepOldTeeFiles(teeDirectoryPath);

  return teeFilePath;
}

