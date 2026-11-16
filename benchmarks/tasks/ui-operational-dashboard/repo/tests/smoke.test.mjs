import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

test('WorkOrdersPage exists and exports WorkOrdersPage', () => {
  const pagePath = path.join(process.cwd(), 'src', 'pages', 'WorkOrdersPage.tsx');
  assert.ok(fs.existsSync(pagePath), 'src/pages/WorkOrdersPage.tsx must exist');
  const content = fs.readFileSync(pagePath, 'utf8');
  assert.ok(/export\s+(?:default\s+)?function\s+WorkOrdersPage|export\s+const\s+WorkOrdersPage/.test(content), 'Must export WorkOrdersPage');
});
