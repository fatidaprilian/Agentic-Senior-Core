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

export async function registerDesignContractSeedSmokeTests(t) {

  await t.test('init scaffolds a dynamic UI design contract for fullstack fresh projects', () => {
    const fullstackScaffoldingTargetDirectory = mkdtempSync(join(tmpdir(), 'agentic-senior-core-scaffold-fullstack-'));

    try {
      const projectConfigPath = join(fullstackScaffoldingTargetDirectory, 'project-config.yml');
      writeFileSync(projectConfigPath, [
        'projectName: Atlas Control',
        'projectDescription: Fullstack operations console with authenticated workflows',
        'primaryDomain: Fullstack product',
        'databaseChoice: SQL (PostgreSQL, MySQL, SQLite)',
        'authStrategy: JWT (stateless token auth)',
        'dockerStrategy: Docker for development only',
        'docsLang: en',
        'features:',
        '- Authenticated dashboard',
        '- Admin API',
        '- Operational reporting',
      ].join('\n'));

      const initOutput = execSync(
        `node ${cliPath} init ${fullstackScaffoldingTargetDirectory} --profile balanced --stack typescript --blueprint api-nextjs --ci true --project-config ${projectConfigPath} --no-token-optimize --no-memory-continuity`
      ).toString();

      assert.match(initOutput, /Seed docs: 1 files generated in docs\//);
      assert.match(initOutput, /If docs\/DESIGN\.md or docs\/design-intent\.json is missing, execute \.agent-context\/prompts\/bootstrap-design\.md now before building UI components\./);

      const bootstrapProjectPrompt = readFileSync(
        join(fullstackScaffoldingTargetDirectory, '.agent-context', 'prompts', 'bootstrap-project-context.md'),
        'utf8'
      );
      assert.match(bootstrapProjectPrompt, /^1\. README\.md$/m);
      assert.match(bootstrapProjectPrompt, /docs\/api-contract\.md/);
      assert.match(bootstrapProjectPrompt, /docs\/DESIGN\.md/);
      assert.match(bootstrapProjectPrompt, /docs\/design-intent\.json/);

      const designIntentSeed = readJson(join(fullstackScaffoldingTargetDirectory, 'docs', 'design-intent.json'));
      assert.equal(designIntentSeed.mode, 'dynamic');
      assert.equal(designIntentSeed.project.domain, 'Fullstack product');
      assert.deepEqual(designIntentSeed.implementation.requiredDeliverables, ['docs/DESIGN.md', 'docs/design-intent.json']);

      const onboardingReport = readJson(
        join(fullstackScaffoldingTargetDirectory, '.agent-context', 'state', 'onboarding-report.json')
      );
      assert.equal(onboardingReport.projectScope.key, 'both');
      assert.equal(onboardingReport.projectScope.label, 'Both (frontend + backend)');
    } finally {
      rmSync(fullstackScaffoldingTargetDirectory, { recursive: true, force: true });
    }
  });
}
