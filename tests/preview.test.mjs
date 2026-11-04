import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { getBrowserCandidates, findBrowserExecutable, runPreviewCommand } from '../lib/cli/commands/preview.mjs';

describe('Zero-Dependency Multi-Browser Preview Engine', () => {
  it('returns valid candidate list for current platform', () => {
    const candidates = getBrowserCandidates();
    assert.ok(Array.isArray(candidates), 'Candidates must be an array');
    assert.ok(candidates.length >= 4, 'Must define at least 4 browser candidates');

    const names = candidates.map(c => c.name.toLowerCase());
    assert.ok(names.some(n => n.includes('brave')), 'Must include Brave');
    assert.ok(names.some(n => n.includes('edge')), 'Must include Edge');
    assert.ok(names.some(n => n.includes('chrome') || n.includes('chromium')), 'Must include Chrome/Chromium');
    assert.ok(names.some(n => n.includes('firefox')), 'Must include Firefox');
  });

  it('detects an installed browser if present on system', () => {
    const browser = findBrowserExecutable();
    // If a browser is installed, verify its schema
    if (browser) {
      assert.ok(browser.name, 'Browser must have name');
      assert.ok(['chromium', 'firefox'].includes(browser.family), 'Family must be chromium or firefox');
      assert.ok(fs.existsSync(browser.path), 'Path must exist on disk');
    }
  });

  it('fails safely when target html does not exist', async () => {
    const originalExit = process.exit;
    let exitCode = null;
    process.exit = (code) => { exitCode = code; throw new Error('EXIT'); };

    try {
      await runPreviewCommand(['non_existent_file_xyz.html']);
    } catch {
      // expected
    } finally {
      process.exit = originalExit;
    }

    assert.strictEqual(exitCode, 1, 'Must exit with 1 on missing file');
  });

  it('captures preview screenshot to single fixed temp slot when browser is available', async () => {
    const browser = findBrowserExecutable();
    if (!browser) {
      return; // Skip on headless environments without installed browsers
    }

    const tempHtml = path.join(os.tmpdir(), 'asc-test-fixture.html');
    fs.writeFileSync(tempHtml, '<!DOCTYPE html><html><body><h1>Test</h1></body></html>', 'utf8');

    await runPreviewCommand([tempHtml]);

    const activePng = path.join(os.tmpdir(), 'asc-preview-active.png');
    assert.ok(fs.existsSync(activePng), 'asc-preview-active.png must be created');
    const stat = fs.statSync(activePng);
    assert.ok(stat.size > 100, 'Screenshot must be non-empty');

    if (fs.existsSync(tempHtml)) fs.unlinkSync(tempHtml);
  });
});

