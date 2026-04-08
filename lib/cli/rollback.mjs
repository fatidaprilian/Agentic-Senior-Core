import fs from 'node:fs/promises';
import path from 'node:path';
import { pathExists, ensureDirectory } from './utils.mjs';

const BACKUP_DIR_NAME = '.agentic-backup';

/**
 * Performs a rollback of a target directory using the backup manifest.
 * @param {string} targetDirectoryPath 
 */
export async function performRollback(targetDirectoryPath) {
  const startTime = Date.now();
  const backupRoot = path.join(targetDirectoryPath, BACKUP_DIR_NAME);
  const manifestPath = path.join(backupRoot, 'manifest.json');
  const objectsDir = path.join(backupRoot, 'objects');

  if (!(await pathExists(manifestPath))) {
      throw new Error(`Rollback failed: Backup manifest not found at ${manifestPath}`);
  }

  const manifestData = JSON.parse(await fs.readFile(manifestPath, 'utf8'));
  const report = {
      restoredFiles: [],
      deletedFiles: [],
      errors: []
  };

  for (const [relativePath, fileManifest] of Object.entries(manifestData.files)) {
      const destinationPath = path.join(targetDirectoryPath, relativePath);

      if (fileManifest.action === 'restore') {
          const sourceObjectPath = path.join(objectsDir, fileManifest.hash);
          if (!(await pathExists(sourceObjectPath))) {
              report.errors.push(`Missing backup object for file: ${relativePath} (Expected hash: ${fileManifest.hash})`);
              continue;
          }

          try {
             await ensureDirectory(path.dirname(destinationPath));
             await fs.copyFile(sourceObjectPath, destinationPath);
             report.restoredFiles.push(relativePath);
          } catch (err) {
             report.errors.push(`Failed to restore ${relativePath}: ${err.message}`);
          }
      } else if (fileManifest.action === 'delete') {
          // File did not exist before, but might exist now
          if (await pathExists(destinationPath)) {
              try {
                  const stats = await fs.stat(destinationPath);
                  if (stats.isDirectory()) {
                      await fs.rm(destinationPath, { recursive: true, force: true });
                  } else {
                      await fs.unlink(destinationPath);
                  }
                  report.deletedFiles.push(relativePath);
              } catch (err) {
                  report.errors.push(`Failed to delete dynamically added file ${relativePath}: ${err.message}`);
              }
          }
      }
  }

  report.durationMs = Date.now() - startTime;
  report.success = report.errors.length === 0;

  return report;
}
