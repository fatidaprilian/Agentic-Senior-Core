import fs from 'node:fs/promises';
import path from 'node:path';

import {
  REPO_ROOT,
  entryPointFiles,
  directoryCopies,
} from '../constants.mjs';
import { pathExists } from './filesystem.mjs';

function toPosixRelativePath(relativePath) {
  return relativePath.split(path.sep).join('/');
}

function isPathWithinPrefix(relativePath, prefixPath) {
  const normalizedRelativePath = toPosixRelativePath(relativePath).replace(/\/+$/g, '');
  const normalizedPrefixPath = toPosixRelativePath(prefixPath).replace(/\/+$/g, '');

  if (!normalizedPrefixPath) {
    return false;
  }

  return normalizedRelativePath === normalizedPrefixPath
    || normalizedRelativePath.startsWith(`${normalizedPrefixPath}/`);
}

const localOnlyGovernanceFiles = new Set([
  '.agent-context/state/active-memory.json',
  '.agent-context/state/v3-purge-audit.json',
]);

function isLocalOnlyGovernanceFile(relativePath) {
  return localOnlyGovernanceFiles.has(toPosixRelativePath(relativePath));
}

export async function collectRelativeTreeEntries(baseDirectoryPath, relativeRootPath) {
  const files = [];
  const directories = [];

  if (!(await pathExists(baseDirectoryPath))) {
    return { files, directories };
  }

  const normalizedRootPath = toPosixRelativePath(relativeRootPath);
  directories.push(normalizedRootPath);

  async function walkDirectory(currentDirectoryPath, currentRelativePath) {
    const directoryEntries = await fs.readdir(currentDirectoryPath, { withFileTypes: true });

    for (const directoryEntry of directoryEntries) {
      const sourceEntryPath = path.join(currentDirectoryPath, directoryEntry.name);
      const relativeEntryPath = toPosixRelativePath(path.join(currentRelativePath, directoryEntry.name));

      if (directoryEntry.isDirectory()) {
        directories.push(relativeEntryPath);
        await walkDirectory(sourceEntryPath, relativeEntryPath);
        continue;
      }

      if (isLocalOnlyGovernanceFile(relativeEntryPath)) {
        continue;
      }

      files.push(relativeEntryPath);
    }
  }

  await walkDirectory(baseDirectoryPath, normalizedRootPath);
  return { files, directories };
}

async function collectOptionalManagedEntries(baseDirectoryPath, options = {}) {
  const files = new Set();
  const directories = new Set();

  if (options.includeMcpTemplate === true) {
    const mcpServerEntrypointPath = path.join(baseDirectoryPath, 'scripts', 'mcp-server.mjs');
    if (await pathExists(mcpServerEntrypointPath)) {
      files.add('scripts/mcp-server.mjs');
    }

    const mcpServerHelpersDirectoryPath = path.join(baseDirectoryPath, 'scripts', 'mcp-server');
    const mcpServerTreeEntries = await collectRelativeTreeEntries(
      mcpServerHelpersDirectoryPath,
      'scripts/mcp-server'
    );

    for (const relativeFilePath of mcpServerTreeEntries.files) {
      files.add(relativeFilePath);
    }

    for (const relativeDirectoryPath of mcpServerTreeEntries.directories) {
      directories.add(relativeDirectoryPath);
    }
  }

  return { files, directories };
}

async function buildManagedSourceManifest(options = {}) {
  const sourceFiles = new Set();
  const sourceDirectories = new Set();

  for (const sourceDirectoryName of directoryCopies) {
    const sourceDirectoryPath = path.join(REPO_ROOT, sourceDirectoryName);
    const sourceTreeEntries = await collectRelativeTreeEntries(sourceDirectoryPath, sourceDirectoryName);

    for (const sourceFilePath of sourceTreeEntries.files) {
      sourceFiles.add(sourceFilePath);
    }

    for (const sourceDirectoryPathRelative of sourceTreeEntries.directories) {
      sourceDirectories.add(sourceDirectoryPathRelative);
    }
  }

  for (const entryPointFileName of entryPointFiles) {
    const sourceFilePath = path.join(REPO_ROOT, entryPointFileName);
    if (!(await pathExists(sourceFilePath))) {
      continue;
    }

    sourceFiles.add(toPosixRelativePath(entryPointFileName));
  }

  const optionalManagedEntries = await collectOptionalManagedEntries(REPO_ROOT, options);
  for (const sourceFilePath of optionalManagedEntries.files) {
    sourceFiles.add(sourceFilePath);
  }
  for (const sourceDirectoryPath of optionalManagedEntries.directories) {
    sourceDirectories.add(sourceDirectoryPath);
  }

  return {
    files: sourceFiles,
    directories: sourceDirectories,
  };
}

