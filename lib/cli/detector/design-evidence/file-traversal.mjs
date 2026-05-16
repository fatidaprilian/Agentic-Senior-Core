/**
 * Filesystem traversal and surface-file classification for the design evidence
 * scan. Bounded by FRONTEND_FILE_SCAN_LIMIT so the scan never blows up on huge
 * monorepos.
 */

import fs from 'node:fs/promises';
import path from 'node:path';

import {
  DESIGN_EVIDENCE_SAMPLE_LIMIT,
  FRONTEND_FILE_SCAN_LIMIT,
  FRONTEND_SCAN_FILE_EXTENSIONS,
  FRONTEND_SCAN_IGNORE_DIRECTORY_NAMES,
} from './constants.mjs';

export async function collectFrontendSourceFilePaths(directoryPath, collectedFilePaths = []) {
  if (collectedFilePaths.length >= FRONTEND_FILE_SCAN_LIMIT) {
    return collectedFilePaths;
  }

  let directoryEntries;
  try {
    directoryEntries = await fs.readdir(directoryPath, { withFileTypes: true });
  } catch {
    return collectedFilePaths;
  }

  for (const directoryEntry of directoryEntries) {
    if (collectedFilePaths.length >= FRONTEND_FILE_SCAN_LIMIT) {
      break;
    }

    if (directoryEntry.isDirectory()) {
      if (FRONTEND_SCAN_IGNORE_DIRECTORY_NAMES.has(directoryEntry.name)) {
        continue;
      }

      await collectFrontendSourceFilePaths(path.join(directoryPath, directoryEntry.name), collectedFilePaths);
      continue;
    }

    const fileExtension = path.extname(directoryEntry.name).toLowerCase();
    if (FRONTEND_SCAN_FILE_EXTENSIONS.has(fileExtension)) {
      collectedFilePaths.push(path.join(directoryPath, directoryEntry.name));
    }
  }

  return collectedFilePaths;
}

export function registerSurfaceFile(summary, targetDirectoryPath, scannedFilePath, seenSurfaceFiles) {
  const relativeFilePath = path.relative(targetDirectoryPath, scannedFilePath).replace(/\\/g, '/');
  const normalizedBaseName = path.basename(scannedFilePath, path.extname(scannedFilePath)).toLowerCase();
  const looksLikeComponent = /[A-Z]/.test(path.basename(scannedFilePath, path.extname(scannedFilePath)))
    || relativeFilePath.includes('/components/')
    || relativeFilePath.startsWith('components/');
  const looksLikePage = normalizedBaseName === 'page'
    || normalizedBaseName === 'index'
    || relativeFilePath.includes('/pages/')
    || relativeFilePath.startsWith('pages/')
    || relativeFilePath.includes('/app/');
  const looksLikeLayout = normalizedBaseName === 'layout' || relativeFilePath.includes('/layouts/');

  if (looksLikeComponent) {
    summary.componentInventory.componentFileCount += 1;
  }

  if (looksLikePage) {
    summary.componentInventory.pageFileCount += 1;
  }

  if (looksLikeLayout) {
    summary.componentInventory.layoutFileCount += 1;
  }

  if ((looksLikeComponent || looksLikePage || looksLikeLayout) && !seenSurfaceFiles.has(relativeFilePath)) {
    seenSurfaceFiles.add(relativeFilePath);
    if (summary.componentInventory.surfaceFileSamples.length < DESIGN_EVIDENCE_SAMPLE_LIMIT) {
      summary.componentInventory.surfaceFileSamples.push(relativeFilePath);
    }
  }
}
