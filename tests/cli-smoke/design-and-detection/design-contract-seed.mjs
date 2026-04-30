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
      assert.match(bootstrapDesignPrompt, /Do not anchor the final design language to famous products, benchmark visuals, or external reference surfaces/);
      assert.match(bootstrapDesignPrompt, /Token Architecture and Alias Strategy/);
      assert.match(bootstrapDesignPrompt, /Responsive Strategy and Cross-Viewport Adaptation Matrix/);
      assert.match(bootstrapDesignPrompt, /tokenSystem/);
      assert.match(bootstrapDesignPrompt, /colorTruth/);
      assert.match(bootstrapDesignPrompt, /crossViewportAdaptation/);
      assert.match(bootstrapDesignPrompt, /motionSystem/);
      assert.match(bootstrapDesignPrompt, /componentMorphology/);
      assert.match(bootstrapDesignPrompt, /accessibilityPolicy/);
      assert.match(bootstrapDesignPrompt, /designExecutionPolicy/);
      assert.match(bootstrapDesignPrompt, /designExecutionHandoff/);
      assert.match(bootstrapDesignPrompt, /reviewRubric/);
      assert.match(bootstrapDesignPrompt, /contextHygiene/);
      assert.match(bootstrapDesignPrompt, /Design continuity is opt-in\./);
      assert.match(bootstrapDesignPrompt, /zero-based redesign/i);
      assert.match(bootstrapDesignPrompt, /visualResetStrategy/);
      assert.match(bootstrapDesignPrompt, /user supplies research files/i);
      assert.match(bootstrapDesignPrompt, /candidate evidence/i);
      assert.match(bootstrapDesignPrompt, /activate the Dynamic Avant-Garde Anchor Engine before coding/i);
      assert.match(bootstrapDesignPrompt, /output only the chosen anchor/i);
      assert.match(bootstrapDesignPrompt, /Dynamic Avant-Garde Anchor Engine/i);
      assert.match(bootstrapDesignPrompt, /Token Derivation Audit/i);
      assert.match(bootstrapDesignPrompt, /Library Research Protocol/i);
      assert.match(bootstrapDesignPrompt, /old design docs do not count as research/i);
      assert.match(bootstrapDesignPrompt, /discard the two safest or most predictable options/i);
      assert.match(bootstrapDesignPrompt, /reduced-motion fallbacks instead of suppressing motion/i);
      assert.match(bootstrapDesignPrompt, /WCAG 2\.2 AA/);
      assert.match(bootstrapDesignPrompt, /APCA/);
      assert.match(bootstrapDesignPrompt, /AI-safe UI/);
      assert.match(bootstrapDesignPrompt, /Creative Ambition Floor/);
      assert.match(bootstrapDesignPrompt, /AI color audit/i);
      assert.match(bootstrapDesignPrompt, /motion, 3D, canvas, WebGL/i);
      assert.match(bootstrapDesignPrompt, /visually exploratory, product-derived palettes/);
      assert.match(bootstrapDesignPrompt, /decorative grid wallpaper/);
      assert.match(bootstrapDesignPrompt, /representation-first/i);
      assert.match(bootstrapDesignPrompt, /Refine this scaffold seed instead of discarding it\./);
      assert.match(bootstrapDesignPrompt, /replace all placeholder expressive direction with agent-chosen decisions grounded in repo evidence/i);

      const designIntentSeed = readJson(join(uiScaffoldingTargetDirectory, 'docs', 'design-intent.json'));
      assert.equal(designIntentSeed.mode, 'dynamic');
      assert.equal(designIntentSeed.designPhilosophy.length > 0, true);
      assert.equal(designIntentSeed.seedPolicy.mode, 'structure-first-scaffold');
      assert.equal(designIntentSeed.seedPolicy.requiresProjectSpecificRefinement, true);
      assert.equal(designIntentSeed.visualDirection.seedMode, 'scaffold-only');
      assert.equal(designIntentSeed.visualDirection.requiresProjectSpecificSynthesis, true);
      assert.equal(designIntentSeed.externalResearchIntake.userSuppliedResearchPolicy, 'read-as-candidate-evidence-not-final-prescription');
      assert.equal(designIntentSeed.externalResearchIntake.requireOfficialDocsVerificationForTechnologyClaims, true);
      assert.ok(designIntentSeed.externalResearchIntake.candidateDomains.includes('motion-and-scroll'));
      assert.equal(designIntentSeed.conceptualAnchor.mode, 'required-when-no-external-research');
      assert.equal(designIntentSeed.conceptualAnchor.userResearchAbsencePolicy.scaffoldSeedDoesNotCountAsResearch, true);
      assert.equal(designIntentSeed.conceptualAnchor.userResearchAbsencePolicy.requireAgentLedResearchWhenAvailable, true);
      assert.equal(designIntentSeed.conceptualAnchor.candidateSelectionPolicy.considerAtLeast, 3);
      assert.equal(designIntentSeed.conceptualAnchor.candidateSelectionPolicy.discardObviousCandidateCount, 2);
      assert.equal(designIntentSeed.conceptualAnchor.candidateSelectionPolicy.minimumCandidateDistance, 'high');
      assert.equal(designIntentSeed.conceptualAnchor.candidateSelectionPolicy.preferDistinctiveOverSafe, true);
      assert.equal(designIntentSeed.conceptualAnchor.candidateSelectionPolicy.doNotRevealHiddenCandidateList, true);
      assert.equal(designIntentSeed.conceptualAnchor.anchorReference, 'agent-defined-anchor-reference');
      assert.equal(designIntentSeed.conceptualAnchor.creativeCommitmentPolicy.requiredBeforeComplianceReview, true);
      assert.ok(designIntentSeed.conceptualAnchor.creativeCommitmentPolicy.requiredCommitmentFields.includes('signatureMotion'));
      assert.ok(designIntentSeed.conceptualAnchor.forbiddenFinalAnchorTerms.includes('dashboard'));
      assert.ok(designIntentSeed.conceptualAnchor.forbiddenFinalAnchorTerms.includes('safe-admin-layout'));
      assert.ok(designIntentSeed.conceptualAnchor.sourceDomains.includes('cinematic-spatial-interface'));
      assert.equal(designIntentSeed.conceptualAnchor.visualRiskBudget.allowRichMotionAndMicroInteraction, true);
      assert.equal(designIntentSeed.conceptualAnchor.visualRiskBudget.rejectTimidDefaultWhenAnchorSupportsExpressiveUi, true);
      assert.ok(designIntentSeed.conceptualAnchor.requiredDerivedAxes.includes('responsive-composition'));
      assert.ok(designIntentSeed.conceptualAnchor.finalAnchorContract.requiredFields.includes('anchorReference'));
      assert.ok(designIntentSeed.conceptualAnchor.finalAnchorContract.requiredFields.includes('specificReferencePoint'));
      assert.ok(designIntentSeed.conceptualAnchor.finalAnchorContract.requiredFields.includes('motionRiskBudget'));
      assert.equal(designIntentSeed.derivedTokenLogic.anchorReference, designIntentSeed.conceptualAnchor.anchorReference);
      assert.equal(typeof designIntentSeed.derivedTokenLogic.colorDerivationSource, 'string');
      assert.equal(designIntentSeed.derivedTokenLogic.validationRule.includes('anchorReference'), true);
      assert.equal(designIntentSeed.aiSafeUiAudit.status, 'agent-must-complete-before-ui-implementation');
      assert.equal(designIntentSeed.aiSafeUiAudit.blockingByDefault, true);
      assert.equal(designIntentSeed.aiSafeUiAudit.requiredProductSpecificSignals.length >= 3, true);
      assert.match(designIntentSeed.aiSafeUiAudit.interchangeabilityTest, /renamed/);
      assert.match(designIntentSeed.aiSafeUiAudit.paletteExplorationRule, /visually exploratory/);
      assert.match(designIntentSeed.aiSafeUiAudit.backgroundPatternRule, /product function/);
      assert.equal(designIntentSeed.aiSafeUiAudit.aiColorAudit.status, 'agent-must-complete-before-ui-implementation');
      assert.ok(designIntentSeed.aiSafeUiAudit.aiColorAudit.autopilotRisks.includes('cyber-neon-terminal-default'));
      assert.ok(designIntentSeed.aiSafeUiAudit.aiColorAudit.requiredEvidence.includes('product-specific-color-behavior-that-would-not-transfer'));
      assert.equal(designIntentSeed.aiSafeUiAudit.motionSpatialCourageAudit.status, 'agent-must-complete-before-ui-implementation');
      assert.match(designIntentSeed.aiSafeUiAudit.motionSpatialCourageAudit.defaultStance, /first-class options/);
      assert.ok(designIntentSeed.aiSafeUiAudit.motionSpatialCourageAudit.requiredDecisionFields.includes('spatial-or-3d-fit'));
      assert.equal(designIntentSeed.libraryResearchStatus, 'pending-verification');
      assert.equal(designIntentSeed.libraryDecisions[0].fallbackIfUnavailable.length > 0, true);
      assert.deepEqual(designIntentSeed.tokenSystem.taxonomyOrder, ['primitive', 'semantic', 'component']);
      assert.equal(designIntentSeed.tokenSystem.primitiveColorSpace, 'OKLCH');
      assert.equal(designIntentSeed.tokenSystem.requireSemanticAliases, true);
      assert.equal(designIntentSeed.colorTruth.format, 'OKLCH');
      assert.equal(designIntentSeed.colorTruth.allowHexDerivatives, true);
      assert.equal(designIntentSeed.colorTruth.rolesAreMinimumScaffold, true);
      assert.equal(designIntentSeed.colorTruth.rolesMustBeAgentDefined, true);
      assert.ok(designIntentSeed.colorTruth.paletteRoles.includes('agent-defined-semantic-roles'));
      assert.equal(designIntentSeed.crossViewportAdaptation.adaptByRecomposition, true);
      assert.equal(typeof designIntentSeed.crossViewportAdaptation.mutationRules.mobile, 'string');
      assert.equal(designIntentSeed.motionSystem.allowMeaningfulMotion, true);
      assert.equal(designIntentSeed.motionSystem.seedToneLocked, false);
      assert.equal(designIntentSeed.motionSystem.respectReducedMotion, true);
      assert.equal(designIntentSeed.componentMorphology.requireStateBehaviorMatrix, true);
      assert.equal(designIntentSeed.componentMorphology.seedBehaviorsRequireRefinement, true);
      assert.ok(designIntentSeed.componentMorphology.stateKeys.includes('loading'));
      assert.equal(designIntentSeed.accessibilityPolicy.hardComplianceFloor, 'WCAG-2.2-AA');
      assert.equal(designIntentSeed.accessibilityPolicy.advisoryContrastModel, 'APCA');
      assert.equal(designIntentSeed.accessibilityPolicy.failOnHardViolations, true);
      assert.equal(designIntentSeed.designExecutionPolicy.representationStrategy, 'surface-plan-v1');
      assert.equal(designIntentSeed.designExecutionPolicy.seedRefinementRequiredBeforeUiImplementation, true);
      assert.equal(designIntentSeed.designExecutionPolicy.requireSurfacePlan, true);
      assert.equal(designIntentSeed.designExecutionPolicy.requireComponentGraph, true);
      assert.equal(designIntentSeed.designExecutionPolicy.requireViewportMutationPlan, true);
      assert.equal(designIntentSeed.designExecutionPolicy.requireInteractionStateMatrix, true);
      assert.equal(designIntentSeed.designExecutionPolicy.requireContentPriorityMap, true);
      assert.equal(designIntentSeed.designExecutionPolicy.requireCreativeCommitmentGate, true);
      assert.equal(designIntentSeed.designExecutionPolicy.requireStructuredHandoff, true);
      assert.equal(designIntentSeed.designExecutionPolicy.requirePerSurfaceMutationOps, true);
      assert.equal(designIntentSeed.designExecutionPolicy.forbidUniformSiblingSurfaceTreatment, true);
      assert.equal(designIntentSeed.designExecutionPolicy.zeroBasedRedesignResetsPriorVisualsWhenRequested, true);
      assert.equal(designIntentSeed.designExecutionPolicy.forbidScreenshotDependency, true);
      assert.equal(designIntentSeed.designExecutionPolicy.semanticReviewFocus.length >= 4, true);
      assert.equal(designIntentSeed.designExecutionHandoff.version, 'ui-handoff-v1');
      assert.equal(designIntentSeed.designExecutionHandoff.seedMode, 'structure-first-scaffold');
      assert.equal(designIntentSeed.designExecutionHandoff.requiresTaskSpecificRefinement, true);
      assert.equal(designIntentSeed.designExecutionHandoff.surfacePlan.length >= 1, true);
      assert.equal(designIntentSeed.designExecutionHandoff.componentGraph.nodes.length >= 2, true);
      assert.equal(designIntentSeed.designExecutionHandoff.taskFlowNarrative.length >= 2, true);
      assert.equal(designIntentSeed.designExecutionHandoff.creativeCommitment.status, 'agent-must-complete-before-ui-implementation');
      assert.ok(designIntentSeed.designExecutionHandoff.visualResetStrategy.requiredResetAxes.includes('composition'));
      assert.ok(designIntentSeed.designExecutionHandoff.visualResetStrategy.existingUiForbiddenAs.includes('layout-source'));
      assert.equal(designIntentSeed.designExecutionHandoff.viewportMutationPlan.mobile.primaryOperation.length > 0, true);
      assert.equal(designIntentSeed.designExecutionHandoff.viewportMutationPlan.mobile.requiredSurfaceActions.length >= 2, true);
      assert.equal(designIntentSeed.designExecutionHandoff.viewportMutationPlan.mobile.forbiddenPatterns.length >= 1, true);
      assert.equal(designIntentSeed.designExecutionHandoff.implementationGuardrails.requireBuildFromHandoff, true);
      assert.equal(designIntentSeed.reviewRubric.version, 'ui-rubric-v1');
      assert.equal(designIntentSeed.reviewRubric.genericityAutoFail, true);
      assert.ok(designIntentSeed.reviewRubric.genericitySignals.includes('missing-conceptual-anchor-without-external-research'));
      assert.ok(designIntentSeed.reviewRubric.genericitySignals.includes('zero-based-redesign-kept-prior-visual-dna'));
      assert.ok(designIntentSeed.reviewRubric.genericitySignals.includes('ai-safe-ui-template-look'));
      assert.ok(designIntentSeed.reviewRubric.genericitySignals.includes('ai-color-default-palette-without-product-role-behavior'));
      assert.ok(designIntentSeed.reviewRubric.genericitySignals.includes('motion-or-3d-omitted-from-fear-without-fit-analysis'));
      assert.ok(designIntentSeed.reviewRubric.genericitySignals.includes('decorative-grid-or-glow-wallpaper-without-product-function'));
      assert.ok(designIntentSeed.reviewRubric.validBoldSignals.includes('three-at-a-glance-product-specific-signals'));
      assert.ok(designIntentSeed.reviewRubric.validBoldSignals.includes('motion-or-spatial-experience-derived-from-anchor'));
      assert.equal(designIntentSeed.reviewRubric.dimensions.length >= 5, true);
      assert.equal(designIntentSeed.reviewRubric.reportingRules.mustExplainGenericity, true);
      assert.equal(designIntentSeed.contextHygiene.continuityMode, 'opt-in-only');
      assert.equal(designIntentSeed.contextHygiene.repoEvidenceOverridesMemory, true);
      assert.equal(designIntentSeed.contextHygiene.forbidCarryoverWhenUnapproved, true);
      assert.ok(designIntentSeed.contextHygiene.driftSignals.includes('prior-ui-visual-dna-carried-into-reset-request'));
      assert.ok(designIntentSeed.forbiddenPatterns.includes('visual-decisions-not-derived-from-conceptual-anchor'));
      assert.ok(designIntentSeed.forbiddenPatterns.includes('restyle-instead-of-recomposition'));
      assert.ok(designIntentSeed.forbiddenPatterns.includes('ai-safe-ui-template-look'));
      assert.ok(designIntentSeed.forbiddenPatterns.includes('interchangeable-product-renaming-test-fails'));
      assert.equal(designIntentSeed.implementation.requireViewportMutationRules, true);
      assert.equal(designIntentSeed.implementation.requireMachineReadableContract, true);
      assert.deepEqual(designIntentSeed.implementation.requiredDeliverables, ['docs/DESIGN.md', 'docs/design-intent.json']);
      assert.deepEqual(validateDesignIntentContract(designIntentSeed), []);

      const compiledRulesContent = readFileSync(join(uiScaffoldingTargetDirectory, '.agent-instructions.md'), 'utf8');
      assert.match(compiledRulesContent, /\[UI TASK ANCHOR - READ FIRST\]/);
      assert.match(compiledRulesContent, /Anchor Reference: agent-defined-anchor-reference/);
      assert.match(compiledRulesContent, /docs\/design-intent\.json/);
      assert.match(compiledRulesContent, /Resolve the smallest relevant layer set before responding\./);
      assert.match(compiledRulesContent, /LAYER 1: RULES \(SCOPE-RESOLVED\)/);
      assert.match(compiledRulesContent, /- For UI scope: if docs\/DESIGN\.md or docs\/design-intent\.json is missing, execute bootstrap-design prompt before implementing UI surfaces\./);
      assert.match(compiledRulesContent, /LAYER 5: EXECUTION PROMPTS AND UI TRIGGERS/);
      assert.match(compiledRulesContent, /bootstrap-design\.md -> ui, ux, layout, screen, tailwind, frontend, redesign/);

      const agentsContent = readFileSync(join(uiScaffoldingTargetDirectory, 'AGENTS.md'), 'utf8');
      assert.match(agentsContent, /Critical Bootstrap Floor/);
      assert.match(agentsContent, /bootstrap-design\.md/);
      assert.match(agentsContent, /frontend-architecture\.md/);
      assert.match(agentsContent, /docs\/DESIGN\.md/);
      assert.match(agentsContent, /docs\/design-intent\.json/);
    } finally {
      rmSync(uiScaffoldingTargetDirectory, { recursive: true, force: true });
    }
  });

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
