import fs from 'fs';
import path from 'path';
import os from 'os';

export const DEFAULT_RULE_CAP = 25;

/**
 * Resolves the global user configuration directory path.
 * @returns {string} Absolute path to global config directory.
 */
export function getUserConfigDir() {
  return path.join(os.homedir(), '.gemini', 'config');
}

/**
 * Resolves the project-local configuration directory path.
 * @param {string} cwd Working directory of the project.
 * @returns {string} Absolute path to project config directory.
 */
export function getProjectConfigDir(cwd = process.cwd()) {
  return path.join(cwd, '.agents');
}

/**
 * Resolves the JSON preferences file path for a given scope.
 * @param {Object} options
 * @param {string} [options.cwd] Project working directory.
 * @param {'user'|'project'} options.scope Preference scope.
 * @returns {string} Absolute path to preferences JSON file.
 */
export function getPreferencesFilePath({ cwd = process.cwd(), scope = 'project' } = {}) {
  const baseDir = scope === 'user' ? getUserConfigDir() : getProjectConfigDir(cwd);
  return path.join(baseDir, 'adaptive_preferences.json');
}

/**
 * Initializes an empty preferences structure.
 * @returns {Object} Fresh preferences data object.
 */
export function createEmptyPreferences() {
  return {
    version: '1.0.0',
    updatedAt: new Date().toISOString(),
    rules: []
  };
}

/**
 * Loads preference rules from storage for a specific scope.
 * @param {Object} options
 * @param {string} [options.cwd] Project working directory.
 * @param {'user'|'project'} [options.scope] Target scope.
 * @returns {Object} Preferences data object.
 */
export function loadPreferences({ cwd = process.cwd(), scope = 'project' } = {}) {
  const filePath = getPreferencesFilePath({ cwd, scope });
  if (!fs.existsSync(filePath)) {
    return createEmptyPreferences();
  }

  try {
    const raw = fs.readFileSync(filePath, 'utf8');
    const parsed = JSON.parse(raw);
    if (!parsed || !Array.isArray(parsed.rules)) {
      return createEmptyPreferences();
    }
    return parsed;
  } catch (err) {
    return createEmptyPreferences();
  }
}

/**
 * Saves preference rules to storage for a specific scope.
 * @param {Object} options
 * @param {string} [options.cwd] Project working directory.
 * @param {'user'|'project'} [options.scope] Target scope.
 * @param {Object} options.preferences Preferences payload to write.
 */
export function savePreferences({ cwd = process.cwd(), scope = 'project', preferences } = {}) {
  const filePath = getPreferencesFilePath({ cwd, scope });
  const dirPath = path.dirname(filePath);

  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }

  const payload = {
    ...createEmptyPreferences(),
    ...preferences,
    updatedAt: new Date().toISOString()
  };

  fs.writeFileSync(filePath, JSON.stringify(payload, null, 2), 'utf8');
  return payload;
}

/**
 * Adds or updates a rule within the specified scope, enforcing deduplication and max rule cap.
 * @param {Object} options
 * @param {string} [options.cwd] Project working directory.
 * @param {'user'|'project'} [options.scope] Target scope.
 * @param {Object} options.rule Rule definition object.
 * @param {number} [options.maxCap] Maximum allowed rules per scope.
 * @returns {{ preferences: Object, added: boolean, capExceeded: boolean }} Result summary.
 */
export function addRule({ cwd = process.cwd(), scope = 'project', rule, maxCap = DEFAULT_RULE_CAP } = {}) {
  if (!rule || !rule.pattern) {
    throw new Error('Rule pattern is required');
  }

  const prefs = loadPreferences({ cwd, scope });
  const normalizedPattern = String(rule.pattern).trim().toLowerCase();

  const existingIndex = prefs.rules.findIndex(
    r => String(r.pattern).trim().toLowerCase() === normalizedPattern
  );

  const formattedRule = {
    id: rule.id || `rule_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    type: rule.type === 'syntactic' ? 'syntactic' : 'taste',
    pattern: String(rule.pattern).trim(),
    reason: String(rule.reason || '').trim(),
    source: rule.source || 'learn',
    createdAt: rule.createdAt || new Date().toISOString()
  };

  let added = false;
  if (existingIndex >= 0) {
    // Update existing rule
    prefs.rules[existingIndex] = {
      ...prefs.rules[existingIndex],
      ...formattedRule
    };
  } else {
    // Append new rule
    prefs.rules.push(formattedRule);
    added = true;
  }

  let capExceeded = false;
  if (prefs.rules.length > maxCap) {
    capExceeded = true;
    // Trim oldest rules exceeding cap
    prefs.rules = prefs.rules.slice(prefs.rules.length - maxCap);
  }

  const saved = savePreferences({ cwd, scope, preferences: prefs });
  return { preferences: saved, added, capExceeded };
}

/**
 * Resolves active combined rules from both user and project scopes.
 * User scope rules come first, project scope rules override or extend.
 * @param {Object} options
 * @param {string} [options.cwd] Project working directory.
 * @returns {{ syntactic: Array<Object>, taste: Array<Object> }} Active rules grouped by track.
 */
export function resolveActiveRules({ cwd = process.cwd() } = {}) {
  const userPrefs = loadPreferences({ cwd, scope: 'user' });
  const projectPrefs = loadPreferences({ cwd, scope: 'project' });

  const combinedRules = [...userPrefs.rules, ...projectPrefs.rules];

  // Deduplicate combined by pattern (project scope overrides user scope if identical)
  const ruleMap = new Map();
  for (const r of combinedRules) {
    const key = String(r.pattern).trim().toLowerCase();
    ruleMap.set(key, r);
  }

  const allActive = Array.from(ruleMap.values());

  return {
    syntactic: allActive.filter(r => r.type === 'syntactic'),
    taste: allActive.filter(r => r.type === 'taste')
  };
}
