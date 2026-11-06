import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { execSync } from 'node:child_process';

const SOURCE_EXTENSIONS = new Set([
  'js', 'mjs', 'cjs', 'jsx', 'ts', 'mts', 'cts', 'tsx',
  'py', 'go', 'rs', 'java', 'kt', 'cs', 'rb', 'php', 'swift', 'vue', 'svelte',
]);

const DEFAULT_IGNORE_DIRS = new Set([
  '.git', 'node_modules', 'dist', 'build', '.next', '.nuxt', '.expo',
  'coverage', '.storybook', 'migrations', 'generated', 'vendor', 'target',
  '.venv', 'venv', '__pycache__', '.asc', '.agents', '.opencode', '.roo', '.kilo',
  'tests', 'test', '__tests__', 'android', 'ios',
]);

const FRAMEWORK_CONVENTIONAL_BASENAMES = new Set([
  'page.tsx', 'page.jsx', 'page.ts', 'page.js',
  'layout.tsx', 'layout.jsx', 'layout.ts', 'layout.js',
  'loading.tsx', 'loading.jsx', 'loading.ts', 'loading.js',
  'error.tsx', 'error.jsx', 'error.ts', 'error.js',
  'not-found.tsx', 'not-found.jsx', 'not-found.ts', 'not-found.js',
  'template.tsx', 'template.jsx', 'template.ts', 'template.js',
  'route.tsx', 'route.ts', 'route.js',
  'default.tsx', 'default.jsx', 'default.ts', 'default.js',
  'root.tsx', 'root.jsx', 'root.ts', 'root.js',
  '_layout.tsx', '_layout.jsx', '_layout.ts', '_layout.js',
  'index.vue', 'app.vue',
  '+page.svelte', '+layout.svelte', '+page.server.ts', '+page.server.js',
  '+error.svelte', '+layout.server.ts', '+layout.server.js',
  'index.ts', 'index.js', 'index.tsx', 'index.jsx', 'index.mjs',
  'types.ts', 'types.d.ts',
  'tailwind.config.ts', 'tailwind.config.js', 'tailwind.config.mjs',
  'postcss.config.js', 'postcss.config.mjs', 'postcss.config.cjs',
  'next.config.ts', 'next.config.js', 'next.config.mjs',
  'vite.config.ts', 'vite.config.js', 'vite.config.mjs',
  'tsconfig.json', 'jest.config.ts', 'jest.config.js', 'vitest.config.ts',
]);

const FRAMEWORK_CONVENTIONAL_SUFFIXES = [
  '.component.ts', '.component.js', '.module.ts', '.service.ts',
  '.pipe.ts', '.directive.ts', '.guard.ts', '.resolver.ts',
  '.stories.tsx', '.stories.jsx', '.stories.ts', '.stories.js',
  '.spec.ts', '.spec.tsx', '.spec.js', '.spec.jsx', '.spec.mjs',
  '.test.ts', '.test.tsx', '.test.js', '.test.jsx', '.test.mjs',
];

function isFrameworkConventional(basename) {
  if (FRAMEWORK_CONVENTIONAL_BASENAMES.has(basename)) return true;
  return FRAMEWORK_CONVENTIONAL_SUFFIXES.some(suffix => basename.endsWith(suffix));
}

function loadDedupConfig(cwd) {
  const candidates = [
    path.join(cwd, '.asc', 'dedup-config.json'),
    path.join(cwd, '.agents', 'dedup-config.json'),
  ];
  for (const file of candidates) {
    try {
      if (fs.existsSync(file)) {
        return JSON.parse(fs.readFileSync(file, 'utf8'));
      }
    } catch {
      // Ignore malformed config and use defaults
    }
  }
  return {};
}

function hasInlineIgnore(content) {
  if (content.includes('jscpd:ignore-start')) return true;
  const match = content.match(/asc-dedup:ignore\s*--\s*(.+)/i);
  return Boolean(match && match[1] && match[1].trim().length > 0);
}

