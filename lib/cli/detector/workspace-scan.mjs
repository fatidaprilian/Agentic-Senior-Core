/**
 * Workspace traversal: from a target directory, find immediate project markers,
 * locate nested project candidates inside monorepo containers, and read package
 * manifests when present. The scan is bounded by max depth and a per-run
 * directory budget so it terminates cleanly on huge repos.
 */

import fs from 'node:fs/promises';
import path from 'node:path';

import {
  hasProjectMarkers,
  INTERNAL_GOVERNANCE_SURFACE_NAMES,
  looksLikeWorkspaceSearchCandidate,
  WORKSPACE_CONTAINER_DIRECTORY_NAMES,
  WORKSPACE_ROOT_MARKER_FILE_NAMES,
  WORKSPACE_SCAN_IGNORE_DIRECTORY_NAMES,
  WORKSPACE_SCAN_MAX_DEPTH,
  WORKSPACE_SCAN_MAX_DIRECTORIES,
} from './constants.mjs';

export async function collectProjectMarkers(targetDirectoryPath) {
  const markerNames = new Set();
  const directoryEntries = await fs.readdir(targetDirectoryPath, { withFileTypes: true });

  for (const directoryEntry of directoryEntries) {
    if (directoryEntry.name === '.git' || directoryEntry.name === 'node_modules') {
      continue;
    }

    if (INTERNAL_GOVERNANCE_SURFACE_NAMES.has(directoryEntry.name)) {
      continue;
    }

    markerNames.add(directoryEntry.name);
  }

  return markerNames;
}

export async function readPackageJsonIfExists(targetDirectoryPath) {
  const packageJsonPath = path.join(targetDirectoryPath, 'package.json');

  try {
    const packageJsonContent = await fs.readFile(packageJsonPath, 'utf8');
    return JSON.parse(packageJsonContent);
  } catch {
    return null;
  }
}

async function readDirectoryEntries(directoryPath) {
  try {
    return await fs.readdir(directoryPath, { withFileTypes: true });
  } catch {
    return [];
  }
}

export async function collectNestedWorkspaceProjects(targetDirectoryPath) {
  const rootDirectoryEntries = await readDirectoryEntries(targetDirectoryPath);
  const rootMarkerNames = new Set(rootDirectoryEntries.map((directoryEntry) => directoryEntry.name));
  const rootLooksLikeWorkspace = Array.from(rootMarkerNames).some((markerName) => (
    WORKSPACE_ROOT_MARKER_FILE_NAMES.has(markerName)
    || looksLikeWorkspaceSearchCandidate(markerName)
  ));
  const nestedWorkspaceProjects = [];
  const queuedWorkspacePaths = new Set();
  const workspaceQueue = [];
  let scannedDirectoryCount = 0;

  for (const rootDirectoryEntry of rootDirectoryEntries) {
    if (!rootDirectoryEntry.isDirectory()) {
      continue;
    }

    if (WORKSPACE_SCAN_IGNORE_DIRECTORY_NAMES.has(rootDirectoryEntry.name)) {
      continue;
    }

    const shouldInspectRootChild = rootLooksLikeWorkspace
      || looksLikeWorkspaceSearchCandidate(rootDirectoryEntry.name);

    if (!shouldInspectRootChild) {
      continue;
    }

    const rootChildDirectoryPath = path.join(targetDirectoryPath, rootDirectoryEntry.name);
    const rootChildEntries = await readDirectoryEntries(rootChildDirectoryPath);
    const rootChildMarkerNames = new Set(rootChildEntries.map((directoryEntry) => directoryEntry.name));
    const rootChildRelativePath = rootDirectoryEntry.name.replace(/\\/g, '/');

    workspaceQueue.push({
      directoryPath: rootChildDirectoryPath,
      relativePath: rootChildRelativePath,
      markerNames: rootChildMarkerNames,
      depth: 1,
      underWorkspaceContainer: WORKSPACE_CONTAINER_DIRECTORY_NAMES.has(rootDirectoryEntry.name.toLowerCase()),
    });
    queuedWorkspacePaths.add(rootChildRelativePath);
  }

  while (workspaceQueue.length > 0 && scannedDirectoryCount < WORKSPACE_SCAN_MAX_DIRECTORIES) {
    const currentWorkspaceEntry = workspaceQueue.shift();
    scannedDirectoryCount += 1;

    const isProjectCandidate = hasProjectMarkers(currentWorkspaceEntry.markerNames);
    const currentDirectoryName = path.basename(currentWorkspaceEntry.directoryPath).toLowerCase();
    const isWorkspaceContainer = WORKSPACE_CONTAINER_DIRECTORY_NAMES.has(currentDirectoryName);

    if (isProjectCandidate) {
      nestedWorkspaceProjects.push({
        directoryPath: currentWorkspaceEntry.directoryPath,
        relativePath: currentWorkspaceEntry.relativePath,
        markerNames: currentWorkspaceEntry.markerNames,
        packageManifest: currentWorkspaceEntry.markerNames.has('package.json')
          ? await readPackageJsonIfExists(currentWorkspaceEntry.directoryPath)
          : null,
      });
    }

    if (currentWorkspaceEntry.depth >= WORKSPACE_SCAN_MAX_DEPTH) {
      continue;
    }

    const shouldTraverseChildren = currentWorkspaceEntry.underWorkspaceContainer
      || isWorkspaceContainer
      || !isProjectCandidate;

    if (!shouldTraverseChildren) {
      continue;
    }

    const childEntries = await readDirectoryEntries(currentWorkspaceEntry.directoryPath);
    for (const childEntry of childEntries) {
      if (!childEntry.isDirectory()) {
        continue;
      }

      if (WORKSPACE_SCAN_IGNORE_DIRECTORY_NAMES.has(childEntry.name)) {
        continue;
      }

      const childLooksRelevant = looksLikeWorkspaceSearchCandidate(childEntry.name);
      if (!childLooksRelevant && !currentWorkspaceEntry.underWorkspaceContainer && !isWorkspaceContainer) {
        continue;
      }

      const childDirectoryPath = path.join(currentWorkspaceEntry.directoryPath, childEntry.name);
      const childRelativePath = path.join(currentWorkspaceEntry.relativePath, childEntry.name).replace(/\\/g, '/');

      if (queuedWorkspacePaths.has(childRelativePath)) {
        continue;
      }

      const childDirectoryEntries = await readDirectoryEntries(childDirectoryPath);
      const childMarkerNames = new Set(childDirectoryEntries.map((directoryEntry) => directoryEntry.name));
      const childIsProjectCandidate = hasProjectMarkers(childMarkerNames);
      const childIsWorkspaceContainer = WORKSPACE_CONTAINER_DIRECTORY_NAMES.has(childEntry.name.toLowerCase());

      if (!childIsProjectCandidate && !childIsWorkspaceContainer && !childLooksRelevant) {
        continue;
      }

      workspaceQueue.push({
        directoryPath: childDirectoryPath,
        relativePath: childRelativePath,
        markerNames: childMarkerNames,
        depth: currentWorkspaceEntry.depth + 1,
        underWorkspaceContainer: currentWorkspaceEntry.underWorkspaceContainer || isWorkspaceContainer || childIsWorkspaceContainer,
      });
      queuedWorkspacePaths.add(childRelativePath);
    }
  }

  return nestedWorkspaceProjects;
}
