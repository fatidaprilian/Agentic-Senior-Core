import {
  assert,
  cliPath,
  execSync,
  existsSync,
  join,
  mkdirSync,
  mkdtempSync,
  readJson,
  rmSync,
  tmpdir,
  writeFileSync,
} from '../shared.mjs';
import { validateDesignIntentContract } from '../../../lib/cli/project-scaffolder.mjs';
import { detectProjectContext, detectUiScopeSignals } from '../../../lib/cli/detector.mjs';

export async function registerOptimizationDefaultsSmokeTests(t) {
  await t.test('optimize command enables token optimization policy state', () => {
    const optimizationTargetDirectory = mkdtempSync(join(tmpdir(), 'agentic-senior-core-optimize-'));

    try {
      execSync(
        `node ${cliPath} init ${optimizationTargetDirectory} --profile balanced --stack typescript --blueprint api-nextjs --ci true`
      ).toString();

      const optimizeOutput = execSync(
        `node ${cliPath} optimize ${optimizationTargetDirectory} --agent copilot --enable`
      ).toString();

      assert.match(optimizeOutput, /Token optimization enabled/);
      assert.match(optimizeOutput, /Updated files: \.agent-context\/state\/token-optimization\.json and \.agent-context\/state\/token-optimization-report\.json/);

      const tokenStatePath = join(optimizationTargetDirectory, '.agent-context', 'state', 'token-optimization.json');
      const tokenState = readJson(tokenStatePath);

      assert.equal(tokenState.enabled, true);
      assert.equal(tokenState.selectedAgent, 'copilot');
      assert.ok(Array.isArray(tokenState.commandRewriteMappings));
      assert.ok(tokenState.commandRewriteMappings.length >= 10);
      assert.ok(tokenState.commandRewriteMappings.some((mapping) => {
        return mapping.rawCommand === 'git status' && mapping.optimizedCommand === 'ascx git status';
      }));
      assert.ok(tokenState.commandRewriteMappings.some((mapping) => {
        return mapping.rawCommand === 'git diff' && mapping.optimizedCommand === 'ascx git diff';
      }));
      assert.ok(tokenState.commandRewriteMappings.some((mapping) => {
        return mapping.rawCommand === 'npm test' && mapping.optimizedCommand === 'ascx npm test';
      }));

      assert.equal(existsSync(join(optimizationTargetDirectory, '.agent-instructions.md')), false);

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

      const statusOutput = execSync(
        `node ${cliPath} optimize status ${optimizationTargetDirectory}`
      ).toString();
      assert.match(statusOutput, /Runtime token saver status/);
      assert.match(statusOutput, /initialized: yes/);
      assert.match(statusOutput, /ascx: found/);
      assert.match(statusOutput, /tee: writable/);
      assert.match(statusOutput, /9router: not-checked/);

      const doctorOutput = execSync(
        `node ${cliPath} optimize doctor ${optimizationTargetDirectory}`
      ).toString();
      assert.match(doctorOutput, /ASCX runtime token saver doctor/);
      assert.match(doctorOutput, /ascx: found/);
      assert.match(doctorOutput, /tee: writable/);
      assert.match(doctorOutput, /next_action:/);
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

      assert.equal(existsSync(join(initOptimizationTargetDirectory, '.agent-instructions.md')), false);
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
      assert.match(defaultInitOutput, /Default response mode: Compact Natural Mode enabled/);

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
      assert.ok(defaultTokenState.commandRewriteMappings.some((mapping) => mapping.optimizedCommand === 'ascx git status'));
      assert.ok(defaultTokenState.commandRewriteMappings.some((mapping) => mapping.optimizedCommand === 'ascx git diff'));
      assert.ok(defaultTokenState.commandRewriteMappings.some((mapping) => mapping.optimizedCommand === 'ascx npm test'));
      assert.ok(defaultTokenState.outputFoldingStrategy.preserveAlways.includes('error-message'));
      assert.ok(defaultTokenState.outputFoldingStrategy.safetyBoundary.includes('never hide failing checks'));

      assert.equal(existsSync(join(defaultOptimizationTargetDirectory, '.agent-instructions.md')), false);

      const defaultOnboardingReport = readJson(
        join(defaultOptimizationTargetDirectory, '.agent-context', 'state', 'onboarding-report.json')
      );
      assert.equal(defaultOnboardingReport.memoryContinuity?.enabled, true);
      assert.equal(defaultOnboardingReport.memoryContinuity?.activeSnapshotFile, '.agent-context/state/active-memory.json');
      assert.equal(defaultOnboardingReport.tokenOptimization?.enabled, true);
      assert.equal(defaultOnboardingReport.responseCompression?.enabled, true);
      assert.equal(defaultOnboardingReport.responseCompression?.mode, 'compact-natural-mode');
      assert.equal(defaultOnboardingReport.responseCompression?.defaultOn, true);
      assert.equal(defaultOnboardingReport.responseCompression?.promptFile, '.agent-context/prompts/compact-natural-mode.md');
      assert.equal(existsSync(join(defaultOptimizationTargetDirectory, '.agent-context', 'prompts', 'compact-natural-mode.md')), true);

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

      assert.equal(existsSync(join(optOutOptimizationTargetDirectory, '.agent-instructions.md')), false);

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
