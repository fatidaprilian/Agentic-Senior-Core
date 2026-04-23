import test from 'node:test';
import assert from 'node:assert/strict';
import { execSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { buildRubricCalibrationReport, calibrateGenericityAssessment } from '../scripts/ui-design-judge/rubric-calibration.mjs';

const goldsetPath = join(process.cwd(), 'scripts', 'ui-design-judge', 'rubric-goldset.json');
const calibrationScriptPath = join(process.cwd(), 'scripts', 'ui-rubric-calibration.mjs');

function loadGoldset() {
  return JSON.parse(readFileSync(goldsetPath, 'utf8'));
}

test('ui rubric calibration helper matches the gold set', () => {
  const goldset = loadGoldset();
  const report = buildRubricCalibrationReport({
    cases: goldset.cases,
    reviewRubricSummary: goldset.reviewRubric,
  });

  assert.equal(report.reportName, 'ui-rubric-calibration');
  assert.equal(report.passed, true);
  assert.equal(report.failureCount, 0);
  assert.equal(report.totalCases >= 5, true);
  assert.equal(report.passedCaseCount, report.totalCases);
});

test('ui rubric calibration can uplift and downgrade provider status deterministically', () => {
  const goldset = loadGoldset();
  const upliftCase = goldset.cases.find((caseEntry) => caseEntry.id === 'provider-overcalls-generic');
  const downgradeCase = goldset.cases.find((caseEntry) => caseEntry.id === 'bold-but-contract-drift');

  assert.ok(upliftCase);
  assert.ok(downgradeCase);

  const upliftCalibration = calibrateGenericityAssessment({
    reviewRubricSummary: goldset.reviewRubric,
    designExecutionSummary: upliftCase.designExecutionSummary,
    genericityAssessment: upliftCase.genericityAssessment,
    rubricBreakdown: upliftCase.rubricBreakdown,
    findings: upliftCase.findings,
    notes: upliftCase.notes,
    tasteVsFailureSeparated: upliftCase.tasteVsFailureSeparated,
  });
  const downgradeCalibration = calibrateGenericityAssessment({
    reviewRubricSummary: goldset.reviewRubric,
    designExecutionSummary: downgradeCase.designExecutionSummary,
    genericityAssessment: downgradeCase.genericityAssessment,
    rubricBreakdown: downgradeCase.rubricBreakdown,
    findings: downgradeCase.findings,
    notes: downgradeCase.notes,
    tasteVsFailureSeparated: downgradeCase.tasteVsFailureSeparated,
  });

  assert.equal(upliftCalibration.providerStatus, 'generic');
  assert.equal(upliftCalibration.calibratedStatus, 'distinctive');
  assert.equal(upliftCalibration.contractDriftDetected, false);
  assert.equal(downgradeCalibration.providerStatus, 'distinctive');
  assert.equal(downgradeCalibration.calibratedStatus, 'mixed');
  assert.equal(downgradeCalibration.contractDriftDetected, true);
});

test('ui rubric calibration script emits a machine-readable passing report', () => {
  const calibrationOutput = execSync(`node ${calibrationScriptPath}`).toString();
  const calibrationReport = JSON.parse(calibrationOutput);

  assert.equal(calibrationReport.reportName, 'ui-rubric-calibration');
  assert.equal(calibrationReport.passed, true);
  assert.equal(calibrationReport.failureCount, 0);
  assert.equal(typeof calibrationReport.accuracyPercent, 'number');
  assert.ok(Array.isArray(calibrationReport.results));
  assert.ok(calibrationReport.results.length >= 5);
});
