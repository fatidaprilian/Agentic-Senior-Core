// Verifies the user-facing CLI subcommand `audit:design-anti-repeat`:
// help text, working-directory routing (scans the user project, not the
// package install path), friendly skip messages with actionable next steps,
// and exit codes.

import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { runDesignAntiRepeatAuditCommand } from '../lib/cli/commands/audit-design-anti-repeat.mjs';

function captureConsoleOutput() {
  const stdoutLines = [];
  const stderrLines = [];
  const originalConsoleLog = console.log;
  const originalConsoleError = console.error;
  const originalProcessStdoutWrite = process.stdout.write.bind(process.stdout);
  console.log = (...consoleArgs) => stdoutLines.push(consoleArgs.join(' '));
  console.error = (...consoleArgs) => stderrLines.push(consoleArgs.join(' '));
  process.stdout.write = (chunk) => {
    stdoutLines.push(typeof chunk === 'string' ? chunk.replace(/\n$/, '') : String(chunk));
    return true;
  };
  return {
    stdoutLines,
    stderrLines,
    restore() {
      console.log = originalConsoleLog;
      console.error = originalConsoleError;
      process.stdout.write = originalProcessStdoutWrite;
    },
  };
}

async function withWorkingDirectory(temporaryWorkingDirectoryPath, callback) {
  const previousWorkingDirectoryPath = process.cwd();
  try {
    process.chdir(temporaryWorkingDirectoryPath);
    return await callback();
  } finally {
    process.chdir(previousWorkingDirectoryPath);
  }
}

