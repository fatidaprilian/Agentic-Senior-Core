import fs from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';
import { pathExists, ensureDirectory } from './utils.mjs';
import { entryPointFiles, BACKUP_DIR_NAME } from './constants.mjs';

/**
 * Calculates a SHA-256 hash of a file's contents.
 */
async function hashFile(filePath) {
  const fileBuffer = await fs.readFile(filePath);
  const hashSum = crypto.createHash('sha256');
  hashSum.update(fileBuffer);
  return hashSum.digest('hex');
}

/**
 * Helper to get all files in a directory recursively.
 */
async function getFilesInDirectory(dirPath) {
  const files = [];
  try {
    const entries = await fs.readdir(dirPath, { withFileTypes: true });
    for (const entry of entries) {
      if (entry.name === '.git' || entry.name === 'node_modules' || entry.name === BACKUP_DIR_NAME) {
        continue;
      }
      const fullPath = path.join(dirPath, entry.name);
      if (entry.isDirectory()) {
        const nestedFiles = await getFilesInDirectory(fullPath);
        files.push(...nestedFiles);
      } else {
        files.push(fullPath);
      }
    }
  } catch (error) {
    if (error.code !== 'ENOENT') {
      throw error;
    }
  }
  return files;
}

/**
 * Creates a backup of specific paths in the target directory.
 * Currently backs up: managed entrypoint files and the entire .agent-context directory.
 * @param {string} targetDirectoryPath 
 */
export async function createBackup(targetDirectoryPath) {
  const startTime = Date.now();
  const backupRoot = path.join(targetDirectoryPath, BACKUP_DIR_NAME);
  const objectsDir = path.join(backupRoot, 'objects');
  
  await ensureDirectory(objectsDir);

  const pathsToTrack = [
    ...entryPointFiles.map((entryPointFileName) => path.join(targetDirectoryPath, entryPointFileName)),
    path.join(targetDirectoryPath, '.agent-context'),
  ];

  const resolvedFilesToTrack = [];
  
  for (const trackPath of pathsToTrack) {
    try {
      const stats = await fs.stat(trackPath);
      if (stats.isDirectory()) {
         const nested = await getFilesInDirectory(trackPath);
         resolvedFilesToTrack.push(...nested);
      } else if (stats.isFile()) {
         resolvedFilesToTrack.push(trackPath);
      }
    } catch (err) {
      if (err.code !== 'ENOENT') {
         throw err;
      }
      // If it doesn't exist, we track it as missing so that a rollback knows to delete it
      // if it gets created during the run. Wait, tracking everything that doesn't exist 
      // is infinite. We should record the paths we intend to write to as "absent" state.
      resolvedFilesToTrack.push(trackPath); 
    }
  }

  const manifest = {
    timestamp: new Date().toISOString(),
    files: {}
  };

  for (const filePath of resolvedFilesToTrack) {
    const relativePath = path.relative(targetDirectoryPath, filePath);
    // Ignore any backup operations within the backup directory itself
    if (relativePath.startsWith(BACKUP_DIR_NAME)) continue;

    if (await pathExists(filePath)) {
      // File exists: hash and backup
      const fileHash = await hashFile(filePath);
      const destObjectPath = path.join(objectsDir, fileHash);
      
      if (!(await pathExists(destObjectPath))) {
          await fs.copyFile(filePath, destObjectPath);
      }

      const stats = await fs.stat(filePath);
      manifest.files[relativePath] = {
         action: 'restore',
         hash: fileHash,
         mtimeMs: stats.mtimeMs
      };
    } else {
      // File did not exist before operation: must be deleted on rollback
      manifest.files[relativePath] = {
         action: 'delete'
      };
    }
  }

  const manifestPath = path.join(backupRoot, 'manifest.json');
  await fs.writeFile(manifestPath, JSON.stringify(manifest, null, 2));

  return {
    manifestPath,
    backupRoot,
    durationMs: Date.now() - startTime
  };
}
