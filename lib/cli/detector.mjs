/**
 * Stack Detector — Project context auto-detection.
 * Depends on: constants.mjs, utils.mjs
 */
import fs from 'node:fs/promises';
import path from 'node:path';

import { BLUEPRINT_RECOMMENDATIONS } from './constants.mjs';
import { toTitleCase } from './utils.mjs';

const FRONTEND_SCAN_DIRECTORY_NAMES = ['src', 'app', 'pages', 'components', 'styles'];
const FRONTEND_SCAN_FILE_EXTENSIONS = new Set(['.js', '.jsx', '.ts', '.tsx', '.vue', '.css', '.scss', '.sass']);
const FRONTEND_SCAN_IGNORE_DIRECTORY_NAMES = new Set(['.git', 'node_modules', '.next', 'dist', 'build', 'coverage']);
const FRONTEND_FILE_SCAN_LIMIT = 200;
const FRONTEND_FILE_SIZE_LIMIT_BYTES = 200_000;
const WORKSPACE_SCAN_MAX_DEPTH = 3;
const WORKSPACE_SCAN_MAX_DIRECTORIES = 120;
const WORKSPACE_SCAN_IGNORE_DIRECTORY_NAMES = new Set([
  ...FRONTEND_SCAN_IGNORE_DIRECTORY_NAMES,
  '.agent-context',
  '.agents',
  '.cursor',
  '.gemini',
  '.github',
  '.idea',
  '.vscode',
  '.zed',
]);
const WORKSPACE_CONTAINER_DIRECTORY_NAMES = new Set([
  'admin',
  'admins',
  'api',
  'apis',
  'app',
  'apps',
  'backend',
  'backends',
  'client',
  'clients',
  'dashboard',
  'dashboards',
  'frontend',
  'frontends',
  'mobile',
  'mobiles',
  'package',
  'packages',
  'pkg',
  'server',
  'servers',
  'service',
  'services',
  'site',
  'sites',
  'ui',
  'web',
  'worker',
  'workers',
]);
const WORKSPACE_ROOT_MARKER_FILE_NAMES = new Set([
  'lerna.json',
  'nx.json',
  'pnpm-workspace.yaml',
  'turbo.json',
]);
const DIRECT_UI_MARKER_NAMES = [
  'src',
  'next.config.js',
  'next.config.mjs',
  'next.config.ts',
  'tailwind.config.js',
  'tailwind.config.mjs',
  'tailwind.config.ts',
  'vite.config.js',
  'vite.config.mjs',
  'vite.config.ts',
  'react-native.config.js',
  'app',
  'pages',
  'components',
  'public',
  'styles',
  'android',
  'ios',
  'index.html',
];
const PROJECT_MARKER_FILE_NAMES = new Set([
  'Cargo.toml',
  'Gemfile',
  'build.gradle',
  'build.gradle.kts',
  'composer.json',
  'go.mod',
  'package.json',
  'pom.xml',
  'pubspec.yaml',
  'pyproject.toml',
  'react-native.config.js',
  'requirements.txt',
  'tsconfig.json',
  ...DIRECT_UI_MARKER_NAMES,
]);
const INTERNAL_GOVERNANCE_SURFACE_NAMES = new Set([
  '.agent-context',
  '.agent-instructions.md',
  '.agent-override.md',
  '.agentic-backup',
  '.agents',
  '.clauderc',
  '.cursorrules',
  '.cursor',
  '.gemini',
  '.github',
  '.instructions.md',
  '.vscode',
  '.windsurfrules',
  '.zed',
  'AGENTS.md',
  'mcp.json',
]);

function looksLikeWorkspaceSearchCandidate(directoryName) {
  const normalizedDirectoryName = String(directoryName || '').trim().toLowerCase();

  if (!normalizedDirectoryName) {
    return false;
  }

  if (WORKSPACE_CONTAINER_DIRECTORY_NAMES.has(normalizedDirectoryName)) {
    return true;
  }

  return [
    'admin',
    'api',
    'app',
    'backend',
    'client',
    'dashboard',
    'frontend',
    'mobile',
    'package',
    'server',
    'service',
    'site',
    'ui',
    'web',
    'worker',
  ].some((keyword) => normalizedDirectoryName.includes(keyword));
}

