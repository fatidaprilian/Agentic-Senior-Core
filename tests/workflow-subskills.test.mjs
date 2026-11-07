import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const currentFilePath = fileURLToPath(import.meta.url);
const repositoryRoot = path.resolve(path.dirname(currentFilePath), '..');
const pluginRoot = path.join(repositoryRoot, '.agents', 'plugins', 'agentic-senior-core');
const skillsDir = path.join(pluginRoot, 'skills');

describe('7-Skill Invariant & 1-Hop Workflow Subskills', () => {
  it('maintains strictly the 7 canonical top-level skills with zero skill bloat', async () => {
    const entries = await fs.readdir(skillsDir);
    const expected = [
      'asc',
      'asc-develop',
      'asc-pentest',
      'asc-reference',
      'asc-review',
      'asc-test',
      'asc-ui',
    ];
    assert.deepStrictEqual(entries.slice().sort(), expected.slice().sort());
  });

  it('wires execution-plans.md and subagent-orchestration.md as 1-hop gates in asc-develop/SKILL.md', async () => {
    const devSkill = await fs.readFile(path.join(skillsDir, 'asc-develop', 'SKILL.md'), 'utf8');
    const plansRef = await fs.readFile(path.join(skillsDir, 'asc-develop', 'references', 'execution-plans.md'), 'utf8');
    const subagentsRef = await fs.readFile(path.join(skillsDir, 'asc-develop', 'references', 'subagent-orchestration.md'), 'utf8');
    const worktreeRef = await fs.readFile(path.join(skillsDir, 'asc-develop', 'references', 'git-worktrees.md'), 'utf8');

    assert.ok(devSkill.split('\n').length <= 150, 'asc-develop/SKILL.md must stay <= 150 lines');
    assert.ok(devSkill.includes('references/execution-plans.md'), 'asc-develop must link execution-plans.md');
    assert.ok(devSkill.includes('references/subagent-orchestration.md'), 'asc-develop must link subagent-orchestration.md');
    assert.ok(devSkill.includes('references/git-worktrees.md'), 'asc-develop must link git-worktrees.md');

    assert.ok(plansRef.includes('Ruling:'), 'execution-plans.md must document autonomous Ruling protocol');
    assert.ok(plansRef.includes('Look Before You Ask'), 'execution-plans.md must document Look Before You Ask');
    assert.ok(subagentsRef.includes('Spec Compliance'), 'subagent-orchestration.md must document two-pass Spec Compliance review');
    assert.ok(worktreeRef.includes('GIT_DIR != GIT_COMMON'), 'git-worktrees.md must document Step 0 worktree isolation detection');
    assert.ok(worktreeRef.includes('show-superproject-working-tree'), 'git-worktrees.md must include submodule guard');
  });

  it('wires systematic-debugging.md as a 1-hop gate in asc-test/SKILL.md and captures bug symptoms in YAML', async () => {
    const testSkill = await fs.readFile(path.join(skillsDir, 'asc-test', 'SKILL.md'), 'utf8');
    const debugRef = await fs.readFile(path.join(skillsDir, 'asc-test', 'references', 'systematic-debugging.md'), 'utf8');

    assert.ok(testSkill.split('\n').length <= 150, 'asc-test/SKILL.md must stay <= 150 lines');
    assert.ok(testSkill.includes('references/systematic-debugging.md'), 'asc-test must link systematic-debugging.md');

    const descMatch = testSkill.match(/description:\s*>([\s\S]*?)---/);
    assert.ok(descMatch, 'asc-test must have frontmatter description');
    const descLower = descMatch[1].toLowerCase();
    assert.ok(descLower.includes('fix this bug') || descLower.includes('debugging'), 'asc-test description must capture bug-fixing prompts');
    assert.ok(descLower.includes('error') || descLower.includes('kenapa gagal'), 'asc-test description must capture error symptoms');

    assert.ok(debugRef.includes('Phase 1'), 'systematic-debugging.md must define Phase 1 Root-Cause Investigation');
    assert.ok(debugRef.includes('regression-proof.md'), 'systematic-debugging.md must connect to regression-proof.md');
  });

  it('includes Subagent Pressure Testing (TDD for Skills) inside asc/references/writing-skills.md', async () => {
    const writingSkills = await fs.readFile(path.join(skillsDir, 'asc', 'references', 'writing-skills.md'), 'utf8');
    assert.ok(writingSkills.includes('Pressure Testing'), 'writing-skills.md must include Subagent Pressure Testing');
    assert.ok(writingSkills.includes('RED') && writingSkills.includes('GREEN'), 'writing-skills.md must map RED-GREEN cycle to skill testing');
  });
});

