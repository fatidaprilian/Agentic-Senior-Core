// @ts-check

/**
 * Filesystem scanning for the typography/palette anti-repeat audit. Walks
 * the repository tree, skips noisy directories (node_modules, build outputs,
 * etc.), and yields scannable CSS-like and token-config file paths.
 */

import { readdirSync, statSync, existsSync } from 'node:fs';
import { extname, join, relative, sep } from 'node:path';

export const DEFAULT_CSS_FILE_EXTENSIONS = new Set(['.css', '.scss', '.sass', '.less']);
export const TOKEN_CONFIG_FILE_NAMES = new Set([
  'tailwind.config.js',
  'tailwind.config.cjs',
  'tailwind.config.mjs',
  'tailwind.config.ts',
  'theme.config.js',
  'theme.config.ts',
  'design-tokens.js',
  'design-tokens.ts',
]);
export const SCAN_SKIP_DIRECTORY_NAMES = new Set([
  'node_modules',
  '.git',
  '.agentic-backup',
  '.benchmarks',
  'dist',
  'build',
  '.next',
  'out',
  'coverage',
  '.cache',
]);

function isInsideSkippedDirectory(absolutePath, repositoryRootPath) {
  const relativePath = relative(repositoryRootPath, absolutePath);
  if (!relativePath || relativePath.startsWith('..')) {
    return true;
  }
  const pathSegments = relativePath.split(sep);
  return pathSegments.some((segmentName) => SCAN_SKIP_DIRECTORY_NAMES.has(segmentName));
}

function* walkDirectoryEntries(currentDirectoryPath, repositoryRootPath) {
  const directoryEntries = readdirSync(currentDirectoryPath, { withFileTypes: true });
  for (const directoryEntry of directoryEntries) {
    const childPath = join(currentDirectoryPath, directoryEntry.name);
    if (directoryEntry.isDirectory()) {
      if (SCAN_SKIP_DIRECTORY_NAMES.has(directoryEntry.name)) {
        continue;
      }
      if (isInsideSkippedDirectory(childPath, repositoryRootPath)) {
        continue;
      }
      yield* walkDirectoryEntries(childPath, repositoryRootPath);
      continue;
    }
    if (directoryEntry.isFile()) {
      yield childPath;
    }
  }
}

export function isScannableFile(absoluteFilePath) {
  const fileExtension = extname(absoluteFilePath).toLowerCase();
  if (DEFAULT_CSS_FILE_EXTENSIONS.has(fileExtension)) {
    return true;
  }
  const baseName = absoluteFilePath.split(/[\\/]/).pop();
  return TOKEN_CONFIG_FILE_NAMES.has(baseName);
}

export function collectScannableFilePaths(repositoryRootPath, scanRoots) {
  const collectedFilePaths = [];
  for (const scanRoot of scanRoots) {
    const absoluteScanRoot = join(repositoryRootPath, scanRoot);
    if (!existsSync(absoluteScanRoot)) {
      continue;
    }
    const scanRootStat = statSync(absoluteScanRoot);
    if (!scanRootStat.isDirectory()) {
      continue;
    }
    for (const candidateFilePath of walkDirectoryEntries(absoluteScanRoot, repositoryRootPath)) {
      if (!isScannableFile(candidateFilePath)) {
        continue;
      }
      collectedFilePaths.push(candidateFilePath);
    }
  }
  return collectedFilePaths.sort();
}

export function lineNumberFromIndex(sourceText, charIndex) {
  let lineNumber = 1;
  for (let scanIndex = 0; scanIndex < charIndex && scanIndex < sourceText.length; scanIndex += 1) {
    if (sourceText[scanIndex] === '\n') {
      lineNumber += 1;
    }
  }
  return lineNumber;
}
