import { describe, it, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { addRule } from '../lib/core/adaptive-preferences.mjs';
import { generateValidatorScript, compileAndSaveValidator } from '../lib/core/rule-compiler.mjs';
import { installGitPreCommitHook } from '../lib/cli/commands/git-hook-generator.mjs';

describe('Rule Compiler & Git Hook Generator Module', () => {
  let tempDir;

  beforeEach(() => {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'asc-compiler-test-'));
  });

  afterEach(() => {
    if (fs.existsSync(tempDir)) {
      fs.rmSync(tempDir, { recursive: true, force: true });
    }
  });

  it('generates non-empty executable validator script containing syntactic rules', () => {
    addRule({
      cwd: tempDir,
      scope: 'project',
      rule: { pattern: 'from-purple-500', type: 'syntactic', reason: 'Generic purple gradient' }
    });

    const script = generateValidatorScript({ cwd: tempDir });
    assert.ok(script.includes('#!/usr/bin/env node'));
    assert.ok(script.includes('from-purple-500'));
    assert.ok(script.includes('Generic purple gradient'));
  });

  it('saves compiled validator script to disk at .asc/hooks/pre-commit-validator.cjs', () => {
    addRule({
      cwd: tempDir,
      scope: 'project',
      rule: { pattern: 'bg-red-500', type: 'syntactic', reason: 'Hardcoded alert color' }
    });

    const savedPath = compileAndSaveValidator({ cwd: tempDir });
    assert.ok(fs.existsSync(savedPath));
    const content = fs.readFileSync(savedPath, 'utf8');
    assert.ok(content.includes('bg-red-500'));
  });

  it('installs git pre-commit hook into .git/hooks/pre-commit', () => {
    // Create dummy .git directory
    const gitDir = path.join(tempDir, '.git');
    fs.mkdirSync(gitDir, { recursive: true });

    const res = installGitPreCommitHook({ cwd: tempDir });
    assert.equal(res.installed, true);
    assert.ok(fs.existsSync(res.hookPath));

    const hookContent = fs.readFileSync(res.hookPath, 'utf8');
    assert.ok(hookContent.includes('.asc/hooks/pre-commit-runner.cjs') || hookContent.includes('.asc/hooks/pre-commit-validator.cjs'));
  });
});
