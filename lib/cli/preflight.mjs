import fs from 'node:fs/promises';
import path from 'node:path';
import { constants } from 'node:fs';
import { pathExists } from './utils.mjs';

const MINIMUM_NODE_VERSION = 18;
const MINIMUM_FREE_DISK_SPACE_MB = 5;

export async function runPreflightChecks(targetDirectoryPath, operationMode) {
  const result = {
    passed: true,
    checks: [],
    errors: [],
  };

  // Check 1: Node Version
  const nodeVersionString = process.version;
  const majorVersion = parseInt(nodeVersionString.slice(1).split('.')[0], 10);
  if (majorVersion >= MINIMUM_NODE_VERSION) {
    result.checks.push(`Node.js version is compatible: ${nodeVersionString}`);
  } else {
    result.passed = false;
    result.errors.push(`Node.js version ${nodeVersionString} is unsupported. Minimum required is v${MINIMUM_NODE_VERSION}.x`);
  }

  // Check 2: Write Permissions
  try {
    await fs.access(targetDirectoryPath, constants.W_OK);
    result.checks.push(`Target directory is writable: ${targetDirectoryPath}`);
  } catch (error) {
    if (error.code === 'ENOENT') {
       // Target directory does not exist yet. Ensure its parent is writable so we can create it
       const parentDir = path.dirname(targetDirectoryPath);
       try {
           await fs.access(parentDir, constants.W_OK);
           result.checks.push(`Target parent directory is writable: ${parentDir}`);
       } catch (parentErr) {
           result.passed = false;
           result.errors.push(`Target directory does not exist and parent is read-only: ${parentDir}`);
       }
    } else {
        result.passed = false;
        result.errors.push(`Target directory is read-only: ${targetDirectoryPath}`);
    }
  }

  // Check 3: Disk Space
  try {
    const statfsString = typeof fs.statfs === 'function';
    // Use fs.statfs if available (Node 18.15+)
    if (statfsString) {
        // If directory doesn't exist, check its parent
        const pathToCheck = await pathExists(targetDirectoryPath) ? targetDirectoryPath : path.dirname(targetDirectoryPath);
        const diskStats = await fs.statfs(pathToCheck);
        // diskStats.bavail is free blocks available to unprivileged user
        // diskStats.bsize is block size
        const freeBytes = Number(diskStats.bavail) * Number(diskStats.bsize);
        const freeMb = freeBytes / (1024 * 1024);
        
        if (freeMb >= MINIMUM_FREE_DISK_SPACE_MB) {
             result.checks.push(`Sufficient free disk space available: ${freeMb.toFixed(2)} MB`);
        } else {
             result.passed = false;
             result.errors.push(`Insufficient free disk space. Required: ${MINIMUM_FREE_DISK_SPACE_MB} MB, Available: ${freeMb.toFixed(2)} MB`);
        }
    } else {
        result.checks.push('Skipping disk space check (fs.statfs requires Node.js v18.15+)');
    }
  } catch (error) {
     result.checks.push(`Skipping disk space check due to standard library limitation: ${error.message}`);
  }

  // Check 4: Conflicting Files
  if (operationMode === 'init') {
      const potentiallyConflictingPaths = [
          path.join(targetDirectoryPath, '.cursorrules'),
          path.join(targetDirectoryPath, '.windsurfrules'),
          path.join(targetDirectoryPath, '.agent-context'),
      ];

      const conflictingFound = [];
      for (const conflictPath of potentiallyConflictingPaths) {
          if (await pathExists(conflictPath)) {
              conflictingFound.push(path.basename(conflictPath));
          }
      }

      if (conflictingFound.length > 0) {
           result.passed = false;
           result.errors.push(`Conflicting governance files already exist during init: ${conflictingFound.join(', ')}. Use upgrade instead.`);
      } else {
           result.checks.push('No conflicting governance files found.');
      }
  }

  return result;
}
