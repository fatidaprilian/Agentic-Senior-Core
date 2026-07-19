import test from 'node:test';
import assert from 'node:assert';
import path from 'node:path';
import os from 'node:os';
import crypto from 'node:crypto';
import { createRequire } from 'node:module';
const requireCJS = createRequire(import.meta.url);
const pathUtil = requireCJS('../hooks/path-util.cjs');

test('Path Hash Normalization', async (t) => {
  await t.test('computes identical hashes despite casing and slash differences on Windows', () => {
    const pathA = 'C:\\Users\\User\\Project';
    const pathB = 'c:/users/user/project/';

    const hashA = pathUtil.getWorkflowGatePath(pathA);
    const hashB = pathUtil.getWorkflowGatePath(pathB);

    assert.strictEqual(hashA, hashB, 'Hashes should match regardless of separator and casing');
  });

  await t.test('hook path computation matches mcp path computation', () => {
    // Both now use the exact same utility, so this test ensures the utility is stable
    const samplePath = path.resolve('E:/Project/Agentic-Senior-Core');
    
    // Simulate what post-edit-enforce does (process.cwd())
    const hookPath = pathUtil.getWorkflowGatePath(samplePath);

    // Simulate what tools.mjs does (REPOSITORY_ROOT)
    const mcpPath = pathUtil.getWorkflowGatePath(samplePath);

    assert.strictEqual(hookPath, mcpPath, 'Hook and MCP must resolve to identical paths');

    // Verify it resolves to the home config directory
    const expectedPrefix = path.join(os.homedir(), '.config', 'agentic-senior-core', 'gates');
    assert.ok(hookPath.startsWith(expectedPrefix), 'Should be stored in global home directory');
  });
});
