import {
  assert,
  cliPath,
  execSync,
  existsSync,
  join,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  readJson,
  rmSync,
  tmpdir,
  writeFileSync,
} from '../shared.mjs';
import { validateDesignIntentContract } from '../../../lib/cli/project-scaffolder.mjs';
import { detectProjectContext, detectUiScopeSignals } from '../../../lib/cli/detector.mjs';

export async function registerUpgradeDesignSeedSmokeTests(t) {
  await t.test('upgrade dry-run warns about stale project doc templates', () => {
    const staleDocsTargetDirectory = mkdtempSync(join(tmpdir(), 'agentic-senior-core-upgrade-stale-docs-'));

    try {
      const projectConfigPath = join(staleDocsTargetDirectory, 'project-config.yml');
      writeFileSync(projectConfigPath, [
        'projectName: Upgrade Docs Check',
        'projectDescription: Verifies stale template reporting',
        'primaryDomain: API service',
        'databaseChoice: SQL (PostgreSQL, MySQL, SQLite)',
        'authStrategy: JWT (stateless token auth)',
        'docsLang: en',
        'features:',
        '- Audit trail',
        '- Invoice summary',
      ].join('\n'));

      execSync(
        `node ${cliPath} init ${staleDocsTargetDirectory} --profile balanced --stack typescript --blueprint api-nextjs --ci true --project-config ${projectConfigPath} --no-token-optimize`
      ).toString();

      mkdirSync(join(staleDocsTargetDirectory, 'docs'), { recursive: true });
      const projectBriefPath = join(staleDocsTargetDirectory, 'docs', 'project-brief.md');
      writeFileSync(
        projectBriefPath,
        [
          '# Project Brief: Upgrade Docs Check',
          '',
          'Template version: 1.0.0',
          '',
          'Legacy template-based document kept for upgrade compatibility test.',
        ].join('\n')
      );

      const upgradeOutput = execSync(`node ${cliPath} upgrade ${staleDocsTargetDirectory} --dry-run`).toString();
      assert.match(upgradeOutput, /Project docs stale files: 1/);
      assert.match(upgradeOutput, /Some project docs were generated from older template versions/);
      assert.match(upgradeOutput, /docs\/project-brief\.md \(detected: 1\.0\.0, expected: 1\.2\.0\)/);
    } finally {
      rmSync(staleDocsTargetDirectory, { recursive: true, force: true });
    }
  });

  await t.test('upgrade dry-run warns when UI scope is detected but the design contract is missing', () => {
    const uiUpgradeTargetDirectory = mkdtempSync(join(tmpdir(), 'agentic-senior-core-upgrade-ui-warning-'));

    try {
      writeFileSync(
        join(uiUpgradeTargetDirectory, 'package.json'),
        JSON.stringify({
          name: 'ui-warning-project',
          private: true,
          dependencies: {
            next: '15.0.0',
            react: '19.0.0',
            'react-dom': '19.0.0',
          },
        }, null, 2)
      );
      writeFileSync(join(uiUpgradeTargetDirectory, 'next.config.js'), 'module.exports = {};');
      mkdirSync(join(uiUpgradeTargetDirectory, 'components'), { recursive: true });

      const upgradeOutput = execSync(`node ${cliPath} upgrade ${uiUpgradeTargetDirectory} --dry-run`).toString();
      assert.match(upgradeOutput, /UI\/frontend scope was detected, but the dynamic design contract is incomplete/);
      assert.match(upgradeOutput, /Missing docs\/DESIGN\.md/);
      assert.match(upgradeOutput, /Missing docs\/design-intent\.json/);
      assert.match(upgradeOutput, /Planned seed on apply: docs\/design-intent\.json/);
      assert.match(upgradeOutput, /Detection signals:/);
      assert.match(upgradeOutput, /Upgrade synchronizes governance assets and can seed docs\/design-intent\.json, but it does not author project-specific docs\/DESIGN\.md automatically\./);
    } finally {
      rmSync(uiUpgradeTargetDirectory, { recursive: true, force: true });
    }
  });

  await t.test('upgrade materializes a design-intent seed for detected UI repos', () => {
    const uiUpgradeTargetDirectory = mkdtempSync(join(tmpdir(), 'agentic-senior-core-upgrade-ui-seed-'));

    try {
      writeFileSync(
        join(uiUpgradeTargetDirectory, 'package.json'),
        JSON.stringify({
          name: 'ui-seed-project',
          description: 'Existing portfolio website that needs a fresh design contract',
          private: true,
          dependencies: {
            vite: '6.0.0',
            react: '19.0.0',
            tailwindcss: '4.0.0',
          },
        }, null, 2)
      );
      writeFileSync(join(uiUpgradeTargetDirectory, 'vite.config.js'), 'export default {};');
      writeFileSync(join(uiUpgradeTargetDirectory, 'tailwind.config.js'), 'export default {};');
      mkdirSync(join(uiUpgradeTargetDirectory, 'public'), { recursive: true });
      writeFileSync(join(uiUpgradeTargetDirectory, 'index.html'), '<!doctype html><html></html>');

      const upgradeOutput = execSync(`node ${cliPath} upgrade ${uiUpgradeTargetDirectory} --yes`).toString();
      assert.match(upgradeOutput, /\[NEW\]\s+docs\/design-intent\.json \(seed\)/);

      const designIntentSeed = readJson(join(uiUpgradeTargetDirectory, 'docs', 'design-intent.json'));
      assert.equal(designIntentSeed.mode, 'dynamic');
      assert.equal(designIntentSeed.status, 'seed-generated-during-upgrade');
      assert.equal(designIntentSeed.seedPolicy.mode, 'structure-first-scaffold');
      assert.deepEqual(designIntentSeed.tokenSystem.taxonomyOrder, ['primitive', 'semantic', 'component']);
      assert.equal(designIntentSeed.colorTruth.format, 'OKLCH');
      assert.ok(designIntentSeed.colorTruth.paletteRoles.includes('agent-defined-semantic-roles'));
      assert.equal(designIntentSeed.crossViewportAdaptation.adaptByRecomposition, true);
      assert.equal(designIntentSeed.motionSystem.allowMeaningfulMotion, true);
      assert.equal(designIntentSeed.motionSystem.seedToneLocked, false);
      assert.equal(designIntentSeed.componentMorphology.requireStateBehaviorMatrix, true);
      assert.equal(designIntentSeed.accessibilityPolicy.failOnHardViolations, true);
      assert.equal(designIntentSeed.designExecutionPolicy.seedRefinementRequiredBeforeUiImplementation, true);
      assert.equal(designIntentSeed.designExecutionPolicy.requireSignatureMoveRationale, true);
      assert.equal(designIntentSeed.designExecutionHandoff.seedMode, 'structure-first-scaffold');
      assert.equal(designIntentSeed.designExecutionHandoff.signatureMoveRationale.length > 0, true);
      assert.equal(designIntentSeed.reviewRubric.validBoldSignals.length >= 3, true);
      assert.equal(designIntentSeed.contextHygiene.continuityMode, 'opt-in-only');
      assert.equal(designIntentSeed.implementation.requireMachineReadableContract, true);
      assert.equal(designIntentSeed.implementation.requireViewportMutationRules, true);
      assert.equal(designIntentSeed.repoEvidence.designEvidenceSummary.summaryVersion, 'v1');
      assert.equal(typeof designIntentSeed.repoEvidence.designEvidenceSummary.structuredInspection.classAttributeCount, 'number');
      assert.deepEqual(designIntentSeed.implementation.requiredDeliverables, ['docs/DESIGN.md', 'docs/design-intent.json']);
      assert.deepEqual(validateDesignIntentContract(designIntentSeed), []);
    } finally {
      rmSync(uiUpgradeTargetDirectory, { recursive: true, force: true });
    }
  });

  await t.test('upgrade materializes a design-intent seed for installed fullstack workspaces', () => {
    const fullstackUpgradeTargetDirectory = mkdtempSync(join(tmpdir(), 'agentic-senior-core-upgrade-fullstack-seed-'));

    try {
      const projectConfigPath = join(fullstackUpgradeTargetDirectory, 'project-config.yml');
      writeFileSync(projectConfigPath, [
        'projectName: Fullstack Upgrade Seed',
        'projectDescription: Fresh fullstack product initialized before the design seed existed',
        'primaryDomain: Fullstack product',
        'databaseChoice: SQL (PostgreSQL, MySQL, SQLite)',
        'authStrategy: JWT (stateless token auth)',
        'dockerStrategy: Docker for development only',
        'docsLang: en',
      ].join('\n'));

      execSync(
        `node ${cliPath} init ${fullstackUpgradeTargetDirectory} --profile balanced --stack typescript --blueprint api-nextjs --ci true --project-config ${projectConfigPath} --no-token-optimize --no-memory-continuity`
      ).toString();
      rmSync(join(fullstackUpgradeTargetDirectory, 'docs', 'design-intent.json'), { force: true });

      const upgradeOutput = execSync(`node ${cliPath} upgrade ${fullstackUpgradeTargetDirectory} --yes`).toString();
      assert.match(upgradeOutput, /\[NEW\]\s+docs\/design-intent\.json \(seed\)/);

      const designIntentSeed = readJson(join(fullstackUpgradeTargetDirectory, 'docs', 'design-intent.json'));
      assert.equal(designIntentSeed.mode, 'dynamic');
      assert.equal(designIntentSeed.status, 'seed-generated-during-upgrade');
      assert.ok(designIntentSeed.repoEvidence.uiSignalReasons.includes('onboarding project scope: both'));
      assert.deepEqual(validateDesignIntentContract(designIntentSeed), []);
    } finally {
      rmSync(fullstackUpgradeTargetDirectory, { recursive: true, force: true });
    }
  });
}
