import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import { installGitPreCommitHook } from '../lib/cli/commands/git-hook-generator.mjs';
import { runUninstallCommand } from '../lib/cli/commands/uninstall.mjs';
import { getThresholds } from '../.agents/plugins/agentic-senior-core/hooks/constants.cjs';

describe('Git Hook Generator & Hardening', () => {
  it('installs pre-commit hook in .git/hooks when .husky is absent', async () => {
    const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'asc-githook-test-'));
    await fs.mkdir(path.join(tmpDir, '.git', 'hooks'), { recursive: true });

    const res = installGitPreCommitHook({ cwd: tmpDir });
    assert.strictEqual(res.installed, true);
    assert.strictEqual(res.hookPath, path.join(tmpDir, '.git', 'hooks', 'pre-commit'));
    assert.strictEqual(res.runnerPath, path.join(tmpDir, '.asc', 'hooks', 'pre-commit-runner.cjs'));

    const hookContent = await fs.readFile(res.hookPath, 'utf8');
    assert.ok(hookContent.includes('pre-commit-runner.cjs'), 'Hook invokes pre-commit-runner.cjs');

    const runnerContent = await fs.readFile(res.runnerPath, 'utf8');
    assert.ok(runnerContent.includes('runPreCommitGate'), 'Runner script contains entry point');
    assert.ok(runnerContent.includes('runEslintAutoFix'), 'Runner script contains ESLint auto-fix step');

    await fs.rm(tmpDir, { recursive: true, force: true });
  });

  it('detects .husky directory and appends to .husky/pre-commit without overwriting', async () => {
    const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'asc-husky-test-'));
    await fs.mkdir(path.join(tmpDir, '.husky'), { recursive: true });
    await fs.writeFile(path.join(tmpDir, '.husky', 'pre-commit'), '#!/bin/sh\nnpm test\n', 'utf8');

    const res = installGitPreCommitHook({ cwd: tmpDir });
    assert.strictEqual(res.installed, true);
    assert.strictEqual(res.hookPath, path.join(tmpDir, '.husky', 'pre-commit'));

    const content = await fs.readFile(res.hookPath, 'utf8');
    assert.ok(content.includes('npm test'), 'Preserves existing husky hook content');
    assert.ok(content.includes('pre-commit-runner.cjs'), 'Appends ASC pre-commit runner');

    await fs.rm(tmpDir, { recursive: true, force: true });
  });

  it('uninstalls ASC git hook cleanly while preserving custom husky user commands', async () => {
    const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'asc-uninstall-hook-test-'));
    await fs.mkdir(path.join(tmpDir, '.husky'), { recursive: true });
    await fs.writeFile(path.join(tmpDir, '.husky', 'pre-commit'), '#!/bin/sh\nnpm test\n', 'utf8');

    installGitPreCommitHook({ cwd: tmpDir });

    // Save process cwd
    const origCwd = process.cwd();
    process.chdir(tmpDir);

    try {
      await runUninstallCommand([]);
      const content = await fs.readFile(path.join(tmpDir, '.husky', 'pre-commit'), 'utf8');
      assert.ok(content.includes('npm test'), 'Preserved user test command');
      assert.strictEqual(content.includes('pre-commit-runner.cjs'), false, 'Removed ASC runner invocation');
    } finally {
      process.chdir(origCwd);
      await fs.rm(tmpDir, { recursive: true, force: true });
    }
  });

  it('reads overridable thresholds from .asc/dedup-config.json', async () => {
    const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'asc-threshold-test-'));
    await fs.mkdir(path.join(tmpDir, '.asc'), { recursive: true });
    await fs.writeFile(
      path.join(tmpDir, '.asc', 'dedup-config.json'),
      JSON.stringify({ NEW_FILE_LINE_THRESHOLD: 15, LOC_DELTA_THRESHOLD: 10 }),
      'utf8'
    );

    const thresholds = getThresholds(tmpDir);
    assert.strictEqual(thresholds.NEW_FILE_LINE_THRESHOLD, 15);
    assert.strictEqual(thresholds.LOC_DELTA_THRESHOLD, 10);

    await fs.rm(tmpDir, { recursive: true, force: true });
  });
});
