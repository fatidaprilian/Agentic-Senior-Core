import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import { fileURLToPath } from 'node:url';
import { runAdapterCommand } from '../lib/cli/commands/adapter.mjs';
import { runGlobalCommand } from '../lib/cli/commands/global.mjs';
import { runUninstallCommand } from '../lib/cli/commands/uninstall.mjs';

const currentFilePath = fileURLToPath(import.meta.url);
const repositoryRoot = path.resolve(path.dirname(currentFilePath), '..');

const EXPECTED_SKILLS = [
  'asc',
  'asc-adapter',
  'asc-add-feature',
  'asc-audit',
  'asc-bootstrap',
  'asc-debt',
  'asc-dedup',
  'asc-fingerprint',
  'asc-learn',
  'asc-new-project',
  'asc-refactor',
  'asc-reference',
  'asc-review',
];

describe('Roo Code Rules and Skills Integration', () => {
  it('asc adapter --roo creates .roo/rules and all 13 skills in .roo/skills', async () => {
    const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'asc-roo-adapter-test-'));
    const originalCwd = process.cwd();

    try {
      process.chdir(tmpDir);
      await runAdapterCommand(['--roo']);

      const rulesPath = path.join(tmpDir, '.roo', 'rules', 'agentic-senior-core.md');
      const rulesExist = await fs.access(rulesPath).then(() => true).catch(() => false);
      assert.ok(rulesExist, 'asc adapter --roo must generate .roo/rules/agentic-senior-core.md');

      const skillsDir = path.join(tmpDir, '.roo', 'skills');
      const skillsExist = await fs.access(skillsDir).then(() => true).catch(() => false);
      assert.ok(skillsExist, 'asc adapter --roo must generate .roo/skills/ directory');

      for (const skillName of EXPECTED_SKILLS) {
        const skillFilePath = path.join(skillsDir, skillName, 'SKILL.md');
        const skillExists = await fs.access(skillFilePath).then(() => true).catch(() => false);
        assert.ok(skillExists, `Missing skill file: ${skillName}/SKILL.md in .roo/skills/`);

        const content = await fs.readFile(skillFilePath, 'utf8');
        assert.ok(content.includes(`name: ${skillName}`), `${skillName} frontmatter must match directory name`);

        const match = content.match(/description:\s*(?:>|-)?\s*\n?([\s\S]*?)---/);
        assert.ok(match, `${skillName} must contain valid description frontmatter`);
        const desc = match[1].replace(/\n\s*/g, ' ').trim();
        assert.ok(desc.length > 0 && desc.length <= 1024, `${skillName} description length (${desc.length}) must be <= 1024 chars`);
      }
    } finally {
      process.chdir(originalCwd);
      await fs.rm(tmpDir, { recursive: true, force: true });
    }
  });

  it('asc uninstall cleanly removes .roo/rules and .roo/skills in workspace', async () => {
    const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'asc-roo-uninstall-test-'));
    const originalCwd = process.cwd();

    try {
      process.chdir(tmpDir);
      await runAdapterCommand(['--roo']);

      const rulesPath = path.join(tmpDir, '.roo', 'rules', 'agentic-senior-core.md');
      const skillsPath = path.join(tmpDir, '.roo', 'skills');

      assert.ok(await fs.access(rulesPath).then(() => true).catch(() => false), 'Rules should exist before uninstall');
      assert.ok(await fs.access(skillsPath).then(() => true).catch(() => false), 'Skills should exist before uninstall');

      await runUninstallCommand([]);

      const rulesAfter = await fs.access(rulesPath).then(() => true).catch(() => false);
      const skillsAfter = await fs.access(skillsPath).then(() => true).catch(() => false);

      assert.equal(rulesAfter, false, 'Rules file must be deleted after uninstall');
      assert.equal(skillsAfter, false, 'Skills directory must be deleted after uninstall');
    } finally {
      process.chdir(originalCwd);
      await fs.rm(tmpDir, { recursive: true, force: true });
    }
  });

  it('asc global --roo installs rules to ~/.roo/rules and skills to ~/.roo/skills', async () => {
    const HOME = os.homedir();
    const globalRulesPath = path.join(HOME, '.roo', 'rules', 'agentic-senior-core.md');
    const globalSkillsDir = path.join(HOME, '.roo', 'skills');

    await runGlobalCommand(['--roo']);

    const rulesExist = await fs.access(globalRulesPath).then(() => true).catch(() => false);
    assert.ok(rulesExist, 'asc global --roo must install rules to ~/.roo/rules/agentic-senior-core.md');

    const skillsExist = await fs.access(globalSkillsDir).then(() => true).catch(() => false);
    assert.ok(skillsExist, 'asc global --roo must install skills to ~/.roo/skills/');

    for (const skillName of EXPECTED_SKILLS) {
      const skillPath = path.join(globalSkillsDir, skillName, 'SKILL.md');
      const exists = await fs.access(skillPath).then(() => true).catch(() => false);
      assert.ok(exists, `Global skill must exist: ~/.roo/skills/${skillName}/SKILL.md`);
    }
  });
});
