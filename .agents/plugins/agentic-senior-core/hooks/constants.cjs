const fs = require('fs');
const path = require('path');

const SOURCE_EXTENSIONS = new Set([
  'js', 'ts', 'mjs', 'cjs', 'jsx', 'tsx',
  'py', 'rb', 'go', 'rs', 'java', 'kt', 'swift', 'cs',
]);

const LOC_DELTA_THRESHOLD = 30;
const NEW_FILE_LINE_THRESHOLD = 50;
const SESSION_DRIFT_THRESHOLD = 4;
const LADDER_PULSE_INTERVAL = 3;

function loadDedupConfig(cwd = process.cwd()) {
  const candidates = [
    path.join(cwd, '.asc', 'dedup-config.json'),
    path.join(cwd, '.agents', 'dedup-config.json'),
  ];
  for (let i = 0; i < candidates.length; i++) {
    try {
      if (fs.existsSync(candidates[i])) {
        return JSON.parse(fs.readFileSync(candidates[i], 'utf8'));
      }
    } catch (_) {}
  }
  return {};
}

function getThresholds(cwd = process.cwd()) {
  const config = loadDedupConfig(cwd);
  return {
    NEW_FILE_LINE_THRESHOLD: typeof config.NEW_FILE_LINE_THRESHOLD === 'number'
      ? config.NEW_FILE_LINE_THRESHOLD
      : NEW_FILE_LINE_THRESHOLD,
    LOC_DELTA_THRESHOLD: typeof config.LOC_DELTA_THRESHOLD === 'number'
      ? config.LOC_DELTA_THRESHOLD
      : LOC_DELTA_THRESHOLD,
  };
}

module.exports = {
  SOURCE_EXTENSIONS,
  LOC_DELTA_THRESHOLD,
  NEW_FILE_LINE_THRESHOLD,
  SESSION_DRIFT_THRESHOLD,
  LADDER_PULSE_INTERVAL,
  getThresholds,
  loadDedupConfig,
};
