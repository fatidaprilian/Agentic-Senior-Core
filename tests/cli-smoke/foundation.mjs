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
import { runProjectDiscovery } from '../../lib/cli/project-scaffolder.mjs';
import {
  resolveProjectScopeKeyFromLabel,
  normalizeAdditionalStackSelection,
  normalizeAdditionalBlueprintSelection,
  normalizeRuntimeEnvironmentKey,
} from '../../lib/cli/commands/init.mjs';

export async function registerCliSmokeFoundationTests(t) {
  await t.test('published package surface includes compact native instruction surface', () => {
    const packageJson = readJson(join(process.cwd(), 'package.json'));
    assert.equal(Array.isArray(packageJson.files), true);
    assert.equal(packageJson.files.includes('AGENTS.md'), true);
    assert.equal(packageJson.files.includes('CLAUDE.md'), true);
    assert.equal(packageJson.files.includes('GEMINI.md'), true);
    assert.equal(packageJson.files.includes('.agent-context/rules/'), true);
    assert.equal(packageJson.files.includes('.instructions.md'), false);
    assert.equal(packageJson.files.includes('.cursor/'), false);
    assert.equal(packageJson.files.includes('.windsurf/'), false);
    assert.equal(packageJson.files.includes('.github/'), false);
    assert.equal(packageJson.files.includes('.gemini/'), false);
    assert.equal(packageJson.files.includes('.agents/'), false);
    assert.equal(packageJson.files.includes('.cursorrules'), false);
    assert.equal(packageJson.files.includes('.windsurfrules'), false);
  });

  await t.test('shows help', () => {
    const output = execSync(`node ${cliPath} --help`).toString();
    assert.match(output, /Usage:/);
    assert.match(output, /init/);
    assert.doesNotMatch(output, /--profile-pack/);
    assert.match(output, /--no-memory-continuity/);
    assert.match(output, /context "<request>"/);
    assert.match(output, /--file/);

    assert.match(output, /quality checks \(guardrails\)/i);
    assert.match(output, /frontend-ui/);
  });

  await t.test('context command emits adaptive manifest JSON', () => {
    const contextOutput = execSync(
      `node ${cliPath} context "tolong refactor auth flow, cek security dan test" --request-id smoke-auth-refactor --file src/app/login/page.tsx --json`
    ).toString();
    const manifest = JSON.parse(contextOutput);

    assert.equal(manifest.schemaVersion, 'adaptive-context-manifest-v1');
    assert.equal(manifest.requestId, 'smoke-auth-refactor');
    assert.ok(manifest.labels.includes('SEC'));
    assert.ok(manifest.labels.includes('ARCH'));
    assert.ok(manifest.labels.includes('TEST'));
    assert.ok(manifest.labels.includes('FE'));
    assert.deepEqual(manifest.contextFiles, ['src/app/login/page.tsx']);
    assert.ok(manifest.selectedRules.includes('.agent-context/rules/security.md'));
    assert.equal(manifest.fallbackRequired, false);
  });

  await t.test('launch command shows numbered startup choices', () => {
    const launchOutput = execSync(`node ${cliPath} launch`, { input: '5\n' }).toString();
    assert.match(launchOutput, /How do you want to start\?/);
    assert.match(launchOutput, /1\. npm \/ npx path/);
    assert.match(launchOutput, /Exit selected\./);
  });

  await t.test('project discovery falls back to defaults when concise answers are empty', async () => {
    const queuedAnswers = ['', '', '', '1', '1', '1', '1', '1', ''];
    const mockUserInterface = {
      async question() {
        return queuedAnswers.shift() ?? '';
      },
    };

    const discoveryAnswers = await runProjectDiscovery(mockUserInterface, {
      defaultProjectName: 'AutomatedLicensePlateReaders',
      defaultProjectDescription: 'Incident review dashboard for plate-reader workflows',
    });

    assert.equal(discoveryAnswers.projectName, 'AutomatedLicensePlateReaders');
    assert.equal(discoveryAnswers.projectDescription, 'Incident review dashboard for plate-reader workflows');
    assert.equal(discoveryAnswers.architectureStyle, 'Agent recommendation required from current brief, repo evidence, and live official docs');
    assert.equal(discoveryAnswers.includeCiGuardrails, true);
    assert.deepEqual(discoveryAnswers.features, []);
  });

  await t.test('init scope mapping remains deterministic without choosing stack', () => {
    assert.equal(resolveProjectScopeKeyFromLabel('Frontend only'), 'frontend-only');
    assert.equal(resolveProjectScopeKeyFromLabel('Unknown scope label'), 'both');
  });

  await t.test('init records existing project runtime evidence without applying detected stack', () => {
    const existingProjectTargetDirectory = mkdtempSync(join(tmpdir(), 'agentic-senior-core-existing-stack-detect-'));

    try {
      writeFileSync(
        join(existingProjectTargetDirectory, 'package.json'),
        JSON.stringify({ name: 'polyglot-web', version: '1.0.0' }, null, 2)
      );
      writeFileSync(join(existingProjectTargetDirectory, 'tsconfig.json'), '{"compilerOptions":{}}\n');
      writeFileSync(
        join(existingProjectTargetDirectory, 'pyproject.toml'),
        '[project]\nname = "polyglot-web"\nversion = "1.0.0"\n'
      );

      const initOutput = execSync(
        `node ${cliPath} init ${existingProjectTargetDirectory} --profile balanced --ci true --no-scaffold-docs --no-token-optimize`
      ).toString();

      assert.match(initOutput, /Existing project detection transparency:/);
      assert.match(initOutput, /Active rules baseline: canonical AGENTS\.md \+ \.agent-context\/ lazy rule library/);
      assert.match(initOutput, /Runtime decision: agent recommendation required from current repo\/brief evidence/);
      assert.match(initOutput, /Architecture decision: agent recommendation required from current repo\/brief evidence/);

      const onboardingReportPath = join(existingProjectTargetDirectory, '.agent-context', 'state', 'onboarding-report.json');
      const onboardingReport = readJson(onboardingReportPath);

      assert.equal(onboardingReport.selectedStack, null);
      assert.equal(onboardingReport.runtimeDecision.mode, 'agent-decision-required');
      assert.equal(onboardingReport.runtimeDecision.detectedStackEvidence, 'python.md');
      assert.ok(Array.isArray(onboardingReport.selectedAdditionalStacks));
      assert.deepEqual(onboardingReport.selectedAdditionalStacks, []);
      assert.ok(onboardingReport.autoDetection.detectedAdditionalStacks.includes('typescript.md'));
      assert.ok(Array.isArray(onboardingReport.selectedAdditionalBlueprints));
      assert.deepEqual(onboardingReport.selectedAdditionalBlueprints, []);
      assert.equal(onboardingReport.autoDetection?.detectionTransparency?.declarationType, 'existing-project');
      assert.equal(onboardingReport.autoDetection?.detectionTransparency?.quickConfirmation?.response, 'evidence-only');
      assert.equal(onboardingReport.autoDetection?.detectionTransparency?.decision?.mode, 'existing-project-evidence-only');
      assert.equal(onboardingReport.autoDetection?.detectionTransparency?.decision?.selectedStackFileName, 'agent-decision-runtime.md');

      const installedAgentsContent = readFileSync(join(existingProjectTargetDirectory, 'AGENTS.md'), 'utf8');
      assert.match(installedAgentsContent, /Runtime signals are evidence gates/i);
      assert.match(installedAgentsContent, /agentic-senior-core context/);
      assert.match(installedAgentsContent, /Structural planning signals are not a hard whitelist/i);
      assert.match(installedAgentsContent, /\.agent-context\/rules\//);
      assert.equal(readFileSync(join(existingProjectTargetDirectory, 'CLAUDE.md'), 'utf8').trim(), '@AGENTS.md');
      assert.equal(readFileSync(join(existingProjectTargetDirectory, 'GEMINI.md'), 'utf8').trim(), '@AGENTS.md');
      assert.equal(existsSync(join(existingProjectTargetDirectory, '.agent-instructions.md')), false);
      assert.equal(existsSync(join(existingProjectTargetDirectory, '.cursorrules')), false);
    } finally {
      rmSync(existingProjectTargetDirectory, { recursive: true, force: true });
    }
  });

  await t.test('init additional stack normalization removes primary and duplicates', () => {
    const normalizedAdditionalStacks = normalizeAdditionalStackSelection('python.md', [
      'typescript.md',
      'python.md',
      'typescript.md',
      'go.md',
    ]);

    assert.deepEqual(normalizedAdditionalStacks, ['typescript.md', 'go.md']);
  });

  await t.test('init additional blueprint normalization removes primary and duplicates', () => {
    const normalizedAdditionalBlueprints = normalizeAdditionalBlueprintSelection('fastapi-service.md', [
      'api-nextjs.md',
      'fastapi-service.md',
      'api-nextjs.md',
      'nestjs-logic.md',
    ]);

    assert.deepEqual(normalizedAdditionalBlueprints, ['api-nextjs.md', 'nestjs-logic.md']);
  });

  await t.test('init runtime environment normalization accepts supported keys', () => {
    assert.equal(normalizeRuntimeEnvironmentKey('linux-wsl'), 'linux-wsl');
    assert.equal(normalizeRuntimeEnvironmentKey('Windows'), 'windows');
    assert.equal(normalizeRuntimeEnvironmentKey('auto'), 'auto');
    assert.equal(normalizeRuntimeEnvironmentKey('unsupported-env'), null);
  });

  await t.test('initializes with a scope hint preset without selecting stack', () => {
    const presetTargetDirectory = mkdtempSync(join(tmpdir(), 'agentic-senior-core-preset-'));

    try {
      const presetOutput = execSync(`node ${cliPath} init ${presetTargetDirectory} --preset frontend-ui`).toString();

      assert.match(presetOutput, /Using preset: frontend-ui/);

      const presetReportPath = join(presetTargetDirectory, '.agent-context', 'state', 'onboarding-report.json');
      const presetReport = readJson(presetReportPath);

      assert.equal(presetReport.selectedPreset, 'frontend-ui');
      assert.equal(presetReport.selectedProfile, 'balanced');
      assert.equal(presetReport.selectedStack, null);
      assert.equal(presetReport.selectedBlueprint, null);
      assert.equal(presetReport.runtimeDecision.mode, 'agent-decision-required');
      assert.equal(presetReport.architectureDecision.mode, 'agent-decision-required');
    } finally {
      rmSync(presetTargetDirectory, { recursive: true, force: true });
    }
  });

  await t.test('init copies compact instruction surface and keeps MCP templates opt-in', () => {
    const optOutMcpTargetDirectory = mkdtempSync(join(tmpdir(), 'agentic-senior-core-init-workflow-optout-mcp-'));
    const mcpTemplateTargetDirectory = mkdtempSync(join(tmpdir(), 'agentic-senior-core-init-workflow-mcp-'));

    try {
      execSync(
        `node ${cliPath} init ${optOutMcpTargetDirectory} --profile balanced --stack typescript --blueprint api-nextjs --ci true --no-token-optimize --no-mcp-template`
      ).toString();

      assert.equal(existsSync(join(optOutMcpTargetDirectory, '.github', 'workflows', 'release-gate.yml')), false);
      assert.equal(existsSync(join(optOutMcpTargetDirectory, 'AGENTS.md')), true);
      assert.equal(existsSync(join(optOutMcpTargetDirectory, 'CLAUDE.md')), true);
      assert.equal(existsSync(join(optOutMcpTargetDirectory, 'GEMINI.md')), true);
      assert.equal(readFileSync(join(optOutMcpTargetDirectory, 'CLAUDE.md'), 'utf8').trim(), '@AGENTS.md');
      assert.equal(readFileSync(join(optOutMcpTargetDirectory, 'GEMINI.md'), 'utf8').trim(), '@AGENTS.md');
      assert.equal(existsSync(join(optOutMcpTargetDirectory, '.instructions.md')), false);
      assert.equal(existsSync(join(optOutMcpTargetDirectory, '.agent-instructions.md')), false);
      assert.equal(existsSync(join(optOutMcpTargetDirectory, '.cursor', 'rules', 'agentic-senior-core.mdc')), false);
      assert.equal(existsSync(join(optOutMcpTargetDirectory, '.windsurf', 'rules', 'agentic-senior-core.md')), false);
      assert.equal(existsSync(join(optOutMcpTargetDirectory, '.github', 'copilot-instructions.md')), false);
      assert.equal(existsSync(join(optOutMcpTargetDirectory, '.github', 'instructions', 'agentic-senior-core.instructions.md')), false);
      assert.equal(existsSync(join(optOutMcpTargetDirectory, '.gemini', 'instructions.md')), false);
      assert.equal(existsSync(join(optOutMcpTargetDirectory, '.vscode', 'mcp.json')), false);

      execSync(
        `node ${cliPath} init ${mcpTemplateTargetDirectory} --profile balanced --stack typescript --blueprint api-nextjs --ci true --no-token-optimize --mcp-template`
      ).toString();

      assert.equal(existsSync(join(mcpTemplateTargetDirectory, 'AGENTS.md')), true);
      assert.equal(existsSync(join(mcpTemplateTargetDirectory, '.instructions.md')), false);
      assert.equal(existsSync(join(mcpTemplateTargetDirectory, 'mcp.json')), false);
      assert.equal(existsSync(join(mcpTemplateTargetDirectory, '.vscode', 'mcp.json')), true);
      assert.equal(existsSync(join(mcpTemplateTargetDirectory, 'scripts', 'mcp-server.mjs')), true);
      assert.equal(existsSync(join(mcpTemplateTargetDirectory, 'scripts', 'mcp-server', 'constants.mjs')), true);
      assert.equal(existsSync(join(mcpTemplateTargetDirectory, 'scripts', 'mcp-server', 'tool-registry.mjs')), true);
      assert.equal(existsSync(join(mcpTemplateTargetDirectory, 'scripts', 'mcp-server', 'tools.mjs')), true);

      const workspaceMcpConfig = readJson(join(mcpTemplateTargetDirectory, '.vscode', 'mcp.json'));

      assert.equal(Object.prototype.hasOwnProperty.call(workspaceMcpConfig, '$schema'), false);
      assert.equal(workspaceMcpConfig.servers?.['agentic-senior-core']?.command, 'node');
      assert.equal(workspaceMcpConfig.servers?.['agentic-senior-core']?.cwd, '${workspaceFolder}');
      assert.deepEqual(workspaceMcpConfig.servers?.['agentic-senior-core']?.args, ['./scripts/mcp-server.mjs']);
    } finally {
      rmSync(optOutMcpTargetDirectory, { recursive: true, force: true });
      rmSync(mcpTemplateTargetDirectory, { recursive: true, force: true });
    }
  });

  await t.test('initializes beginner and strict profiles non-interactively', () => {
    const beginnerTargetDirectory = mkdtempSync(join(tmpdir(), 'agentic-senior-core-beginner-'));
    const strictTargetDirectory = mkdtempSync(join(tmpdir(), 'agentic-senior-core-strict-'));

    try {
      const beginnerOutput = execSync(
        `node ${cliPath} init ${beginnerTargetDirectory} --profile beginner --stack typescript --blueprint api-nextjs --ci true`
      ).toString();
      assert.match(beginnerOutput, /Review thresholds: critical/);

      const strictOutput = execSync(
        `node ${cliPath} init ${strictTargetDirectory} --profile strict --stack go --blueprint go-service --ci true`
      ).toString();
      assert.match(strictOutput, /Review thresholds: critical, high, medium/);

      const beginnerReportPath = join(beginnerTargetDirectory, '.agent-context', 'state', 'onboarding-report.json');
      const beginnerReport = readJson(beginnerReportPath);
      assert.equal(beginnerReport.selectedProfile, 'beginner');

      const strictReportPath = join(strictTargetDirectory, '.agent-context', 'state', 'onboarding-report.json');
      const strictReport = readJson(strictReportPath);
      assert.equal(strictReport.selectedProfile, 'strict');
      assert.equal(strictReport.selectedStack, 'go.md');
      assert.equal(strictReport.selectedBlueprint, 'go-service.md');
      assert.equal(strictReport.operationMode, 'init');
    } finally {
      rmSync(beginnerTargetDirectory, { recursive: true, force: true });
      rmSync(strictTargetDirectory, { recursive: true, force: true });
    }
  });

  await t.test('init uses default review thresholds by default', () => {
    const defaultThresholdTargetDirectory = mkdtempSync(join(tmpdir(), 'agentic-senior-core-default-thresholds-'));

    try {
      const defaultThresholdOutput = execSync(
        `node ${cliPath} init ${defaultThresholdTargetDirectory} --stack typescript --blueprint api-nextjs --ci true --no-scaffold-docs --no-token-optimize`
      ).toString();

      assert.match(defaultThresholdOutput, /Review thresholds: critical, high/);
      assert.doesNotMatch(defaultThresholdOutput, /Golden Standard mode enabled/);
      assert.doesNotMatch(defaultThresholdOutput, /Profile: /);

      const onboardingReportPath = join(defaultThresholdTargetDirectory, '.agent-context', 'state', 'onboarding-report.json');
      const onboardingReport = readJson(onboardingReportPath);

      assert.equal(onboardingReport.selectedProfile, 'balanced');
      assert.equal(onboardingReport.selectedStack, 'typescript.md');
      assert.equal(onboardingReport.selectedBlueprint, 'api-nextjs.md');
    } finally {
      rmSync(defaultThresholdTargetDirectory, { recursive: true, force: true });
    }
  });

  await t.test('fresh non-interactive init uses agent decision placeholders instead of stack interview', () => {
    const streamlinedTargetDirectory = mkdtempSync(join(tmpdir(), 'agentic-senior-core-streamlined-init-'));

    try {
      const initOutput = execSync(
        `node ${cliPath} init ${streamlinedTargetDirectory} --no-token-optimize --no-memory-continuity`
      ).toString();
      assert.match(initOutput, /Runtime decision: agent recommendation required from current repo\/brief evidence/);
      assert.match(initOutput, /Architecture decision: agent recommendation required from current repo\/brief evidence/);
      assert.doesNotMatch(initOutput, /project-description-first/);
      assert.doesNotMatch(initOutput, /This is a fresh project\. Want me to scaffold project documentation/);
      assert.doesNotMatch(initOutput, /Apply this architecture/);
    } finally {
      rmSync(streamlinedTargetDirectory, { recursive: true, force: true });
    }
  });

  await t.test('non-interactive fresh init records agent runtime recommendation requirement', () => {
    const architectTargetDirectory = mkdtempSync(join(tmpdir(), 'agentic-senior-core-architect-'));

    try {
      const initOutput = execSync(
        `node ${cliPath} init ${architectTargetDirectory} --project-description "Machine learning API for image classification and model serving" --ci true --no-scaffold-docs --no-token-optimize --no-memory-continuity`
      ).toString();
      assert.match(initOutput, /Runtime decision: agent recommendation required from current repo\/brief evidence/);
      const onboardingReport = readJson(join(architectTargetDirectory, '.agent-context', 'state', 'onboarding-report.json'));
      assert.equal(onboardingReport.runtimeDecision.mode, 'agent-decision-required');
    } finally {
      rmSync(architectTargetDirectory, { recursive: true, force: true });
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
      assert.match(upgradeOutput, /Running managed guidance upgrade for an existing repository\./);
      assert.match(upgradeOutput, /CI\/CD quality checks \(guardrails\): enabled/);
      assert.match(upgradeOutput, /Dry run enabled/);
    } finally {
      rmSync(upgradeTargetDirectory, { recursive: true, force: true });
    }
  });

  await t.test('upgrade dry-run reports stale managed files without deleting them', () => {
    const upgradeTargetDirectory = mkdtempSync(join(tmpdir(), 'agentic-senior-core-upgrade-dry-stale-'));

    try {
      execSync(
        `node ${cliPath} init ${upgradeTargetDirectory} --profile balanced --stack typescript --blueprint api-nextjs --ci true`
      ).toString();

      const staleManagedDirectory = join(upgradeTargetDirectory, '.agent-context', 'legacy-upgrade-test');
      const staleManagedFilePath = join(staleManagedDirectory, 'obsolete.md');
      mkdirSync(staleManagedDirectory, { recursive: true });
      writeFileSync(staleManagedFilePath, '# Obsolete managed file\n');

      const upgradeOutput = execSync(`node ${cliPath} upgrade ${upgradeTargetDirectory} --dry-run`).toString();
      assert.match(upgradeOutput, /Managed surface stale files: 1/);
      assert.equal(existsSync(staleManagedFilePath), true);
    } finally {
      rmSync(upgradeTargetDirectory, { recursive: true, force: true });
    }
  });

  await t.test('upgrade prunes stale managed files by default', () => {
    const upgradeTargetDirectory = mkdtempSync(join(tmpdir(), 'agentic-senior-core-upgrade-prune-'));

    try {
      execSync(
        `node ${cliPath} init ${upgradeTargetDirectory} --profile balanced --stack typescript --blueprint api-nextjs --ci true`
      ).toString();

      const staleManagedDirectory = join(upgradeTargetDirectory, '.agent-context', 'legacy-upgrade-test');
      const staleManagedFilePath = join(staleManagedDirectory, 'obsolete.md');
      mkdirSync(staleManagedDirectory, { recursive: true });
      writeFileSync(staleManagedFilePath, '# Obsolete managed file\n');

      const upgradeOutput = execSync(`node ${cliPath} upgrade ${upgradeTargetDirectory} --yes`).toString();
      assert.match(upgradeOutput, /Governance surface sync: 1:1/);
      assert.match(upgradeOutput, /1 deleted/);
      assert.equal(existsSync(staleManagedFilePath), false);
      assert.equal(existsSync(staleManagedDirectory), false);
    } finally {
      rmSync(upgradeTargetDirectory, { recursive: true, force: true });
    }
  });

  await t.test('upgrade ensures local backup artifacts are ignored', () => {
    const upgradeTargetDirectory = mkdtempSync(join(tmpdir(), 'agentic-senior-core-upgrade-backup-ignore-'));

    try {
      execSync(
        `node ${cliPath} init ${upgradeTargetDirectory} --profile balanced --stack typescript --blueprint api-nextjs --ci true`
      ).toString();

      writeFileSync(join(upgradeTargetDirectory, '.gitignore'), 'node_modules/\n');

      const upgradeOutput = execSync(`node ${cliPath} upgrade ${upgradeTargetDirectory} --yes`).toString();
      assert.match(upgradeOutput, /Local backup artifacts ignored in \.gitignore \(\.agentic-backup\/\)\./);

      const gitignoreContent = readFileSync(join(upgradeTargetDirectory, '.gitignore'), 'utf8');
      assert.match(gitignoreContent, /^\.agentic-backup\/$/m);
      assert.equal((gitignoreContent.match(/\.agentic-backup\//g) || []).length, 1);
    } finally {
      rmSync(upgradeTargetDirectory, { recursive: true, force: true });
    }
  });

  await t.test('upgrade refreshes compact instruction bridges and prunes managed legacy adapters', () => {
    const upgradeTargetDirectory = mkdtempSync(join(tmpdir(), 'agentic-senior-core-upgrade-compiled-surface-'));

    try {
      execSync(
        `node ${cliPath} init ${upgradeTargetDirectory} --profile balanced --stack typescript --blueprint api-nextjs --ci true`
      ).toString();

      writeFileSync(join(upgradeTargetDirectory, 'CLAUDE.md'), 'Agentic-Senior-Core stale bridge\n');
      writeFileSync(join(upgradeTargetDirectory, 'GEMINI.md'), 'Agentic-Senior-Core stale bridge\n');
      writeFileSync(join(upgradeTargetDirectory, '.instructions.md'), 'Agentic-Senior-Core stale canonical snapshot');
      writeFileSync(join(upgradeTargetDirectory, '.agent-instructions.md'), 'STALE compiled snapshot\nAgentic-Senior-Core');
      writeFileSync(join(upgradeTargetDirectory, '.cursorrules'), 'Generated by Agentic-Senior-Core CLI v0.0.0\nSTALE cursorrules');
      writeFileSync(join(upgradeTargetDirectory, '.windsurfrules'), 'Generated by Agentic-Senior-Core CLI v0.0.0\nSTALE windsurfrules');
      writeFileSync(join(upgradeTargetDirectory, '.clauderc'), 'Generated by Agentic-Senior-Core CLI v0.0.0\nSTALE clauderc');
      mkdirSync(join(upgradeTargetDirectory, '.gemini'), { recursive: true });
      mkdirSync(join(upgradeTargetDirectory, '.github', 'instructions'), { recursive: true });
      mkdirSync(join(upgradeTargetDirectory, '.cursor', 'rules'), { recursive: true });
      mkdirSync(join(upgradeTargetDirectory, '.windsurf', 'rules'), { recursive: true });
      writeFileSync(join(upgradeTargetDirectory, '.gemini', 'instructions.md'), 'Adapter Mode: thin\nAgentic-Senior-Core\nSTALE gemini');
      writeFileSync(join(upgradeTargetDirectory, '.github', 'copilot-instructions.md'), 'Adapter Mode: thin\nAgentic-Senior-Core\nSTALE copilot');
      writeFileSync(join(upgradeTargetDirectory, '.github', 'instructions', 'agentic-senior-core.instructions.md'), 'Adapter Mode: thin\nAgentic-Senior-Core\nSTALE github instructions');
      writeFileSync(join(upgradeTargetDirectory, '.cursor', 'rules', 'agentic-senior-core.mdc'), 'Adapter Mode: thin\nAgentic-Senior-Core\nSTALE cursor');
      writeFileSync(join(upgradeTargetDirectory, '.windsurf', 'rules', 'agentic-senior-core.md'), 'Adapter Mode: thin\nAgentic-Senior-Core\nSTALE windsurf');
      const activeMemoryPath = join(upgradeTargetDirectory, '.agent-context', 'state', 'active-memory.json');
      const activeMemoryState = readJson(activeMemoryPath);
      activeMemoryState.project.currentFocus = 'Preserve this active task across upgrade.';
      writeFileSync(activeMemoryPath, `${JSON.stringify(activeMemoryState, null, 2)}\n`);

      const upgradeOutput = execSync(`node ${cliPath} upgrade ${upgradeTargetDirectory} --yes`).toString();
      assert.match(upgradeOutput, /Refreshed files: AGENTS\.md, CLAUDE\.md, GEMINI\.md, \.agent-context\/, and \.agent-context\/state\/onboarding-report\.json/);

      assert.equal(readFileSync(join(upgradeTargetDirectory, 'CLAUDE.md'), 'utf8').trim(), '@AGENTS.md');
      assert.equal(readFileSync(join(upgradeTargetDirectory, 'GEMINI.md'), 'utf8').trim(), '@AGENTS.md');
      assert.equal(existsSync(join(upgradeTargetDirectory, '.instructions.md')), false);
      assert.equal(existsSync(join(upgradeTargetDirectory, '.agent-instructions.md')), false);
      assert.equal(existsSync(join(upgradeTargetDirectory, '.cursorrules')), false);
      assert.equal(existsSync(join(upgradeTargetDirectory, '.windsurfrules')), false);
      assert.equal(existsSync(join(upgradeTargetDirectory, '.clauderc')), false);
      assert.equal(existsSync(join(upgradeTargetDirectory, '.gemini', 'instructions.md')), false);
      assert.equal(existsSync(join(upgradeTargetDirectory, '.github', 'copilot-instructions.md')), false);
      assert.equal(existsSync(join(upgradeTargetDirectory, '.github', 'instructions', 'agentic-senior-core.instructions.md')), false);
      assert.equal(existsSync(join(upgradeTargetDirectory, '.cursor', 'rules', 'agentic-senior-core.mdc')), false);
      assert.equal(existsSync(join(upgradeTargetDirectory, '.windsurf', 'rules', 'agentic-senior-core.md')), false);
      assert.equal(
        readJson(activeMemoryPath).project.currentFocus,
        'Preserve this active task across upgrade.'
      );
    } finally {
      rmSync(upgradeTargetDirectory, { recursive: true, force: true });
    }
  });

  await t.test('upgrade preserves user-owned instruction entrypoints', () => {
    const upgradeTargetDirectory = mkdtempSync(join(tmpdir(), 'agentic-senior-core-upgrade-user-owned-rules-'));

    try {
      execSync(
        `node ${cliPath} init ${upgradeTargetDirectory} --profile balanced --stack typescript --blueprint api-nextjs --ci true`
      ).toString();

      const userOwnedFiles = new Map([
        ['.instructions.md', '# Team instructions\n\nKeep this local policy intact.\n'],
        ['AGENTS.md', '# Team agents\n\nDo not replace this file.\n'],
        ['CLAUDE.md', '# Team Claude memory\n\nImport local team workflow.\n'],
        ['GEMINI.md', '# Team Gemini context\n\nUse the internal runbook.\n'],
        ['.cursorrules', '# Team Cursor rules\n\nPreserve existing Cursor workflow.\n'],
        ['.windsurfrules', '# Team Windsurf rules\n\nPreserve existing Windsurf workflow.\n'],
        ['.clauderc', '# Team Claude legacy rules\n\nPreserve legacy Claude workflow.\n'],
        ['.gemini/instructions.md', '# Team Gemini instructions\n\nPreserve workspace context file.\n'],
        ['.github/copilot-instructions.md', '# Team Copilot instructions\n\nPreserve review policy.\n'],
      ]);

      for (const [relativeFilePath, fileContent] of userOwnedFiles) {
        const relativePathSegments = relativeFilePath.split('/');
        if (relativePathSegments.length > 1) {
          mkdirSync(join(upgradeTargetDirectory, ...relativePathSegments.slice(0, -1)), { recursive: true });
        }
        writeFileSync(join(upgradeTargetDirectory, ...relativeFilePath.split('/')), fileContent);
      }

      const upgradeOutput = execSync(`node ${cliPath} upgrade ${upgradeTargetDirectory} --yes`).toString();
      assert.match(upgradeOutput, /User-owned instruction entrypoints preserved: 3/);

      for (const [relativeFilePath, fileContent] of userOwnedFiles) {
        assert.equal(
          readFileSync(join(upgradeTargetDirectory, ...relativeFilePath.split('/')), 'utf8'),
          fileContent,
          `${relativeFilePath} should not be overwritten`
        );
      }

      assert.equal(readFileSync(join(upgradeTargetDirectory, 'AGENTS.md'), 'utf8'), userOwnedFiles.get('AGENTS.md'));
    } finally {
      rmSync(upgradeTargetDirectory, { recursive: true, force: true });
    }
  });

  await t.test('upgrade seeds active memory when continuity snapshot is missing', () => {
    const upgradeTargetDirectory = mkdtempSync(join(tmpdir(), 'agentic-senior-core-upgrade-active-memory-'));

    try {
      execSync(
        `node ${cliPath} init ${upgradeTargetDirectory} --profile balanced --stack typescript --blueprint api-nextjs --ci true`
      ).toString();

      const activeMemoryPath = join(upgradeTargetDirectory, '.agent-context', 'state', 'active-memory.json');
      rmSync(activeMemoryPath, { force: true });

      const upgradeOutput = execSync(`node ${cliPath} upgrade ${upgradeTargetDirectory} --yes`).toString();
      assert.match(upgradeOutput, /\.agent-context\/state\/active-memory\.json \(seed\)/);
      assert.equal(readJson(activeMemoryPath).schemaVersion, 'active-memory-v1');
    } finally {
      rmSync(upgradeTargetDirectory, { recursive: true, force: true });
    }
  });

  await t.test('upgrade restores MCP helper modules when MCP template is enabled', () => {
    const upgradeTargetDirectory = mkdtempSync(join(tmpdir(), 'agentic-senior-core-upgrade-mcp-helpers-'));

    try {
      execSync(
        `node ${cliPath} init ${upgradeTargetDirectory} --profile balanced --stack typescript --blueprint api-nextjs --ci true --mcp-template`
      ).toString();

      rmSync(join(upgradeTargetDirectory, 'scripts', 'mcp-server'), { recursive: true, force: true });
      assert.equal(existsSync(join(upgradeTargetDirectory, 'scripts', 'mcp-server', 'tool-registry.mjs')), false);

      const upgradeOutput = execSync(`node ${cliPath} upgrade ${upgradeTargetDirectory} --yes --mcp-template`).toString();

      assert.match(upgradeOutput, /scripts\/mcp-server\/tool-registry\.mjs/);
      assert.equal(existsSync(join(upgradeTargetDirectory, 'scripts', 'mcp-server.mjs')), true);
      assert.equal(existsSync(join(upgradeTargetDirectory, 'scripts', 'mcp-server', 'constants.mjs')), true);
      assert.equal(existsSync(join(upgradeTargetDirectory, 'scripts', 'mcp-server', 'tool-registry.mjs')), true);
      assert.equal(existsSync(join(upgradeTargetDirectory, 'scripts', 'mcp-server', 'tools.mjs')), true);
    } finally {
      rmSync(upgradeTargetDirectory, { recursive: true, force: true });
    }
  });

  await t.test('init generates AI bootstrap prompts in English by default and keeps Layer 9 bootstrap flow reachable', () => {
    const scaffoldingTargetDirectory = mkdtempSync(join(tmpdir(), 'agentic-senior-core-scaffold-config-'));

    try {
      const projectConfigPath = join(scaffoldingTargetDirectory, 'project-config.yml');
      writeFileSync(projectConfigPath, [
        'projectName: Nusantara API',
        'projectDescription: Internal service for transaction processing',
        'architectureStyle: Microservice / distributed system',
        'primaryDomain: API service',
        'databaseChoice: SQL (PostgreSQL, MySQL, SQLite)',
        'authStrategy: JWT (stateless token auth)',
        'dockerStrategy: Docker for both development and production',
        'docsLang: id',
        'features:',
        '- Manajemen pengguna',
        '- Laporan transaksi',
        'additionalContext: Digunakan tim operasional internal.',
      ].join('\n'));

      const initOutput = execSync(
        `node ${cliPath} init ${scaffoldingTargetDirectory} --profile balanced --stack typescript --blueprint api-nextjs --ci true --project-config ${projectConfigPath} --no-token-optimize`
      ).toString();

      assert.match(initOutput, /Bootstrap prompts: 1 files generated in \.agent-context\/prompts\//);
      assert.match(initOutput, /Bootstrap docs language: en/);
      assert.match(initOutput, /Prompt starter examples \(copy and adapt in your IDE\):/);
      assert.match(initOutput, /If docs\/project-brief\.md is missing, execute \.agent-context\/prompts\/bootstrap-project-context\.md now/);

      const bootstrapProjectContextPrompt = readFileSync(
        join(scaffoldingTargetDirectory, '.agent-context', 'prompts', 'bootstrap-project-context.md'),
        'utf8'
      );
      assert.match(bootstrapProjectContextPrompt, /Dynamic Project Context Synthesis/);
      assert.match(bootstrapProjectContextPrompt, /Create or update these files in EN language/);
      assert.match(bootstrapProjectContextPrompt, /^1\. README\.md$/m);
      assert.match(bootstrapProjectContextPrompt, /^2\. docs\/doc-index\.md$/m);
      assert.match(bootstrapProjectContextPrompt, /Project name: Nusantara API/);
      assert.match(bootstrapProjectContextPrompt, /Project topology decision: Microservice \/ distributed system/);
      assert.match(bootstrapProjectContextPrompt, /No copy-paste from external prose/);
      assert.match(bootstrapProjectContextPrompt, /If runtime or framework setup is unresolved, recommend the latest stable compatible option from the brief, constraints, and live official documentation before coding/);
      assert.match(bootstrapProjectContextPrompt, /For any ecosystem or technology claim, perform live web research and include citation metadata \(source \+ fetchedAt timestamp\) rather than relying on offline heuristics\./);
      assert.match(bootstrapProjectContextPrompt, /Write for native English speakers at an 8th-grade reading level\./);
      assert.match(bootstrapProjectContextPrompt, /README\.md must be public and developer friendly/);
      assert.match(bootstrapProjectContextPrompt, /docs\/doc-index\.md is the low-token routing map for docs\/\*/);
      assert.match(bootstrapProjectContextPrompt, /Add SRS, PRD, technical-design, or ERD docs only when project evidence triggers them/);
      assert.match(bootstrapProjectContextPrompt, /Assumptions to Validate/);
      assert.match(bootstrapProjectContextPrompt, /Next Validation Action/);
      assert.match(bootstrapProjectContextPrompt, /Do not invent modules or architecture layers only to make the docs look complete\./);
      assert.match(bootstrapProjectContextPrompt, /Docker Execution Gate/);
      assert.match(bootstrapProjectContextPrompt, /Selected Docker strategy: Docker for both development and production/);
      assert.match(bootstrapProjectContextPrompt, /Materialize Docker assets from the actual stack/);
      assert.match(bootstrapProjectContextPrompt, /compose\.yaml for development/);
      assert.match(bootstrapProjectContextPrompt, /compose\.prod\.yaml or a documented production Compose override/);
      assert.match(bootstrapProjectContextPrompt, /\.dockerignore/);
      assert.match(bootstrapProjectContextPrompt, /do not execute Docker build, Compose, or registry commands/);

      const installedAgentsContent = readFileSync(join(scaffoldingTargetDirectory, 'AGENTS.md'), 'utf8');
      assert.match(installedAgentsContent, /Layer 9: Project Context/);
      assert.match(installedAgentsContent, /Use root `README\.md` as the public and developer entrypoint/);
      assert.match(installedAgentsContent, /Use `docs\/doc-index\.md` as the compact routing map/);
      assert.match(installedAgentsContent, /docs\/project-brief\.md/);
      assert.match(installedAgentsContent, /docs\/flow-overview\.md/);
      assert.match(installedAgentsContent, /Create or refine required docs first/);
      assert.equal(existsSync(join(scaffoldingTargetDirectory, '.agent-instructions.md')), false);

      const upgradePreviewOutput = execSync(`node ${cliPath} upgrade ${scaffoldingTargetDirectory} --dry-run`).toString();
      assert.doesNotMatch(upgradePreviewOutput, /Some project docs were generated from older template versions/);

      const onboardingReport = readJson(
        join(scaffoldingTargetDirectory, '.agent-context', 'state', 'onboarding-report.json')
      );
      assert.equal(onboardingReport.projectTopology, 'Microservice / distributed system');
      assert.equal(onboardingReport.containerizationStrategy.selected, 'Docker for both development and production');
      assert.equal(onboardingReport.containerizationStrategy.developmentRequired, true);
      assert.equal(onboardingReport.containerizationStrategy.productionRequired, true);
      assert.equal(onboardingReport.containerizationStrategy.materializationRequired, true);
      assert.equal(onboardingReport.containerizationStrategy.requiredRuleFile, '.agent-context/rules/docker-runtime.md');
    } finally {
      rmSync(scaffoldingTargetDirectory, { recursive: true, force: true });
    }
  });
}
