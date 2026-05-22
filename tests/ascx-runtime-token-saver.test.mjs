import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

import { evaluateAscxFixtures } from '../lib/cli/ascx/fixture-evaluator.mjs';
import { classifyAscxInvocation, parseAscxCommand } from '../lib/cli/ascx/lexer.mjs';
import { runAscx } from '../lib/cli/ascx/runtime.mjs';
import { ASCX_RUNTIME_TOKEN_SAVER_FIXTURES } from '../benchmarks/runtime-token-saver/fixtures.mjs';

function createTempDirectory() {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'ascx-runtime-token-saver-'));
}

test('ascx fixture benchmark preserves evidence for supported MVP commands', async () => {
  const tempDirectoryPath = createTempDirectory();

  try {
    const report = await evaluateAscxFixtures(ASCX_RUNTIME_TOKEN_SAVER_FIXTURES, {
      cwd: tempDirectoryPath,
      teeDirectoryPath: path.join(tempDirectoryPath, 'tee'),
    });

    assert.equal(report.passed, true);
    assert.equal(report.failedCount, 0);
    assert.equal(report.summary.falseSuccessCount, 0);
    assert.equal(report.summary.teeWriteFailures, 0);
    assert.equal(report.summary.evidencePreservationPassRate, 1);
    assert.equal(report.summary.continuationPassRate, 1);
    assert.ok(report.summary.continuationCheckCount >= ASCX_RUNTIME_TOKEN_SAVER_FIXTURES.length);
  } finally {
    fs.rmSync(tempDirectoryPath, { recursive: true, force: true });
  }
});

test('ascx lexer classifies pipe and redirect syntax as unsafe passthrough', () => {
  const pipeCommand = parseAscxCommand(['npm', 'test', '|', 'tee', 'test.log']);
  const redirectCommand = parseAscxCommand(['git', 'status', '>', 'status.txt']);
  const gitDiffCommand = parseAscxCommand(['git', 'diff']);

  assert.equal(classifyAscxInvocation(pipeCommand).kind, 'unsafe-for-compression');
  assert.equal(classifyAscxInvocation(redirectCommand).kind, 'unsafe-for-compression');
  assert.equal(classifyAscxInvocation(gitDiffCommand).adapterName, 'git-diff');
});

test('ascx writes raw tee for failing compressed command and preserves exit code', async () => {
  const tempDirectoryPath = createTempDirectory();

  try {
    const result = await runAscx(['npm', 'test'], {
      cwd: tempDirectoryPath,
      teeDirectoryPath: path.join(tempDirectoryPath, 'tee'),
      async executeCommand() {
        return {
          exitCode: 1,
          stdout: [
            '# Subtest: rejects duplicate order',
            'not ok 1 - rejects duplicate order',
            'AssertionError [ERR_ASSERTION]: Expected duplicate submit to be rejected',
            'at file:///E:/Project/app/tests/orders.test.mjs:77:7',
            '# tests 1',
            '# pass 0',
            '# fail 1',
          ].join('\n'),
          stderr: '',
        };
      },
    });

    assert.equal(result.exitCode, 1);
    assert.equal(result.compressed, true);
    assert.match(result.stdout, /rejects duplicate order/);
    assert.match(result.stdout, /orders\.test\.mjs:77:7/);
    assert.ok(path.isAbsolute(result.rawTeePath));
    assert.equal(fs.existsSync(result.rawTeePath), true);
  } finally {
    fs.rmSync(tempDirectoryPath, { recursive: true, force: true });
  }
});

test('ascx passthrough leaves unsupported commands uncompressed', async () => {
  const result = await runAscx(['rg', 'TODO'], {
    async executeCommand() {
      return {
        exitCode: 0,
        stdout: 'src/app.js:1:TODO\n',
        stderr: '',
      };
    },
  });

  assert.equal(result.exitCode, 0);
  assert.equal(result.compressed, false);
  assert.equal(result.stdout, 'src/app.js:1:TODO\n');
  assert.equal(result.rawTeePath, null);
});

test('ascx can run unsupported npm commands as passthrough', async () => {
  const result = await runAscx(['npm', '--version']);

  assert.equal(result.exitCode, 0);
  assert.equal(result.compressed, false);
  assert.match(result.stdout, /\d+\.\d+\.\d+/);
});

test('ascx keeps environment-prefixed commands in passthrough mode', async () => {
  const result = await runAscx([
    'ASCX_ENV_PREFIX_TEST=ok',
    process.execPath,
    '-e',
    'process.stdout.write(process.env.ASCX_ENV_PREFIX_TEST || "missing")',
  ]);

  assert.equal(result.classification.kind, 'passthrough');
  assert.deepEqual(result.parsedCommand.environment, ['ASCX_ENV_PREFIX_TEST=ok']);
  assert.equal(result.stdout, 'ok');
  assert.equal(result.compressed, false);
});
