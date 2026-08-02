import { describe, it, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import {
  loadPreferences,
  savePreferences,
  addRule,
  resolveActiveRules,
  getPreferencesFilePath,
  DEFAULT_RULE_CAP
} from '../lib/core/adaptive-preferences.mjs';

describe('Adaptive Preferences Core Module', () => {
  let tempDir;

  beforeEach(() => {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'asc-pref-test-'));
  });

  afterEach(() => {
    if (fs.existsSync(tempDir)) {
      fs.rmSync(tempDir, { recursive: true, force: true });
    }
  });

  it('loads empty preferences when file does not exist', () => {
    const prefs = loadPreferences({ cwd: tempDir, scope: 'project' });
    assert.equal(prefs.version, '1.0.0');
    assert.deepEqual(prefs.rules, []);
  });

  it('adds and saves syntactic and taste rules with deduplication', () => {
    const res1 = addRule({
      cwd: tempDir,
      scope: 'project',
      rule: {
        pattern: 'no-inline-tailwind',
        type: 'syntactic',
        reason: 'Prefer standard CSS modules'
      }
    });

    assert.equal(res1.added, true);
    assert.equal(res1.capExceeded, false);
    assert.equal(res1.preferences.rules.length, 1);

    // Duplicate addition should update, not duplicate
    const res2 = addRule({
      cwd: tempDir,
      scope: 'project',
      rule: {
        pattern: 'NO-INLINE-TAILWIND',
        type: 'syntactic',
        reason: 'Updated reason'
      }
    });

    assert.equal(res2.added, false);
    assert.equal(res2.preferences.rules.length, 1);
    assert.equal(res2.preferences.rules[0].reason, 'Updated reason');
  });

  it('enforces maximum rule cap limit by trimming oldest rules', () => {
    const cap = 3;
    for (let i = 1; i <= 5; i++) {
      addRule({
        cwd: tempDir,
        scope: 'project',
        rule: { pattern: `pattern_${i}`, type: 'taste' },
        maxCap: cap
      });
    }

    const loaded = loadPreferences({ cwd: tempDir, scope: 'project' });
    assert.equal(loaded.rules.length, 3);
    assert.equal(loaded.rules[0].pattern, 'pattern_3');
    assert.equal(loaded.rules[2].pattern, 'pattern_5');
  });

  it('resolves active rules combining user and project scopes with override', () => {
    // Add rule in project scope
    addRule({
      cwd: tempDir,
      scope: 'project',
      rule: { pattern: 'bg-purple-500', type: 'syntactic', reason: 'Project banned color' }
    });

    addRule({
      cwd: tempDir,
      scope: 'project',
      rule: { pattern: 'minimal-borders', type: 'taste', reason: 'Clean aesthetic' }
    });

    const active = resolveActiveRules({ cwd: tempDir });
    assert.equal(active.syntactic.length, 1);
    assert.equal(active.taste.length, 1);
    assert.equal(active.syntactic[0].pattern, 'bg-purple-500');
    assert.equal(active.taste[0].pattern, 'minimal-borders');
  });
});
