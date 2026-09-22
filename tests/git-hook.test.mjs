import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import { execSync } from 'node:child_process';
import { installGitPreCommitHook, installGlobalGitPreCommitHook } from '../lib/cli/commands/git-hook-generator.mjs';
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
    assert.ok(runnerContent.includes('checkSecrets'), 'Runner script contains secret detection');
    assert.ok(runnerContent.includes('checkMergeConflictMarkers'), 'Runner script contains merge conflict check');
    assert.ok(runnerContent.includes('checkLargeFiles'), 'Runner script contains large file check');
    assert.ok(!runnerContent.includes('runEslintAutoFix'), 'Runner script does NOT contain ESLint auto-fix');

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

// --- Integration tests: real git repo + staged files + runner script ---

function isJscpdAvailable() {
  try {
    execSync('npx jscpd --version', { stdio: 'pipe', timeout: 15000 });
    return true;
  } catch {
    return false;
  }
}

async function createGitRepo() {
  const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'asc-integration-'));
  execSync('git init', { cwd: tmpDir, stdio: 'pipe' });
  execSync('git config user.email "test@test.com"', { cwd: tmpDir, stdio: 'pipe' });
  execSync('git config user.name "Test"', { cwd: tmpDir, stdio: 'pipe' });
  return tmpDir;
}

// A 20-line function block — used twice to create an obvious duplicate
const DUPLICATE_BLOCK = `function processUserData(input) {
  const normalized = input.trim().toLowerCase();
  const parts = normalized.split(',');
  const result = [];
  for (let i = 0; i < parts.length; i++) {
    const value = parts[i].trim();
    if (value.length === 0) continue;
    if (value.startsWith('#')) continue;
    const parsed = parseInt(value, 10);
    if (isNaN(parsed)) {
      result.push(value);
    } else {
      result.push(parsed);
    }
  }
  return result.filter(Boolean);
}
module.exports = { processUserData };`;