test('audit:design-anti-repeat CLI subcommand', async (t) => {
  await t.test('--help prints usage and returns exit code 0 without scanning', async () => {
    const consoleCapture = captureConsoleOutput();
    try {
      const exitCode = await runDesignAntiRepeatAuditCommand(['--help']);
      assert.equal(exitCode, 0);
      const helpOutput = consoleCapture.stdoutLines.join('\n');
      assert.match(helpOutput, /audit:design-anti-repeat/);
      assert.match(helpOutput, /--palette-advisory/);
      assert.match(helpOutput, /--threshold/);
      assert.match(helpOutput, /Skip behavior/);
      assert.match(helpOutput, /BOUNDARY_TYPOGRAPHY_LEDGER_VIOLATION/);
    } finally {
      consoleCapture.restore();
    }
  });

  await t.test('skips with friendly message and exit 0 when design-intent.json is absent', async () => {
    const temporaryProjectRoot = mkdtempSync(join(tmpdir(), 'design-anti-repeat-cmd-absent-'));
    const consoleCapture = captureConsoleOutput();
    try {
      const exitCode = await withWorkingDirectory(temporaryProjectRoot, () => runDesignAntiRepeatAuditCommand([]));
      assert.equal(exitCode, 0);
      const reportOutput = consoleCapture.stdoutLines.join('\n');
      assert.match(reportOutput, /Audit skipped: docs\/design-intent\.json is missing/);
      assert.match(reportOutput, /init/);
      assert.match(reportOutput, /upgrade/);
    } finally {
      consoleCapture.restore();
      rmSync(temporaryProjectRoot, { recursive: true, force: true });
    }
  });

  await t.test('skips with migration guidance when researchDossier metadata is absent', async () => {
    const temporaryProjectRoot = mkdtempSync(join(tmpdir(), 'design-anti-repeat-cmd-no-ledger-'));
    mkdirSync(join(temporaryProjectRoot, 'docs'), { recursive: true });
    writeFileSync(
      join(temporaryProjectRoot, 'docs', 'design-intent.json'),
      JSON.stringify({ mode: 'dynamic', status: 'active' }, null, 2),
      'utf8',
    );
    const consoleCapture = captureConsoleOutput();
    try {
      const exitCode = await withWorkingDirectory(temporaryProjectRoot, () => runDesignAntiRepeatAuditCommand([]));
      assert.equal(exitCode, 0);
      const reportOutput = consoleCapture.stdoutLines.join('\n');
      assert.match(reportOutput, /researchDossier metadata is absent/);
      assert.match(reportOutput, /upgrade/);
      assert.match(reportOutput, /research-design\.md/);
    } finally {
      consoleCapture.restore();
      rmSync(temporaryProjectRoot, { recursive: true, force: true });
    }
  });

  await t.test('returns exit 1 when CSS in the user project leaks a font from the anti-repeat ledger', async () => {
    const temporaryProjectRoot = mkdtempSync(join(tmpdir(), 'design-anti-repeat-cmd-violation-'));
    mkdirSync(join(temporaryProjectRoot, 'docs'), { recursive: true });
    mkdirSync(join(temporaryProjectRoot, 'src', 'styles'), { recursive: true });
    writeFileSync(
      join(temporaryProjectRoot, 'docs', 'design-intent.json'),
      JSON.stringify({
        mode: 'dynamic',
        status: 'active',
        researchDossier: {
          metadata: {
            researchVerifiedAt: '2026-05-01',
            freshnessWindowDays: 90,
            antiRepeatLedger: {
              blocklistFromHistory: true,
              ledgerScope: 'signature-level-descriptors-only',
              ledgerMaxEntriesPerCategory: 3,
              previousAnchors: [],
              previousPalettes: [],
              previousMotionSignatures: [],
              previousTypographyChoices: [{
                summary: 'display: Display-Family-A; body: Body-Family-B; mono: Mono-Family-C',
                source: 'migrated-from-existing-design-intent',
                blockedBecause: 'previously-shipped-typography-trio',
              }],
            },
          },
        },
      }, null, 2),
      'utf8',
    );
    writeFileSync(
      join(temporaryProjectRoot, 'src', 'styles', 'globals.css'),
      "body { font-family: 'Body-Family-B', system-ui, sans-serif; }",
      'utf8',
    );
    const consoleCapture = captureConsoleOutput();
    try {
      const exitCode = await withWorkingDirectory(temporaryProjectRoot, () => runDesignAntiRepeatAuditCommand([]));
      assert.equal(exitCode, 1);
      const reportOutput = consoleCapture.stdoutLines.join('\n');
      assert.match(reportOutput, /Typography violations \(blocking\)/);
      assert.match(reportOutput, /body-family-b/i);
      assert.match(reportOutput, /globals\.css/);
    } finally {
      consoleCapture.restore();
      rmSync(temporaryProjectRoot, { recursive: true, force: true });
    }
  });

  await t.test('--json prints the structured report including targetDirectoryPath', async () => {
    const temporaryProjectRoot = mkdtempSync(join(tmpdir(), 'design-anti-repeat-cmd-json-'));
    const consoleCapture = captureConsoleOutput();
    try {
      const exitCode = await withWorkingDirectory(temporaryProjectRoot, () => runDesignAntiRepeatAuditCommand(['--json']));
      assert.equal(exitCode, 0);
      const jsonText = consoleCapture.stdoutLines.join('\n');
      const parsedReport = JSON.parse(jsonText);
      assert.equal(parsedReport.skipped, true);
      assert.equal(parsedReport.reason, 'design-intent-file-absent');
      assert.equal(typeof parsedReport.targetDirectoryPath, 'string');
      assert.equal(parsedReport.targetDirectoryPath.length > 0, true);
    } finally {
      consoleCapture.restore();
      rmSync(temporaryProjectRoot, { recursive: true, force: true });
    }
  });

  await t.test('--threshold value is not treated as the target directory', async () => {
    const temporaryProjectRoot = mkdtempSync(join(tmpdir(), 'design-anti-repeat-cmd-threshold-'));
    const consoleCapture = captureConsoleOutput();
    try {
      const exitCode = await withWorkingDirectory(
        temporaryProjectRoot,
        () => runDesignAntiRepeatAuditCommand(['--json', '--threshold', '0.05']),
      );
      assert.equal(exitCode, 0);
      const parsedReport = JSON.parse(consoleCapture.stdoutLines.join('\n'));
      assert.equal(parsedReport.skipped, true);
      assert.equal(parsedReport.reason, 'design-intent-file-absent');
      assert.equal(parsedReport.targetDirectoryPath, temporaryProjectRoot);
      assert.equal(parsedReport.oklchDistanceThreshold, 0.05);
    } finally {
      consoleCapture.restore();
      rmSync(temporaryProjectRoot, { recursive: true, force: true });
    }
  });
});
