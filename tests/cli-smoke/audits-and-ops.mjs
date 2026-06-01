import {
  assert,
  cliPath,
  createHash,
  execSync,
  existsSync,
  join,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  tmpdir,
  writeFileSync,
} from './shared.mjs';

export async function registerCliSmokeAuditsAndOpsTests(t) {
  await t.test('validator keeps root override file retired', () => {
    const validationOutput = execSync(`node ${join(process.cwd(), 'scripts', 'validate.mjs')}`).toString();
    assert.match(validationOutput, /RESULTS/);
    assert.equal(existsSync(join(process.cwd(), '.agent-override.md')), false);
    assert.doesNotMatch(validationOutput, /Checking override governance/);
    assert.doesNotMatch(validationOutput, /\.agent-override\.md/);
    assert.match(validationOutput, /Checking terminology mapping consistency/);
    assert.match(validationOutput, /Checking existing-project detection transparency coverage/);
    assert.match(validationOutput, /README\.md includes Terminology Mapping \(Final\)/);
  });

  await t.test('detection benchmark prints machine-readable metrics', () => {
    const benchmarkOutput = execSync(`node ${join(process.cwd(), 'scripts', 'detection-benchmark.mjs')}`).toString();
    const benchmarkReport = JSON.parse(benchmarkOutput);

    assert.ok(typeof benchmarkReport.top1Accuracy === 'number');
    assert.ok(typeof benchmarkReport.manualCorrectionRate === 'number');
    assert.ok(Array.isArray(benchmarkReport.fixtures));
    assert.ok(benchmarkReport.fixtureCount >= 1);
  });




  await t.test('context-triggered audit enforces strict mode by workflow and manual override', () => {
    const reviewWorkflowAuditOutput = execSync(
      `node ${join(process.cwd(), 'scripts', 'context-triggered-audit.mjs')} --workflow review-request`
    ).toString();
    const reviewWorkflowAuditReport = JSON.parse(reviewWorkflowAuditOutput);

    assert.equal(reviewWorkflowAuditReport.auditName, 'context-triggered-audit');
    assert.equal(reviewWorkflowAuditReport.workflow, 'review-request');
    assert.equal(reviewWorkflowAuditReport.strictAuditMode, true);
    assert.equal(reviewWorkflowAuditReport.passed, true);

    const smallEditAuditOutput = execSync(
      `node ${join(process.cwd(), 'scripts', 'context-triggered-audit.mjs')} --workflow small-edit`
    ).toString();
    const smallEditAuditReport = JSON.parse(smallEditAuditOutput);

    assert.equal(smallEditAuditReport.workflow, 'small-edit');
    assert.equal(smallEditAuditReport.strictAuditMode, false);
    assert.equal(smallEditAuditReport.passed, true);

    const forcedStrictAuditOutput = execSync(
      `node ${join(process.cwd(), 'scripts', 'context-triggered-audit.mjs')} --workflow small-edit --strict`
    ).toString();
    const forcedStrictAuditReport = JSON.parse(forcedStrictAuditOutput);

    assert.equal(forcedStrictAuditReport.workflow, 'small-edit');
    assert.equal(forcedStrictAuditReport.userForcedStrictMode, true);
    assert.equal(forcedStrictAuditReport.strictAuditMode, true);
    assert.equal(forcedStrictAuditReport.passed, true);
  });




  await t.test('skill command is retired in purge mode', () => {
    try {
      execSync(`node ${cliPath} skill frontend --tier advance --json`);
      assert.fail('Expected skill command to be unavailable after purge');
    } catch (error) {
      const errorOutput = error && typeof error === 'object' && 'stderr' in error
        ? String(error.stderr || error.stdout || '')
        : '';
      assert.match(errorOutput, /Unknown command: skill/);
    }
  });

  await t.test('preflight checks abort installation on conflict', () => {
    const preflightTargetDirectory = mkdtempSync(join(tmpdir(), 'agentic-senior-core-preflight-'));
    writeFileSync(join(preflightTargetDirectory, 'AGENTS.md'), 'Conflict');

    try {
      execSync(`node ${cliPath} init ${preflightTargetDirectory} --preset frontend-ui`);
      assert.fail('Should have thrown an error due to preflight failure');
    } catch (error) {
      const errorOutput = error.stderr ? error.stderr.toString() : error.stdout.toString();
      assert.match(errorOutput, /\[FATAL\] Preflight checks failed/);
      assert.match(errorOutput, /Conflicting governance files already exist during init/);
    } finally {
      rmSync(preflightTargetDirectory, { recursive: true, force: true });
    }
  });

  await t.test('transactional install performs automatic rollback on failure', () => {
    const rollbackTargetDirectory = mkdtempSync(join(tmpdir(), 'agentic-senior-core-rollback-'));
    const rulesPath = join(rollbackTargetDirectory, 'AGENTS.md');
    writeFileSync(rulesPath, 'Initial Rules Content');

    try {
      const backupRoot = join(rollbackTargetDirectory, '.agentic-backup');
      const objectsDir = join(backupRoot, 'objects');
      mkdirSync(objectsDir, { recursive: true });

      const hash = createHash('sha256').update('Initial Rules Content').digest('hex');
      writeFileSync(join(objectsDir, hash), 'Initial Rules Content');

      const manifest = {
        timestamp: new Date().toISOString(),
        files: {
          'AGENTS.md': { action: 'restore', hash },
          'CLAUDE.md': { action: 'delete' },
        },
      };
      writeFileSync(join(backupRoot, 'manifest.json'), JSON.stringify(manifest));

      writeFileSync(rulesPath, 'Corrupted Content');
      writeFileSync(join(rollbackTargetDirectory, 'CLAUDE.md'), 'Should Be Deleted');

      execSync(`node ${cliPath} rollback ${rollbackTargetDirectory}`);

      const restoredContent = readFileSync(rulesPath, 'utf8');
      assert.equal(restoredContent, 'Initial Rules Content');
      assert.equal(existsSync(join(rollbackTargetDirectory, 'CLAUDE.md')), false);
    } finally {
      rmSync(rollbackTargetDirectory, { recursive: true, force: true });
    }
  });
}
