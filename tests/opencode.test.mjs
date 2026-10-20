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

describe('OpenCode Native Plugin, Rules & Skills Integration', () => {
  it('canonical opencode-plugin ES module exists and exports valid V2 and V1 interfaces', async () => {
    const pluginPath = path.join(repositoryRoot, 'lib', 'opencode-plugin', 'agentic-senior-core.js');
    const content = await fs.readFile(pluginPath, 'utf8');

    assert.ok(content.includes('export default'), 'Plugin must default export module');
    assert.ok(content.includes('id: "agentic-senior-core"'), 'Plugin must declare id');
    assert.ok(content.includes('setup'), 'Plugin must implement V2 setup lifecycle');
    assert.ok(content.includes('server'), 'Plugin must implement V1 server lifecycle fallback');
    assert.ok(content.includes('"context"'), 'Plugin must hook session context');
    assert.ok(content.includes('"compaction"'), 'Plugin must hook session compaction');
  });

  it('asc adapter --opencode generates AGENTS.md, plugin and skills in workspace', async () => {
    const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'asc-opencode-adapter-test-'));
    const originalCwd = process.cwd();

    try {
      process.chdir(tmpDir);
      await runAdapterCommand(['--opencode']);

      const rulesPath = path.join(tmpDir, 'AGENTS.md');
      const rulesExist = await fs.access(rulesPath).then(() => true).catch(() => false);
      assert.ok(rulesExist, 'asc adapter --opencode must generate AGENTS.md');

      const rulesContent = await fs.readFile(rulesPath, 'utf8');
      assert.ok(rulesContent.includes('# Agentic Senior Core'), 'AGENTS.md must contain ASC rules');

      const pluginPath = path.join(tmpDir, '.opencode', 'plugins', 'agentic-senior-core.js');
      const pluginExists = await fs.access(pluginPath).then(() => true).catch(() => false);
      assert.ok(pluginExists, 'asc adapter --opencode must generate .opencode/plugins/agentic-senior-core.js');

      const skillsDir = path.join(tmpDir, '.opencode', 'skills');
      const skillsExist = await fs.access(skillsDir).then(() => true).catch(() => false);
      assert.ok(skillsExist, 'asc adapter --opencode must generate .opencode/skills/ directory');

      for (const skillName of EXPECTED_SKILLS) {
        const skillFilePath = path.join(skillsDir, skillName, 'SKILL.md');
        const skillExists = await fs.access(skillFilePath).then(() => true).catch(() => false);
        assert.ok(skillExists, `Missing skill file: ${skillName}/SKILL.md in .opencode/skills/`);
      }
    } finally {
      process.chdir(originalCwd);
      await fs.rm(tmpDir, { recursive: true, force: true });
    }
  });

  it('asc uninstall cleanly removes OpenCode rules, plugin and skills in workspace', async () => {
    const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'asc-opencode-uninstall-test-'));
    const originalCwd = process.cwd();

    try {
      process.chdir(tmpDir);
      await runAdapterCommand(['--opencode']);

      const rulesPath = path.join(tmpDir, 'AGENTS.md');
      const pluginPath = path.join(tmpDir, '.opencode', 'plugins', 'agentic-senior-core.js');
      const skillsDir = path.join(tmpDir, '.opencode', 'skills');

      assert.ok(await fs.access(rulesPath).then(() => true).catch(() => false), 'Rules should exist before uninstall');
      assert.ok(await fs.access(pluginPath).then(() => true).catch(() => false), 'Plugin should exist before uninstall');
      assert.ok(await fs.access(skillsDir).then(() => true).catch(() => false), 'Skills should exist before uninstall');

      await runUninstallCommand([]);

      const rulesAfter = await fs.access(rulesPath).then(() => true).catch(() => false);
      const pluginAfter = await fs.access(pluginPath).then(() => true).catch(() => false);
      const skillsAfter = await fs.access(skillsDir).then(() => true).catch(() => false);

      assert.equal(rulesAfter, false, 'AGENTS.md with ASC signature must be deleted after uninstall');
      assert.equal(pluginAfter, false, 'OpenCode plugin file must be deleted after uninstall');
      assert.equal(skillsAfter, false, 'OpenCode skills directory must be deleted after uninstall');
    } finally {
      process.chdir(originalCwd);
      await fs.rm(tmpDir, { recursive: true, force: true });
    }
  });

  it('asc global --opencode creates ~/.config/opencode files', async () => {
    const HOME = os.homedir();
    const opencodeRulesPath = path.join(HOME, '.config', 'opencode', 'AGENTS.md');
    const opencodePluginPath = path.join(HOME, '.config', 'opencode', 'plugins', 'agentic-senior-core.js');
    const opencodeSkillsDir = path.join(HOME, '.config', 'opencode', 'skills');

    await runGlobalCommand(['--opencode']);

    const rulesCreated = await fs.access(opencodeRulesPath).then(() => true).catch(() => false);
    const pluginCreated = await fs.access(opencodePluginPath).then(() => true).catch(() => false);
    const skillsCreated = await fs.access(opencodeSkillsDir).then(() => true).catch(() => false);

    assert.ok(rulesCreated, 'asc global --opencode must create ~/.config/opencode/AGENTS.md');
    assert.ok(pluginCreated, 'asc global --opencode must create ~/.config/opencode/plugins/agentic-senior-core.js');
    assert.ok(skillsCreated, 'asc global --opencode must create ~/.config/opencode/skills');

    const rulesContent = await fs.readFile(opencodeRulesPath, 'utf8');
    assert.ok(rulesContent.includes('# Agentic Senior Core'), 'Global AGENTS.md must contain ASC rules');
  });
});
