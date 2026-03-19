import test from 'node:test';
import assert from 'node:assert/strict';
import { execSync } from 'node:child_process';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

test('LLM Judge Tests', async (t) => {
  const judgePath = join(process.cwd(), 'scripts', 'llm-judge.mjs');

  await t.test('dry-run mode does not error and produces JSON_VERDICT', () => {
    const temporaryOutputDirectory = mkdtempSync(join(tmpdir(), 'agentic-senior-core-judge-'));

    try {
      // In CI environment or normal environments, dry-run shouldn't ask for API keys.
      const output = execSync(`node ${judgePath} --dry-run`, {
        env: {
          ...process.env,
          LLM_JUDGE_OUTPUT_PATH: join(temporaryOutputDirectory, 'llm-judge-report.json'),
        },
      }).toString();
    
      // It should output VERDICT: JSON_VERDICT: []  (dry run — no LLM call made)
      assert.match(output, /JSON_VERDICT:\s*\[\]/);
      assert.match(output, /JSON_REPORT:/);
      assert.match(output, /"schemaVersion":"1.0"/);
      assert.match(output, /"provider":"dry-run"/);
      assert.match(output, /dry run — no LLM call made/);
    } finally {
      rmSync(temporaryOutputDirectory, { recursive: true, force: true });
    }
  });
});
