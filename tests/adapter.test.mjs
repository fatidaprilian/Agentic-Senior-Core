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
    const inlineSections = [
      'Code Quality',
      'Architecture',
      'Security',
      'Error Handling',
      'Response Style',
    ];
    for (const section of inlineSections) {
      assert.ok(content.includes(`## ${section}`), `AGENTS.md missing inline section: ${section}`);
    }
    const referencedSections = ['Testing', 'API Design', 'Database', 'Frontend', 'Infrastructure', 'Resilience'];
    for (const section of referencedSections) {
      assert.ok(content.includes(section), `AGENTS.md must reference domain section: ${section}`);
    }
    assert.ok(content.includes('/asc-reference'), 'AGENTS.md must point to asc-reference skill');
  });

  it('AGENTS.md has explicit security carveouts', async () => {
    const content = await fs.readFile(path.join(repositoryRoot, 'AGENTS.md'), 'utf8');
    assert.ok(content.includes('never skip'), 'Security section must have "never skip" carveout');
    assert.ok(content.includes('trust boundar'), 'Must mention trust boundaries');
    assert.ok(content.includes('Parameterize'), 'Must mention parameterized queries');
  });
});

describe('Hooks', () => {
  it('hooks.json has correct Claude format', async () => {
    const hooksPath = path.join(repositoryRoot, '.agents', 'plugins', 'agentic-senior-core', 'hooks.json');
    const content = await fs.readFile(hooksPath, 'utf8');
    const hooks = JSON.parse(content);
    assert.ok(hooks.hooks.SessionStart, 'Must have SessionStart event');
    assert.ok(hooks.hooks.SubagentStart, 'Must have SubagentStart event');
    assert.ok(Array.isArray(hooks.hooks.SessionStart), 'SessionStart must be an array');
    const sessionHook = hooks.hooks.SessionStart[0];
    assert.ok(sessionHook.hooks[0].command, 'Hook must have command field');
    assert.ok(sessionHook.hooks[0].commandWindows, 'Hook must have commandWindows field');
  });

  it('session-start.js and subagent-start.js exist', async () => {
    await fs.access(path.join(repositoryRoot, '.agents', 'plugins', 'agentic-senior-core', 'hooks', 'session-start.js'));
    await fs.access(path.join(repositoryRoot, '.agents', 'plugins', 'agentic-senior-core', 'hooks', 'subagent-start.js'));
  });

  it('hook scripts use CommonJS (require)', async () => {
    const sessionStart = await fs.readFile(path.join(repositoryRoot, '.agents', 'plugins', 'agentic-senior-core', 'hooks', 'session-start.js'), 'utf8');
    const subagentStart = await fs.readFile(path.join(repositoryRoot, '.agents', 'plugins', 'agentic-senior-core', 'hooks', 'subagent-start.js'), 'utf8');
    assert.ok(sessionStart.includes("require('fs')") || sessionStart.includes("require('node:fs')"), 'session-start.js must use require');
    assert.ok(subagentStart.includes("require('fs')") || subagentStart.includes("require('node:fs')"), 'subagent-start.js must use require');
  });

  it('post-edit-enforce.js exists and uses CommonJS', async () => {
    const hookPath = path.join(repositoryRoot, '.agents', 'plugins', 'agentic-senior-core', 'hooks', 'post-edit-enforce.js');
    const content = await fs.readFile(hookPath, 'utf8');
    assert.ok(content.includes("require('path')") || content.includes("require('node:path')"), 'post-edit-enforce.js must use require');
    assert.ok(content.includes('PostToolUse'), 'Must reference PostToolUse event');
    assert.ok(content.includes('additionalContext'), 'Must output additionalContext');
  });

  it('pre-tool-dependency-gate.js and known-duplicates.json exist', async () => {
    await fs.access(path.join(repositoryRoot, '.agents', 'plugins', 'agentic-senior-core', 'hooks', 'pre-tool-dependency-gate.js'));
    await fs.access(path.join(repositoryRoot, '.agents', 'plugins', 'agentic-senior-core', 'hooks', 'lib', 'known-duplicates.json'));
    const gateContent = await fs.readFile(path.join(repositoryRoot, '.agents', 'plugins', 'agentic-senior-core', 'hooks', 'pre-tool-dependency-gate.js'), 'utf8');
    assert.ok(gateContent.includes('permissionDecision'), 'pre-tool-dependency-gate.js must return permissionDecision');
    assert.ok(gateContent.includes('PreToolUse'), 'Must reference PreToolUse event');
  });

  it('hooks.json registers PreToolUse and PostToolUse events', async () => {
    const hooksPath = path.join(repositoryRoot, '.agents', 'plugins', 'agentic-senior-core', 'hooks.json');
    const content = await fs.readFile(hooksPath, 'utf8');
    const hooks = JSON.parse(content);
    assert.ok(hooks.hooks.PreToolUse, 'Must have PreToolUse event');
    assert.ok(hooks.hooks.PostToolUse, 'Must have PostToolUse event');
    assert.ok(Array.isArray(hooks.hooks.PreToolUse), 'PreToolUse must be an array');
    assert.ok(Array.isArray(hooks.hooks.PostToolUse), 'PostToolUse must be an array');
  });
});

