import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

import { evaluateAscxFixtures } from '../lib/cli/ascx/fixture-evaluator.mjs';
import { HIGH_RISK_REDUCTION_PERCENT, shouldWriteSafetyTee } from '../lib/cli/ascx/formatter.mjs';
import { classifyAscxInvocation, parseAscxCommand } from '../lib/cli/ascx/lexer.mjs';
import { runAscx } from '../lib/cli/ascx/runtime.mjs';
import { MAX_TEE_FILES, writeRawTeeFile } from '../lib/cli/ascx/tee-writer.mjs';
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
  const result = await runAscx(['grep', 'TODO'], {
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

test('ascx skips tee for confident adapter with high reduction on exit 0', () => {
  const confident = shouldWriteSafetyTee({
    adapterResult: { confident: true, truncated: false },
    exitCode: 0,
    reductionPercent: HIGH_RISK_REDUCTION_PERCENT + 10,
  });
  const notConfident = shouldWriteSafetyTee({
    adapterResult: { confident: false, truncated: false },
    exitCode: 0,
    reductionPercent: HIGH_RISK_REDUCTION_PERCENT + 10,
  });
  const undefinedConfidence = shouldWriteSafetyTee({
    adapterResult: { truncated: false },
    exitCode: 0,
    reductionPercent: HIGH_RISK_REDUCTION_PERCENT + 10,
  });
  const failingConfident = shouldWriteSafetyTee({
    adapterResult: { confident: true, truncated: false },
    exitCode: 1,
    reductionPercent: 10,
  });
  const truncated = shouldWriteSafetyTee({
    adapterResult: { confident: true, truncated: true },
    exitCode: 0,
    reductionPercent: 10,
  });

  assert.equal(confident, false, 'confident exit-0 must not trigger tee');
  assert.equal(notConfident, true, 'not confident must trigger tee');
  assert.equal(undefinedConfidence, true, 'undefined confidence with high reduction must trigger tee');
  assert.equal(failingConfident, true, 'exit !== 0 must always trigger tee');
  assert.equal(truncated, true, 'truncated must always trigger tee');
});

test('ascx tee sweep caps files at MAX_TEE_FILES', async () => {
  const tempDirectoryPath = createTempDirectory();
  const teeDirectoryPath = path.join(tempDirectoryPath, 'tee');

  try {
    const totalFiles = MAX_TEE_FILES + 5;

    for (let i = 0; i < totalFiles; i++) {
      const sequenceNumber = String(i).padStart(3, '0');
      await writeRawTeeFile({
        commandText: `test-sweep-${sequenceNumber}`,
        cwd: tempDirectoryPath,
        exitCode: 0,
        rawOutput: `output ${sequenceNumber}`,
        teeDirectoryPath,
      });
    }

    const remaining = fs.readdirSync(teeDirectoryPath).filter((name) => name.endsWith('.log'));
    assert.equal(remaining.length, MAX_TEE_FILES);

    const oldestSurvivor = remaining.sort()[0];
    assert.ok(
      !oldestSurvivor.includes('test-sweep-000'),
      'oldest files should have been swept',
    );
  } finally {
    fs.rmSync(tempDirectoryPath, { recursive: true, force: true });
  }
});

test('ascx does not write tee for confident passing npm test', async () => {
  const tempDirectoryPath = createTempDirectory();

  try {
    const result = await runAscx(['npm', 'test'], {
      cwd: tempDirectoryPath,
      teeDirectoryPath: path.join(tempDirectoryPath, 'tee'),
      async executeCommand() {
        return {
          exitCode: 0,
          stdout: [
            'TAP version 13',
            '# Subtest: example passes',
            'ok 1 - example passes',
            '# tests 1',
            '# pass 1',
            '# fail 0',
            '# duration_ms 5.2',
          ].join('\n'),
          stderr: '',
        };
      },
    });

    assert.equal(result.exitCode, 0);
    assert.equal(result.compressed, true);
    assert.equal(result.rawTeePath, null, 'confident pass must not produce tee file');
    assert.match(result.stdout, /raw_output: none/);
  } finally {
    fs.rmSync(tempDirectoryPath, { recursive: true, force: true });
  }
});
