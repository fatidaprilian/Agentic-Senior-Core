import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const currentFilePath = fileURLToPath(import.meta.url);
const repositoryRoot = path.resolve(path.dirname(currentFilePath), '..');

describe('Universal Plugin Structure', () => {
  it('AGENTS.md exists and is under 2000 tokens (~8KB)', async () => {
    const agentsPath = path.join(repositoryRoot, 'AGENTS.md');
    const content = await fs.readFile(agentsPath, 'utf8');
    assert.ok(content.length > 100, 'AGENTS.md should have meaningful content');
    assert.ok(content.length < 8000, `AGENTS.md too large: ${content.length} bytes (target <8000)`);
  });

  it('AGENTS.md contains required sections', async () => {
    const content = await fs.readFile(path.join(repositoryRoot, 'AGENTS.md'), 'utf8');
    const requiredSections = [
      'Code Quality',
      'Architecture',
      'Security',
      'Error Handling',
      'Testing',
      'API Design',
      'Database',
      'Frontend',
      'Infrastructure',
      'Resilience',
      'Response Style',
    ];
    for (const section of requiredSections) {
      assert.ok(content.includes(section), `AGENTS.md missing section: ${section}`);
    }
  });

  it('AGENTS.md has explicit security carveouts', async () => {
    const content = await fs.readFile(path.join(repositoryRoot, 'AGENTS.md'), 'utf8');
    assert.ok(content.includes('never skip'), 'Security section must have "never skip" carveout');
    assert.ok(content.includes('trust boundar'), 'Must mention trust boundaries');
    assert.ok(content.includes('Parameterize'), 'Must mention parameterized queries');
  });
});

describe('Claude Code Plugin', () => {
  it('.claude-plugin/plugin.json exists and has correct schema', async () => {
    const pluginPath = path.join(repositoryRoot, '.claude-plugin', 'plugin.json');
    const content = await fs.readFile(pluginPath, 'utf8');
    const plugin = JSON.parse(content);
    assert.equal(plugin.name, 'agentic-senior-core');
    assert.ok(plugin.version);
    assert.ok(plugin.skills, 'plugin.json must declare skills path');
    assert.ok(plugin.hooks, 'plugin.json must declare hooks path');
  });

  it('.claude-plugin/marketplace.json exists', async () => {
    const marketplacePath = path.join(repositoryRoot, '.claude-plugin', 'marketplace.json');
    const content = await fs.readFile(marketplacePath, 'utf8');
    const marketplace = JSON.parse(content);
    assert.ok(marketplace.plugins, 'marketplace.json must have plugins array');
    assert.ok(marketplace.plugins.length > 0);
  });
});

describe('Codex Plugin', () => {
  it('.codex-plugin/plugin.json exists and has correct schema', async () => {
    const pluginPath = path.join(repositoryRoot, '.codex-plugin', 'plugin.json');
    const content = await fs.readFile(pluginPath, 'utf8');
    const plugin = JSON.parse(content);
    assert.equal(plugin.name, 'agentic-senior-core');
    assert.ok(plugin.skills, 'plugin.json must declare skills path');
    assert.ok(plugin.hooks, 'plugin.json must declare hooks path');
    assert.ok(plugin.interface, 'plugin.json must have interface for marketplace');
  });
});

