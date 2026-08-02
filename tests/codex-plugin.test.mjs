import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const currentFilePath = fileURLToPath(import.meta.url);
const repositoryRoot = path.resolve(path.dirname(currentFilePath), '..');

describe('Codex Plugin & Marketplace Support', () => {
  it('.codex-plugin/plugin.json exists and is valid Codex manifest', async () => {
    const codexManifestPath = path.join(
      repositoryRoot,
      '.agents',
      'plugins',
      'agentic-senior-core',
      '.codex-plugin',
      'plugin.json'
    );

    const content = await fs.readFile(codexManifestPath, 'utf8');
    const parsed = JSON.parse(content);

    assert.equal(parsed.name, 'agentic-senior-core');
    assert.equal(parsed.skills, './skills/');
    assert.equal(parsed.hooks, './hooks/hooks.json');
    assert.ok(parsed.interface && parsed.interface.displayName);
  });

  it('.agents/plugins/marketplace.json exists and is valid catalog', async () => {
    const marketplacePath = path.join(repositoryRoot, '.agents', 'plugins', 'marketplace.json');
    const content = await fs.readFile(marketplacePath, 'utf8');
    const parsed = JSON.parse(content);

    assert.equal(parsed.name, 'agentic-senior-core-marketplace');
    assert.ok(Array.isArray(parsed.plugins));
    assert.equal(parsed.plugins[0].name, 'agentic-senior-core');
  });
});
