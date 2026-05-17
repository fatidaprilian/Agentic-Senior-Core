#!/usr/bin/env node
// @ts-check

/**
 * audit-caching-scope-hygiene.mjs
 *
 * Phase 5 drift catcher. Scans user-facing surfaces (README, AGENTS.md, FAQ,
 * integration playbook, CHANGELOG) for caching numerical claims and verifies
 * that each claim is integration-scoped per `docs/architecture/decisions-foundation.md`
 * D4 "Per-Tool Caching Scope Matrix".
 *
 * The rule: never publish a single universal "X% caching saving" figure that
 * mixes integration modes. Every numerical caching saving claim on a public
 * surface must either:
 *   1. be in a clearly-scoped paragraph that names the integration mode
 *      (direct API, Claude Code SDK programmatic, Cursor, Windsurf, Codex CLI,
 *      Kiro, IDE wrapper) within +/- 600 characters of the figure, OR
 *   2. live in a documented exempt context (Phase 1 aggregate-cap CHANGELOG
 *      rationale, archived plan files under docs/archive/, benchmark JSON
 *      under benchmarks/results/, the canonical D4 matrix itself).
 */

import { existsSync, readFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const SCRIPT_FILE_PATH = fileURLToPath(import.meta.url);
const REPOSITORY_ROOT = resolve(dirname(SCRIPT_FILE_PATH), '..');
const ARGS = new Set(process.argv.slice(2));
const JSON_ONLY = ARGS.has('--json');

const PUBLIC_SURFACES = [
  'README.md',
  'AGENTS.md',
  'docs/faq.md',
  'docs/integration-playbook.md',
  'docs/doc-index.md',
  'CHANGELOG.md',
];

// Numerical caching saving claims this audit scans for. Pattern is intentionally
// strict: a digit-prefixed percent paired with an action verb or saving noun,
// or a bare 89.31%-style figure within a cache-keyword window.
const SAVING_CLAIM_PATTERNS = [
  // "X% reduction|saving|off|cheaper"
  /\b(\d{1,3}(?:\.\d+)?)\s*%\s*(?:effective[- ]token\s+)?(?:reduction|saving|savings|off|cheaper)\b/gi,
  // "saves|cuts|reduces|delivers up to X%" (cache context check applied below)
  /\b(?:save[sd]?|cut[s]?|reduce[sd]?|deliver[sd]?)\s+(?:up\s+to\s+)?(\d{1,3}(?:\.\d+)?)\s*%/gi,
  // "up to X% ... cache"
  /\b(?:up to|approximately|about|~)\s*(\d{1,3}(?:\.\d+)?)\s*%[^.\n]{0,80}(?:cach|warm|prompt[- ]cach)/gi,
  // "cache ... X% reduction|saving"
  /\bcach[a-z]*[^.\n]{0,80}\b(\d{1,3}(?:\.\d+)?)\s*%\s*(?:reduction|saving|savings|off)/gi,
  // bare two-decimal figures like 89.31% (cache context check applied below)
  /\b(\d{2,3}\.\d{2})\s*%/g,
];

// Patterns at these indices apply a cache-context window check before counting.
const CONTEXT_GATED_PATTERN_INDEXES = new Set([1, 4]);

const INTEGRATION_MODE_KEYWORDS = [
  'direct provider api',
  'direct api',
  'direct anthropic',
  'direct openai',
  'direct gemini',
  'claude code sdk',
  'claude code cli',
  'cursor',
  'windsurf',
  'codex cli',
  'codex / openai',
  'kiro',
  'ide wrapper',
  'ide wrappers',
  'integration mode',
  'integration_mode',
  'per-tool caching',
  'per-integration',
  'per integration',
  'cache_control',
];

const CACHE_CONTEXT_KEYWORDS = [
  'cach',
  'warm',
  'prompt-cach',
  'prompt cach',
  'cache_control',
];

const CONTEXT_WINDOW_RADIUS = 600;

function readSurface(rootDir, relativePath, sourceOverrides) {
  if (sourceOverrides && Object.prototype.hasOwnProperty.call(sourceOverrides, relativePath)) {
    return String(sourceOverrides[relativePath]);
  }
  const absolutePath = join(rootDir, relativePath);
  if (!existsSync(absolutePath)) {
    return null;
  }
  return readFileSync(absolutePath, 'utf8');
}

function findCachingClaimMatches(sourceText) {
  /** @type {{index: number, matchedText: string, percent: string}[]} */
  const matches = [];
  for (let patternIndex = 0; patternIndex < SAVING_CLAIM_PATTERNS.length; patternIndex += 1) {
    const pattern = SAVING_CLAIM_PATTERNS[patternIndex];
    pattern.lastIndex = 0;
    let result;
    // eslint-disable-next-line no-cond-assign
    while ((result = pattern.exec(sourceText)) !== null) {
      const matchedText = result[0];
      const percent = result[1] || '';
      const index = result.index;

      // For context-gated patterns, confirm there is a cache keyword within
      // the context window before counting this as a caching claim.
      if (CONTEXT_GATED_PATTERN_INDEXES.has(patternIndex)) {
        const start = Math.max(0, index - CONTEXT_WINDOW_RADIUS);
        const end = Math.min(sourceText.length, index + matchedText.length + CONTEXT_WINDOW_RADIUS);
        const window = sourceText.slice(start, end).toLowerCase();
        const hasCacheContext = CACHE_CONTEXT_KEYWORDS.some((keyword) => window.includes(keyword));
        if (!hasCacheContext) {
          continue;
        }
      }

      matches.push({ index, matchedText, percent });
    }
  }

  // Deduplicate overlapping matches (same percent within a few chars).
  matches.sort((a, b) => a.index - b.index);
  /** @type {{index: number, matchedText: string, percent: string}[]} */
  const deduped = [];
  for (const match of matches) {
    const last = deduped[deduped.length - 1];
    if (last && Math.abs(last.index - match.index) <= 8 && last.percent === match.percent) {
      continue;
    }
    deduped.push(match);
  }
  return deduped;
}

function extractContextWindow(sourceText, index, matchLength) {
  const start = Math.max(0, index - CONTEXT_WINDOW_RADIUS);
  const end = Math.min(sourceText.length, index + matchLength + CONTEXT_WINDOW_RADIUS);
  return sourceText.slice(start, end);
}

function hasIntegrationModeMarker(contextWindow) {
  const normalized = contextWindow.toLowerCase();
  return INTEGRATION_MODE_KEYWORDS.some((keyword) => normalized.includes(keyword));
}

function lineNumberFromIndex(sourceText, charIndex) {
  let line = 1;
  for (let i = 0; i < charIndex && i < sourceText.length; i += 1) {
    if (sourceText[i] === '\n') {
      line += 1;
    }
  }
  return line;
}

export function runCachingScopeHygieneAudit(options = {}) {
  const rootDir = options.rootDir ? resolve(String(options.rootDir)) : REPOSITORY_ROOT;
  const sourceOverrides = options.sourceOverrides || null;
  const surfaceList = options.surfaceList || PUBLIC_SURFACES;
  const violations = [];
  const surfaceReports = [];
  let totalClaims = 0;

  for (const surfacePath of surfaceList) {
    const sourceText = readSurface(rootDir, surfacePath, sourceOverrides);
    if (sourceText === null) {
      continue;
    }

    const claims = findCachingClaimMatches(sourceText);
    totalClaims += claims.length;
    /** @type {{percent: string, line: number, scoped: boolean}[]} */
    const claimReports = [];

    for (const claim of claims) {
      const contextWindow = extractContextWindow(sourceText, claim.index, claim.matchedText.length);
      const scoped = hasIntegrationModeMarker(contextWindow);
      const lineNumber = lineNumberFromIndex(sourceText, claim.index);

      claimReports.push({
        percent: claim.percent,
        line: lineNumber,
        scoped,
      });

      if (!scoped) {
        violations.push({
          file: surfacePath,
          line: lineNumber,
          kind: 'caching-claim.missing-integration-scope',
          detail: `Caching saving claim "${claim.matchedText.trim()}" lacks an integration-mode marker within +/- ${CONTEXT_WINDOW_RADIUS} chars. Add a per-tool / direct-API / IDE-wrapper label, or move the figure under a clearly-scoped paragraph. Source of truth: docs/architecture/decisions-foundation.md D4.`,
        });
      }
    }

    surfaceReports.push({
      path: surfacePath,
      claimCount: claims.length,
      scopedCount: claimReports.filter((claim) => claim.scoped).length,
      unscopedCount: claimReports.filter((claim) => !claim.scoped).length,
      claims: claimReports,
    });
  }

  return {
    auditName: 'audit-caching-scope-hygiene',
    reportVersion: '1.0.0',
    generatedAt: new Date().toISOString(),
    surfaceCount: surfaceReports.length,
    totalClaimCount: totalClaims,
    violationCount: violations.length,
    passed: violations.length === 0,
    surfaces: surfaceReports,
    violations,
  };
}

function main() {
  const report = runCachingScopeHygieneAudit();

  if (JSON_ONLY) {
    process.stdout.write(`${JSON.stringify(report, null, 2)}\n`);
    process.exit(report.passed ? 0 : 1);
  }

  console.log('===============================================');
  console.log('  audit:caching-scope-hygiene');
  console.log('===============================================');
  console.log(`  Public surfaces scanned: ${report.surfaceCount}`);
  console.log(`  Caching saving claims:    ${report.totalClaimCount}`);
  console.log('');

  if (report.passed) {
    console.log('  All caching saving claims on public surfaces are integration-scoped.');
    process.stderr.write(`AUDIT_CACHING_SCOPE_HYGIENE_REPORT: ${JSON.stringify({ passed: true, surfaceCount: report.surfaceCount, totalClaimCount: report.totalClaimCount })}\n`);
    process.exit(0);
  }

  console.log('  Violations:');
  for (const violation of report.violations) {
    console.log(`    [${violation.kind}] ${violation.file}:${violation.line} ${violation.detail}`);
  }
  console.log('');
  console.log(`  ${report.violationCount} violation(s) found.`);
  process.stderr.write(`AUDIT_CACHING_SCOPE_HYGIENE_REPORT: ${JSON.stringify({ passed: false, violationCount: report.violationCount })}\n`);
  process.exit(1);
}

if (process.argv[1] && (import.meta.url === `file://${process.argv[1].replace(/\\/g, '/')}` || process.argv[1].endsWith('audit-caching-scope-hygiene.mjs'))) {
  main();
}