describe('Hooks', () => {
  it('hooks/hooks.json has correct Claude format', async () => {
    const hooksPath = path.join(repositoryRoot, 'hooks', 'hooks.json');
    const content = await fs.readFile(hooksPath, 'utf8');
    const hooks = JSON.parse(content);
    assert.ok(hooks.hooks.SessionStart, 'Must have SessionStart event');
    assert.ok(hooks.hooks.SubagentStart, 'Must have SubagentStart event');
    assert.ok(Array.isArray(hooks.hooks.SessionStart), 'SessionStart must be an array');
    const sessionHook = hooks.hooks.SessionStart[0];
    assert.ok(sessionHook.hooks[0].command, 'Hook must have command field');
    assert.ok(sessionHook.hooks[0].commandWindows, 'Hook must have commandWindows field');
  });

  it('hooks/copilot-hooks.json has camelCase events', async () => {
    const hooksPath = path.join(repositoryRoot, 'hooks', 'copilot-hooks.json');
    const content = await fs.readFile(hooksPath, 'utf8');
    const hooks = JSON.parse(content);
    assert.ok(hooks.hooks.sessionStart, 'Must have camelCase sessionStart');
    assert.ok(hooks.hooks.subagentStart, 'Must have camelCase subagentStart');
  });

  it('session-start.js and subagent-start.js exist', async () => {
    await fs.access(path.join(repositoryRoot, 'hooks', 'session-start.js'));
    await fs.access(path.join(repositoryRoot, 'hooks', 'subagent-start.js'));
  });

  it('hook scripts use CommonJS (require)', async () => {
    const sessionStart = await fs.readFile(path.join(repositoryRoot, 'hooks', 'session-start.js'), 'utf8');
    const subagentStart = await fs.readFile(path.join(repositoryRoot, 'hooks', 'subagent-start.js'), 'utf8');
    assert.ok(sessionStart.includes("require('fs')") || sessionStart.includes("require('node:fs')"), 'session-start.js must use require');
    assert.ok(subagentStart.includes("require('fs')") || subagentStart.includes("require('node:fs')"), 'subagent-start.js must use require');
  });
});

describe('Skills', () => {
  it('all skill directories have SKILL.md', async () => {
    const skillsDir = path.join(repositoryRoot, 'skills');
    const skillDirs = await fs.readdir(skillsDir);
    for (const dir of skillDirs) {
      const skillPath = path.join(skillsDir, dir, 'SKILL.md');
      const exists = await fs.access(skillPath).then(() => true).catch(() => false);
      assert.ok(exists, `Missing SKILL.md in skills/${dir}/`);
    }
  });

  it('asc-adapter skill exists', async () => {
    const skillPath = path.join(repositoryRoot, 'skills', 'asc-adapter', 'SKILL.md');
    const exists = await fs.access(skillPath).then(() => true).catch(() => false);
    assert.ok(exists, 'Missing skills/asc-adapter/SKILL.md');
  });
});

describe('Commands', () => {
  it('all .md command files exist', async () => {
    const commandsDir = path.join(repositoryRoot, 'commands');
    const expectedMd = ['asc-refactor.md', 'asc-review.md', 'asc-audit.md', 'asc-help.md'];
    for (const cmd of expectedMd) {
      const cmdPath = path.join(commandsDir, cmd);
      const exists = await fs.access(cmdPath).then(() => true).catch(() => false);
      assert.ok(exists, `Missing command file: commands/${cmd}`);
    }
  });

  it('all .toml command files exist (Gemini)', async () => {
    const commandsDir = path.join(repositoryRoot, 'commands');
    const expectedToml = ['asc-refactor.toml', 'asc-review.toml', 'asc-audit.toml', 'asc-help.toml'];
    for (const cmd of expectedToml) {
      const cmdPath = path.join(commandsDir, cmd);
      const exists = await fs.access(cmdPath).then(() => true).catch(() => false);
      assert.ok(exists, `Missing Gemini command file: commands/${cmd}`);
    }
  });
});

