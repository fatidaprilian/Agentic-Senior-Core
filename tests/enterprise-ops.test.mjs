import test from 'node:test';
import assert from 'node:assert/strict';
import { execSync } from 'node:child_process';
import { join } from 'node:path';

test('Enterprise Operations Tests', async (t) => {
  await t.test('release gate outputs machine-readable report', () => {
    const releaseGateOutput = execSync(`node ${join(process.cwd(), 'scripts', 'release-gate.mjs')}`).toString();
    const releaseGateReport = JSON.parse(releaseGateOutput);

    assert.equal(releaseGateReport.gateName, 'release-gate');
    assert.equal(releaseGateReport.passed, true);
    assert.equal(releaseGateReport.failureCount, 0);
    assert.ok(Array.isArray(releaseGateReport.results));
    assert.ok(releaseGateReport.results.length >= 6);

    const compatibilityCoverageResult = releaseGateReport.results.find(
      (resultEntry) => resultEntry.checkName === 'compatibility-manifest-coverage'
    );
    assert.ok(compatibilityCoverageResult);
    assert.equal(compatibilityCoverageResult.passed, true);
  });

  await t.test('SBOM generator emits CycloneDX payload', () => {
    const sbomOutput = execSync(`node ${join(process.cwd(), 'scripts', 'generate-sbom.mjs')}`).toString();
    const sbomPayload = JSON.parse(sbomOutput);

    assert.equal(sbomPayload.bomFormat, 'CycloneDX');
    assert.equal(sbomPayload.specVersion, '1.5');
    assert.ok(sbomPayload.metadata?.component?.name);
    assert.ok(Array.isArray(sbomPayload.components));
  });

  await t.test('benchmark gate outputs machine-readable report', () => {
    const benchmarkGateOutput = execSync(`node ${join(process.cwd(), 'scripts', 'benchmark-gate.mjs')}`).toString();
    const benchmarkGateReport = JSON.parse(benchmarkGateOutput);

    assert.equal(benchmarkGateReport.gateName, 'benchmark-gate');
    assert.equal(typeof benchmarkGateReport.passed, 'boolean');
    assert.ok(Array.isArray(benchmarkGateReport.results));
    assert.ok(benchmarkGateReport.results.length >= 2);
  });

  await t.test('benchmark intelligence outputs machine-readable report', () => {
    const benchmarkIntelligenceOutput = execSync(`node ${join(process.cwd(), 'scripts', 'benchmark-intelligence.mjs')}`).toString();
    const benchmarkIntelligenceReport = JSON.parse(benchmarkIntelligenceOutput);

    assert.equal(benchmarkIntelligenceReport.reportName, 'benchmark-intelligence');
    assert.equal(typeof benchmarkIntelligenceReport.passed, 'boolean');
    assert.ok(Array.isArray(benchmarkIntelligenceReport.watchlist));
    assert.ok(benchmarkIntelligenceReport.watchlist.length >= 3);
  });

  await t.test('token optimization benchmark outputs machine-readable report', () => {
    const tokenBenchmarkOutput = execSync(`node ${join(process.cwd(), 'scripts', 'token-optimization-benchmark.mjs')} --stdout-only`).toString();
    const tokenBenchmarkReport = JSON.parse(tokenBenchmarkOutput);

    assert.equal(tokenBenchmarkReport.reportName, 'token-optimization-benchmark');
    assert.ok(Array.isArray(tokenBenchmarkReport.scenarios));
    assert.ok(tokenBenchmarkReport.scenarios.length >= 3);
    assert.equal(typeof tokenBenchmarkReport.summary.averageNativeSavingsPercent, 'number');
  });

  await t.test('quality trend report outputs machine-readable report', () => {
    const qualityTrendOutput = execSync(`node ${join(process.cwd(), 'scripts', 'quality-trend-report.mjs')} --stdout-only`).toString();
    const qualityTrendReport = JSON.parse(qualityTrendOutput);

    assert.equal(qualityTrendReport.reportName, 'quality-trend-report');
    assert.equal(typeof qualityTrendReport.governanceHealth.gatePassRatePercent, 'number');
    assert.ok(Array.isArray(qualityTrendReport.governanceHealth.gateSummaries));
    assert.ok(Array.isArray(qualityTrendReport.rejectionCategories));
    assert.equal(typeof qualityTrendReport.rollbackSignals.windowDays, 'number');
    assert.equal(typeof qualityTrendReport.tokenEfficiency.isAvailable, 'boolean');
    assert.ok(Array.isArray(qualityTrendReport.history));
  });
});
