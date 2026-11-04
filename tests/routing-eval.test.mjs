import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const currentFilePath = fileURLToPath(import.meta.url);
const repositoryRoot = path.resolve(path.dirname(currentFilePath), '..');

describe('Routing Evaluation & Skill Trigger Disambiguation', () => {
  const pluginDir = path.join(repositoryRoot, '.agents', 'plugins', 'agentic-senior-core');
  const skillsDir = path.join(pluginDir, 'skills');
  const allSkills = ['asc', 'asc-develop', 'asc-review', 'asc-test', 'asc-reference', 'asc-ui'];

  it('validates eval/routing-eval.json dataset integrity', async () => {
    const evalPath = path.join(repositoryRoot, 'eval', 'routing-eval.json');
    const raw = await fs.readFile(evalPath, 'utf8');
    const data = JSON.parse(raw);

    assert.ok(Array.isArray(data.cases), 'eval dataset must contain cases array');
    assert.strictEqual(data.cases.length, 40, 'must contain exactly 40 evaluation cases');

    const counts = {};
    for (const c of data.cases) {
      assert.ok(c.id, 'case must have id');
      assert.ok(c.prompt, 'case must have prompt');
      assert.ok(allSkills.includes(c.expected_skill), `case ${c.id} has valid expected_skill`);
      counts[c.expected_skill] = (counts[c.expected_skill] || 0) + 1;
    }

    // Verify all 6 skills are adequately represented
    for (const skill of allSkills) {
      assert.ok(
        (counts[skill] || 0) >= 6,
        `Skill ${skill} must have at least 6 test cases in eval dataset`
      );
    }
  });

  it('verifies skill descriptions adhere to trigger-only discipline', async () => {
    for (const skill of allSkills) {
      const skillFile = path.join(skillsDir, skill, 'SKILL.md');
      const content = await fs.readFile(skillFile, 'utf8');

      // Extract frontmatter description
      const descMatch = content.match(/description:\s*>([\s\S]*?)---/);
      assert.ok(descMatch, `Skill ${skill} must have frontmatter description`);

      const descText = descMatch[1].trim().replace(/\s+/g, ' ');

      // Length budget: under 650 characters (concise for prompt cache)
      assert.ok(
        descText.length <= 650,
        `Skill ${skill} description is ${descText.length} chars (must be <= 650)`
      );

      // Ban workflow summary phrases in description
      assert.strictEqual(
        /Handles\s+[A-Z]/i.test(descText),
        false,
        `Skill ${skill} description must not contain 'Handles ...' workflow summary`
      );
      assert.strictEqual(
        /Covers\s+[A-Z]/i.test(descText),
        false,
        `Skill ${skill} description must not contain 'Covers ...' workflow summary`
      );

      // Must start with trigger condition
      assert.ok(
        descText.startsWith('Trigger this skill when') || descText.startsWith('Trigger when'),
        `Skill ${skill} description must start with 'Trigger this skill when'`
      );
    }
  });

  it('ensures no conflicting trigger overlap between testing, UI, and reference skills', async () => {
    const readSkillDesc = async (skill) => {
      const content = await fs.readFile(path.join(skillsDir, skill, 'SKILL.md'), 'utf8');
      const match = content.match(/description:\s*>([\s\S]*?)---/);
      return match ? match[1].toLowerCase() : '';
    };

    const testDesc = await readSkillDesc('asc-test');
    const refDesc = await readSkillDesc('asc-reference');
    const uiDesc = await readSkillDesc('asc-ui');

    // asc-reference must NOT contain testing triggers
    assert.strictEqual(refDesc.includes('write a test'), false, 'asc-reference must not trigger on "write a test"');
    assert.strictEqual(refDesc.includes('bikin tes'), false, 'asc-reference must not trigger on "bikin tes"');
    assert.strictEqual(refDesc.includes('unit test'), false, 'asc-reference must not trigger on "unit test"');

    // asc-reference must NOT contain UI layout triggers
    assert.strictEqual(refDesc.includes('frontend layouts'), false, 'asc-reference must not trigger on "frontend layouts"');
    assert.strictEqual(refDesc.includes('react components'), false, 'asc-reference must not trigger on "react components"');
    assert.strictEqual(refDesc.includes('broken on mobile'), false, 'asc-reference must not trigger on "broken on mobile"');

    // asc-ui owns mobile and UI
    assert.ok(uiDesc.includes('broken on mobile') || uiDesc.includes('tampilan di hp rusak'), 'asc-ui owns mobile UI');

    // asc-test owns testing triggers
    assert.ok(testDesc.includes('write a test'), 'asc-test owns "write a test"');
    assert.ok(testDesc.includes('bikin tes'), 'asc-test owns "bikin tes"');
  });
});

