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
} from './shared.mjs';
import { validateDesignIntentContract } from '../../lib/cli/project-scaffolder.mjs';
import { detectProjectContext, detectUiScopeSignals } from '../../lib/cli/detector.mjs';

export async function registerCliSmokeDesignAndDetectionTests(t) {
  await t.test('init scaffolds a dynamic UI design contract for web projects', () => {
    const uiScaffoldingTargetDirectory = mkdtempSync(join(tmpdir(), 'agentic-senior-core-scaffold-ui-'));

    try {
      const projectConfigPath = join(uiScaffoldingTargetDirectory, 'project-config.yml');
      writeFileSync(projectConfigPath, [
        'projectName: Atlas Studio',
        'projectDescription: Editorial web application for curated product stories',
        'primaryDomain: Web application',
        'databaseChoice: SQL (PostgreSQL, MySQL, SQLite)',
        'authStrategy: Session-based (server-side sessions)',
        'dockerStrategy: Docker for development only',
        'docsLang: en',
        'features:',
        '- Story landing pages',
        '- Product discovery',
        '- Editorial collections',
        'additionalContext: The interface should feel authored and premium without becoming a brand copy.',
      ].join('\n'));

      const initOutput = execSync(
        `node ${cliPath} init ${uiScaffoldingTargetDirectory} --profile balanced --stack typescript --blueprint api-nextjs --ci true --project-config ${projectConfigPath} --no-token-optimize`
      ).toString();

      assert.match(initOutput, /Bootstrap prompts: 2 files generated in \.agent-context\/prompts\//);
      assert.match(initOutput, /Seed docs: 1 files generated in docs\//);
      assert.match(initOutput, /If docs\/DESIGN\.md or docs\/design-intent\.json is missing, execute \.agent-context\/prompts\/bootstrap-design\.md now before building UI components\./);

      const bootstrapDesignPrompt = readFileSync(
        join(uiScaffoldingTargetDirectory, '.agent-context', 'prompts', 'bootstrap-design.md'),
        'utf8'
      );
      assert.match(bootstrapDesignPrompt, /Dynamic Design Contract Synthesis/);
      assert.match(bootstrapDesignPrompt, /docs\/DESIGN\.md/);
      assert.match(bootstrapDesignPrompt, /docs\/design-intent\.json/);
      assert.match(bootstrapDesignPrompt, /Do not anchor the final design language to a famous brand reference/);
      assert.match(bootstrapDesignPrompt, /Token Architecture and Alias Strategy/);
      assert.match(bootstrapDesignPrompt, /Responsive Strategy and Cross-Viewport Adaptation Matrix/);
      assert.match(bootstrapDesignPrompt, /tokenSystem/);
      assert.match(bootstrapDesignPrompt, /colorTruth/);
      assert.match(bootstrapDesignPrompt, /crossViewportAdaptation/);
      assert.match(bootstrapDesignPrompt, /motionSystem/);
      assert.match(bootstrapDesignPrompt, /componentMorphology/);

      const designIntentSeed = readJson(join(uiScaffoldingTargetDirectory, 'docs', 'design-intent.json'));
      assert.equal(designIntentSeed.mode, 'dynamic');
      assert.equal(designIntentSeed.designPhilosophy.length > 0, true);
      assert.deepEqual(designIntentSeed.tokenSystem.taxonomyOrder, ['primitive', 'semantic', 'component']);
      assert.equal(designIntentSeed.tokenSystem.primitiveColorSpace, 'OKLCH');
      assert.equal(designIntentSeed.tokenSystem.requireSemanticAliases, true);
      assert.equal(designIntentSeed.colorTruth.format, 'OKLCH');
      assert.equal(designIntentSeed.colorTruth.allowHexDerivatives, true);
      assert.equal(designIntentSeed.crossViewportAdaptation.adaptByRecomposition, true);
      assert.equal(typeof designIntentSeed.crossViewportAdaptation.mutationRules.mobile, 'string');
      assert.equal(designIntentSeed.motionSystem.allowMeaningfulMotion, true);
      assert.equal(designIntentSeed.motionSystem.respectReducedMotion, true);
      assert.equal(designIntentSeed.componentMorphology.requireStateBehaviorMatrix, true);
      assert.ok(designIntentSeed.componentMorphology.stateKeys.includes('loading'));
      assert.equal(designIntentSeed.implementation.requireViewportMutationRules, true);
      assert.equal(designIntentSeed.implementation.requireMachineReadableContract, true);
      assert.deepEqual(designIntentSeed.implementation.requiredDeliverables, ['docs/DESIGN.md', 'docs/design-intent.json']);
      assert.deepEqual(validateDesignIntentContract(designIntentSeed), []);

      const compiledRulesContent = readFileSync(join(uiScaffoldingTargetDirectory, '.cursorrules'), 'utf8');
      assert.match(compiledRulesContent, /docs\/design-intent\.json/);
      assert.match(compiledRulesContent, /- For UI scope: if docs\/DESIGN\.md or docs\/design-intent\.json is missing, execute bootstrap-design prompt before implementing UI surfaces\./);
      assert.match(compiledRulesContent, /LAYER 5: EXECUTION PROMPTS AND UI TRIGGERS/);
      assert.match(compiledRulesContent, /bootstrap-design\.md -> ui, ux, layout, screen, tailwind, frontend, redesign/);
    } finally {
      rmSync(uiScaffoldingTargetDirectory, { recursive: true, force: true });
    }
  });

  await t.test('detector ignores init-owned governance artifacts when deciding whether a project already exists', async () => {
    const governanceOnlyTargetDirectory = mkdtempSync(join(tmpdir(), 'agentic-senior-core-governance-only-'));

    try {
      mkdirSync(join(governanceOnlyTargetDirectory, '.agentic-backup', 'objects'), { recursive: true });
      mkdirSync(join(governanceOnlyTargetDirectory, '.agent-context'), { recursive: true });
      writeFileSync(join(governanceOnlyTargetDirectory, '.cursorrules'), 'Generated by Agentic-Senior-Core CLI');
      writeFileSync(join(governanceOnlyTargetDirectory, '.instructions.md'), '# local adapter');

      const projectDetection = await detectProjectContext(governanceOnlyTargetDirectory);
      assert.equal(projectDetection.hasExistingProjectFiles, false);
      assert.equal(projectDetection.recommendedStackFileName, null);
      assert.deepEqual(projectDetection.rankedCandidates, []);
    } finally {
      rmSync(governanceOnlyTargetDirectory, { recursive: true, force: true });
    }
  });

  await t.test('init seeds design-intent for detected existing UI repositories without full doc scaffolding', () => {
    const existingUiInitTargetDirectory = mkdtempSync(join(tmpdir(), 'agentic-senior-core-init-existing-ui-seed-'));

    try {
      writeFileSync(
        join(existingUiInitTargetDirectory, 'package.json'),
        JSON.stringify({
          name: 'existing-ui-init-seed',
          description: 'Existing portfolio site that still needs a machine-readable design contract',
          private: true,
          dependencies: {
            react: '19.0.0',
            'react-dom': '19.0.0',
            tailwindcss: '4.0.0',
          },
        }, null, 2)
      );
      writeFileSync(join(existingUiInitTargetDirectory, 'vite.config.js'), 'export default {};');
      writeFileSync(join(existingUiInitTargetDirectory, 'tailwind.config.js'), 'export default {};');
      mkdirSync(join(existingUiInitTargetDirectory, 'public'), { recursive: true });
      mkdirSync(join(existingUiInitTargetDirectory, 'src'), { recursive: true });
      writeFileSync(
        join(existingUiInitTargetDirectory, 'src', 'App.tsx'),
        [
          'export function App() {',
          '  return <main className="md:grid lg:grid-cols-3 max-[900px]:block" style={{ color: "#112233", backgroundColor: "rgba(12, 34, 56, 0.9)" }}><Widget one={1} two={2} three={3} four={4} five={5} six={6} /></main>;',
          '}',
        ].join('\n')
      );
      writeFileSync(join(existingUiInitTargetDirectory, 'index.html'), '<!doctype html><html></html>');

      const initOutput = execSync(
        `node ${cliPath} init ${existingUiInitTargetDirectory} --profile balanced --stack typescript --blueprint api-nextjs --ci true --no-token-optimize`
      ).toString();

      assert.match(initOutput, /Existing UI\/frontend scope detected\. Seeded docs\/design-intent\.json/);
      assert.match(initOutput, /Design seed docs: 1 files generated in docs\//);
      assert.match(initOutput, /If docs\/DESIGN\.md is missing, execute \.agent-context\/prompts\/bootstrap-design\.md now and refine docs\/design-intent\.json into a complete design contract before building UI components\./);

      const designIntentSeed = readJson(join(existingUiInitTargetDirectory, 'docs', 'design-intent.json'));
      assert.equal(designIntentSeed.mode, 'dynamic');
      assert.equal(designIntentSeed.status, 'seed-generated-during-init');
      assert.equal(designIntentSeed.project.name, 'existing-ui-init-seed');
      assert.deepEqual(designIntentSeed.tokenSystem.taxonomyOrder, ['primitive', 'semantic', 'component']);
      assert.equal(designIntentSeed.colorTruth.format, 'OKLCH');
      assert.equal(designIntentSeed.crossViewportAdaptation.adaptByRecomposition, true);
      assert.equal(designIntentSeed.motionSystem.allowMeaningfulMotion, true);
      assert.equal(designIntentSeed.componentMorphology.requireStateBehaviorMatrix, true);
      assert.equal(designIntentSeed.implementation.requireMachineReadableContract, true);
      assert.equal(designIntentSeed.repoEvidence.frontendMetrics.hardcodedColorCount >= 2, true);
      assert.equal(designIntentSeed.repoEvidence.frontendMetrics.propDrillingCandidateCount >= 1, true);
      assert.equal(designIntentSeed.repoEvidence.designEvidenceSummary.summaryVersion, 'v1');
      assert.equal(designIntentSeed.repoEvidence.designEvidenceSummary.colors.hardcodedCount >= 2, true);
      assert.equal(designIntentSeed.repoEvidence.designEvidenceSummary.componentInventory.componentFileCount >= 1, true);
      assert.deepEqual(designIntentSeed.repoEvidence.workspaceUiEntries, []);
    } finally {
      rmSync(existingUiInitTargetDirectory, { recursive: true, force: true });
    }
  });

  await t.test('init seeds design-intent and onboarding UI evidence for microservice workspaces with nested frontend apps', () => {
    const existingUiMicroserviceTargetDirectory = mkdtempSync(join(tmpdir(), 'agentic-senior-core-init-existing-ui-microservice-'));

    try {
      mkdirSync(join(existingUiMicroserviceTargetDirectory, 'services', 'orders'), { recursive: true });
      writeFileSync(
        join(existingUiMicroserviceTargetDirectory, 'services', 'orders', 'pyproject.toml'),
        '[project]\nname = "orders-service"\nversion = "1.0.0"\n'
      );

      mkdirSync(join(existingUiMicroserviceTargetDirectory, 'apps', 'web', 'src'), { recursive: true });
      writeFileSync(
        join(existingUiMicroserviceTargetDirectory, 'apps', 'web', 'package.json'),
        JSON.stringify({
          name: '@workspace/web',
          description: 'Customer-facing storefront inside a microservice workspace',
          private: true,
          dependencies: {
            react: '19.0.0',
            'react-dom': '19.0.0',
            tailwindcss: '4.0.0',
          },
        }, null, 2)
      );
      writeFileSync(join(existingUiMicroserviceTargetDirectory, 'apps', 'web', 'vite.config.js'), 'export default {};');
      writeFileSync(
        join(existingUiMicroserviceTargetDirectory, 'apps', 'web', 'src', 'App.tsx'),
        [
          'export function App() {',
          '  return <main className="md:grid lg:grid-cols-3 max-[900px]:block" style={{ color: "#112233", backgroundColor: "rgba(12, 34, 56, 0.9)" }}><Widget one={1} two={2} three={3} four={4} five={5} six={6} /></main>;',
          '}',
        ].join('\n')
      );

      const initOutput = execSync(
        `node ${cliPath} init ${existingUiMicroserviceTargetDirectory} --profile balanced --ci true --no-token-optimize --no-scaffold-docs`
      ).toString();

      assert.match(initOutput, /Using detected stack automatically for this existing project: Python\./);
      assert.match(initOutput, /Existing UI\/frontend scope detected\. Seeded docs\/design-intent\.json/);

      const designIntentSeed = readJson(join(existingUiMicroserviceTargetDirectory, 'docs', 'design-intent.json'));
      assert.equal(designIntentSeed.mode, 'dynamic');
      assert.deepEqual(designIntentSeed.tokenSystem.taxonomyOrder, ['primitive', 'semantic', 'component']);
      assert.equal(designIntentSeed.motionSystem.allowMeaningfulMotion, true);
      assert.equal(designIntentSeed.componentMorphology.requireStateBehaviorMatrix, true);
      assert.ok(Array.isArray(designIntentSeed.repoEvidence.workspaceUiEntries));
      assert.equal(designIntentSeed.repoEvidence.designEvidenceSummary.summaryVersion, 'v1');
      assert.equal(designIntentSeed.repoEvidence.designEvidenceSummary.tailwind.breakpointUsageCount >= 1, true);
      assert.ok(designIntentSeed.repoEvidence.workspaceUiEntries.some((workspaceUiEntry) => workspaceUiEntry.relativePath === 'apps/web'));

      const onboardingReport = readJson(
        join(existingUiMicroserviceTargetDirectory, '.agent-context', 'state', 'onboarding-report.json')
      );
      assert.equal(onboardingReport.selectedStack, 'python.md');
      assert.equal(onboardingReport.autoDetection.uiScope.isUiScopeLikely, true);
      assert.equal(onboardingReport.autoDetection.uiScope.designEvidenceSummary.summaryVersion, 'v1');
      assert.ok(onboardingReport.autoDetection.uiScope.workspaceUiEntries.some((workspaceUiEntry) => workspaceUiEntry.relativePath === 'apps/web'));
    } finally {
      rmSync(existingUiMicroserviceTargetDirectory, { recursive: true, force: true });
    }
  });

  await t.test('ui scope detector collects cheap frontend evidence metrics', async () => {
    const uiEvidenceTargetDirectory = mkdtempSync(join(tmpdir(), 'agentic-senior-core-ui-evidence-'));

    try {
      writeFileSync(
        join(uiEvidenceTargetDirectory, 'package.json'),
        JSON.stringify({
          name: 'ui-evidence-target',
          private: true,
          dependencies: {
            react: '19.0.0',
            tailwindcss: '4.0.0',
          },
        }, null, 2)
      );
      mkdirSync(join(uiEvidenceTargetDirectory, 'src'), { recursive: true });
      writeFileSync(
        join(uiEvidenceTargetDirectory, 'src', 'Screen.tsx'),
        [
          'export function Screen() {',
          '  return <section className="sm:grid md:grid lg:grid-cols-4 max-[900px]:block" style={{ color: "#abcdef", backgroundColor: "rgba(0, 0, 0, 0.5)" }}><Card a={a} b={b} c={c} d={d} e={e} f={f} /></section>;',
          '}',
          '@media (min-width: 920px) { .panel { display: grid; } }',
        ].join('\n')
      );

      const uiScopeSignals = await detectUiScopeSignals({
        targetDirectoryPath: uiEvidenceTargetDirectory,
        selectedStackFileName: 'typescript.md',
        selectedBlueprintFileName: 'api-nextjs.md',
      });

      assert.equal(uiScopeSignals.isUiScopeLikely, true);
      assert.ok(uiScopeSignals.frontendEvidenceMetrics);
      assert.equal(uiScopeSignals.frontendEvidenceMetrics.hardcodedColorCount >= 2, true);
      assert.equal(uiScopeSignals.frontendEvidenceMetrics.propDrillingCandidateCount >= 1, true);
      assert.equal(uiScopeSignals.frontendEvidenceMetrics.arbitraryBreakpointCount >= 1, true);
      assert.equal(uiScopeSignals.frontendEvidenceMetrics.mediaQueryCount >= 1, true);
      assert.equal(uiScopeSignals.designEvidenceSummary.summaryVersion, 'v1');
      assert.equal(uiScopeSignals.designEvidenceSummary.cssVariables.definitionCount, 0);
      assert.equal(uiScopeSignals.designEvidenceSummary.colors.hardcodedCount >= 2, true);
    } finally {
      rmSync(uiEvidenceTargetDirectory, { recursive: true, force: true });
    }
  });

  await t.test('ui scope detector finds nested frontend packages inside microservice workspaces', async () => {
    const workspaceTargetDirectory = mkdtempSync(join(tmpdir(), 'agentic-senior-core-ui-microservice-'));

    try {
      mkdirSync(join(workspaceTargetDirectory, 'services', 'orders'), { recursive: true });
      writeFileSync(
        join(workspaceTargetDirectory, 'services', 'orders', 'pyproject.toml'),
        '[project]\nname = "orders-service"\nversion = "1.0.0"\n'
      );

      mkdirSync(join(workspaceTargetDirectory, 'apps', 'web', 'src'), { recursive: true });
      writeFileSync(
        join(workspaceTargetDirectory, 'apps', 'web', 'package.json'),
        JSON.stringify({
          name: '@workspace/web',
          private: true,
          dependencies: {
            react: '19.0.0',
            'react-dom': '19.0.0',
            tailwindcss: '4.0.0',
          },
        }, null, 2)
      );
      writeFileSync(join(workspaceTargetDirectory, 'apps', 'web', 'vite.config.js'), 'export default {};');
      writeFileSync(
        join(workspaceTargetDirectory, 'apps', 'web', 'src', 'App.tsx'),
        [
          'export function App() {',
          '  return <main className="md:grid lg:grid-cols-3 max-[900px]:block" style={{ color: "#112233", backgroundColor: "rgba(12, 34, 56, 0.9)" }}><Widget one={1} two={2} three={3} four={4} five={5} six={6} /></main>;',
          '}',
        ].join('\n')
      );

      const projectDetection = await detectProjectContext(workspaceTargetDirectory);
      assert.equal(projectDetection.recommendedStackFileName, 'python.md');
      assert.ok(projectDetection.secondaryStackFileNames.includes('typescript.md'));

      const uiScopeSignals = await detectUiScopeSignals({
        targetDirectoryPath: workspaceTargetDirectory,
        selectedStackFileName: projectDetection.recommendedStackFileName,
        selectedBlueprintFileName: projectDetection.recommendedBlueprintFileName,
      });

      assert.equal(uiScopeSignals.isUiScopeLikely, true);
      assert.ok(Array.isArray(uiScopeSignals.workspaceUiEntries));
      assert.ok(uiScopeSignals.workspaceUiEntries.some((workspaceUiEntry) => workspaceUiEntry.relativePath === 'apps/web'));
      assert.equal(uiScopeSignals.packageManifest?.name, '@workspace/web');
      assert.equal(uiScopeSignals.frontendEvidenceMetrics?.hardcodedColorCount >= 2, true);
      assert.equal(uiScopeSignals.frontendEvidenceMetrics?.propDrillingCandidateCount >= 1, true);
      assert.equal(uiScopeSignals.designEvidenceSummary.summaryVersion, 'v1');
      assert.ok(uiScopeSignals.designEvidenceSummary.componentInventory.surfaceFileSamples.some((filePath) => filePath.endsWith('src/App.tsx')));
    } finally {
      rmSync(workspaceTargetDirectory, { recursive: true, force: true });
    }
  });

  await t.test('ui scope detector does not false-positive on backend-only microservice workspaces', async () => {
    const workspaceTargetDirectory = mkdtempSync(join(tmpdir(), 'agentic-senior-core-backend-microservice-'));

    try {
      mkdirSync(join(workspaceTargetDirectory, 'services', 'orders'), { recursive: true });
      mkdirSync(join(workspaceTargetDirectory, 'services', 'billing'), { recursive: true });
      writeFileSync(
        join(workspaceTargetDirectory, 'services', 'orders', 'pyproject.toml'),
        '[project]\nname = "orders-service"\nversion = "1.0.0"\n'
      );
      writeFileSync(
        join(workspaceTargetDirectory, 'services', 'billing', 'go.mod'),
        'module example.com/billing\n\ngo 1.22.0\n'
      );

      const uiScopeSignals = await detectUiScopeSignals({
        targetDirectoryPath: workspaceTargetDirectory,
        selectedStackFileName: 'python.md',
        selectedBlueprintFileName: 'fastapi-service.md',
      });

      assert.equal(uiScopeSignals.isUiScopeLikely, false);
      assert.deepEqual(uiScopeSignals.workspaceUiEntries, []);
      assert.equal(uiScopeSignals.frontendEvidenceMetrics, null);
    } finally {
      rmSync(workspaceTargetDirectory, { recursive: true, force: true });
    }
  });

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
      assert.deepEqual(designIntentSeed.tokenSystem.taxonomyOrder, ['primitive', 'semantic', 'component']);
      assert.equal(designIntentSeed.colorTruth.format, 'OKLCH');
      assert.equal(designIntentSeed.crossViewportAdaptation.adaptByRecomposition, true);
      assert.equal(designIntentSeed.motionSystem.allowMeaningfulMotion, true);
      assert.equal(designIntentSeed.componentMorphology.requireStateBehaviorMatrix, true);
      assert.equal(designIntentSeed.implementation.requireMachineReadableContract, true);
      assert.equal(designIntentSeed.implementation.requireViewportMutationRules, true);
      assert.equal(designIntentSeed.repoEvidence.designEvidenceSummary.summaryVersion, 'v1');
      assert.deepEqual(designIntentSeed.implementation.requiredDeliverables, ['docs/DESIGN.md', 'docs/design-intent.json']);
      assert.deepEqual(validateDesignIntentContract(designIntentSeed), []);
    } finally {
      rmSync(uiUpgradeTargetDirectory, { recursive: true, force: true });
    }
  });

  await t.test('optimize command enables token optimization policy and regenerates rules', () => {
    const optimizationTargetDirectory = mkdtempSync(join(tmpdir(), 'agentic-senior-core-optimize-'));

    try {
      execSync(
        `node ${cliPath} init ${optimizationTargetDirectory} --profile balanced --stack typescript --blueprint api-nextjs --ci true`
      ).toString();

      const optimizeOutput = execSync(
        `node ${cliPath} optimize ${optimizationTargetDirectory} --agent copilot --enable`
      ).toString();

      assert.match(optimizeOutput, /Token optimization enabled/);

      const tokenStatePath = join(optimizationTargetDirectory, '.agent-context', 'state', 'token-optimization.json');
      const tokenState = readJson(tokenStatePath);

      assert.equal(tokenState.enabled, true);
      assert.equal(tokenState.selectedAgent, 'copilot');
      assert.ok(Array.isArray(tokenState.commandRewriteMappings));
      assert.ok(tokenState.commandRewriteMappings.length >= 10);

      const tokenRulesContent = readFileSync(join(optimizationTargetDirectory, '.cursorrules'), 'utf8');
      assert.match(tokenRulesContent, /TOKEN OPTIMIZATION PROFILE/);

      const tokenReportPath = join(
        optimizationTargetDirectory,
        '.agent-context',
        'state',
        'token-optimization-report.json'
      );
      const tokenReport = readJson(tokenReportPath);
      assert.equal(tokenReport.enabled, true);
      assert.equal(tokenReport.selectedAgent, 'copilot');
      assert.ok(typeof tokenReport.externalProxy === 'object');
    } finally {
      rmSync(optimizationTargetDirectory, { recursive: true, force: true });
    }
  });

  await t.test('init can auto-enable token optimization with flags', () => {
    const initOptimizationTargetDirectory = mkdtempSync(join(tmpdir(), 'agentic-senior-core-init-optimize-'));

    try {
      const initOutput = execSync(
        `node ${cliPath} init ${initOptimizationTargetDirectory} --profile balanced --stack typescript --blueprint api-nextjs --ci true --token-optimize --token-agent cursor`
      ).toString();

      assert.match(initOutput, /Token optimization policy enabled for agent cursor/);

      const initTokenStatePath = join(
        initOptimizationTargetDirectory,
        '.agent-context',
        'state',
        'token-optimization.json'
      );
      const initTokenState = readJson(initTokenStatePath);

      assert.equal(initTokenState.enabled, true);
      assert.equal(initTokenState.selectedAgent, 'cursor');
      assert.ok(typeof initTokenState.externalProxy === 'object');

      const initCompiledRulesContent = readFileSync(join(initOptimizationTargetDirectory, '.cursorrules'), 'utf8');
      assert.match(initCompiledRulesContent, /TOKEN OPTIMIZATION PROFILE/);
    } finally {
      rmSync(initOptimizationTargetDirectory, { recursive: true, force: true });
    }
  });

  await t.test('init enables memory continuity and token optimization by default and supports opt-out', () => {
    const defaultOptimizationTargetDirectory = mkdtempSync(join(tmpdir(), 'agentic-senior-core-init-default-optimize-'));
    const optOutOptimizationTargetDirectory = mkdtempSync(join(tmpdir(), 'agentic-senior-core-init-optout-optimize-'));

    try {
      const defaultInitOutput = execSync(
        `node ${cliPath} init ${defaultOptimizationTargetDirectory} --profile balanced --stack typescript --blueprint api-nextjs --ci true`
      ).toString();

      assert.match(defaultInitOutput, /Memory continuity policy enabled/);
      assert.match(defaultInitOutput, /Token optimization policy enabled for agent/);

      const defaultMemoryState = readJson(
        join(defaultOptimizationTargetDirectory, '.agent-context', 'state', 'memory-continuity.json')
      );
      assert.equal(defaultMemoryState.enabled, true);
      assert.equal(defaultMemoryState.hydrationMode, 'progressive-disclosure');
      assert.ok(Array.isArray(defaultMemoryState.adapters));
      assert.ok(defaultMemoryState.adapters.length >= 3);

      const defaultTokenState = readJson(
        join(defaultOptimizationTargetDirectory, '.agent-context', 'state', 'token-optimization.json')
      );
      assert.equal(defaultTokenState.enabled, true);

      const defaultCompiledRules = readFileSync(join(defaultOptimizationTargetDirectory, '.cursorrules'), 'utf8');
      assert.match(defaultCompiledRules, /MEMORY CONTINUITY PROFILE/);
      assert.match(defaultCompiledRules, /TOKEN OPTIMIZATION PROFILE/);

      const defaultOnboardingReport = readJson(
        join(defaultOptimizationTargetDirectory, '.agent-context', 'state', 'onboarding-report.json')
      );
      assert.equal(defaultOnboardingReport.memoryContinuity?.enabled, true);
      assert.equal(defaultOnboardingReport.tokenOptimization?.enabled, true);

      const optOutInitOutput = execSync(
        `node ${cliPath} init ${optOutOptimizationTargetDirectory} --profile balanced --stack typescript --blueprint api-nextjs --ci true --no-token-optimize --no-memory-continuity`
      ).toString();

      assert.match(optOutInitOutput, /Memory continuity policy: disabled \(--no-memory-continuity\)/);
      assert.match(optOutInitOutput, /Token optimization policy: disabled \(--no-token-optimize\)/);

      const optOutMemoryStatePath = join(
        optOutOptimizationTargetDirectory,
        '.agent-context',
        'state',
        'memory-continuity.json'
      );
      assert.equal(existsSync(optOutMemoryStatePath), false);

      const optOutTokenStatePath = join(
        optOutOptimizationTargetDirectory,
        '.agent-context',
        'state',
        'token-optimization.json'
      );
      assert.equal(existsSync(optOutTokenStatePath), false);

      const optOutCompiledRules = readFileSync(join(optOutOptimizationTargetDirectory, '.cursorrules'), 'utf8');
      assert.doesNotMatch(optOutCompiledRules, /MEMORY CONTINUITY PROFILE/);
      assert.doesNotMatch(optOutCompiledRules, /TOKEN OPTIMIZATION PROFILE/);

      const optOutOnboardingReport = readJson(
        join(optOutOptimizationTargetDirectory, '.agent-context', 'state', 'onboarding-report.json')
      );
      assert.equal(optOutOnboardingReport.memoryContinuity?.enabled, false);
      assert.equal(optOutOnboardingReport.tokenOptimization?.enabled, false);
    } finally {
      rmSync(defaultOptimizationTargetDirectory, { recursive: true, force: true });
      rmSync(optOutOptimizationTargetDirectory, { recursive: true, force: true });
    }
  });
}