describe('Skills', () => {
  it('all skill directories have SKILL.md', async () => {
    const skillsDir = path.join(repositoryRoot, '.agents', 'plugins', 'agentic-senior-core', 'skills');
    const skillDirs = await fs.readdir(skillsDir);
    for (const dir of skillDirs) {
      const skillPath = path.join(skillsDir, dir, 'SKILL.md');
      const exists = await fs.access(skillPath).then(() => true).catch(() => false);
      assert.ok(exists, `Missing SKILL.md in ${dir}/`);
    }
  });

  it('asc-adapter skill exists', async () => {
    const skillPath = path.join(repositoryRoot, '.agents', 'plugins', 'agentic-senior-core', 'skills', 'asc-adapter', 'SKILL.md');
    const exists = await fs.access(skillPath).then(() => true).catch(() => false);
    assert.ok(exists, 'Missing skills/asc-adapter/SKILL.md');
  });
});

describe('Commands', () => {
  it('all .md command files exist', async () => {
    const commandsDir = path.join(repositoryRoot, '.agents', 'plugins', 'agentic-senior-core', 'commands');
    const expectedMd = ['asc-refactor.md', 'asc-review.md', 'asc-audit.md', 'asc-help.md'];
    for (const cmd of expectedMd) {
      const cmdPath = path.join(commandsDir, cmd);
      const exists = await fs.access(cmdPath).then(() => true).catch(() => false);
      assert.ok(exists, `Missing command file: commands/${cmd}`);
    }
  });

  it('all .toml command files exist (Gemini)', async () => {
    const commandsDir = path.join(repositoryRoot, '.agents', 'plugins', 'agentic-senior-core', 'commands');
    const expectedToml = ['asc-refactor.toml', 'asc-review.toml', 'asc-audit.toml', 'asc-help.toml'];
    for (const cmd of expectedToml) {
      const cmdPath = path.join(commandsDir, cmd);
      const exists = await fs.access(cmdPath).then(() => true).catch(() => false);
      assert.ok(exists, `Missing Gemini command file: commands/${cmd}`);
    }
  });
});

describe('Host Adapters', () => {
  it('new host plugin manifests exist', async () => {
    const manifestPaths = [
      '.agents/plugins/agentic-senior-core/plugin.json',
      '.agents/plugins/agentic-senior-core/rules/agentic-senior-core.md',
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
    const content = await fs.readFile(path.join(repositoryRoot, '.agents', 'plugins', 'agentic-senior-core', 'rules', 'agentic-senior-core.md'), 'utf8');
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

  it('gemini-extension.json references rules/agentic-senior-core.md', async () => {
    const content = await fs.readFile(path.join(repositoryRoot, 'gemini-extension.json'), 'utf8');
    const extension = JSON.parse(content);
    assert.equal(extension.contextFileName, '.agents/plugins/agentic-senior-core/rules/agentic-senior-core.md');
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
      'gemini-extension.json',
      '.agents/plugins/agentic-senior-core/plugin.json'
    ];

    for (const filePath of versionFiles) {
      const content = await fs.readFile(path.join(repositoryRoot, filePath), 'utf8');
      const json = JSON.parse(content);
      assert.equal(json.version, version, `Version mismatch in ${filePath}: expected ${version}, got ${json.version}`);
    }
  });
});
