// @ts-check

/**
 * Verdict parsing and machine-readable report assembly for the LLM judge. Keeps
 * the pipeline output deterministic so downstream gates and CI dashboards can
 * consume a stable schema.
 */

import { writeFileSync } from 'node:fs';

import {
  MACHINE_REPORT_PATH,
  SEVERITY_NORMALIZATION_TABLE,
  SHOULD_EMIT_MACHINE_REPORT,
} from './constants.mjs';
import { detectCiProvider } from './diff-collection.mjs';

/**
 * @typedef {import('./constants.mjs').MachineReportPayload} MachineReportPayload
 * @typedef {import('./constants.mjs').Violation} Violation
 */

/**
 * @param {string | undefined} rawSeverityValue
 * @returns {string}
 */
export function normalizeSeverity(rawSeverityValue) {
  const normalizedSeverityKey = String(rawSeverityValue || '').trim().toLowerCase();
  return SEVERITY_NORMALIZATION_TABLE[normalizedSeverityKey] || 'low';
}

/**
 * @param {MachineReportPayload} machineReportPayload
 * @returns {string}
 */
export function formatMachineReadableLine(machineReportPayload) {
  return `JSON_REPORT: ${JSON.stringify(machineReportPayload)}`;
}

/**
 * @param {MachineReportPayload} machineReportPayload
 */
export function emitMachineReadableReport(machineReportPayload) {
  if (!SHOULD_EMIT_MACHINE_REPORT) {
    return;
  }

  writeFileSync(MACHINE_REPORT_PATH, `${JSON.stringify(machineReportPayload, null, 2)}\n`, 'utf-8');
  console.log(formatMachineReadableLine(machineReportPayload));
  console.log(`📎  Machine report saved: ${MACHINE_REPORT_PATH}`);
}

/**
 * Extracts and parses the JSON verdict from the LLM response.
 *
 * @param {string} llmResponseText
 * @param {boolean} failOnMalformedResponse
 * @returns {Array<{ rule: string, problem: string, severity: string }>}
 */
export function extractVerdict(llmResponseText, failOnMalformedResponse) {
  const match = llmResponseText.match(/JSON_VERDICT:\s*(\[.*\])/i);
  if (!match) {
    console.warn('⚠️  LLM response did not include a valid JSON_VERDICT line.');
    if (failOnMalformedResponse) {
      console.error('❌  Failing pipeline because malformed responses are not allowed by the profile.');
      process.exit(1);
    }
    return [];
  }
  try {
    return JSON.parse(match[1]);
  } catch (err) {
    const parseError = /** @type {Error} */ (err);
    console.error('⚠️  Failed to parse JSON_VERDICT:', parseError.message);
    if (failOnMalformedResponse) {
      process.exit(1);
    }
    return [];
  }
}

/**
 * @param {Array<{ rule?: string, problem?: string, severity?: string }>} violations
 * @returns {Violation[]}
 */
export function normalizeViolations(violations) {
  return violations.map((violationItem) => ({
    rule: String(violationItem.rule || 'Unknown Rule'),
    problem: String(violationItem.problem || 'No problem description provided.'),
    severity: normalizeSeverity(violationItem.severity),
  }));
}

/**
 * @param {{
 *   provider: string,
 *   selectedProfile: string,
 *   blockingSeverities: string[],
 *   finalViolations: Violation[],
 *   blockingFound: Violation[],
 *   isDryRun: boolean,
 *   malformedVerdict: boolean,
 *   providerError: boolean,
 * }} payloadInput
 * @returns {MachineReportPayload}
 */
export function buildMachineReportPayload({
  provider,
  selectedProfile,
  blockingSeverities,
  finalViolations,
  blockingFound,
  isDryRun,
  malformedVerdict,
  providerError,
}) {
  return {
    generatedAt: new Date().toISOString(),
    schemaVersion: '1.0',
    profile: selectedProfile,
    provider,
    ciProvider: detectCiProvider(),
    blockingSeverities,
    failDecision: blockingFound.length > 0 || malformedVerdict || providerError,
    malformedVerdict,
    providerError,
    dryRun: isDryRun,
    summary: {
      totalViolations: finalViolations.length,
      blockingViolations: blockingFound.length,
    },
    violations: finalViolations,
  };
}
