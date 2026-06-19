// @ts-check

/**
 * Tests for the Phase 5 caching-scope hygiene audit. The audit guards public
 * surfaces against universal "X% caching saving" claims that mix integration
 * modes (direct API + IDE wrappers).
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';

import { runCachingScopeHygieneAudit } from '../scripts/validate/audits/caching-scope-hygiene.mjs';

const SCOPED_BLURB = [
  '# Test surface',
  '',
  'For direct provider API integration with Anthropic, the documented warm-cache',
  'effective reduction is 89.31% based on cache_control multipliers. IDE wrappers',
  'such as Cursor, Windsurf, Codex CLI, and Kiro abstract the caching boundary, so',
  'this saving is not measurable from the rules pack side for those integrations.',
  '',
].join('\n');

const UNSCOPED_BLURB = [
  '# Marketing-style page',
  '',
  'v4 saves 89% on caching across every supported workflow. This figure has no',
  'qualifier nearby and the file does not specify which tool or request path it',
  'applies to. The audit must catch this before any release publishes the claim.',
  '',
].join('\n');

const NO_CLAIM_BLURB = [
  '# Generic doc',
  '',
  'This file mentions caching architecture and the bounded reflection block but',
  'does not include any numerical caching saving figure. It should not flag.',
  '',
].join('\n');

test('runCachingScopeHygieneAudit passes when caching claim is integration-scoped', () => {
  const report = runCachingScopeHygieneAudit({
    sourceOverrides: {
      'README.md': SCOPED_BLURB,
    },
    surfaceList: ['README.md'],
  });

  assert.equal(report.passed, true);
  assert.equal(report.violationCount, 0);
  assert.ok(report.totalClaimCount >= 1, 'expected at least one caching claim to be detected');
  const [surface] = report.surfaces;
  assert.equal(surface.scopedCount, surface.claimCount);
  assert.equal(surface.unscopedCount, 0);
});

test('runCachingScopeHygieneAudit fails when caching claim has no integration scope', () => {
  const report = runCachingScopeHygieneAudit({
    sourceOverrides: {
      'README.md': UNSCOPED_BLURB,
    },
    surfaceList: ['README.md'],
  });

  assert.equal(report.passed, false);
  assert.ok(report.violationCount >= 1);
  assert.equal(report.violations[0].kind, 'caching-claim.missing-integration-scope');
  assert.equal(report.violations[0].file, 'README.md');
});

test('runCachingScopeHygieneAudit ignores files that contain no caching numerical claim', () => {
  const report = runCachingScopeHygieneAudit({
    sourceOverrides: {
      'docs/faq.md': NO_CLAIM_BLURB,
    },
    surfaceList: ['docs/faq.md'],
  });

  assert.equal(report.passed, true);
  assert.equal(report.violationCount, 0);
  assert.equal(report.totalClaimCount, 0);
});

test('runCachingScopeHygieneAudit treats unrelated digit-percent strings as non-claims', () => {
  const sourceText = [
    '# Roadmap',
    '',
    'We aim for >=80% test coverage and >=9.0 OSSF Scorecard. These percentages are',
    'unrelated to caching numbers and should not trip the audit.',
    '',
  ].join('\n');

  const report = runCachingScopeHygieneAudit({
    sourceOverrides: {
      'docs/archive/HISTORY.md': sourceText,
    },
    surfaceList: ['docs/archive/HISTORY.md'],
  });

  assert.equal(report.passed, true);
  assert.equal(report.totalClaimCount, 0);
});

test('runCachingScopeHygieneAudit currently passes against the live public surfaces', () => {
  // Smoke test against the actual repo surfaces. This is the regression guard
  // that catches future drift if a contributor adds an unscoped caching claim.
  const report = runCachingScopeHygieneAudit();

  assert.equal(report.passed, true, () => `Public-surface caching scope drift detected:\n${report.violations.map((violation) => `  [${violation.kind}] ${violation.file}:${violation.line} ${violation.detail}`).join('\n')}`);
});
