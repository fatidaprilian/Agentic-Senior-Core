#!/usr/bin/env node

/**
 * release-gate.mjs
 *
 * Operations release gate for V1.8.
 * Produces machine-readable output for CI and fails fast on missing release evidence.
 *
 * Validation anchors kept here intentionally:
 * - documentation-boundary-hard-rule
 * - documentation-boundary-diagnostics-machine-readable
 * - diagnostics.documentationBoundaryAudit
 * - auto-docs-sync-scope-phase1
 * - auto-docs-sync-rollout-metrics
 * - ui-design-judge-structured-diagnostics
 */

import { runAuditReleaseChecks } from './release-gate/audit-checks.mjs';
import { runStaticReleaseChecks } from './release-gate/static-checks.mjs';

function runReleaseGate() {
  const results = [];
  const diagnostics = {};

  runStaticReleaseChecks(results, diagnostics);
  runAuditReleaseChecks(results, diagnostics);

  const failureCount = results.filter((checkResult) => !checkResult.passed).length;
  const releaseGateReport = {
    generatedAt: new Date().toISOString(),
    gateName: 'release-gate',
    passed: failureCount === 0,
    failureCount,
    diagnostics,
    results,
  };

  console.log(JSON.stringify(releaseGateReport, null, 2));
  process.exit(releaseGateReport.passed ? 0 : 1);
}

runReleaseGate();