describe('Host Adapters', () => {
  it('in-repo adapter files exist at standard IDE paths', async () => {
    const adapterPaths = [
      '.cursor/rules/agentic-senior-core.mdc',
      '.windsurf/rules/agentic-senior-core.md',
      '.devin/rules/agentic-senior-core.md',
      '.clinerules/agentic-senior-core.md',
      '.github/copilot-instructions.md',
      '.kiro/steering/agentic-senior-core.md',
      '.continue/rules/agentic-senior-core.md',
      '.zed/rules/agentic-senior-core.md',
      '.kilocode/rules/agentic-senior-core.md',
      '.roo/rules/agentic-senior-core.md',
      '.openhands/microagents/agentic-senior-core.md',
      'CONVENTIONS.md',
    ];
    for (const adapterPath of adapterPaths) {
      const fullPath = path.join(repositoryRoot, adapterPath);
      const exists = await fs.access(fullPath).then(() => true).catch(() => false);
      assert.ok(exists, `Missing in-repo adapter: ${adapterPath}`);
    }
  });

  it('cursor.mdc has alwaysApply frontmatter', async () => {
    const content = await fs.readFile(path.join(repositoryRoot, '.cursor', 'rules', 'agentic-senior-core.mdc'), 'utf8');
    assert.ok(content.includes('alwaysApply: true'), 'Cursor adapter must have alwaysApply: true');
  });

  it('new host plugin manifests exist', async () => {
    const manifestPaths = [
      '.devin-plugin/plugin.json',
      '.github/plugin/plugin.json',
      '.github/plugin/marketplace.json',
      '.agents/plugins/agentic-senior-core/plugin.json',
      '.agents/rules/agentic-senior-core.md',
      'plugin.yaml',
      '__init__.py',
    ];
    for (const manifestPath of manifestPaths) {
      const fullPath = path.join(repositoryRoot, manifestPath);
      const exists = await fs.access(fullPath).then(() => true).catch(() => false);
      assert.ok(exists, `Missing host manifest: ${manifestPath}`);
    }
  });

  it('Antigravity rules have correct frontmatter', async () => {
    const content = await fs.readFile(path.join(repositoryRoot, '.agents', 'rules', 'agentic-senior-core.md'), 'utf8');
    assert.ok(content.includes('trigger: always_on'), 'Antigravity rule must have trigger: always_on');
    assert.ok(content.includes('description:'), 'Antigravity rule must have description');
  });

  it('Antigravity plugin bundle has skills', async () => {
    const pluginSkills = ['asc', 'asc-review', 'asc-audit', 'asc-refactor'];
    for (const skill of pluginSkills) {
      const skillPath = path.join(repositoryRoot, '.agents', 'plugins', 'agentic-senior-core', 'skills', skill, 'SKILL.md');
      const exists = await fs.access(skillPath).then(() => true).catch(() => false);
      assert.ok(exists, `Missing Antigravity plugin skill: ${skill}`);
    }
  });

  it('OpenCode plugin exists', async () => {
    await fs.access(path.join(repositoryRoot, '.opencode', 'plugins', 'agentic-senior-core.mjs'));
  });

  it('OpenClaw skills exist', async () => {
    await fs.access(path.join(repositoryRoot, '.openclaw', 'skills', 'asc', 'SKILL.md'));
    await fs.access(path.join(repositoryRoot, '.openclaw', 'skills', 'asc-review', 'SKILL.md'));
    await fs.access(path.join(repositoryRoot, '.openclaw', 'skills', 'asc-audit', 'SKILL.md'));
  });

  it('gemini-extension.json references AGENTS.md', async () => {
    const content = await fs.readFile(path.join(repositoryRoot, 'gemini-extension.json'), 'utf8');
    const extension = JSON.parse(content);
    assert.equal(extension.contextFileName, 'AGENTS.md');
  });
});

describe('CLI Commands', () => {
  it('uninstall command module exists', async () => {
    const uninstallPath = path.join(repositoryRoot, 'lib', 'cli', 'commands', 'uninstall.mjs');
    const exists = await fs.access(uninstallPath).then(() => true).catch(() => false);
    assert.ok(exists, 'Missing lib/cli/commands/uninstall.mjs');
  });

  it('all version references are consistent', async () => {
    const pkgContent = await fs.readFile(path.join(repositoryRoot, 'package.json'), 'utf8');
    const pkg = JSON.parse(pkgContent);
    const version = pkg.version;

    const versionFiles = [
      '.claude-plugin/plugin.json',
      '.codex-plugin/plugin.json',
      '.devin-plugin/plugin.json',
      '.github/plugin/plugin.json',
      'gemini-extension.json',
    ];

    for (const filePath of versionFiles) {
      const content = await fs.readFile(path.join(repositoryRoot, filePath), 'utf8');
      const json = JSON.parse(content);
      assert.equal(json.version, version, `Version mismatch in ${filePath}: expected ${version}, got ${json.version}`);
    }
  });
});
