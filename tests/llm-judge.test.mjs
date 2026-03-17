import test from 'node:test';
import assert from 'node:assert/strict';
import { execSync } from 'node:child_process';
import { join } from 'node:path';

test('LLM Judge Tests', async (t) => {
  const judgePath = join(process.cwd(), 'scripts', 'llm-judge.mjs');

  await t.test('dry-run mode does not error and produces JSON_VERDICT', () => {
    // In CI environment or normal environments, dry-run shouldn't ask for API keys.
    const output = execSync(`node ${judgePath} --dry-run`).toString();
    
    // It should output VERDICT: JSON_VERDICT: []  (dry run — no LLM call made)
    assert.match(output, /JSON_VERDICT:\s*\[\]/);
    assert.match(output, /dry run — no LLM call made/);
  });
});
