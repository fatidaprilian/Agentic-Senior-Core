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
import { detectProjectContext, detectUiScopeSignals } from '../../../lib/cli/detector.mjs';

export async function registerUiDetectionSmokeTests(t) {
  await t.test('detector ignores init-owned governance artifacts when deciding whether a project already exists', async () => {
    const governanceOnlyTargetDirectory = mkdtempSync(join(tmpdir(), 'agentic-senior-core-governance-only-'));

    try {
      mkdirSync(join(governanceOnlyTargetDirectory, '.agentic-backup', 'objects'), { recursive: true });
      mkdirSync(join(governanceOnlyTargetDirectory, '.agent-context'), { recursive: true });
      writeFileSync(join(governanceOnlyTargetDirectory, 'AGENTS.md'), '# Agentic-Senior-Core governance');
      writeFileSync(join(governanceOnlyTargetDirectory, 'CLAUDE.md'), '@AGENTS.md\n');
      writeFileSync(join(governanceOnlyTargetDirectory, 'GEMINI.md'), '@AGENTS.md\n');

      const projectDetection = await detectProjectContext(governanceOnlyTargetDirectory);
      assert.equal(projectDetection.hasExistingProjectFiles, false);
      assert.equal(projectDetection.detectedStackFileName, null);
      assert.deepEqual(projectDetection.rankedCandidates, []);
    } finally {
      rmSync(governanceOnlyTargetDirectory, { recursive: true, force: true });
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
      assert.equal(uiScopeSignals.frontendEvidenceMetrics.structuredClassAttributeCount >= 1, true);
      assert.equal(uiScopeSignals.frontendEvidenceMetrics.inlineStyleObjectCount >= 1, true);
      assert.equal(uiScopeSignals.frontendEvidenceMetrics.inlineStyleTokenBypassCount >= 2, true);
      assert.equal(uiScopeSignals.designEvidenceSummary.summaryVersion, 'v1');
      assert.equal(uiScopeSignals.designEvidenceSummary.cssVariables.definitionCount, 0);
      assert.equal(uiScopeSignals.designEvidenceSummary.colors.hardcodedCount >= 2, true);
      assert.equal(uiScopeSignals.designEvidenceSummary.structuredInspection.classAttributeCount >= 1, true);
      assert.equal(uiScopeSignals.designEvidenceSummary.structuredInspection.inlineStyleObjectCount >= 1, true);
      assert.equal(uiScopeSignals.designEvidenceSummary.structuredInspection.utilityFamilyCounts.grid >= 1, true);
      assert.equal(uiScopeSignals.designEvidenceSummary.tokenBypassSignals.inlineHardcodedColorCount >= 2, true);
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
      assert.equal(projectDetection.detectedStackFileName, 'python.md');
      assert.ok(projectDetection.secondaryStackFileNames.includes('typescript.md'));

      const uiScopeSignals = await detectUiScopeSignals({
        targetDirectoryPath: workspaceTargetDirectory,
        selectedStackFileName: projectDetection.detectedStackFileName,
        selectedBlueprintFileName: projectDetection.detectedBlueprintFileName,
      });

      assert.equal(uiScopeSignals.isUiScopeLikely, true);
      assert.ok(Array.isArray(uiScopeSignals.workspaceUiEntries));
      assert.ok(uiScopeSignals.workspaceUiEntries.some((workspaceUiEntry) => workspaceUiEntry.relativePath === 'apps/web'));
      assert.equal(uiScopeSignals.packageManifest?.name, '@workspace/web');
      assert.equal(uiScopeSignals.frontendEvidenceMetrics?.hardcodedColorCount >= 2, true);
      assert.equal(uiScopeSignals.frontendEvidenceMetrics?.propDrillingCandidateCount >= 1, true);
      assert.equal(uiScopeSignals.frontendEvidenceMetrics?.structuredClassAttributeCount >= 1, true);
      assert.equal(uiScopeSignals.frontendEvidenceMetrics?.inlineStyleObjectCount >= 1, true);
      assert.equal(uiScopeSignals.designEvidenceSummary.summaryVersion, 'v1');
      assert.ok(uiScopeSignals.designEvidenceSummary.componentInventory.surfaceFileSamples.some((filePath) => filePath.endsWith('src/App.tsx')));
      assert.equal(uiScopeSignals.designEvidenceSummary.structuredInspection.classAttributeCount >= 1, true);
      assert.equal(uiScopeSignals.designEvidenceSummary.structuredInspection.inlineStyleObjectCount >= 1, true);
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
}
