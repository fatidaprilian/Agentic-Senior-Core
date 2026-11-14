import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const currentFilePath = fileURLToPath(import.meta.url);
const repositoryRoot = path.resolve(path.dirname(currentFilePath), '..');

function runPostEditHook(payload) {
  const hookPath = path.join(repositoryRoot, '.agents', 'plugins', 'agentic-senior-core', 'hooks', 'post-edit-enforce.js');
  return spawnSync(process.execPath, [hookPath], {
    input: JSON.stringify(payload),
    encoding: 'utf8',
    timeout: 8000,
  });
}

describe('Clean Code, Review Standards & Cross-Stack Language Hygiene', () => {
  const pluginDir = path.join(repositoryRoot, '.agents', 'plugins', 'agentic-senior-core');
  const reviewSkillDir = path.join(pluginDir, 'skills', 'asc-review');

  it('keeps asc-review/SKILL.md as a lean router <= 150 lines with universal Quality Floor', async () => {
    const content = await fs.readFile(path.join(reviewSkillDir, 'SKILL.md'), 'utf8');
    const lineCount = content.split('\n').length;

    assert.ok(
      lineCount <= 150,
      `asc-review/SKILL.md must stay <= 150 lines (currently ${lineCount})`
    );
    assert.ok(content.includes('## 1. The Universal Quality Floor'), 'Missing Quality Floor section');
    assert.ok(content.includes('## 2. On-Demand Reference Library'), 'Missing On-Demand Reference section');
    assert.ok(content.includes('## 3. Claim Verification Gate'), 'Missing Claim Verification Gate');
    assert.ok(content.includes('## 4. Operational Modes'), 'Missing Operational Modes');
    assert.ok(content.includes('## 5. Output Format'), 'Missing Output Format');
    assert.ok(content.includes('Cognitive Complexity <= 15'), 'Missing Cognitive Complexity ceiling');
    assert.ok(content.includes('CWE-404'), 'Missing CWE-404 resource disposal invariant');
    assert.ok(content.includes('CWE-915'), 'Missing CWE-915 DTO isolation invariant');
    assert.ok(content.includes('CWE-390'), 'Missing CWE-390 error integrity invariant');
  });

  it('provides exactly 4 substantive 1-hop references in asc-review/references/', async () => {
    const expectedRefs = [
      'clean-code-and-complexity.md',
      'concurrency-and-resources.md',
      'contracts-and-error-hygiene.md',
      'review-protocol.md',
    ];

    const actualEntries = await fs.readdir(path.join(reviewSkillDir, 'references'));
    assert.deepStrictEqual(
      actualEntries.slice().sort(),
      expectedRefs.slice().sort(),
      'asc-review/references/ must contain strictly the 4 universal engineering references'
    );

    for (const ref of expectedRefs) {
      const content = await fs.readFile(path.join(reviewSkillDir, 'references', ref), 'utf8');
      assert.ok(content.length > 800, `Reference ${ref} must have substantive guidance`);
      assert.ok(!content.includes('SAURAN'), `Contamination found in ${ref}`);
    }
  });

  it('enforces universal Clean Code invariants in always-on rules and asc-develop review gates', async () => {
    const rulesContent = await fs.readFile(path.join(pluginDir, 'rules', 'agentic-senior-core.md'), 'utf8');
    assert.ok(rulesContent.includes('Bounded complexity & signatures'), 'Rule missing complexity limit');
    assert.ok(rulesContent.includes('Boundary typing & DTO isolation'), 'Rule missing DTO isolation');
    assert.ok(rulesContent.includes('Resource & async hygiene'), 'Rule missing resource/async hygiene');
    assert.ok(rulesContent.includes('Error integrity & human-by-design errors'), 'Rule missing error integrity');

    const orchContent = await fs.readFile(
      path.join(pluginDir, 'skills', 'asc-develop', 'references', 'subagent-orchestration.md'),
      'utf8'
    );
    assert.ok(orchContent.includes('CWE-915'), 'Subagent Pass 2 must enforce DTO isolation');
    assert.ok(orchContent.includes('CWE-404'), 'Subagent Pass 2 must enforce resource closure');
    assert.ok(orchContent.includes('cognitive complexity <= 15'), 'Subagent Pass 2 must enforce complexity ceiling');
  });

  it('catches Python/block comment noise and broad morphological hybrid words without false positives', async () => {
    const slopRaw = await fs.readFile(path.join(pluginDir, 'hooks', 'lib', 'known-ui-slop-patterns.json'), 'utf8');
    const catalog = JSON.parse(slopRaw);
    const byId = Object.fromEntries(catalog.patterns.map((p) => [p.id, new RegExp(p.regex, 'i')]));

    // Comment syntax parity (//, #, /*)
    assert.ok(byId['code-decorative-banner'].test('# =================='), 'Should match Python # banner');
    assert.ok(byId['code-step-narration'].test('# Step 2: compute total'), 'Should match Python # step narration');
    assert.ok(byId['code-step-narration'].test('/* Step 3: save record */'), 'Should match block comment step narration');

    // Broad morphological Indonesian-English hybrids without false English hits
    for (const hybrid of ['meng-upload', 'mengupload', 'di-export', 'disubmit', 'terupdate', 'di-deploy', 'merender']) {
      const re = new RegExp(catalog.patterns.find((p) => p.id === 'copy-hybrid-neologism').regex, 'i');
      assert.ok(re.test(`Proses ${hybrid} selesai`), `Should catch hybrid word: ${hybrid}`);
    }
    for (const cleanEnglish of ['direct', 'display', 'disable', 'dispatch', 'metric', 'member', 'restart']) {
      const re = new RegExp(catalog.patterns.find((p) => p.id === 'copy-hybrid-neologism').regex, 'i');
      assert.strictEqual(re.test(`Call ${cleanEnglish} handler`), false, `False positive on valid English word: ${cleanEnglish}`);
    }
  });

  it('executes post-edit prose/comment checks on backend (.py, .cs) files while skipping test fixtures', () => {
    const pyRes = runPostEditHook({
      tool_name: 'Write',
      tool_input: {
        file_path: 'src/worker.py',
        content: '# ==================\n# Step 1: parse payload\ndef run():\n    pass\n',
      },
    });
    assert.strictEqual(pyRes.status, 0);
    assert.ok(pyRes.stdout.includes('[ASC Language/Comment Note]'), 'Python file should trigger comment hygiene note');

    const csRes = runPostEditHook({
      tool_name: 'Write',
      tool_input: {
        file_path: 'src/OrderService.cs',
        content: 'public class OrderService { public string Msg() => "Gagal mengupload berkas"; }\n',
      },
    });
    assert.strictEqual(csRes.status, 0);
    assert.ok(csRes.stdout.includes('[ASC Language/Comment Note]'), 'C# file should trigger hybrid language note');

    const testRes = runPostEditHook({
      tool_name: 'Write',
      tool_input: {
        file_path: 'tests/language.test.mjs',
        content: 'const sample = "Klik Simpan (Save) untuk mengupload";\n',
      },
    });
    assert.strictEqual(testRes.status, 0);
    assert.strictEqual(testRes.stdout.includes('[ASC Language/Comment Note]'), false, 'Test fixtures must not trigger false prose alerts');
  });
});
