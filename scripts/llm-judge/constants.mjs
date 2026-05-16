// @ts-check

/**
 * Static configuration for the LLM judge CI gate. Centralizes paths, env-driven
 * settings, and severity normalization so the rest of the pipeline reads from a
 * single config surface.
 */

import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export const REPOSITORY_ROOT = resolve(__dirname, '..', '..');
export const PR_CHECKLIST_PATH = resolve(REPOSITORY_ROOT, '.agent-context/review-checklists/pr-checklist.md');
export const THRESHOLDS_PATH = resolve(REPOSITORY_ROOT, '.agent-context/policies/llm-judge-threshold.json');
export const DEFAULT_MACHINE_REPORT_PATH = resolve(REPOSITORY_ROOT, '.agent-context/state/llm-judge-report.json');

export const MAX_DIFF_CHARS = parseInt(process.env.LLM_MAX_DIFF_CHARS ?? '12000', 10);
export const IS_DRY_RUN = process.argv.includes('--dry-run');
export const SHOULD_EMIT_MACHINE_REPORT = process.env.LLM_JUDGE_EMIT_JSON !== 'false';
export const MACHINE_REPORT_PATH = process.env.LLM_JUDGE_OUTPUT_PATH || DEFAULT_MACHINE_REPORT_PATH;

/** @type {Record<string, string>} */
export const SEVERITY_NORMALIZATION_TABLE = {
  critical: 'critical',
  blocker: 'critical',
  severe: 'critical',
  high: 'high',
  major: 'high',
  medium: 'medium',
  moderate: 'medium',
  low: 'low',
  minor: 'low',
  info: 'low',
  informational: 'low',
};

/**
 * @typedef {{
 *   rule: string,
 *   problem: string,
 *   severity: string,
 * }} Violation
 */

/**
 * @typedef {{
 *   generatedAt: string,
 *   schemaVersion: string,
 *   profile: string,
 *   provider: string,
 *   ciProvider: string,
 *   blockingSeverities: string[],
 *   failDecision: boolean,
 *   malformedVerdict: boolean,
 *   providerError: boolean,
 *   dryRun: boolean,
 *   summary: {
 *     totalViolations: number,
 *     blockingViolations: number,
 *   },
 *   violations: Violation[],
 * }} MachineReportPayload
 */
