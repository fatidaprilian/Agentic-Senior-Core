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
    } catch (_) { }
  }
  return {};
}

function getThresholds(cwd = process.cwd()) {
  const config = loadDedupConfig(cwd);
  const num = (value, fallback) => (typeof value === 'number' ? value : fallback);
  return {
    NEW_FILE_LINE_THRESHOLD: num(config.NEW_FILE_LINE_THRESHOLD, NEW_FILE_LINE_THRESHOLD),
    LOC_DELTA_THRESHOLD: num(config.LOC_DELTA_THRESHOLD, LOC_DELTA_THRESHOLD),
    SESSION_DRIFT_THRESHOLD: num(config.SESSION_DRIFT_THRESHOLD, SESSION_DRIFT_THRESHOLD),
    LADDER_PULSE_INTERVAL: num(config.LADDER_PULSE_INTERVAL, LADDER_PULSE_INTERVAL),
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
