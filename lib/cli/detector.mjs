/**
 * Stack Detector — project context auto-detection. Aggregator that re-exports
 * the public surface of the detector subsystem. Implementation lives under
 * lib/cli/detector/* split per concern: workspace scan, UI signal analysis,
 * and stack detection scoring.
 *
 * Public exports:
 *   collectProjectMarkers     — read top-level markers in a directory
 *   detectProjectContext      — top-level stack detection with ranked candidates
 *   detectUiScopeSignals      — UI scope detection plus design evidence scan;
 *                               returns frontendEvidenceMetrics and
 *                               designEvidenceSummary when UI scope is detected
 *   buildDetectionSummary     — human-readable detection summary text
 *   formatDetectionCandidates — formatter for ranked detection candidates
 */

export { collectProjectMarkers } from './detector/workspace-scan.mjs';
export { detectUiScopeSignals } from './detector/ui-signals.mjs';
export {
  buildDetectionSummary,
  detectProjectContext,
  formatDetectionCandidates,
} from './detector/stack-detection.mjs';