async function collectManagedTargetManifest(resolvedTargetDirectoryPath, options = {}) {
  const targetFiles = new Set();
  const targetDirectories = new Set();

  for (const sourceDirectoryName of directoryCopies) {
    const targetDirectoryPath = path.join(resolvedTargetDirectoryPath, sourceDirectoryName);
    const targetTreeEntries = await collectRelativeTreeEntries(targetDirectoryPath, sourceDirectoryName);

    for (const targetFilePath of targetTreeEntries.files) {
      targetFiles.add(targetFilePath);
    }

    for (const targetDirectoryPathRelative of targetTreeEntries.directories) {
      targetDirectories.add(targetDirectoryPathRelative);
    }
  }

  for (const entryPointFileName of entryPointFiles) {
    const targetFilePath = path.join(resolvedTargetDirectoryPath, entryPointFileName);
    if (!(await pathExists(targetFilePath))) {
      continue;
    }

    targetFiles.add(toPosixRelativePath(entryPointFileName));
  }

  const optionalManagedEntries = await collectOptionalManagedEntries(resolvedTargetDirectoryPath, options);
  for (const targetFilePath of optionalManagedEntries.files) {
    targetFiles.add(targetFilePath);
  }
  for (const targetDirectoryPath of optionalManagedEntries.directories) {
    targetDirectories.add(targetDirectoryPath);
  }

  return {
    files: targetFiles,
    directories: targetDirectories,
  };
}

export async function analyzeManagedGovernanceSurface(
  resolvedTargetDirectoryPath,
  options = {}
) {
  const preservePathPrefixes = Array.isArray(options.preservePathPrefixes)
    ? options.preservePathPrefixes
    : ['.agent-context/state', '.gemini'];

  const sourceManifest = await buildManagedSourceManifest(options);
  const targetManifest = await collectManagedTargetManifest(resolvedTargetDirectoryPath, options);

  const staleFiles = [];
  const staleDirectories = [];
  const preservedFiles = [];
  const preservedDirectories = [];

  const sortedTargetFiles = [...targetManifest.files].sort((leftPath, rightPath) => leftPath.localeCompare(rightPath));
  const sortedTargetDirectories = [...targetManifest.directories].sort(
    (leftPath, rightPath) => rightPath.length - leftPath.length || leftPath.localeCompare(rightPath)
  );

  for (const targetFilePath of sortedTargetFiles) {
    if (sourceManifest.files.has(targetFilePath)) {
      continue;
    }

    if (preservePathPrefixes.some((prefixPath) => isPathWithinPrefix(targetFilePath, prefixPath))) {
      preservedFiles.push(targetFilePath);
      continue;
    }

    staleFiles.push(targetFilePath);
  }

  for (const targetDirectoryPathRelative of sortedTargetDirectories) {
    if (sourceManifest.directories.has(targetDirectoryPathRelative)) {
      continue;
    }

    if (preservePathPrefixes.some((prefixPath) => isPathWithinPrefix(targetDirectoryPathRelative, prefixPath))) {
      preservedDirectories.push(targetDirectoryPathRelative);
      continue;
    }

    staleDirectories.push(targetDirectoryPathRelative);
  }

  return {
    staleFiles,
    staleDirectories,
    preservedFiles,
    preservedDirectories,
    managedSourceFileCount: sourceManifest.files.size,
    managedSourceDirectoryCount: sourceManifest.directories.size,
    managedTargetFileCount: targetManifest.files.size,
    managedTargetDirectoryCount: targetManifest.directories.size,
  };
}