describe('Git Hook Integration (requires jscpd)', { skip: !isJscpdAvailable() && 'jscpd not available — skipping integration tests' }, () => {
  it('blocks commit when staged file duplicates existing code', async () => {
    const tmpDir = await createGitRepo();

    try {
      // Create original file and commit it
      await fs.writeFile(path.join(tmpDir, 'original.js'), DUPLICATE_BLOCK, 'utf8');
      execSync('git add original.js && git commit -m "add original"', { cwd: tmpDir, stdio: 'pipe' });

      // Install ASC pre-commit hook
      installGitPreCommitHook({ cwd: tmpDir });

      // Create a duplicate file (renamed function, same body) and stage it
      const duplicateContent = DUPLICATE_BLOCK.replace('processUserData', 'processUserData2');
      await fs.writeFile(path.join(tmpDir, 'duplicate.js'), duplicateContent, 'utf8');
      execSync('git add duplicate.js', { cwd: tmpDir, stdio: 'pipe' });

      // Run the pre-commit runner directly — should exit non-zero
      let exitCode = 0;
      let stderr = '';
      try {
        execSync('node .asc/hooks/pre-commit-runner.cjs', {
          cwd: tmpDir,
          stdio: 'pipe',
          timeout: 30000,
        });
      } catch (err) {
        exitCode = err.status;
        stderr = err.stderr?.toString() || '';
      }

      assert.notStrictEqual(exitCode, 0, 'Runner should exit non-zero on duplicate');
      assert.ok(stderr.includes('[ASC Dedup]'), 'Error message should contain [ASC Dedup] marker');
    } finally {
      await fs.rm(tmpDir, { recursive: true, force: true });
    }
  });

  it('allows commit when staged file has no duplication', async () => {
    const tmpDir = await createGitRepo();

    try {
      // Create a unique file and commit it
      await fs.writeFile(path.join(tmpDir, 'utils.js'), 'module.exports = { add: (a, b) => a + b };\n', 'utf8');
      execSync('git add utils.js && git commit -m "add utils"', { cwd: tmpDir, stdio: 'pipe' });

      // Install ASC pre-commit hook
      installGitPreCommitHook({ cwd: tmpDir });

      // Create a completely different file and stage it
      const uniqueContent = `function calculateTax(amount, rate) {
  if (amount <= 0 || rate < 0) return 0;
  return Math.round(amount * rate * 100) / 100;
}
module.exports = { calculateTax };`;
      await fs.writeFile(path.join(tmpDir, 'tax.js'), uniqueContent, 'utf8');
      execSync('git add tax.js', { cwd: tmpDir, stdio: 'pipe' });

      // Run the pre-commit runner — should exit 0
      let exitCode = 0;
      try {
        execSync('node .asc/hooks/pre-commit-runner.cjs', {
          cwd: tmpDir,
          stdio: 'pipe',
          timeout: 30000,
        });
      } catch (err) {
        exitCode = err.status;
      }

      assert.strictEqual(exitCode, 0, 'Runner should exit 0 when no duplicates found');
    } finally {
      await fs.rm(tmpDir, { recursive: true, force: true });
    }
  });

  it('blocks commit when staged file contains a private key pattern', async () => {
    const tmpDir = await createGitRepo();

    try {
      installGitPreCommitHook({ cwd: tmpDir });

      const secretContent = '-----BEGIN RSA PRIVATE KEY-----\nMIIEpAIBAAKCAQEA0Z\n-----END RSA PRIVATE KEY-----\n';
      await fs.writeFile(path.join(tmpDir, 'secrets.txt'), secretContent, 'utf8');
      execSync('git add secrets.txt', { cwd: tmpDir, stdio: 'pipe' });

      let exitCode = 0;
      try {
        execSync('node .asc/hooks/pre-commit-runner.cjs', {
          cwd: tmpDir,
          stdio: 'pipe',
          timeout: 30000,
        });
      } catch (err) {
        exitCode = err.status;
      }

      assert.strictEqual(exitCode, 1, 'Runner should exit 1 when private key is detected');
    } finally {
      await fs.rm(tmpDir, { recursive: true, force: true });
    }
  });

  it('blocks commit when staged file contains Slack/NPM tokens or DB connection string', async () => {
    const tmpDir = await createGitRepo();

    try {
      installGitPreCommitHook({ cwd: tmpDir });

      const dummySlack = ['xoxb', '1234567890', '1234567890', 'abcdefghijklmnopqrstuvwx'].join('-');
      const dummyDb = ['postgres:', '', 'admin:SuperSecretPass123@db.example.com', 'mydb'].join('/');
      const secretPayload = `const slack = "${dummySlack}";\nconst db = "${dummyDb}";\n`;
      await fs.writeFile(path.join(tmpDir, 'config.js'), secretPayload, 'utf8');
      execSync('git add config.js', { cwd: tmpDir, stdio: 'pipe' });

      let exitCode = 0;
      try {
        execSync('node .asc/hooks/pre-commit-runner.cjs', {
          cwd: tmpDir,
          stdio: 'pipe',
          timeout: 30000,
        });
      } catch (err) {
        exitCode = err.status;
      }

      assert.strictEqual(exitCode, 1, 'Runner should exit 1 when Slack/DB secret is detected');
    } finally {
      await fs.rm(tmpDir, { recursive: true, force: true });
    }
  });

  it('blocks commit when .env file is staged without ignore', async () => {
    const tmpDir = await createGitRepo();

    try {
      installGitPreCommitHook({ cwd: tmpDir });

      await fs.writeFile(path.join(tmpDir, '.env'), 'DATABASE_PASSWORD=secret\n', 'utf8');
      execSync('git add .env', { cwd: tmpDir, stdio: 'pipe' });

      let exitCode = 0;
      try {
        execSync('node .asc/hooks/pre-commit-runner.cjs', {
          cwd: tmpDir,
          stdio: 'pipe',
          timeout: 30000,
        });
      } catch (err) {
        exitCode = err.status;
      }

      assert.strictEqual(exitCode, 1, 'Runner should exit 1 when staged .env file is detected');
    } finally {
      await fs.rm(tmpDir, { recursive: true, force: true });
    }
  });

  it('blocks commit when staged file contains merge conflict markers', async () => {
    const tmpDir = await createGitRepo();

    try {
      installGitPreCommitHook({ cwd: tmpDir });

      const conflictContent = 'function hello() {\n<<<<<<< HEAD\n  return 1;\n=======\n  return 2;\n>>>>>>> branch\n}\n';
      await fs.writeFile(path.join(tmpDir, 'conflict.js'), conflictContent, 'utf8');
      execSync('git add conflict.js', { cwd: tmpDir, stdio: 'pipe' });

      let exitCode = 0;
      try {
        execSync('node .asc/hooks/pre-commit-runner.cjs', {
          cwd: tmpDir,
          stdio: 'pipe',
          timeout: 30000,
        });
      } catch (err) {
        exitCode = err.status;
      }

      assert.strictEqual(exitCode, 1, 'Runner should exit 1 when merge conflict markers are detected');
    } finally {
      await fs.rm(tmpDir, { recursive: true, force: true });
    }
  });

  it('allows commit when no secrets, conflicts, or large files detected', async () => {
    const tmpDir = await createGitRepo();

    try {
      installGitPreCommitHook({ cwd: tmpDir });

      const content = 'const handler = () => setState(42);\nmodule.exports = { handler };\n';
      await fs.writeFile(path.join(tmpDir, 'handler.js'), content, 'utf8');
      execSync('git add handler.js', { cwd: tmpDir, stdio: 'pipe' });

      let exitCode = 0;
      try {
        execSync('node .asc/hooks/pre-commit-runner.cjs', {
          cwd: tmpDir,
          stdio: 'pipe',
          timeout: 30000,
        });
      } catch (err) {
        exitCode = err.status;
      }

      assert.strictEqual(exitCode, 0, 'Runner should exit 0 — clean file, no violations');
    } finally {
      await fs.rm(tmpDir, { recursive: true, force: true });
    }
  });

  it('allows commit when file contains valid inline ignore comment with reason', async () => {
    const tmpDir = await createGitRepo();

    try {
      await fs.writeFile(path.join(tmpDir, 'original.js'), DUPLICATE_BLOCK, 'utf8');
      execSync('git add original.js && git commit -m "add original"', { cwd: tmpDir, stdio: 'pipe' });

      installGitPreCommitHook({ cwd: tmpDir });

      // Create duplicate file but add valid inline ignore comment with reason
      const duplicateContent = '// asc-dedup:ignore -- Intentional domain separation for pdf generator\n'
        + DUPLICATE_BLOCK.replace('processUserData', 'processUserData2');
      await fs.writeFile(path.join(tmpDir, 'duplicate.js'), duplicateContent, 'utf8');
      execSync('git add duplicate.js', { cwd: tmpDir, stdio: 'pipe' });

      let exitCode = 0;
      try {
        execSync('node .asc/hooks/pre-commit-runner.cjs', { cwd: tmpDir, stdio: 'pipe', timeout: 30000 });
      } catch (err) {
        exitCode = err.status;
      }

      assert.strictEqual(exitCode, 0, 'Runner should exit 0 when inline ignore with reason is present');
    } finally {
      await fs.rm(tmpDir, { recursive: true, force: true });
    }
  });

  it('allows commit when duplicate pair is whitelisted in allowedDuplicates config', async () => {
    const tmpDir = await createGitRepo();

    try {
      await fs.writeFile(path.join(tmpDir, 'original.js'), DUPLICATE_BLOCK, 'utf8');
      execSync('git add original.js && git commit -m "add original"', { cwd: tmpDir, stdio: 'pipe' });

      installGitPreCommitHook({ cwd: tmpDir });

      // Add allowedDuplicates config
      const ascDir = path.join(tmpDir, '.asc');
      await fs.mkdir(ascDir, { recursive: true });
      await fs.writeFile(
        path.join(ascDir, 'dedup-config.json'),
        JSON.stringify({ allowedDuplicates: [['original.js', 'duplicate.js']] }),
        'utf8'
      );

      const duplicateContent = DUPLICATE_BLOCK.replace('processUserData', 'processUserData2');
      await fs.writeFile(path.join(tmpDir, 'duplicate.js'), duplicateContent, 'utf8');
      execSync('git add duplicate.js', { cwd: tmpDir, stdio: 'pipe' });

      let exitCode = 0;
      try {
        execSync('node .asc/hooks/pre-commit-runner.cjs', { cwd: tmpDir, stdio: 'pipe', timeout: 30000 });
      } catch (err) {
        exitCode = err.status;
      }

      assert.strictEqual(exitCode, 0, 'Runner should exit 0 when duplicate pair is in allowedDuplicates whitelist');
    } finally {
      await fs.rm(tmpDir, { recursive: true, force: true });
    }
  });

  it('blocks commit when staged file contains unverified ASC-STUB or fake success return', async () => {
    const tmpDir = await createGitRepo();

    try {
      installGitPreCommitHook({ cwd: tmpDir });

      // Staged file with unverified stub
      await fs.writeFile(path.join(tmpDir, 'feature.js'), 'function doWork() {\n  // ASC-STUB: unfinished mock\n  return { success: true };\n}\n', 'utf8');
      execSync('git add feature.js', { cwd: tmpDir, stdio: 'pipe' });

      let exitCode = 0;
      let stderrOutput = '';
      try {
        execSync('node .asc/hooks/pre-commit-runner.cjs', { cwd: tmpDir, stdio: 'pipe', timeout: 30000 });
      } catch (err) {
        exitCode = err.status;
        stderrOutput = err.stderr ? err.stderr.toString() : '';
      }

      assert.strictEqual(exitCode, 1, 'Runner should exit 1 when unverified stub is staged');
      assert.ok(stderrOutput.includes('[ASC Stub Gate]'), 'Output should contain ASC Stub Gate message');
    } finally {
      await fs.rm(tmpDir, { recursive: true, force: true });
    }
  });

  it('installs global pre-commit hook dispatcher correctly', async () => {
    const tmpHome = await fs.mkdtemp(path.join(os.tmpdir(), 'asc-global-hook-test-'));
    const res = installGlobalGitPreCommitHook({ homeDir: tmpHome });
    assert.strictEqual(res.installed, true);
    assert.strictEqual(res.global, true);
    assert.strictEqual(res.hookPath, path.join(tmpHome, '.asc', 'global-hooks', 'pre-commit'));
    assert.strictEqual(res.runnerPath, path.join(tmpHome, '.asc', 'global-hooks', 'pre-commit-runner.cjs'));

    const runnerExists = await fs.access(res.runnerPath).then(() => true).catch(() => false);
    assert.ok(runnerExists, 'Global pre-commit-runner.cjs must be generated as fallback');

    const content = await fs.readFile(res.hookPath, 'utf8');
    assert.ok(content.includes('.husky/pre-commit'), 'Global dispatcher checks .husky/pre-commit');
    assert.ok(content.includes('.git/hooks/pre-commit.local'), 'Global dispatcher checks local hook fallback');
    assert.ok(content.includes('.asc/hooks/pre-commit-runner.cjs'), 'Global dispatcher checks ASC runner');
    assert.ok(content.includes('git rev-parse --show-toplevel'), 'Global dispatcher resolves Git Root via rev-parse');
    assert.ok(content.includes('"$GIT_ROOT"/apps/*'), 'Global dispatcher performs monorepo subfolder scan');

    await fs.rm(tmpHome, { recursive: true, force: true });
  });
});
