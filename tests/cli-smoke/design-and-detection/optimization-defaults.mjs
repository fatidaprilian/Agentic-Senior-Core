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

export async function registerOptimizationDefaultsSmokeTests(t) {
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

      const tokenRulesContent = readFileSync(join(optimizationTargetDirectory, '.agent-instructions.md'), 'utf8');
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

      const initCompiledRulesContent = readFileSync(join(initOptimizationTargetDirectory, '.agent-instructions.md'), 'utf8');
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

      assert.match(defaultInitOutput, /Project memory continuity metadata enabled/);
      assert.match(defaultInitOutput, /Token optimization policy enabled for agent/);

      const defaultMemoryState = readJson(
        join(defaultOptimizationTargetDirectory, '.agent-context', 'state', 'memory-continuity.json')
      );
      assert.equal(defaultMemoryState.enabled, true);
      assert.equal(defaultMemoryState.hydrationMode, 'progressive-disclosure');
      assert.ok(Array.isArray(defaultMemoryState.adapters));
      assert.ok(defaultMemoryState.adapters.length >= 3);

      const defaultActiveMemoryState = readJson(
        join(defaultOptimizationTargetDirectory, '.agent-context', 'state', 'active-memory.json')
      );
      assert.equal(defaultActiveMemoryState.schemaVersion, 'active-memory-v1');
      assert.equal(defaultActiveMemoryState.snapshotPurpose, 'compact-cross-session-continuity');
      assert.equal(defaultActiveMemoryState.privacy.storeSecrets, false);

      const defaultTokenState = readJson(
        join(defaultOptimizationTargetDirectory, '.agent-context', 'state', 'token-optimization.json')
      );
      assert.equal(defaultTokenState.enabled, true);
      assert.equal(defaultTokenState.outputFoldingStrategy?.mode, 'compact-high-signal-output');
      assert.ok(defaultTokenState.outputFoldingStrategy.preserveAlways.includes('error-message'));
      assert.ok(defaultTokenState.outputFoldingStrategy.safetyBoundary.includes('never hide failing checks'));

      const defaultCompiledRules = readFileSync(join(defaultOptimizationTargetDirectory, '.agent-instructions.md'), 'utf8');
      assert.match(defaultCompiledRules, /MEMORY CONTINUITY PROFILE/);
      assert.match(defaultCompiledRules, /active-memory\.json/);
      assert.match(defaultCompiledRules, /Refresh `?\.agent-context\/state\/active-memory\.json`? directly at natural task boundaries/);
      assert.match(defaultCompiledRules, /Before the final response, update `project\.currentFocus`/);
      assert.match(defaultCompiledRules, /TOKEN OPTIMIZATION PROFILE/);
      assert.match(defaultCompiledRules, /Output folding policy/);

      const defaultOnboardingReport = readJson(
        join(defaultOptimizationTargetDirectory, '.agent-context', 'state', 'onboarding-report.json')
      );
      assert.equal(defaultOnboardingReport.memoryContinuity?.enabled, true);
      assert.equal(defaultOnboardingReport.memoryContinuity?.activeSnapshotFile, '.agent-context/state/active-memory.json');
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

      const optOutActiveMemoryStatePath = join(
        optOutOptimizationTargetDirectory,
        '.agent-context',
        'state',
        'active-memory.json'
      );
      assert.equal(existsSync(optOutActiveMemoryStatePath), false);

      const optOutTokenStatePath = join(
        optOutOptimizationTargetDirectory,
        '.agent-context',
        'state',
        'token-optimization.json'
      );
      assert.equal(existsSync(optOutTokenStatePath), false);

      const optOutCompiledRules = readFileSync(join(optOutOptimizationTargetDirectory, '.agent-instructions.md'), 'utf8');
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
