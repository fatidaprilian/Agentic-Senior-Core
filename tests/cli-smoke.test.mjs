import test from 'node:test';
import assert from 'node:assert/strict';
import { execSync } from 'node:child_process';
import { mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

test('CLI Smoke Tests', async (t) => {
  const cliPath = join(process.cwd(), 'bin', 'agentic-senior-core.js');

  await t.test('shows help', () => {
    const output = execSync(`node ${cliPath} --help`).toString();
    assert.match(output, /Usage:/);
    assert.match(output, /init/);
    assert.match(output, /--profile-pack/);
  });

  await t.test('launch command shows numbered startup choices', () => {
    const launchOutput = execSync(`node ${cliPath} launch`, { input: '7\n' }).toString();
    assert.match(launchOutput, /How do you want to start\?/);
    assert.match(launchOutput, /1\. GitHub template/);
    assert.match(launchOutput, /Exit selected\./);
  });

  await t.test('initializes with a team profile pack', () => {
    const temporaryTargetDirectory = mkdtempSync(join(tmpdir(), 'agentic-senior-core-'));

    try {
      const initOutput = execSync(
        `node ${cliPath} init ${temporaryTargetDirectory} --profile-pack startup --stack typescript --blueprint api-nextjs --ci true`
      ).toString();

      assert.match(initOutput, /Initialization complete/);
      assert.match(initOutput, /Team profile pack: Startup Team/);

      const onboardingReportPath = join(temporaryTargetDirectory, '.agent-context', 'state', 'onboarding-report.json');
      const onboardingReport = JSON.parse(readFileSync(onboardingReportPath, 'utf8'));

      assert.equal(onboardingReport.selectedProfile, 'balanced');
      assert.equal(onboardingReport.selectedProfilePack?.name, 'startup');
      assert.equal(onboardingReport.selectedProfilePack?.sourceFile, 'startup.md');
      assert.equal(onboardingReport.selectedStack, 'typescript.md');
      assert.equal(onboardingReport.selectedBlueprint, 'api-nextjs.md');
      assert.equal(onboardingReport.ciGuardrailsEnabled, true);
      assert.deepEqual(onboardingReport.selectedSkillDomains, ['frontend', 'fullstack', 'cli']);

      const compiledRulesContent = readFileSync(join(temporaryTargetDirectory, '.cursorrules'), 'utf8');
      assert.match(compiledRulesContent, /SKILL PACK: Frontend/);
      assert.match(compiledRulesContent, /SKILL PACK: Fullstack/);
    } finally {
      rmSync(temporaryTargetDirectory, { recursive: true, force: true });
    }
  });

  await t.test('initializes with a plug-and-play preset', () => {
    const presetTargetDirectory = mkdtempSync(join(tmpdir(), 'agentic-senior-core-preset-'));

    try {
      const presetOutput = execSync(
        `node ${cliPath} init ${presetTargetDirectory} --preset frontend-web`
      ).toString();

      assert.match(presetOutput, /Using preset: frontend-web/);

      const presetReportPath = join(presetTargetDirectory, '.agent-context', 'state', 'onboarding-report.json');
      const presetReport = JSON.parse(readFileSync(presetReportPath, 'utf8'));

      assert.equal(presetReport.selectedPreset, 'frontend-web');
      assert.equal(presetReport.selectedProfile, 'balanced');
      assert.equal(presetReport.selectedStack, 'typescript.md');
      assert.equal(presetReport.selectedBlueprint, 'api-nextjs.md');
    } finally {
      rmSync(presetTargetDirectory, { recursive: true, force: true });
    }
  });

  await t.test('initializes beginner and strict profiles non-interactively', () => {
    const beginnerTargetDirectory = mkdtempSync(join(tmpdir(), 'agentic-senior-core-beginner-'));
    const strictTargetDirectory = mkdtempSync(join(tmpdir(), 'agentic-senior-core-strict-'));

    try {
      const beginnerOutput = execSync(
        `node ${cliPath} init ${beginnerTargetDirectory} --profile beginner --stack typescript --blueprint api-nextjs --ci true`
      ).toString();
      assert.match(beginnerOutput, /Profile: Beginner/);

      const strictOutput = execSync(
        `node ${cliPath} init ${strictTargetDirectory} --profile strict --stack go --blueprint go-service --ci true`
      ).toString();
      assert.match(strictOutput, /Profile: Strict/);

      const strictReportPath = join(strictTargetDirectory, '.agent-context', 'state', 'onboarding-report.json');
      const strictReport = JSON.parse(readFileSync(strictReportPath, 'utf8'));
      assert.equal(strictReport.selectedProfile, 'strict');
      assert.equal(strictReport.selectedStack, 'go.md');
      assert.equal(strictReport.selectedBlueprint, 'go-service.md');
      assert.equal(strictReport.operationMode, 'init');
    } finally {
      rmSync(beginnerTargetDirectory, { recursive: true, force: true });
      rmSync(strictTargetDirectory, { recursive: true, force: true });
    }
  });

  await t.test('upgrade command supports dry-run preview', () => {
    const upgradeTargetDirectory = mkdtempSync(join(tmpdir(), 'agentic-senior-core-upgrade-'));

    try {
      execSync(
        `node ${cliPath} init ${upgradeTargetDirectory} --profile balanced --stack typescript --blueprint api-nextjs --ci true`
      ).toString();

      const upgradeOutput = execSync(`node ${cliPath} upgrade ${upgradeTargetDirectory} --dry-run`).toString();
      assert.match(upgradeOutput, /Upgrade preview/);
      assert.match(upgradeOutput, /Dry run enabled/);
    } finally {
      rmSync(upgradeTargetDirectory, { recursive: true, force: true });
    }
  });

  await t.test('validator checks override governance', () => {
    const validationOutput = execSync(`node ${join(process.cwd(), 'scripts', 'validate.mjs')}`).toString();
    assert.match(validationOutput, /RESULTS/);
    assert.match(validationOutput, /Checking override governance/);
  });

  await t.test('detection benchmark prints machine-readable metrics', () => {
    const benchmarkOutput = execSync(`node ${join(process.cwd(), 'scripts', 'detection-benchmark.mjs')}`).toString();
    const benchmarkReport = JSON.parse(benchmarkOutput);

    assert.ok(typeof benchmarkReport.top1Accuracy === 'number');
    assert.ok(typeof benchmarkReport.manualCorrectionRate === 'number');
    assert.ok(Array.isArray(benchmarkReport.fixtures));
    assert.ok(benchmarkReport.fixtureCount >= 1);
  });

  await t.test('frontend usability audit outputs machine-readable report', () => {
    const auditOutput = execSync(`node ${join(process.cwd(), 'scripts', 'frontend-usability-audit.mjs')}`).toString();
    const auditReport = JSON.parse(auditOutput);

    assert.equal(auditReport.auditName, 'frontend-usability-audit');
    assert.equal(auditReport.passed, true);
    assert.equal(auditReport.failureCount, 0);
    assert.ok(Array.isArray(auditReport.failures));
  });

  await t.test('skill selector outputs recommended pack', () => {
    const skillOutput = execSync(`node ${cliPath} skill frontend --tier advance --json`).toString();
    const skillReport = JSON.parse(skillOutput);

    assert.equal(skillReport.defaultTier, 'advance');
    assert.equal(skillReport.selectedTier, 'advance');
    assert.equal(skillReport.selectedDomain?.name, 'frontend');
    assert.equal(skillReport.recommendedPackFileName, 'frontend.md');
  });
});
