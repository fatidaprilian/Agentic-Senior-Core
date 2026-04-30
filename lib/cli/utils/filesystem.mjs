import fs from 'node:fs/promises';
import path from 'node:path';

export async function pathExists(targetPath) {
  try {
    await fs.stat(targetPath);
    return true;
  } catch {
    return false;
  }
}

export async function ensureDirectory(directoryPath) {
  await fs.mkdir(directoryPath, { recursive: true });
}

export async function copyDirectory(sourceDirectoryPath, targetDirectoryPath) {
  if (path.resolve(sourceDirectoryPath) === path.resolve(targetDirectoryPath)) {
    return;
  }

  await ensureDirectory(targetDirectoryPath);
  const directoryEntries = await fs.readdir(sourceDirectoryPath, { withFileTypes: true });

  for (const directoryEntry of directoryEntries) {
    const sourceEntryPath = path.join(sourceDirectoryPath, directoryEntry.name);
    const targetEntryPath = path.join(targetDirectoryPath, directoryEntry.name);

    if (directoryEntry.isDirectory()) {
      await copyDirectory(sourceEntryPath, targetEntryPath);
      continue;
    }

    if (path.resolve(sourceEntryPath) === path.resolve(targetEntryPath)) {
      continue;
    }

    await fs.copyFile(sourceEntryPath, targetEntryPath);
  }
}

export function isAgenticManagedContent(content) {
  const normalizedContent = Buffer.isBuffer(content)
    ? content.toString('utf8')
    : String(content || '');

  return [
    'Agentic-Senior-Core',
    'AGENTIC-SENIOR-CORE',
    'Adapter Mode: thin',
    'Adapter Mode: legacy-thin',
    'Canonical Snapshot SHA256',
    'Canonical baseline: .instructions.md',
  ].some((managedSignal) => normalizedContent.includes(managedSignal));
}

export async function syncFile(sourcePath, targetPath, options = {}) {
  if (!(await pathExists(sourcePath))) return { status: 'skipped' };

  if (!(await pathExists(targetPath))) {
    await ensureDirectory(path.dirname(targetPath));
    await fs.copyFile(sourcePath, targetPath);
    return { status: 'created' };
  }

  const sourceContent = await fs.readFile(sourcePath);
  const targetContent = await fs.readFile(targetPath);

  if (sourceContent.equals(targetContent)) {
    return { status: 'unchanged' };
  }

  if (options.preserveUserOwned === true && !isAgenticManagedContent(targetContent)) {
    return { status: 'preserved' };
  }

  await fs.copyFile(sourcePath, targetPath);
  return { status: 'updated' };
}
