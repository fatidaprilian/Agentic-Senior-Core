import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import { fileURLToPath } from 'node:url';
import { runAdapterCommand } from '../lib/cli/commands/adapter.mjs';

const currentFilePath = fileURLToPath(import.meta.url);
const repositoryRoot = path.resolve(path.dirname(currentFilePath), '..');

describe('Kilo Code Native Plugin & Adapter Integration', () => {
  it('canonical kilo-plugin ES module exists and has valid export structure', async () => {
    const pluginPath = path.join(repositoryRoot, 'lib', 'kilo-plugin', 'agentic-senior-core.js');
    const content = await fs.readFile(pluginPath, 'utf8');
    assert.ok(content.includes('export default'), 'Plugin must default export module');
    assert.ok(content.includes('id: "agentic-senior-core"'), 'Plugin must declare id');
    assert.ok(content.includes('experimental.chat.system.transform'), 'Plugin must register system prompt transform hook');
    assert.ok(content.includes('experimental.session.compacting'), 'Plugin must register compaction hook');

    const universalPluginKiloFolder = path.join(repositoryRoot, '.agents', 'plugins', 'agentic-senior-core', 'kilo-plugin');
    const universalHasKiloFolder = await fs.access(universalPluginKiloFolder).then(() => true).catch(() => false);
    assert.equal(universalHasKiloFolder, false, '.agents/plugins/agentic-senior-core must NOT contain kilo-plugin folder');
  });

  it('asc adapter --kilocode creates modern .kilo/ rules and plugin files', async () => {
    const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'asc-kilo-test-'));
    const originalCwd = process.cwd();
    try {
      process.chdir(tmpDir);
      await runAdapterCommand(['--kilocode']);

      const modernRuleExists = await fs.access(path.join(tmpDir, '.kilo', 'rules', 'agentic-senior-core.md')).then(() => true).catch(() => false);
      const modernPluginExists = await fs.access(path.join(tmpDir, '.kilo', 'plugin', 'agentic-senior-core.js')).then(() => true).catch(() => false);
      const legacyRuleExists = await fs.access(path.join(tmpDir, '.kilocode', 'rules', 'agentic-senior-core.md')).then(() => true).catch(() => false);

      assert.ok(modernRuleExists, 'asc adapter --kilocode must create .kilo/rules/agentic-senior-core.md');
      assert.ok(modernPluginExists, 'asc adapter --kilocode must create .kilo/plugin/agentic-senior-core.js');
      assert.ok(legacyRuleExists, 'asc adapter --kilocode must create legacy .kilocode/rules/agentic-senior-core.md fallback');
    } finally {
      process.chdir(originalCwd);
      await fs.rm(tmpDir, { recursive: true, force: true });
    }
  });

  it('asc global --kilocode isolates plugin only to Kilo Code targets', async () => {
    const { runGlobalCommand } = await import('../lib/cli/commands/global.mjs');
    const HOME = os.homedir();
    const kiloPluginPath = path.join(HOME, '.config', 'kilo', 'plugin', 'agentic-senior-core.js');
    const kiloRulesPath = path.join(HOME, '.config', 'kilo', 'rules', 'agentic-senior-core.md');

    await runGlobalCommand(['--kilocode']);

    const pluginCreated = await fs.access(kiloPluginPath).then(() => true).catch(() => false);
    const rulesCreated = await fs.access(kiloRulesPath).then(() => true).catch(() => false);

    assert.ok(pluginCreated, 'asc global --kilocode must create ~/.config/kilo/plugin/agentic-senior-core.js');
    assert.ok(rulesCreated, 'asc global --kilocode must create ~/.config/kilo/rules/agentic-senior-core.md');

    // Ensure non-Kilo target directories (e.g. .cline, .roo, .windsurf) NEVER contain kilo-plugin
    const clineRulesDir = path.join(HOME, 'Documents', 'Cline', 'Rules');
    const clineKiloCheck = await fs.access(path.join(clineRulesDir, 'agentic-senior-core.js')).then(() => true).catch(() => false);
    assert.equal(clineKiloCheck, false, 'Non-Kilo targets must NOT pull kilo plugin');
  });
});

