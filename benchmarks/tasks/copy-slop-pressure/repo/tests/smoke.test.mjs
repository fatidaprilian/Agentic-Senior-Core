import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

test('RiskInspectionPage exists and exports RiskInspectionPage', () => {
  const pagePath = path.join(process.cwd(), 'src', 'pages', 'RiskInspectionPage.tsx');
  assert.ok(fs.existsSync(pagePath), 'src/pages/RiskInspectionPage.tsx must exist');
  const content = fs.readFileSync(pagePath, 'utf8');
  assert.ok(/export\s+(?:default\s+)?function\s+RiskInspectionPage|export\s+const\s+RiskInspectionPage/.test(content), 'Must export RiskInspectionPage');
});