function isAllowedDuplicatePair(fileA, fileB, allowedDuplicates = [], cwd = process.cwd()) {
  if (!Array.isArray(allowedDuplicates) || allowedDuplicates.length === 0) return false;
  const normA = path.resolve(cwd, fileA).replace(/\\/g, '/').toLowerCase();
  const normB = path.resolve(cwd, fileB).replace(/\\/g, '/').toLowerCase();
  const baseA = path.basename(fileA).toLowerCase();
  const baseB = path.basename(fileB).toLowerCase();

  for (const pair of allowedDuplicates) {
    if (!Array.isArray(pair) || pair.length < 2) continue;
    const p0Norm = path.resolve(cwd, pair[0]).replace(/\\/g, '/').toLowerCase();
    const p1Norm = path.resolve(cwd, pair[1]).replace(/\\/g, '/').toLowerCase();
    const p0Base = path.basename(pair[0]).toLowerCase();
    const p1Base = path.basename(pair[1]).toLowerCase();
    if ((normA === p0Norm && normB === p1Norm) || (normA === p1Norm && normB === p0Norm)) return true;
    if ((baseA === p0Base && baseB === p1Base) || (baseA === p1Base && baseB === p0Base)) return true;
  }
  return false;
}

function collectSourceFiles(targetPath, ignoreDirs, includeTests = false) {
  const files = [];
  const resolved = path.resolve(targetPath);
  if (!fs.existsSync(resolved)) return files;

  const stat = fs.statSync(resolved);
  if (stat.isFile()) {
    const ext = path.extname(resolved).slice(1).toLowerCase();
    if (SOURCE_EXTENSIONS.has(ext)) files.push(resolved);
    return files;
  }

  const walk = (dir) => {
    let entries;
    try {
      entries = fs.readdirSync(dir, { withFileTypes: true });
    } catch {
      return;
    }
    for (const entry of entries) {
      if (entry.isDirectory()) {
        if (ignoreDirs.has(entry.name)) continue;
        if (!includeTests && ['tests', 'test', '__tests__'].includes(entry.name)) continue;
        walk(path.join(dir, entry.name));
      } else if (entry.isFile()) {
        const ext = path.extname(entry.name).slice(1).toLowerCase();
        if (!SOURCE_EXTENSIONS.has(ext)) continue;
        files.push(path.join(dir, entry.name));
      }
    }
  };

  walk(resolved);
  return files;
}

/**
 * Extracts normalized meaningful source lines while retaining original 1-based line numbers
 * and counting lexical tokens to avoid trivial closing-brace false positives.
 */
