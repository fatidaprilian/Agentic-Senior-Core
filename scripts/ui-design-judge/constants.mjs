// @ts-check

import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export const REPOSITORY_ROOT = resolve(__dirname, '..', '..');
export const DESIGN_INTENT_PATH = resolve(REPOSITORY_ROOT, 'docs', 'design-intent.json');
export const DESIGN_GUIDE_PATH = resolve(REPOSITORY_ROOT, 'docs', 'DESIGN.md');
export const MAX_DIFF_CHARS = 12000;
export const UI_FILE_EXTENSIONS = new Set(['.js', '.jsx', '.ts', '.tsx', '.vue', '.css', '.scss', '.sass']);
export const DESIGN_EXECUTION_REQUIRED_CAPABILITIES = [
  'requireSurfacePlan',
  'requireComponentGraph',
  'requireViewportMutationPlan',
  'requireInteractionStateMatrix',
  'requireContentPriorityMap',
  'requireTaskFlowNarrative',
  'requireSignatureMoveRationale',
  'requireStructuredHandoff',
  'requireRepoEvidenceAlignment',
];
