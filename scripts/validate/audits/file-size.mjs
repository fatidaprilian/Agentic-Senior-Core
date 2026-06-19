#!/usr/bin/env node
// @ts-check

/**
 * audit-file-size.mjs
 *
 * Enforces the 500 LOC threshold on production source files. Files that exceed
 * the threshold are hard failures unless they declare a justified exception
 * with a `// @file-size-exception: <reason>` marker in their first 5 lines.
 *
 * Scope:
 *   lib/     all .mjs/.js files
 *   scripts/ all .mjs/.js files
 *   bin/     all .js/.mjs files
 *
 * Excluded:
 *   *.test.mjs / *.test.js (test files have different size economics)
 *
 * Usage:
 *   node scripts/audit-file-size.mjs            (human-readable + machine line)
 *   node scripts/audit-file-size.mjs --json     (JSON only)
 *
 * Exit codes:
 *   0 — all files within budget (or covered by exception)
 *   1 — at least one file exceeded the threshold without an exception marker
 */

import { readdirSync, readFileSync, statSync } from 'node:fs';
import { dirname, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const SCRIPT_FILE_PATH = fileURLToPath(import.meta.url);
const REPOSITORY_ROOT = resolve(dirname(SCRIPT_FILE_PATH), '../../..');

export const DEFAULT_LOC_THRESHOLD = 500;
const EXCEPTION_MARKER_PATTERN = /^\s*(?:\/\/|\*)\s*@file-size-exception:\s*(.+?)\s*(?:\*\/\s*)?$/;
const EXCEPTION_MARKER_LOOKAHEAD_LINES = 5;
const SCAN_ROOTS = ['lib', 'scripts', 'bin'];
const SCAN_EXTENSIONS = new Set(['.mjs', '.js']);
const SKIP_DIRECTORY_NAMES = new Set(['node_modules', '.git', '.agentic-backup', '.benchmarks']);

const ARGS = new Set(process.argv.slice(2));
const JSON_ONLY = ARGS.has('--json');

function isTestFile(filePath) {
  const baseName = filePath.split(/[\\/]/).pop();
  return /\.test\.(mjs|js)$/.test(baseName);
}

function collectSourceFiles(scanRootName) {
  const collected = [];
  const scanRootAbsolutePath = join(REPOSITORY_ROOT, scanRootName);

  function walk(currentPath) {
    let entries;
    try {
      entries = readdirSync(currentPath, { withFileTypes: true });
    } catch {
      return;
    }

    for (const entry of entries) {
      if (SKIP_DIRECTORY_NAMES.has(entry.name)) {
        continue;
      }

      const entryAbsolute = join(currentPath, entry.name);
      if (entry.isDirectory()) {
        walk(entryAbsolute);
        continue;
      }

      if (!entry.isFile()) {
        continue;
      }

      const dotIndex = entry.name.lastIndexOf('.');
      const extension = dotIndex >= 0 ? entry.name.slice(dotIndex) : '';
      if (!SCAN_EXTENSIONS.has(extension)) {
        continue;
      }

      if (isTestFile(entryAbsolute)) {
        continue;
      }

      collected.push(entryAbsolute);
    }
  }

  try {
    statSync(scanRootAbsolutePath);
  } catch {
    return collected;
  }

  walk(scanRootAbsolutePath);
  return collected;
}

function detectExceptionMarker(sourceLines) {
  const lookahead = sourceLines.slice(0, EXCEPTION_MARKER_LOOKAHEAD_LINES);
  for (const line of lookahead) {
    const match = line.match(EXCEPTION_MARKER_PATTERN);
    if (match) {
      return match[1].trim();
    }
  }
  return null;
}

function inspectFile(filePath, threshold) {
  const sourceText = readFileSync(filePath, 'utf8');
  const lines = sourceText.split(/\r?\n/);
  const lineCount = lines.length;
  const overThreshold = lineCount > threshold;
  const exceptionReason = overThreshold ? detectExceptionMarker(lines) : null;
  const passed = !overThreshold || Boolean(exceptionReason);

  return {
    filePath: relative(REPOSITORY_ROOT, filePath).replace(/\\/g, '/'),
    lineCount,
    threshold,
    overThreshold,
    exceptionReason,
    passed,
  };
}

export function runAuditFileSize({ threshold = DEFAULT_LOC_THRESHOLD } = {}) {
  const scannedFiles = SCAN_ROOTS.flatMap((scanRootName) => collectSourceFiles(scanRootName));
  const inspections = scannedFiles.map((filePath) => inspectFile(filePath, threshold));
  const violations = inspections.filter((entry) => entry.overThreshold && !entry.exceptionReason);
  const exemptedFiles = inspections.filter((entry) => entry.overThreshold && entry.exceptionReason);

  return {
    auditName: 'audit-file-size',
    reportVersion: '1.0.0',
    generatedAt: new Date().toISOString(),
    threshold,
    scannedFileCount: inspections.length,
    overThresholdCount: inspections.filter((entry) => entry.overThreshold).length,
    violationCount: violations.length,
    exemptedCount: exemptedFiles.length,
    violations: violations.map((entry) => ({
      filePath: entry.filePath,
      lineCount: entry.lineCount,
    })),
    exemptedFiles: exemptedFiles.map((entry) => ({
      filePath: entry.filePath,
      lineCount: entry.lineCount,
      reason: entry.exceptionReason,
    })),
    passed: violations.length === 0,
  };
}