function normalizeSourceLines(content) {
  const rawLines = content.split(/\r?\n/);
  const result = [];
  let inBlockComment = false;

  for (let idx = 0; idx < rawLines.length; idx++) {
    let line = rawLines[idx];

    if (inBlockComment) {
      const endIdx = line.indexOf('*/');
      if (endIdx === -1) continue;
      line = line.slice(endIdx + 2);
      inBlockComment = false;
    }

    // Remove inline /* ... */ segments
    line = line.replace(/\/\*[\s\S]*?\*\//g, ' ');
    const openBlock = line.indexOf('/*');
    if (openBlock !== -1) {
      line = line.slice(0, openBlock);
      inBlockComment = true;
    }

    // Strip // or # full-line comments (avoid stripping URLs http://)
    line = line.replace(/(^|\s)\/\/.*$/, '$1');
    if (/^\s*#(?!!)/.test(line)) continue;

    const trimmed = line.trim().replace(/\s+/g, ' ');
    if (!trimmed) continue;
    // Skip import/require/package header lines so shared imports do not trigger clone noise
    if (/^(?:import\s|export\s+\*\s+from\s|from\s+\S+\s+import\s|package\s|using\s)/.test(trimmed)) {
      continue;
    }

    const tokens = trimmed.match(/[A-Za-z0-9_$]+|[{}()[\];.,<>=!+-/*%&|^~?:]+/g) || [];
    // Skip lines that are purely punctuation like `}` or `);` when standalone, keep token count accurate
    result.push({
      lineNo: idx + 1,
      norm: trimmed,
      tokenCount: tokens.length,
    });
  }

  return result;
}

/**
 * Built-in zero-dependency structural clone scanner.
 */
export function scanCodeClones(targetPath, options = {}) {
  const cwd = options.cwd || process.cwd();
  const config = loadDedupConfig(cwd);
  const minLines = options.minLines ?? config.minLines ?? 12;
  const minTokens = options.minTokens ?? config.minTokens ?? Math.max(30, minLines * 3);
  const includeTests = Boolean(options.includeTests);

  const ignoreDirs = new Set([
    ...DEFAULT_IGNORE_DIRS,
    ...(Array.isArray(config.ignoreDirs) ? config.ignoreDirs : []),
  ]);
  if (includeTests) {
    ignoreDirs.delete('tests');
    ignoreDirs.delete('test');
    ignoreDirs.delete('__tests__');
  }

  const files = collectSourceFiles(targetPath, ignoreDirs, includeTests);
  const parsedFiles = [];

  for (const filePath of files) {
    let content;
    try {
      content = fs.readFileSync(filePath, 'utf8');
    } catch {
      continue;
    }
    if (hasInlineIgnore(content)) continue;
    const normLines = normalizeSourceLines(content);
    if (normLines.length < minLines) continue;
    parsedFiles.push({
      filePath,
      relPath: path.relative(cwd, filePath).replace(/\\/g, '/') || path.basename(filePath),
      basename: path.basename(filePath),
      lines: normLines,
    });
  }

  // Map window fingerprint -> list of occurrences { fileIdx, normIdx }
  const windowIndex = new Map();

  for (let fIdx = 0; fIdx < parsedFiles.length; fIdx++) {
    const { lines } = parsedFiles[fIdx];
    let rollingTokens = 0;
    for (let k = 0; k < minLines; k++) {
      rollingTokens += lines[k].tokenCount;
    }

    for (let i = 0; i <= lines.length - minLines; i++) {
      if (i > 0) {
        rollingTokens += lines[i + minLines - 1].tokenCount - lines[i - 1].tokenCount;
      }
      if (rollingTokens >= minTokens) {
        let key = lines[i].norm;
        for (let k = 1; k < minLines; k++) {
          key += '\n' + lines[i + k].norm;
        }
        let bucket = windowIndex.get(key);
        if (!bucket) {
          bucket = [];
          windowIndex.set(key, bucket);
        }
        bucket.push({ fIdx, startIdx: i });
      }
    }
  }

  // Track visited starting pairs so contiguous windows merge into maximal clone blocks
  const visitedPairs = new Set();
  const clones = [];

  for (const occurrences of windowIndex.values()) {
    if (occurrences.length < 2 || occurrences.length > 50) continue;

    for (let a = 0; a < occurrences.length; a++) {
      for (let b = a + 1; b < occurrences.length; b++) {
        const occA = occurrences[a];
        const occB = occurrences[b];

        // Avoid overlapping self-matches in the same file
        if (occA.fIdx === occB.fIdx && Math.abs(occA.startIdx - occB.startIdx) < minLines) {
          continue;
        }

        const prevPairKey = `${occA.fIdx}:${occA.startIdx - 1}|${occB.fIdx}:${occB.startIdx - 1}`;
        if (visitedPairs.has(prevPairKey)) {
          visitedPairs.add(`${occA.fIdx}:${occA.startIdx}|${occB.fIdx}:${occB.startIdx}`);
          continue;
        }

        const fileA = parsedFiles[occA.fIdx];
        const fileB = parsedFiles[occB.fIdx];

        if (
          occA.fIdx !== occB.fIdx
          && fileA.basename === fileB.basename
          && isFrameworkConventional(fileA.basename)
        ) {
          continue;
        }

        if (
          occA.fIdx !== occB.fIdx
          && isAllowedDuplicatePair(fileA.filePath, fileB.filePath, config.allowedDuplicates, cwd)
        ) {
          continue;
        }

        // Extend clone span maximally forward
        let length = minLines;
        while (
          occA.startIdx + length < fileA.lines.length
          && occB.startIdx + length < fileB.lines.length
          && (occA.fIdx !== occB.fIdx || occA.startIdx + length < occB.startIdx)
          && fileA.lines[occA.startIdx + length].norm === fileB.lines[occB.startIdx + length].norm
        ) {
          visitedPairs.add(`${occA.fIdx}:${occA.startIdx + (length - minLines + 1)}|${occB.fIdx}:${occB.startIdx + (length - minLines + 1)}`);
          length++;
        }
        visitedPairs.add(`${occA.fIdx}:${occA.startIdx}|${occB.fIdx}:${occB.startIdx}`);

        let tokens = 0;
        for (let k = 0; k < length; k++) {
          tokens += fileA.lines[occA.startIdx + k].tokenCount;
        }

        const snippetSignature = fileA.lines
          .slice(occA.startIdx, occA.startIdx + Math.min(length, minLines))
          .map(l => l.norm)
          .join('\n');

        clones.push({
          signature: snippetSignature,
          normalizedLines: length,
          tokens,
          first: {
            file: fileA.relPath,
            startLine: fileA.lines[occA.startIdx].lineNo,
            endLine: fileA.lines[occA.startIdx + length - 1].lineNo,
          },
          second: {
            file: fileB.relPath,
            startLine: fileB.lines[occB.startIdx].lineNo,
            endLine: fileB.lines[occB.startIdx + length - 1].lineNo,
          },
        });
      }
    }
  }

  // Group by signature to detect Rule-of-Three (>= 3 distinct locations)
  const clusterMap = new Map();
  for (const clone of clones) {
    let cluster = clusterMap.get(clone.signature);
    if (!cluster) {
      cluster = {
        normalizedLines: clone.normalizedLines,
        tokens: clone.tokens,
        locations: new Map(),
      };
      clusterMap.set(clone.signature, cluster);
    }
    cluster.normalizedLines = Math.max(cluster.normalizedLines, clone.normalizedLines);
    cluster.tokens = Math.max(cluster.tokens, clone.tokens);
    const locKeyA = `${clone.first.file}:${clone.first.startLine}`;
    const locKeyB = `${clone.second.file}:${clone.second.startLine}`;
    cluster.locations.set(locKeyA, clone.first);
    cluster.locations.set(locKeyB, clone.second);
  }

  const clusters = Array.from(clusterMap.values())
    .map(c => ({
      instances: c.locations.size,
      ruleOfThreeViolation: c.locations.size >= 3,
      normalizedLines: c.normalizedLines,
      tokens: c.tokens,
      locations: Array.from(c.locations.values()),
    }))
    .sort((a, b) => (b.instances - a.instances) || (b.tokens - a.tokens));

  return {
    scannedFiles: files.length,
    analyzedFiles: parsedFiles.length,
    minLines,
    minTokens,
    mode: config.mode || 'advisory',
    clusters,
  };
}

function runOptionalJscpd(targetPath, minTokens) {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'asc-dedup-cli-'));
  const reportPath = path.join(tmpDir, 'jscpd-report.json');
  const binaries = ['bunx jscpd', 'npx --yes jscpd@5'];

  try {
    for (const bin of binaries) {
      try {
        execSync(`${bin} "${targetPath}" --min-tokens ${minTokens} --reporters json --silent --output "${tmpDir}"`, {
          stdio: 'pipe',
          timeout: 30000,
        });
      } catch {
        // jscpd may exit non-zero when threshold triggers even after writing report
      }
      if (fs.existsSync(reportPath)) {
        return JSON.parse(fs.readFileSync(reportPath, 'utf8'));
      }
    }
    return null;
  } finally {
    try {
      fs.rmSync(tmpDir, { recursive: true, force: true });
    } catch {
      // Ignore cleanup error
    }
  }
}

export async function runDedupCommand(args = []) {
  if (args.includes('--help') || args.includes('-h')) {
    console.log('Agentic Senior Core -- Code Clone & Duplication Scanner\n');
    console.log('Usage: asc dedup [path] [--min-lines <n>] [--min-tokens <n>] [--include-tests] [--strict] [--json] [--jscpd]\n');
    console.log('Options:');
    console.log('  --min-lines <n>   Minimum normalized lines per clone block (default: 12)');
    console.log('  --min-tokens <n>  Minimum lexical tokens per clone block (default: 36)');
    console.log('  --include-tests   Include test directories in scan');
    console.log('  --strict          Exit with code 1 if Rule-of-Three (>= 3 instances) clones are found');
    console.log('  --json            Emit machine-readable JSON report');
    console.log('  --jscpd           Delegate scan to external jscpd runner (bunx / npx --yes jscpd@5)');
    return;
  }

  let targetArg = '.';
  let minLines;
  let minTokens;
  const includeTests = args.includes('--include-tests');
  const strict = args.includes('--strict');
  const asJson = args.includes('--json');
  const useJscpd = args.includes('--jscpd');

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg === '--min-lines' && args[i + 1]) {
      minLines = Number.parseInt(args[++i], 10);
    } else if (arg === '--min-tokens' && args[i + 1]) {
      minTokens = Number.parseInt(args[++i], 10);
    } else if (!arg.startsWith('-')) {
      targetArg = arg;
    }
  }

  const startTime = performance.now();
  const resolvedTarget = path.resolve(process.cwd(), targetArg);

  if (!fs.existsSync(resolvedTarget)) {
    console.error(`Target path not found: ${resolvedTarget}`);
    process.exit(1);
  }

  if (useJscpd) {
    const externalReport = runOptionalJscpd(resolvedTarget, minTokens || 30);
    if (externalReport) {
      if (asJson) {
        console.log(JSON.stringify(externalReport, null, 2));
        return;
      }
      const dups = externalReport.duplicates || [];
      console.log(`ASC Dedup (jscpd) -- found ${dups.length} duplicate pair(s).`);
      for (const dup of dups.slice(0, 25)) {
        console.log(`  - ${dup.firstFile.name}:${dup.firstFile.start}-${dup.firstFile.end} <-> ${dup.secondFile.name}:${dup.secondFile.start}-${dup.secondFile.end} (${dup.lines} lines)`);
      }
      if (strict && dups.length > 0) process.exit(1);
      return;
    }
    console.warn('[asc dedup] External jscpd unavailable; using built-in zero-dependency clone engine.');
  }

  const report = scanCodeClones(resolvedTarget, {
    cwd: process.cwd(),
    minLines,
    minTokens,
    includeTests,
  });
  const elapsedMs = (performance.now() - startTime).toFixed(1);

  if (asJson) {
    console.log(JSON.stringify({ ...report, durationMs: Number(elapsedMs) }, null, 2));
  } else {
    console.log(`ASC Dedup -- scanned ${report.scannedFiles} source file(s) in ${elapsedMs}ms\n`);

    if (report.clusters.length === 0) {
      console.log('  Zero duplicate code blocks detected.');
    } else {
      const ruleOfThreeCount = report.clusters.filter(c => c.ruleOfThreeViolation).length;
      console.log(`  Found ${report.clusters.length} clone cluster(s) (${ruleOfThreeCount} Rule-of-Three violation(s) >= 3 instances):\n`);

      for (const cluster of report.clusters.slice(0, 20)) {
        const badge = cluster.ruleOfThreeViolation ? '[CONSOLIDATE >=3]' : '[ADVISORY 2x]';
        console.log(`  ${badge} ${cluster.normalizedLines} lines (${cluster.tokens} tokens) across ${cluster.instances} locations:`);
        for (const loc of cluster.locations) {
          console.log(`    - ${loc.file}:${loc.startLine}-${loc.endLine}`);
        }
      }
      if (report.clusters.length > 20) {
        console.log(`\n  ... and ${report.clusters.length - 20} additional cluster(s). Use --json for full output.`);
      }
    }
  }

  const hasBlockingViolation = report.clusters.some(c => c.ruleOfThreeViolation);
  if ((strict || report.mode === 'block') && hasBlockingViolation) {
    process.exit(1);
  }
}

