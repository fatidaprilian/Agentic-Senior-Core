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
  });

  await t.test('SBOM generator emits CycloneDX payload', () => {
    const sbomOutput = execSync(`node ${join(process.cwd(), 'scripts', 'generate-sbom.mjs')}`).toString();
    const sbomPayload = JSON.parse(sbomOutput);

    assert.equal(sbomPayload.bomFormat, 'CycloneDX');
    assert.equal(sbomPayload.specVersion, '1.5');
    assert.ok(sbomPayload.metadata?.component?.name);
    assert.ok(Array.isArray(sbomPayload.components));
  });
});
