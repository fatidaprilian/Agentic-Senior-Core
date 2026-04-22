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
  await t.test('validator checks override governance', () => {
    const validationOutput = execSync(`node ${join(process.cwd(), 'scripts', 'validate.mjs')}`).toString();
    assert.match(validationOutput, /RESULTS/);
    assert.match(validationOutput, /Checking override governance/);
    assert.match(validationOutput, /Checking terminology mapping consistency/);
    assert.match(validationOutput, /Checking existing-project detection transparency coverage/);
    assert.match(validationOutput, /docs\/terminology-mapping\.md includes Dual-Term Mapping section/);
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

    const frontendRuleContent = readFileSync(
      join(process.cwd(), '.agent-context', 'rules', 'frontend-architecture.md'),
      'utf8'
    );
    const bootstrapDesignPromptContent = readFileSync(
      join(process.cwd(), '.agent-context', 'prompts', 'bootstrap-design.md'),
      'utf8'
    );
    const instructionsContent = readFileSync(join(process.cwd(), '.instructions.md'), 'utf8');
    const prChecklistContent = readFileSync(
      join(process.cwd(), '.agent-context', 'review-checklists', 'pr-checklist.md'),
      'utf8'
    );
    const architectureChecklistContent = readFileSync(
      join(process.cwd(), '.agent-context', 'review-checklists', 'architecture-review.md'),
      'utf8'
    );
    const designEvidenceExtractorContent = readFileSync(
      join(process.cwd(), 'lib', 'cli', 'detector', 'design-evidence.mjs'),
      'utf8'
    );
    const compilerContent = readFileSync(join(process.cwd(), 'lib', 'cli', 'compiler.mjs'), 'utf8');

    assert.equal(auditReport.auditName, 'frontend-usability-audit');
    assert.equal(auditReport.passed, true);
    assert.equal(auditReport.failureCount, 0);
    assert.ok(Array.isArray(auditReport.failures));
    assert.equal(auditReport.phase2DesignEvidenceCoverage?.extractorIncludesSummaryVersion, true);
    assert.equal(auditReport.phase2DesignEvidenceCoverage?.extractorIncludesCssVariables, true);
    assert.equal(auditReport.phase2DesignEvidenceCoverage?.extractorIncludesComponentInventory, true);
    assert.equal(auditReport.phase2DesignEvidenceCoverage?.extractorIncludesTokenBypassSignals, true);
    assert.equal(auditReport.phase2DesignEvidenceCoverage?.compilerProjectsFrontendEvidenceMetrics, true);
    assert.equal(auditReport.phase2DesignEvidenceCoverage?.compilerProjectsDesignEvidenceSummary, true);
    assert.match(frontendRuleContent, /Frontend Designer Mode \(Auto Activation\)/);
    assert.match(frontendRuleContent, /UI scope trigger signals/);
    assert.match(frontendRuleContent, /template-only repetitive outputs/);
    assert.match(frontendRuleContent, /UI Consistency Guardrails \(Mandatory\)/);
    assert.match(frontendRuleContent, /Content language must stay consistent per screen and flow unless user requests multilingual output\./);
    assert.match(frontendRuleContent, /Text color must remain contrast-safe against its background; no color collisions\./);
    assert.match(frontendRuleContent, /Responsive quality requires layout mutation and task reprioritization across breakpoints\. Shrinking the desktop layout is not enough\./);
    assert.match(bootstrapDesignPromptContent, /UI Design Mode is context-isolated by default:/);
    assert.match(bootstrapDesignPromptContent, /Cross-Viewport Adaptation Matrix/);
    assert.match(instructionsContent, /UI Design Mode/);
    assert.match(instructionsContent, /do not eagerly load unrelated backend-only rules/);
    assert.match(prChecklistContent, /### 15\. Universal SOP Consolidation/);
    assert.match(prChecklistContent, /### 2\. Architecture/);
    assert.match(architectureChecklistContent, /## Backend Universal Principles/);
    assert.match(architectureChecklistContent, /No clever hacks in backend and shared core modules/);
    assert.match(designEvidenceExtractorContent, /summaryVersion/);
    assert.match(designEvidenceExtractorContent, /cssVariables/);
    assert.match(designEvidenceExtractorContent, /componentInventory/);
    assert.match(designEvidenceExtractorContent, /tokenBypassSignals/);
    assert.match(compilerContent, /frontendEvidenceMetrics/);
    assert.match(compilerContent, /designEvidenceSummary/);
  });

  await t.test('backend universal principles governance snippets are present', () => {
    const architectureRuleContent = readFileSync(
      join(process.cwd(), '.agent-context', 'rules', 'architecture.md'),
      'utf8'
    );
    const prChecklistContent = readFileSync(
      join(process.cwd(), '.agent-context', 'review-checklists', 'pr-checklist.md'),
      'utf8'
    );
    const refactorPromptContent = readFileSync(
      join(process.cwd(), '.agent-context', 'prompts', 'refactor.md'),
      'utf8'
    );

    assert.match(architectureRuleContent, /No clever hacks\./);
    assert.match(architectureRuleContent, /No premature abstraction\./);
    assert.match(architectureRuleContent, /Readability over brevity\./);
    assert.match(architectureRuleContent, /docs\/project-brief\.md/);
    assert.match(architectureRuleContent, /docs\/flow-overview\.md/);
    assert.match(architectureRuleContent, /Do not create generic placeholder templates\./);
    assert.match(architectureRuleContent, /Assumptions to Validate/);
    assert.match(prChecklistContent, /No clever hacks in backend and shared core modules/);
    assert.match(prChecklistContent, /No premature abstraction/);
    assert.match(prChecklistContent, /Readability over brevity for maintainability/);
    assert.match(refactorPromptContent, /Prioritize maintainability over compressed one-liners\./);
  });

  await t.test('documentation boundary audit outputs machine-readable report', () => {
    const documentationAuditOutput = execSync(
      `node ${join(process.cwd(), 'scripts', 'documentation-boundary-audit.mjs')}`
    ).toString();
    const documentationAuditReport = JSON.parse(documentationAuditOutput);

    const apiDocsRuleContent = readFileSync(
      join(process.cwd(), '.agent-context', 'rules', 'api-docs.md'),
      'utf8'
    );
    const prChecklistContent = readFileSync(
      join(process.cwd(), '.agent-context', 'review-checklists', 'pr-checklist.md'),
      'utf8'
    );

    assert.equal(documentationAuditReport.auditName, 'documentation-boundary-audit');
    assert.equal(typeof documentationAuditReport.reportVersion, 'string');
    assert.equal(documentationAuditReport.passed, true);
    assert.equal(typeof documentationAuditReport.source, 'string');
    assert.ok(Array.isArray(documentationAuditReport.boundaryResults));
    assert.ok(Array.isArray(documentationAuditReport.violations));
    assert.equal(documentationAuditReport.autoDocsSyncScope?.phase, 'phase-1');
    assert.equal(documentationAuditReport.autoDocsSyncScope?.bounded, true);
    assert.deepEqual(
      documentationAuditReport.autoDocsSyncScope?.explicitBoundaries,
      ['public-surface', 'api-contract', 'database-structure']
    );
    assert.equal(typeof documentationAuditReport.rolloutMetrics?.precision, 'number');
    assert.equal(typeof documentationAuditReport.rolloutMetrics?.recall, 'number');
    assert.equal(typeof documentationAuditReport.rolloutMetrics?.measuredAt, 'string');
    const boundaryResultWithGuidance = documentationAuditReport.boundaryResults.find(
      (boundaryResult) => Array.isArray(boundaryResult.expectedDocumentationPaths)
        && Array.isArray(boundaryResult.suggestedActions)
    );
    assert.ok(boundaryResultWithGuidance);
    assert.match(apiDocsRuleContent, /Documentation as Hard Rule \(Boundary-Aware\)/);
    assert.match(prChecklistContent, /Public surface changes fail review if documentation updates are missing or stale in the same scope/);
    assert.match(prChecklistContent, /Documentation checks stay boundary-aware and only enforce touched scopes/);
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

  await t.test('rules guardian audit enforces session handoff summary and explicit direction-change confirmation', () => {
    const rulesGuardianAuditOutput = execSync(
      `node ${join(process.cwd(), 'scripts', 'rules-guardian-audit.mjs')}`
    ).toString();
    const rulesGuardianAuditReport = JSON.parse(rulesGuardianAuditOutput);

    assert.equal(rulesGuardianAuditReport.auditName, 'rules-guardian-audit');
    assert.equal(rulesGuardianAuditReport.passed, true);
    assert.equal(rulesGuardianAuditReport.sessionHandoff?.included, true);
    assert.equal(typeof rulesGuardianAuditReport.sessionHandoff?.contractSummary, 'string');
    assert.match(rulesGuardianAuditReport.sessionHandoff?.contractSummary, /stack=/);

    const activeStack = rulesGuardianAuditReport.sessionHandoff?.activeArchitectureContract?.stack;
    const proposedDifferentStack = activeStack === 'python.md' ? 'go.md' : 'python.md';

    try {
      execSync(
        `node ${join(process.cwd(), 'scripts', 'rules-guardian-audit.mjs')} --workflow direction-change --proposed-stack ${proposedDifferentStack}`
      );
      assert.fail('Expected rules guardian audit to fail when direction change is not explicitly confirmed');
    } catch (error) {
      const failedAuditOutput = error && typeof error === 'object' && 'stdout' in error
        ? String(error.stdout ?? '')
        : '';
      const failedAuditReport = JSON.parse(failedAuditOutput);

      assert.equal(failedAuditReport.passed, false);
      assert.equal(failedAuditReport.driftDetection?.driftDetected, true);
      assert.match(failedAuditReport.failures.join(' '), /Direction change detected without explicit user confirmation/);
    }

    const confirmedRulesGuardianAuditOutput = execSync(
      `node ${join(process.cwd(), 'scripts', 'rules-guardian-audit.mjs')} --workflow direction-change --proposed-stack ${proposedDifferentStack} --confirm-direction-change`
    ).toString();
    const confirmedRulesGuardianAuditReport = JSON.parse(confirmedRulesGuardianAuditOutput);

    assert.equal(confirmedRulesGuardianAuditReport.passed, true);
    assert.equal(confirmedRulesGuardianAuditReport.driftDetection?.driftDetected, true);
    assert.equal(confirmedRulesGuardianAuditReport.confirmationPolicy?.confirmationProvided, true);
  });

  await t.test('explain-on-demand audit keeps default output compact and gates diagnostic internals', () => {
    const defaultExplainAuditOutput = execSync(
      `node ${join(process.cwd(), 'scripts', 'explain-on-demand-audit.mjs')} --mode default`
    ).toString();
    const defaultExplainAuditReport = JSON.parse(defaultExplainAuditOutput);

    assert.equal(defaultExplainAuditReport.auditName, 'explain-on-demand-audit');
    assert.equal(defaultExplainAuditReport.mode, 'default');
    assert.equal(defaultExplainAuditReport.passed, true);
    assert.equal(defaultExplainAuditReport.responsePolicy?.defaultModeExposesStateInternals, false);
    assert.equal(defaultExplainAuditReport.defaultResponse?.containsStateInternals, false);
    assert.equal(defaultExplainAuditReport.responsePolicy?.diagnosticRequiresExplicitRequest, true);
    assert.equal(defaultExplainAuditReport.diagnosticMode?.canExplainStateDecisions, true);

    try {
      execSync(`node ${join(process.cwd(), 'scripts', 'explain-on-demand-audit.mjs')} --mode diagnostic`);
      assert.fail('Expected explain-on-demand audit to fail when diagnostic mode is requested without explicit state request');
    } catch (error) {
      const failedAuditOutput = error && typeof error === 'object' && 'stdout' in error
        ? String(error.stdout ?? '')
        : '';
      const failedAuditReport = JSON.parse(failedAuditOutput);

      assert.equal(failedAuditReport.passed, false);
      assert.match(failedAuditReport.failures.join(' '), /Diagnostic mode requested without explicit state request/);
    }

    const diagnosticExplainAuditOutput = execSync(
      `node ${join(process.cwd(), 'scripts', 'explain-on-demand-audit.mjs')} --mode diagnostic --state-debug`
    ).toString();
    const diagnosticExplainAuditReport = JSON.parse(diagnosticExplainAuditOutput);

    assert.equal(diagnosticExplainAuditReport.mode, 'diagnostic');
    assert.equal(diagnosticExplainAuditReport.passed, true);
    assert.equal(diagnosticExplainAuditReport.responsePolicy?.explicitStateRequestReceived, true);
    assert.equal(diagnosticExplainAuditReport.diagnosticMode?.canExplainStateDecisions, true);
    assert.ok(Array.isArray(diagnosticExplainAuditReport.diagnosticMode?.stateDecisionExplanations));
    assert.ok(diagnosticExplainAuditReport.diagnosticMode?.stateDecisionExplanations.length >= 1);
  });

  await t.test('single-source lazy-loading audit enforces canonical source and scoped stack guidance', () => {
    const singleSourceLazyAuditOutput = execSync(
      `node ${join(process.cwd(), 'scripts', 'single-source-lazy-loading-audit.mjs')} --workflow pr-preparation`
    ).toString();
    const singleSourceLazyAuditReport = JSON.parse(singleSourceLazyAuditOutput);

    const architectureRuleContent = readFileSync(
      join(process.cwd(), '.agent-context', 'rules', 'architecture.md'),
      'utf8'
    );
    const prChecklistContent = readFileSync(
      join(process.cwd(), '.agent-context', 'review-checklists', 'pr-checklist.md'),
      'utf8'
    );
    const reviewPromptContent = readFileSync(
      join(process.cwd(), '.agent-context', 'prompts', 'review-code.md'),
      'utf8'
    );
    const compilerContent = readFileSync(join(process.cwd(), 'lib', 'cli', 'compiler.mjs'), 'utf8');

    assert.equal(singleSourceLazyAuditReport.auditName, 'single-source-lazy-loading-audit');
    assert.equal(singleSourceLazyAuditReport.passed, true);
    assert.equal(singleSourceLazyAuditReport.canonicalSource?.enforced, true);
    assert.equal(singleSourceLazyAuditReport.lazyRuleLoading?.enforced, true);
    assert.equal(singleSourceLazyAuditReport.duplicationPolicy?.noConflictingDuplicates, true);

    assert.match(architectureRuleContent, /Single Source of Truth and Lazy Rule Loading/);
    assert.match(prChecklistContent, /Canonical rule source is explicitly defined and enforced/);
    assert.match(reviewPromptContent, /single-source and lazy-loading policy/);
    assert.match(compilerContent, /LAYER 2 POLICY: LAZY RULE LOADING/);
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
    writeFileSync(join(preflightTargetDirectory, '.cursorrules'), 'Conflict');

    try {
      execSync(`node ${cliPath} init ${preflightTargetDirectory} --preset frontend-web`);
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
    const rulesPath = join(rollbackTargetDirectory, '.cursorrules');
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
          '.cursorrules': { action: 'restore', hash },
          '.windsurfrules': { action: 'delete' },
        },
      };
      writeFileSync(join(backupRoot, 'manifest.json'), JSON.stringify(manifest));

      writeFileSync(rulesPath, 'Corrupted Content');
      writeFileSync(join(rollbackTargetDirectory, '.windsurfrules'), 'Should Be Deleted');

      execSync(`node ${cliPath} rollback ${rollbackTargetDirectory}`);

      const restoredContent = readFileSync(rulesPath, 'utf8');
      assert.equal(restoredContent, 'Initial Rules Content');
      assert.equal(existsSync(join(rollbackTargetDirectory, '.windsurfrules')), false);
    } finally {
      rmSync(rollbackTargetDirectory, { recursive: true, force: true });
    }
  });
}
