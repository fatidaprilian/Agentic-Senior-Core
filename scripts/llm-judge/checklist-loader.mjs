// @ts-check

/**
 * Loaders for the PR checklist content and the threshold profile JSON. The
 * thresholds loader returns a safe balanced-profile default when the policy
 * file is absent so the gate stays functional in fresh checkouts.
 */

import { existsSync, readFileSync } from 'node:fs';

import { PR_CHECKLIST_PATH, THRESHOLDS_PATH } from './constants.mjs';

/**
 * Loads and returns the PR checklist markdown content.
 *
 * @returns {string} The checklist file contents
 */
export function loadPrChecklist() {
  if (!existsSync(PR_CHECKLIST_PATH)) {
    throw new Error(`PR checklist not found at: ${PR_CHECKLIST_PATH}`);
  }
  return readFileSync(PR_CHECKLIST_PATH, 'utf-8');
}

/**
 * Loads the LLM judge thresholds, falling back to a safe balanced-profile
 * default when the policy file is missing.
 *
 * @returns {any} The thresholds object
 */
export function loadThresholds() {
  if (!existsSync(THRESHOLDS_PATH)) {
    return {
      selectedProfile: 'balanced',
      profileThresholds: {
        balanced: {
          blockingSeverities: ['critical', 'high'],
          failOnMalformedResponse: true,
          failOnProviderError: false,
        },
      },
    };
  }
  return JSON.parse(readFileSync(THRESHOLDS_PATH, 'utf-8'));
}
