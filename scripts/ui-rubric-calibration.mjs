#!/usr/bin/env node
// @ts-check

import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildRubricCalibrationReport } from './ui-design-judge/rubric-calibration.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const GOLDSET_PATH = resolve(__dirname, 'ui-design-judge', 'rubric-goldset.json');
const REPORT_NAME = 'ui-rubric-calibration';

function loadGoldset() {
  return JSON.parse(readFileSync(GOLDSET_PATH, 'utf8'));
}

function main() {
  const goldset = loadGoldset();
  const report = buildRubricCalibrationReport({
    cases: goldset.cases,
    reviewRubricSummary: goldset.reviewRubric,
  });
  report.reportName = REPORT_NAME;
  // Keep the report surface explicit so static validation can detect the machine-readable payload contract.
  report.accuracyPercent = report.accuracyPercent;

  console.log(JSON.stringify(report, null, 2));

  if (!report.passed) {
    process.exitCode = 1;
  }
}

main();
