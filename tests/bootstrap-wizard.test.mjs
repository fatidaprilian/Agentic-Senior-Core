import { describe, it, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { getSlopCatalog, bootstrapPreferences } from '../lib/core/bootstrap-wizard.mjs';
import { loadPreferences } from '../lib/core/adaptive-preferences.mjs';

describe('Bootstrap Wizard Module', () => {
  let tempDir;

  beforeEach(() => {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'asc-bootstrap-test-'));
  });

  afterEach(() => {
    if (fs.existsSync(tempDir)) {
      fs.rmSync(tempDir, { recursive: true, force: true });
    }
  });

  it('loads non-empty curated slop catalog', () => {
    const catalog = getSlopCatalog();
    assert.ok(Array.isArray(catalog));
    assert.ok(catalog.length >= 5, 'Catalog should contain at least 5 baseline slop patterns');
  });

  it('seeds selected slop patterns into project preferences', () => {
    const catalog = getSlopCatalog();
    const selectedIds = [catalog[0].id, catalog[1].id];

    const results = bootstrapPreferences({
      cwd: tempDir,
      scope: 'project',
      selectedIds
    });

    assert.equal(results.length, 2);
    const prefs = loadPreferences({ cwd: tempDir, scope: 'project' });
    assert.equal(prefs.rules.length, 2);
    assert.equal(prefs.rules[0].source, 'bootstrap');
  });
});