function hasProjectMarkers(markerNames) {
  return Array.from(markerNames).some((markerName) => (
    PROJECT_MARKER_FILE_NAMES.has(markerName)
    || markerName.endsWith('.csproj')
    || markerName.endsWith('.sln')
  ));
}

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

async function readPackageJsonIfExists(targetDirectoryPath) {
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

async function collectNestedWorkspaceProjects(targetDirectoryPath) {
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

async function collectFrontendSourceFilePaths(directoryPath, collectedFilePaths = []) {
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

function countPatternMatches(sourceText, pattern) {
  return Array.from(sourceText.matchAll(pattern)).length;
}

async function collectFrontendEvidenceMetrics(targetDirectoryPath, markerNames, scanRootDirectoryPaths = []) {
  const candidateDirectoryPaths = FRONTEND_SCAN_DIRECTORY_NAMES
    .filter((directoryName) => markerNames.has(directoryName))
    .map((directoryName) => path.join(targetDirectoryPath, directoryName));
  const explicitScanRootDirectoryPaths = Array.isArray(scanRootDirectoryPaths)
    ? scanRootDirectoryPaths.filter((scanRootDirectoryPath) => typeof scanRootDirectoryPath === 'string' && scanRootDirectoryPath.trim().length > 0)
    : [];
  const resolvedCandidateDirectoryPaths = explicitScanRootDirectoryPaths.length > 0
    ? Array.from(new Set(explicitScanRootDirectoryPaths))
    : candidateDirectoryPaths.length > 0
      ? candidateDirectoryPaths
      : [targetDirectoryPath];
  const scannedFilePaths = [];

  for (const candidateDirectoryPath of resolvedCandidateDirectoryPaths) {
    await collectFrontendSourceFilePaths(candidateDirectoryPath, scannedFilePaths);
    if (scannedFilePaths.length >= FRONTEND_FILE_SCAN_LIMIT) {
      break;
    }
  }

  let hardcodedColorCount = 0;
  let propDrillingCandidateCount = 0;
  let mediaQueryCount = 0;
  let tailwindBreakpointUsageCount = 0;
  let arbitraryBreakpointCount = 0;
  const uniqueMediaWidths = new Set();

  for (const scannedFilePath of scannedFilePaths) {
    let sourceText;

    try {
      const fileStat = await fs.stat(scannedFilePath);
      if (fileStat.size > FRONTEND_FILE_SIZE_LIMIT_BYTES) {
        continue;
      }

      sourceText = await fs.readFile(scannedFilePath, 'utf8');
    } catch {
      continue;
    }

    hardcodedColorCount += countPatternMatches(
      sourceText,
      /#[0-9a-fA-F]{3,8}\b|rgba?\([^)]+\)|hsla?\([^)]+\)|oklch\([^)]+\)/g
    );
    propDrillingCandidateCount += countPatternMatches(
      sourceText,
      /<[A-Z][A-Za-z0-9_.:-]*(?:\s+[A-Za-z0-9_:-]+=\{[^}]+\}){5,}/g
    );
    mediaQueryCount += countPatternMatches(sourceText, /@media\b/g);
    tailwindBreakpointUsageCount += countPatternMatches(sourceText, /\b(?:sm|md|lg|xl|2xl):/g);
    arbitraryBreakpointCount += countPatternMatches(sourceText, /\b(?:min|max)-\[[^\]]+\]:/g);

    for (const mediaWidthMatch of sourceText.matchAll(/\((?:min|max)-width:\s*([0-9.]+(?:px|rem|em))\)/g)) {
      uniqueMediaWidths.add(mediaWidthMatch[1]);
    }
  }

  return {
    scannedFileCount: scannedFilePaths.length,
    hardcodedColorCount,
    propDrillingCandidateCount,
    mediaQueryCount,
    tailwindBreakpointUsageCount,
    arbitraryBreakpointCount,
    uniqueMediaWidthCount: uniqueMediaWidths.size,
  };
}

function analyzeUiSignalsForMarkerSet(markerNames, packageManifest, sourceLabel = null) {
  const detectedUiMarkers = DIRECT_UI_MARKER_NAMES.filter((markerName) => markerNames.has(markerName));
  const dependencySource = {
    ...(packageManifest?.dependencies || {}),
    ...(packageManifest?.devDependencies || {}),
  };
  const detectableUiDependencies = [
    'next',
    'react',
    'react-dom',
    'react-native',
    'expo',
    'tailwindcss',
  ];
  const detectedUiDependencies = detectableUiDependencies.filter((dependencyName) => dependencySource[dependencyName]);
  const hasStrongUiMarker = detectedUiMarkers.some((markerName) => (
    markerName.startsWith('next.config')
    || markerName === 'react-native.config.js'
    || markerName === 'android'
    || markerName === 'ios'
  ));
  const hasUiDependencies = detectedUiDependencies.length > 0;
  const hasStructuralUiMarkers = detectedUiMarkers.length >= 2;
  const signalReasons = [];
  const sourcePrefix = sourceLabel ? `${sourceLabel}: ` : '';

  if (detectedUiMarkers.length > 0) {
    signalReasons.push(`${sourcePrefix}ui markers: ${detectedUiMarkers.join(', ')}`);
  }

  if (detectedUiDependencies.length > 0) {
    signalReasons.push(`${sourcePrefix}ui dependencies: ${detectedUiDependencies.join(', ')}`);
  }

  return {
    signalReasons,
    detectedUiMarkers,
    detectedUiDependencies,
    hasStrongUiMarker,
    hasUiDependencies,
    hasStructuralUiMarkers,
  };
}

function collectStackDetectionCandidates(markerNames, evidencePrefix = null) {
  const detectionCandidates = [];
  const withEvidencePrefix = (evidenceItem) => evidencePrefix ? `${evidencePrefix}: ${evidenceItem}` : evidenceItem;

  if (
    markerNames.has('package.json')
    || markerNames.has('tsconfig.json')
    || markerNames.has('next.config.js')
    || markerNames.has('next.config.mjs')
    || markerNames.has('vite.config.js')
    || markerNames.has('vite.config.mjs')
    || markerNames.has('vite.config.ts')
  ) {
    const evidence = [];
    let confidenceScore = 0.7;

    if (markerNames.has('package.json')) {
      evidence.push(withEvidencePrefix('package.json'));
      confidenceScore += 0.12;
    }

    if (markerNames.has('tsconfig.json')) {
      evidence.push(withEvidencePrefix('tsconfig.json'));
      confidenceScore += 0.12;
    }

    if (markerNames.has('next.config.js') || markerNames.has('next.config.mjs')) {
      evidence.push(withEvidencePrefix('Next.js config'));
      confidenceScore += 0.05;
    }

    if (markerNames.has('vite.config.js') || markerNames.has('vite.config.mjs') || markerNames.has('vite.config.ts')) {
      evidence.push(withEvidencePrefix('Vite config'));
      confidenceScore += 0.08;
    }

    detectionCandidates.push({
      stackFileName: 'typescript.md',
      confidenceScore: Math.min(confidenceScore, 0.97),
      evidence,
    });
  }

  if (markerNames.has('pyproject.toml') || markerNames.has('requirements.txt')) {
    detectionCandidates.push({
      stackFileName: 'python.md',
      confidenceScore: markerNames.has('pyproject.toml') ? 0.96 : 0.78,
      evidence: markerNames.has('pyproject.toml')
        ? [withEvidencePrefix('pyproject.toml')]
        : [withEvidencePrefix('requirements.txt')],
    });
  }

  if (markerNames.has('pom.xml') || markerNames.has('build.gradle') || markerNames.has('build.gradle.kts')) {
    const evidence = [];
    if (markerNames.has('pom.xml')) evidence.push(withEvidencePrefix('pom.xml'));
    if (markerNames.has('build.gradle') || markerNames.has('build.gradle.kts')) evidence.push(withEvidencePrefix('Gradle build file'));
    detectionCandidates.push({
      stackFileName: 'java.md',
      confidenceScore: markerNames.has('pom.xml') ? 0.95 : 0.84,
      evidence,
    });
  }

  if (markerNames.has('composer.json')) {
    detectionCandidates.push({
      stackFileName: 'php.md',
      confidenceScore: 0.95,
      evidence: [withEvidencePrefix('composer.json')],
    });
  }

  if (markerNames.has('go.mod')) {
    detectionCandidates.push({
      stackFileName: 'go.md',
      confidenceScore: 0.96,
      evidence: [withEvidencePrefix('go.mod')],
    });
  }

  if (markerNames.has('Cargo.toml')) {
    detectionCandidates.push({
      stackFileName: 'rust.md',
      confidenceScore: 0.96,
      evidence: [withEvidencePrefix('Cargo.toml')],
    });
  }

  if (markerNames.has('Gemfile')) {
    detectionCandidates.push({
      stackFileName: 'ruby.md',
      confidenceScore: 0.95,
      evidence: [withEvidencePrefix('Gemfile')],
    });
  }

  const hasDotNetMarker = Array.from(markerNames).some((markerName) => markerName.endsWith('.sln') || markerName.endsWith('.csproj'));
  if (hasDotNetMarker) {
    detectionCandidates.push({
      stackFileName: 'csharp.md',
      confidenceScore: 0.95,
      evidence: [withEvidencePrefix('.sln or .csproj file')],
    });
  }

  if (markerNames.has('package.json') && (markerNames.has('android') || markerNames.has('ios') || markerNames.has('react-native.config.js'))) {
    detectionCandidates.push({
      stackFileName: 'react-native.md',
      confidenceScore: 0.9,
      evidence: [withEvidencePrefix('package.json'), withEvidencePrefix('mobile runtime markers')],
    });
  }

  if (markerNames.has('pubspec.yaml')) {
    detectionCandidates.push({
      stackFileName: 'flutter.md',
      confidenceScore: 0.94,
      evidence: [withEvidencePrefix('pubspec.yaml')],
    });
  }

  return detectionCandidates;
}

export async function detectUiScopeSignals({
  targetDirectoryPath,
  selectedStackFileName,
  selectedBlueprintFileName,
  packageManifest = null,
  projectScopeKey = null,
  projectScopeSourceLabel = 'project scope',
}) {
  const signalReasons = [];
  const markerNames = await collectProjectMarkers(targetDirectoryPath);
  const resolvedPackageManifest = packageManifest || await readPackageJsonIfExists(targetDirectoryPath);
  const nestedWorkspaceProjects = await collectNestedWorkspaceProjects(targetDirectoryPath);

  const normalizedProjectScopeKey = String(projectScopeKey || '').trim().toLowerCase();
  if (normalizedProjectScopeKey === 'frontend-only' || normalizedProjectScopeKey === 'both') {
    signalReasons.push(`${projectScopeSourceLabel}: ${normalizedProjectScopeKey}`);
  }

  const selectedStackKey = String(selectedStackFileName || '').trim().toLowerCase();
  if (selectedStackKey === 'react-native.md' || selectedStackKey === 'flutter.md') {
    signalReasons.push(`selected stack implies UI runtime: ${selectedStackKey}`);
  }

  const selectedBlueprintKey = String(selectedBlueprintFileName || '').trim().toLowerCase();
  if (selectedBlueprintKey.includes('frontend') || selectedBlueprintKey.includes('landing') || selectedBlueprintKey.includes('mobile-app')) {
    signalReasons.push(`selected blueprint implies UI scope: ${selectedBlueprintKey}`);
  }

  const rootUiSignals = analyzeUiSignalsForMarkerSet(markerNames, resolvedPackageManifest);
  signalReasons.push(...rootUiSignals.signalReasons);

  const nestedUiSignals = nestedWorkspaceProjects
    .map((nestedWorkspaceProject) => ({
      ...nestedWorkspaceProject,
      ...analyzeUiSignalsForMarkerSet(
        nestedWorkspaceProject.markerNames,
        nestedWorkspaceProject.packageManifest,
        `workspace ${nestedWorkspaceProject.relativePath}`
      ),
    }))
    .filter((nestedWorkspaceProject) => nestedWorkspaceProject.signalReasons.length > 0);

  for (const nestedUiSignal of nestedUiSignals) {
    signalReasons.push(...nestedUiSignal.signalReasons);
  }

  const detectedUiMarkers = Array.from(new Set([
    ...rootUiSignals.detectedUiMarkers,
    ...nestedUiSignals.flatMap((nestedUiSignal) => nestedUiSignal.detectedUiMarkers),
  ]));
  const detectedUiDependencies = Array.from(new Set([
    ...rootUiSignals.detectedUiDependencies,
    ...nestedUiSignals.flatMap((nestedUiSignal) => nestedUiSignal.detectedUiDependencies),
  ]));

  const hasStrongUiMarker = rootUiSignals.hasStrongUiMarker
    || nestedUiSignals.some((nestedUiSignal) => nestedUiSignal.hasStrongUiMarker);
  const hasUiDependencies = rootUiSignals.hasUiDependencies
    || nestedUiSignals.some((nestedUiSignal) => nestedUiSignal.hasUiDependencies);
  const hasStructuralUiMarkers = rootUiSignals.hasStructuralUiMarkers
    || nestedUiSignals.some((nestedUiSignal) => nestedUiSignal.hasStructuralUiMarkers);
  const isUiScopeLikely = signalReasons.length > 0
    && (hasStrongUiMarker || hasUiDependencies || hasStructuralUiMarkers || normalizedProjectScopeKey.length > 0);
  const preferredUiWorkspaceEntry = nestedUiSignals.find((nestedUiSignal) => (
    nestedUiSignal.hasStrongUiMarker
    || nestedUiSignal.hasUiDependencies
    || nestedUiSignal.hasStructuralUiMarkers
  )) || null;
  const frontendScanRootDirectoryPaths = (
    !rootUiSignals.hasStrongUiMarker
    && !rootUiSignals.hasUiDependencies
    && !rootUiSignals.hasStructuralUiMarkers
    && nestedUiSignals.length > 0
  )
    ? nestedUiSignals.map((nestedUiSignal) => nestedUiSignal.directoryPath)
    : [];
  const frontendEvidenceMetrics = isUiScopeLikely
    ? await collectFrontendEvidenceMetrics(targetDirectoryPath, markerNames, frontendScanRootDirectoryPaths)
    : null;

  return {
    isUiScopeLikely,
    signalReasons,
    detectedUiMarkers,
    detectedUiDependencies,
    frontendEvidenceMetrics,
    packageManifest: preferredUiWorkspaceEntry?.packageManifest || resolvedPackageManifest,
    workspaceUiEntries: nestedUiSignals.map((nestedUiSignal) => ({
      relativePath: nestedUiSignal.relativePath,
      detectedUiMarkers: nestedUiSignal.detectedUiMarkers,
      detectedUiDependencies: nestedUiSignal.detectedUiDependencies,
    })),
  };
}

export async function detectProjectContext(targetDirectoryPath) {
  const markerNames = await collectProjectMarkers(targetDirectoryPath);
  const nestedWorkspaceProjects = await collectNestedWorkspaceProjects(targetDirectoryPath);
  const detectionCandidates = [
    ...collectStackDetectionCandidates(markerNames),
    ...nestedWorkspaceProjects.flatMap((nestedWorkspaceProject) => (
      collectStackDetectionCandidates(
        nestedWorkspaceProject.markerNames,
        nestedWorkspaceProject.relativePath
      )
    )),
  ];
  const hasExistingProjectFiles = markerNames.size > 0;

  if (detectionCandidates.length === 0) {
    return {
      hasExistingProjectFiles,
      recommendedStackFileName: null,
      secondaryStackFileNames: [],
      recommendedBlueprintFileName: null,
      confidenceLabel: null,
      confidenceScore: 0,
      confidenceGap: 0,
      detectionReasoning: 'No known project markers were detected.',
      rankedCandidates: [],
      evidence: [],
    };
  }

  detectionCandidates.sort((leftCandidate, rightCandidate) => rightCandidate.confidenceScore - leftCandidate.confidenceScore);
  const strongestCandidate = detectionCandidates[0];
  const secondStrongestCandidate = detectionCandidates[1];
  const confidenceGap = secondStrongestCandidate
    ? Number((strongestCandidate.confidenceScore - secondStrongestCandidate.confidenceScore).toFixed(2))
    : Number(strongestCandidate.confidenceScore.toFixed(2));
  const isAmbiguous = secondStrongestCandidate
    && confidenceGap < 0.08;
  const confidenceLabel = strongestCandidate.confidenceScore >= 0.9
    ? 'high'
    : strongestCandidate.confidenceScore >= 0.78
      ? 'medium'
      : 'low';
  const evidence = isAmbiguous
    ? [...strongestCandidate.evidence, `multiple stack signals detected`]
    : strongestCandidate.evidence;
  const rankedCandidates = detectionCandidates.slice(0, 3).map((detectionCandidate) => ({
    stackFileName: detectionCandidate.stackFileName,
    confidenceScore: Number(detectionCandidate.confidenceScore.toFixed(2)),
    evidence: detectionCandidate.evidence,
  }));
  const secondaryStackFileNames = rankedCandidates
    .slice(1)
    .filter((rankedCandidate) => (strongestCandidate.confidenceScore - rankedCandidate.confidenceScore) < 0.08)
    .map((rankedCandidate) => rankedCandidate.stackFileName);
  const detectionReasoning = isAmbiguous
    ? `Top signal ${toTitleCase(strongestCandidate.stackFileName)} is close to ${toTitleCase(secondStrongestCandidate.stackFileName)} (confidence gap ${confidenceGap}).`
    : `Top signal ${toTitleCase(strongestCandidate.stackFileName)} won with confidence ${strongestCandidate.confidenceScore.toFixed(2)} from markers: ${strongestCandidate.evidence.join(', ') || 'none'}.`;

  return {
    hasExistingProjectFiles,
    recommendedStackFileName: strongestCandidate.stackFileName,
    secondaryStackFileNames,
    recommendedBlueprintFileName: BLUEPRINT_RECOMMENDATIONS[strongestCandidate.stackFileName] || null,
    confidenceLabel,
    confidenceScore: strongestCandidate.confidenceScore,
    confidenceGap,
    detectionReasoning,
    rankedCandidates,
    evidence,
  };
}

export function buildDetectionSummary(projectDetection) {
  if (!projectDetection.recommendedStackFileName) {
    return 'I did not find enough stack markers to auto-detect this project confidently.';
  }

  const readableEvidence = projectDetection.evidence.length > 0
    ? projectDetection.evidence.join(', ')
    : 'basic project markers';

  const confidenceGapSummary = typeof projectDetection.confidenceGap === 'number'
    ? ` Confidence gap: ${projectDetection.confidenceGap}.`
    : '';

  const secondaryStacksSummary = projectDetection.secondaryStackFileNames?.length
    ? ` Secondary stack signals: ${projectDetection.secondaryStackFileNames.map((stackFileName) => toTitleCase(stackFileName)).join(', ')}.`
    : '';

  return `This folder looks like ${toTitleCase(projectDetection.recommendedStackFileName)} with ${projectDetection.confidenceLabel} confidence based on ${readableEvidence}.${confidenceGapSummary}${secondaryStacksSummary}`;
}

export function formatDetectionCandidates(rankedCandidates) {
  if (!rankedCandidates?.length) {
    return 'No ranked candidates available.';
  }

  return rankedCandidates
    .map((candidate, candidateIndex) => {
      const evidenceSummary = candidate.evidence?.length ? candidate.evidence.join(', ') : 'no direct markers';
      return `${candidateIndex + 1}. ${toTitleCase(candidate.stackFileName)} (score ${candidate.confidenceScore}) via ${evidenceSummary}`;
    })
    .join('\n');
}
