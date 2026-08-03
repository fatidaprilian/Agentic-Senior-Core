import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const currentFilePath = fileURLToPath(import.meta.url);
const repositoryRoot = path.resolve(path.dirname(currentFilePath), '..');

describe('Polyglot Security Patterns', () => {
  it('loads known-security-patterns.json with valid schema and language tags', async () => {
    const filePath = path.join(repositoryRoot, '.agents', 'plugins', 'agentic-senior-core', 'hooks', 'lib', 'known-security-patterns.json');
    const raw = await fs.readFile(filePath, 'utf8');
    const data = JSON.parse(raw);

    assert.ok(Array.isArray(data.patterns), 'patterns must be an array');
    assert.ok(data.patterns.length >= 10, 'must have at least 10 security patterns');

    const expectedLangs = ['js', 'py', 'go', 'rs', 'universal'];
    for (const p of data.patterns) {
      assert.ok(p.id, 'Pattern must have id');
      assert.ok(p.regex, 'Pattern must have regex');
      assert.ok(p.message, 'Pattern must have message');
      assert.ok(Array.isArray(p.languages), `Pattern ${p.id} must have languages array`);
      for (const lang of p.languages) {
        assert.ok(expectedLangs.includes(lang) || ['ts', 'jsx', 'tsx', 'mjs', 'cjs'].includes(lang), `Pattern ${p.id} has valid language: ${lang}`);
      }
    }
  });
});
