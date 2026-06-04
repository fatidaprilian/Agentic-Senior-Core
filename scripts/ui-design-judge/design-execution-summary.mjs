// @ts-check

import { existsSync, readFileSync } from 'node:fs';
import {
  DESIGN_GUIDE_PATH,
} from './constants.mjs';

/**
 * Legacy design-intent.json is no longer generated.
 * Returns null unconditionally.
 */
export function loadDesignIntent() {
  return null;
}

export function loadDesignGuide() {
  if (!existsSync(DESIGN_GUIDE_PATH)) {
    return '';
  }

  return readFileSync(DESIGN_GUIDE_PATH, 'utf8');
}

export function normalizeStringArray(rawValue) {
  if (!Array.isArray(rawValue)) {
    return [];
  }

  return rawValue
    .map((entryValue) => String(entryValue || '').trim())
    .filter(Boolean);
}

/**
 * Simplified design execution policy summary.
 * With the design-intent.json contract removed, this returns
 * a minimal stub that downstream consumers (main judge, reporting)
 * can safely consume without null checks.
 */
export function summarizeDesignExecutionPolicy(designIntentContent) {
  return {
    policyPresent: false,
    representationStrategy: null,
    contractReady: false,
    screenshotDependencyForbidden: false,
    repoEvidenceAvailable: false,
    structuredInspectionAvailable: false,
    handoffPresent: false,
    handoffVersion: null,
    handoffReady: false,
    handoffArtifactCount: 0,
    presentHandoffArtifacts: [],
    missingHandoffArtifacts: [],
    repoEvidenceSummaryVersion: null,
    requiredCapabilities: [],
    enabledCapabilities: [],
    missingCapabilities: [],
    semanticReviewFocus: [],
    notes: ['Design execution policy is not applicable under the compact token file architecture.'],
  };
}

/**
 * Simplified review rubric summary.
 * Returns a minimal stub since the JSON contract rubric system was removed.
 */
export function summarizeReviewRubric(designIntentContent) {
  return {
    version: null,
    dimensions: [],
    genericityAutoFail: false,
    genericitySignals: [],
    validBoldSignals: [],
    forbiddenPatterns: [],
    reportingRules: {
      mustExplainGenericity: false,
      mustSeparateTasteFromFailure: false,
      contractFidelityOverridesPersonalTaste: false,
    },
  };
}
