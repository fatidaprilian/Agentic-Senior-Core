// Agentic Senior Core — shared constants for hook modules
// Single source of truth for thresholds and extension sets used by
// post-edit-enforce.js and dedup-gate.js.

const SOURCE_EXTENSIONS = new Set([
  'js', 'ts', 'mjs', 'cjs', 'jsx', 'tsx',
  'py', 'rb', 'go', 'rs', 'java', 'kt', 'swift', 'cs',
]);

const LOC_DELTA_THRESHOLD = 30;
const NEW_FILE_LINE_THRESHOLD = 50;
const SESSION_DRIFT_THRESHOLD = 4;
const LADDER_PULSE_INTERVAL = 3;

module.exports = {
  SOURCE_EXTENSIONS,
  LOC_DELTA_THRESHOLD,
  NEW_FILE_LINE_THRESHOLD,
  SESSION_DRIFT_THRESHOLD,
  LADDER_PULSE_INTERVAL,
};
