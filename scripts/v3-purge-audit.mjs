#!/usr/bin/env node

import { readdir, readFile, stat, writeFile, mkdir } from 'node:fs/promises';
import { dirname, extname, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const SCRIPT_FILE_PATH = fileURLToPath(import.meta.url);
const ROOT_DIR = resolve(dirname(SCRIPT_FILE_PATH), '..');
const STATE_OUTPUT_PATH = join(ROOT_DIR, '.agent-context', 'state', 'v3-purge-audit.json');

const STATIC_DIRECTORIES = [
  '.agent-context/stacks',
  '.agent-context/blueprints',
  '.agent-context/profiles',
];

const REFERENCE_TOKENS = [
  '.agent-context/stacks/',
  '.agent-context/blueprints/',
  '.agent-context/profiles/',
];

const NON_BLOCKING_REFERENCE_FILE_PATHS = new Set([
  '.agent-context/state/v3-purge-audit.json',
  'scripts/v3-purge-audit.mjs',
]);

const RUNTIME_BLOCKING_PATH_PATTERNS = [
  /^AGENTS\.md$/,
  /^\.instructions\.md$/,
  /^\.github\/copilot-instructions\.md$/,
  /^\.gemini\/instructions\.md$/,
  /^mcp\.json$/,
  /^lib\//,
  /^scripts\//,
  /^tests\//,
  /^\.agent-context\/prompts\//,
  /^\.agents\/workflows\//,
  /^\.agent-context\/review-checklists\//,
];

const SKIP_DIRECTORY_NAMES = new Set([
  '.git',
  'node_modules',
  '.benchmarks',
  '.agentic-backup',
]);

const TEXT_EXTENSIONS = new Set([
  '.md',
  '.mjs',
  '.js',
  '.json',
  '.yml',
  '.yaml',
  '.txt',
  '.ts',
  '.tsx',
  '.cjs',
  '.sh',
  '.ps1',
]);

function isTextCandidate(fileName) {
  const extension = extname(fileName).toLowerCase();
  return TEXT_EXTENSIONS.has(extension);
}

async function pathStatOrNull(targetPath) {
  try {
    return await stat(targetPath);
  } catch {
    return null;
  }
}

async function listAllFiles(directoryPath) {
  const discoveredFilePaths = [];

  async function walk(currentPath) {
    const directoryEntries = await readdir(currentPath, { withFileTypes: true });

    for (const entry of directoryEntries) {
      if (entry.isDirectory() && SKIP_DIRECTORY_NAMES.has(entry.name)) {
        continue;
      }

      const entryPath = join(currentPath, entry.name);

      if (entry.isDirectory()) {
        await walk(entryPath);
        continue;
      }

      if (!isTextCandidate(entry.name)) {
        continue;
      }

      discoveredFilePaths.push(entryPath);
    }
  }

  await walk(directoryPath);
  return discoveredFilePaths;
}

async function collectDirectoryEntryCount(absoluteDirectoryPath) {
  const directoryStats = await pathStatOrNull(absoluteDirectoryPath);
  if (!directoryStats || !directoryStats.isDirectory()) {
    return 0;
  }

  let fileCount = 0;

  async function walk(currentPath) {
    const directoryEntries = await readdir(currentPath, { withFileTypes: true });

    for (const entry of directoryEntries) {
      const entryPath = join(currentPath, entry.name);
      if (entry.isDirectory()) {
        await walk(entryPath);
        continue;
      }

      fileCount += 1;
    }
  }

  await walk(absoluteDirectoryPath);
  return fileCount;
}

async function runAudit() {
  const allTextFilePaths = await listAllFiles(ROOT_DIR);
  const matchesByFile = [];
  const tokenMatchCounts = Object.fromEntries(REFERENCE_TOKENS.map((token) => [token, 0]));
  let runtimeBlockingFileCount = 0;
  let documentationReferenceFileCount = 0;

  function isRuntimeBlockingFile(relativeFilePath) {
    return RUNTIME_BLOCKING_PATH_PATTERNS.some((pattern) => pattern.test(relativeFilePath));
  }

  for (const absoluteFilePath of allTextFilePaths) {
    const relativeFilePath = relative(ROOT_DIR, absoluteFilePath).replace(/\\/g, '/');

    if (NON_BLOCKING_REFERENCE_FILE_PATHS.has(relativeFilePath)) {
      continue;
    }

    const fileContent = await readFile(absoluteFilePath, 'utf8');

    const matchedTokens = REFERENCE_TOKENS.filter((token) => fileContent.includes(token));
    if (matchedTokens.length === 0) {
      continue;
    }

    for (const matchedToken of matchedTokens) {
      tokenMatchCounts[matchedToken] += 1;
    }

    const classification = isRuntimeBlockingFile(relativeFilePath)
      ? 'runtime-blocking'
      : 'documentation-reference';

    if (classification === 'runtime-blocking') {
      runtimeBlockingFileCount += 1;
    } else {
      documentationReferenceFileCount += 1;
    }

    matchesByFile.push({
      filePath: relativeFilePath,
      matchedTokens,
      classification,
    });
  }

  const directoryAudit = [];
  for (const relativeDirectoryPath of STATIC_DIRECTORIES) {
    const absoluteDirectoryPath = join(ROOT_DIR, relativeDirectoryPath);
    const directoryStat = await pathStatOrNull(absoluteDirectoryPath);

    directoryAudit.push({
      path: relativeDirectoryPath,
      exists: Boolean(directoryStat && directoryStat.isDirectory()),
      fileCount: await collectDirectoryEntryCount(absoluteDirectoryPath),
    });
  }

  const report = {
    generatedAt: new Date().toISOString(),
    auditName: 'v3-purge-audit',
    source: 'working-tree',
    deletionCandidates: directoryAudit,
    referenceSummary: {
      scannedTextFileCount: allTextFilePaths.length,
      blockingFileCount: matchesByFile.length,
      runtimeBlockingFileCount,
      documentationReferenceFileCount,
      tokenMatchCounts,
    },
    blockingReferences: matchesByFile,
    readyForMassDeletion: runtimeBlockingFileCount === 0,
    nextActions: runtimeBlockingFileCount === 0
      ? [
        documentationReferenceFileCount === 0
          ? 'No runtime blockers detected. Mass deletion can proceed after explicit user confirmation.'
          : 'No runtime blockers detected. Optional docs cleanup can be done after explicit user confirmation for mass deletion.',
      ]
      : [
        'Refactor blocking references before removing static directories.',
        'Rerun `npm run audit:v3-purge` and require readyForMassDeletion=true before deletion.',
      ],
  };

  await mkdir(dirname(STATE_OUTPUT_PATH), { recursive: true });
  await writeFile(STATE_OUTPUT_PATH, JSON.stringify(report, null, 2) + '\n', 'utf8');

  console.log(JSON.stringify(report, null, 2));

  if (process.argv.includes('--strict') && !report.readyForMassDeletion) {
    process.exitCode = 1;
  }
}

runAudit().catch((error) => {
  console.error('[FATAL] v3-purge-audit failed');
  console.error(error instanceof Error ? error.stack : String(error));
  process.exitCode = 1;
});
