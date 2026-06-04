// Verifies the CSS-level anti-repeat audit unconditionally skips 
// because it is deprecated in favor of the DESIGN.md blocklist.

import test from 'node:test';
import assert from 'node:assert/strict';
import { runTypographyPaletteAntiRepeatAudit } from '../lib/cli/audits/typography-palette-anti-repeat-audit.mjs';

test('Typography Palette Anti-Repeat Audit', async (t) => {
  await t.test('unconditionally skips with deprecation notice', () => {
    const auditReport = runTypographyPaletteAntiRepeatAudit();
    assert.equal(auditReport.skipped, true);
    assert.equal(auditReport.passed, true);
    assert.equal(auditReport.reason, 'design-intent-deprecated-use-design-md-blocklist');
  });
});
