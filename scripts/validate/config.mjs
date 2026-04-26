export const ALLOWED_SEVERITIES = new Set(['critical', 'high', 'medium', 'low']);
export const OVERRIDE_WARNING_WINDOW_DAYS = 30;
export const THIN_ADAPTER_PATHS = [
  'AGENTS.md',
  '.github/copilot-instructions.md',
  '.gemini/instructions.md',
];
export const FORMAL_ARTIFACT_PATHS = [
  '.instructions.md',
  'README.md',
  'CHANGELOG.md',
  'docs/deep_analysis_and_roadmap_backlog.md',
  '.agent-context/rules/api-docs.md',
  '.agent-context/review-checklists/pr-checklist.md',
  '.agent-context/prompts/review-code.md',
  'AGENTS.md',
  '.github/copilot-instructions.md',
  '.gemini/instructions.md',
];
export const REQUIRED_HUMAN_WRITING_SNIPPETS = [
  {
    path: '.agent-context/rules/api-docs.md',
    snippets: [
      '## Human Writing Standard (Mandatory)',
      'This applies to documentation, release notes, onboarding text, review summaries, and agent-facing explanations.',
      'Style baseline findings are advisory by default and must not block endpoint-change commits that already include accurate docs/spec updates.',
      'No emoji in formal artifacts.',
    ],
  },
  {
    path: '.agent-context/review-checklists/pr-checklist.md',
    snippets: [
      'Scope applied: This applies to documentation, release notes, onboarding text, review summaries, and agent-facing explanations',
      'Style scope review is advisory and does not block merge when API docs are synced in the same commit and contract details are correct',
      'No emoji in formal documentation or review summaries',
      'Documentation uses plain English and avoids AI cliches',
    ],
  },
  {
    path: 'docs/deep_analysis_and_roadmap_backlog.md',
    snippets: [
      '## Part 6: Documentation and Explanation Standards (Mandatory)',
      'This applies to documentation, release notes, onboarding text, review summaries, and agent-facing explanations.',
      'No emoji in formal artifacts. This is mandatory.',
    ],
  },
];
export const TERMINOLOGY_REFERENCE_PATHS = [
  'README.md',
  'docs/roadmap.md',
];
export const REQUIRED_TERMINOLOGY_ROW_PATTERNS = [
  {
    label: 'Federated Governance -> Federated Rules Operations',
    pattern: /\|\s*Federated Governance\s*\|\s*Federated Rules Operations\s*\|/u,
  },
  {
    label: 'Governance Engine -> Rules Engine',
    pattern: /\|\s*Governance Engine\s*\|\s*Rules Engine\s*\|/u,
  },
  {
    label: 'Guardrails -> Quality Checks',
    pattern: /\|\s*Guardrails\s*\|\s*Quality Checks\s*\|/u,
  },
];
export const REQUIRED_TERMINOLOGY_RULE_SNIPPET =
  'Rule: on first mention in developer-facing docs, include canonical term in parentheses.';
export const TERMINOLOGY_REFERENCE_DOCUMENT_PATH = 'docs/terminology-mapping.md';
export const REQUIRED_DEVELOPER_FIRST_MENTION_PATTERNS = [
  {
    path: 'README.md',
    label: 'Rules Engine first mention includes Governance Engine',
    pattern: /Rules Engine\s*\(Governance Engine\)/u,
  },
  {
    path: 'docs/deep-dive.md',
    label: 'Dynamic Rules Engine first mention includes Governance Engine',
    pattern: /Dynamic Rules Engine\s*\(Governance Engine\)/u,
  },
  {
    path: 'docs/faq.md',
    label: 'Quality Checks first mention includes Guardrails',
    pattern: /Quality Checks\s*\(Guardrails\)/u,
  },
  {
    path: '.agent-context/prompts/init-project.md',
    label: 'Init prompt first mention includes strict AI coding guidance context',
    pattern: /strict AI coding guidance context/iu,
  },
  {
    path: 'lib/cli/commands/init.mjs',
    label: 'Init command wording includes project guidance pack',
    pattern: /copy the project guidance pack[^\n]*compile a single rulebook/iu,
  },
  {
    path: 'lib/cli/commands/upgrade.mjs',
    label: 'Upgrade command wording includes managed guidance upgrade',
    pattern: /running managed guidance upgrade for an existing repository\./iu,
  },
  {
    path: 'lib/cli/utils.mjs',
    label: 'CLI help wording includes quality checks and guardrails',
    pattern: /quality checks\s*\(guardrails\)/iu,
  },
];
export const COMPLIANCE_TERMINOLOGY_BOUNDARY_PATHS = [
  '.agent-context/review-checklists/pr-checklist.md',
  '.agent-context/review-checklists/architecture-review.md',
  'scripts/release-gate.mjs',
  'scripts/forbidden-content-check.mjs',
];
export const COMPLIANCE_ALIAS_TERMS = [
  'Federated Rules Operations',
];
export const REQUIRED_COMPLIANCE_CANONICAL_SNIPPETS = [
  {
    path: '.agent-context/review-checklists/pr-checklist.md',
    snippet: '### 15. Universal SOP Consolidation',
    label: 'PR checklist keeps consolidated Universal SOP section',
  },
];
export const REQUIRED_DETECTION_TRANSPARENCY_SNIPPETS = [
  {
    path: 'lib/cli/init-detection-flow.mjs',
    snippets: [
      'existing-project-evidence-only',
      'detectionTransparency',
    ],
  },
  {
    path: 'lib/cli/commands/upgrade.mjs',
    snippets: [
      'Existing project detection transparency:',
      'formatDetectionCandidates(projectDetection.rankedCandidates)',
      'detectionTransparency',
    ],
  },
  {
    path: 'lib/cli/compiler.mjs',
    snippets: [
      'detectionTransparency = null',
      'detectionTransparency: detectionTransparency || null',
    ],
  },
];
export const REQUIRED_STACK_DECISION_BOUNDARY_SNIPPETS = [
  {
    path: '.instructions.md',
    snippets: [
      'Do not silently choose frameworks or architecture from offline heuristics.',
      'produce a short recommendation from evidence and live official documentation before coding',
    ],
  },
  {
    path: '.agent-context/prompts/init-project.md',
    snippets: [
      'If the user already named a stack or framework, treat it as an explicit constraint.',
      'produce a short evidence-backed recommendation from the brief, repo evidence, and live official documentation before coding',
    ],
  },
  {
    path: '.agent-context/rules/architecture.md',
    snippets: [
      'Do not force a default architecture label before the repo, delivery model, and boundary evidence are clear.',
    ],
  },
  {
    path: '.agent-context/rules/microservices.md',
    snippets: [
      'Do not start with microservices by fashion, fear, or habit.',
    ],
  },
  {
    path: 'lib/cli/commands/init.mjs',
    snippets: [
      'AGENT_DECISION_STACK_FILE_NAME',
      'agent recommendation required from current repo/brief evidence',
    ],
  },
];
export const REQUIRED_UNIVERSAL_SOP_SNIPPETS = [
  {
    path: '.agent-context/rules/architecture.md',
    snippets: [
      '## Universal SOP Baseline (Mandatory)',
      'Security and testing are non-negotiable baseline requirements.',
      'If required project context docs are missing, stop implementation and bootstrap docs before writing application code.',
    ],
  },
  {
    path: '.agent-context/review-checklists/pr-checklist.md',
    snippets: [
      '### 15. Universal SOP Consolidation',
      'Coding flow is blocked if `docs/architecture-decision-record.md` (or `docs/Architecture-Decision-Record.md`) is missing',
      'UI implementation flow is blocked if `docs/DESIGN.md` or `docs/design-intent.json` is missing',
    ],
  },
  {
    path: '.agent-context/prompts/review-code.md',
    snippets: [
      'Enforce Universal SOP hard gate: block coding flow when required project docs are missing (`docs/architecture-decision-record.md`, and for UI scope `docs/DESIGN.md` plus `docs/design-intent.json`).',
    ],
  },
  {
    path: '.agent-context/prompts/refactor.md',
    snippets: [
      '6. Enforce Universal SOP hard gate: stop implementation if `docs/architecture-decision-record.md` is missing, and for UI scope stop if `docs/DESIGN.md` or `docs/design-intent.json` is missing.',
    ],
  },
  {
    path: 'lib/cli/compiler.mjs',
    snippets: [
      'Universal SOP hard block policy:',
      'Hard block: do not write application code until docs/project-brief.md and docs/architecture-decision-record.md exist.',
      'For UI scope: if docs/DESIGN.md or docs/design-intent.json is missing, execute bootstrap-design prompt before implementing UI surfaces.',
    ],
  },
];
export const REQUIRED_TEMPLATE_FREE_BOOTSTRAP_SNIPPETS = [
  {
    path: 'lib/cli/project-scaffolder/storage.mjs',
    snippets: [
      'generateProjectDocumentation',
      "bootstrapMode: 'ai-synthesis'",
    ],
  },
  {
    path: 'lib/cli/project-scaffolder/prompt-builders.mjs',
    snippets: [
      'Write project context docs from scratch (no template rendering, no placeholder boilerplate).',
      'For any ecosystem or technology claim, perform live web research and include citation metadata (source + fetchedAt timestamp) rather than relying on offline heuristics.',
    ],
  },
  {
    path: 'lib/cli/commands/init.mjs',
    snippets: [
      'Project docs will be authored dynamically by your IDE assistant from these prompts.',
      'bootstrap-project-context.md',
      'Seed docs:',
      'I prepared dynamic synthesis bootstrap prompts',
    ],
  },
];
export const REQUIRED_UPGRADE_UI_CONTRACT_WARNING_SNIPPETS = [
  {
    path: 'lib/cli/commands/upgrade.mjs',
    snippets: [
      'UI/frontend scope was detected, but the dynamic design contract is incomplete:',
      'docs/design-intent.json',
      'Planned seed on apply: docs/design-intent.json',
      'Upgrade synchronizes governance assets and can seed docs/design-intent.json, but it does not author project-specific docs/DESIGN.md automatically.',
      'detectUiScopeSignals',
      'seed-generated-during-upgrade',
    ],
  },
];
export const REQUIRED_UI_DESIGN_AUTOMATION_SNIPPETS = [
  {
    path: 'AGENTS.md',
    snippets: [
      'Critical Bootstrap Floor',
      'If your host stops at this file',
      'bootstrap-design.md',
      'frontend-architecture.md',
      'docs/DESIGN.md',
      'docs/design-intent.json',
      'does not replace bootstrap loading',
      'Motion/Palette Decision',
      'product categories are heuristics',
      'perform live web research',
    ],
  },
  {
    path: '.instructions.md',
    snippets: [
      'Resolve the smallest relevant layer set for the current request.',
      'UI Design Mode',
      'bootstrap-design.md',
      'frontend-architecture.md',
      'Motion/Palette Decision',
      'product categories are heuristics',
      'do not eagerly load unrelated backend-only rules',
      'valid style context',
      'External references, prior-chat memory, unrelated-project visuals, and remembered screenshots are tainted',
      'WCAG 2.2 AA as the hard compliance floor',
      'APCA as advisory perceptual tuning only',
    ],
  },
  {
    path: '.agent-context/prompts/bootstrap-design.md',
    snippets: [
      'This contract is a decision scaffold, not a style preset.',
      'We guide the agent; we do not pick the final style',
      'Token Architecture and Alias Strategy',
      '`repoEvidence.designEvidenceSummary`',
      'Responsive Recomposition Plan',
      'source of truth',
      'research current official docs',
      'motionPaletteDecision',
      'product categories are heuristics',
      'Responsive design means recomposition, not resizing.',
      'agent-chosen visual direction',
      'viewport mutation rules',
      'WCAG 2.2 AA is the hard floor',
      'APCA may be used only as advisory perceptual tuning',
      'unresearched dependency choices',
      'default component-kit styling without product rationale',
      'genericity findings that cannot name the exact drift signal',
    ],
  },
  {
    path: 'scripts/ui-design-judge.mjs',
    snippets: [
      'Advisory-default UI design contract judge.',
      'Repo-internal workflow audit; no user-facing runtime modes.',
      'genericityAutoFail',
      'blocking required actions',
      'Do not reward generic SaaS defaults or popular template patterns.',
      'UI design judge only evaluates changed UI surfaces.',
      'Structured design execution summary was supplied to semantic review.',
      'designExecutionSignalCount',
      'designExecutionPolicy',
      'designExecutionHandoff',
      'reviewRubric',
      'genericityStatus',
      'handoffReady',
      'structuredInspectionAvailable',
      'calibratedStatus',
      'applyGenericityAutoFail',
    ],
  },
  {
    path: 'scripts/ui-design-judge/rubric-calibration.mjs',
    snippets: [
      'ui-rubric-calibration-v1',
      'matchedGenericitySignals',
      'matchedForbiddenPatterns',
      'matchedValidBoldSignals',
      'contractDriftDetected',
      'Genericity claim was not backed by any named drift signal.',
    ],
  },
  {
    path: 'scripts/ui-rubric-calibration.mjs',
    snippets: [
      'ui-rubric-calibration',
      'rubric-goldset.json',
      'accuracyPercent',
    ],
  },
  {
    path: 'lib/cli/project-scaffolder/design-contract.mjs',
    snippets: [
      'tokenSystem',
      'seedPolicy',
      'structure-first-scaffold',
      'colorTruth',
      'motionPaletteDecision',
      'forbidAutopilotPalettesWithoutEvidence',
      'rolesAreMinimumScaffold',
      'crossViewportAdaptation',
      'motionSystem',
      'densitySource',
      'seedToneLocked',
      'componentMorphology',
      'seedBehaviorsRequireRefinement',
      'accessibilityPolicy',
      'designExecutionPolicy',
      'seedRefinementRequiredBeforeUiImplementation',
      'requirePerSurfaceMutationOps',
      'forbidUniformSiblingSurfaceTreatment',
      'requireStructuredHandoff',
      'handoffFormatVersion',
      'designExecutionHandoff',
      'seedMode',
      'requiresTaskSpecificRefinement',
      'representationStrategy',
      'requireSurfacePlan',
      'requireComponentGraph',
      'requireViewportMutationPlan',
      'requireInteractionStateMatrix',
      'requireContentPriorityMap',
      'forbidScreenshotDependency',
      'semanticReviewFocus',
      'primaryExperienceGoal',
      'surfacePlan',
      'contentPriorityMap',
      'viewportMutationPlan',
      'interactionStateMatrix',
      'taskFlowNarrative',
      'signatureMoveRationale',
      'implementationGuardrails',
      'reviewRubric',
      'genericityAutoFail',
      'genericitySignals',
      'validBoldSignals',
      'mustExplainGenericity',
      'mustSeparateTasteFromFailure',
      'offline-prescribed-style-used-as-final-direction',
      'unresearched-library-or-framework-choice',
      'single-safe-typographic-family-without-role-contrast-or-rationale',
      'hardComplianceFloor',
      'advisoryContrastModel',
      'contextHygiene',
      'repoEvidenceOverridesMemory',
      'requireExplicitContinuityApproval',
      'forbidCarryoverWhenUnapproved',
      'approvedExternalConstraintUsage',
      'requireViewportMutationRules',
      'allowHexDerivatives',
    ],
  },
  {
    path: 'lib/cli/detector.mjs',
    snippets: [
      'frontendEvidenceMetrics',
      'designEvidenceSummary',
    ],
  },
  {
    path: 'lib/cli/detector/design-evidence.mjs',
    snippets: [
      'summaryVersion',
      'hardcodedColorCount',
      'propDrillingCandidateCount',
      'arbitraryBreakpointCount',
      'cssVariables',
      'componentInventory',
      'structuredInspection',
      'classAttributeCount',
      'inlineStyleObjectCount',
      'tokenBypassSignals',
    ],
  },
  {
    path: 'lib/cli/compiler.mjs',
    snippets: [
      'Resolve the smallest relevant layer set before responding.',
      'LAYER 1: RULES (SCOPE-RESOLVED)',
      'LAYER 5: EXECUTION PROMPTS AND UI TRIGGERS',
      'bootstrap-design.md -> ui, ux, layout, screen, tailwind, frontend, redesign',
      'Keep UI-only requests context-isolated',
      'git-workflow.md',
      'designEvidenceSummary',
    ],
  },
];
export const REQUIRED_DOCKER_RUNTIME_AUTOMATION_SNIPPETS = [
  {
    path: '.instructions.md',
    snippets: [
      'docker-runtime.md',
      'For Docker or Compose work, load `docker-runtime.md` and verify the latest official Docker docs before authoring container assets.',
    ],
  },
  {
    path: '.agent-context/rules/docker-runtime.md',
    snippets: [
      'latest official Docker documentation first',
      'Docker Compose Quickstart',
      'Compose file reference',
      'Dockerfile best practices',
      'Use current `docker compose` workflows and `compose.yaml`.',
      'Do not add the top-level Compose `version` field by default.',
      'Use the latest stable compatible Docker base image',
    ],
  },
  {
    path: '.agent-context/prompts/init-project.md',
    snippets: [
      'If Docker or Compose is in scope, load [docker-runtime.md](../rules/docker-runtime.md) and verify the latest official Docker guidance before authoring container assets.',
      'If containerization is selected, Docker assets must follow [docker-runtime.md](../rules/docker-runtime.md) and the latest official Docker docs instead of stale blog-era patterns.',
    ],
  },
];
export const REQUIRED_DEPENDENCY_FRESHNESS_AUTOMATION_SNIPPETS = [
  {
    path: '.instructions.md',
    snippets: [
      'use the latest stable compatible dependency set and official setup flow',
    ],
  },
  {
    path: '.agent-context/rules/efficiency-vs-hype.md',
    snippets: [
      'Latest-Compatible-First Rule',
      'latest stable compatible dependency version',
      'official scaffolder or setup command',
      'Only step down to an older dependency version after documenting',
    ],
  },
  {
    path: '.agent-context/prompts/init-project.md',
    snippets: [
      'recommend the latest stable compatible dependency set and official framework setup flow from live official documentation before coding',
      'Use official framework setup commands or canonical starter flows',
    ],
  },
];
export const FORBIDDEN_TEMPLATE_BOOTSTRAP_SNIPPETS = [
  {
    path: 'lib/cli/project-scaffolder/prompt-builders.mjs',
    snippets: [
      '.tmpl',
    ],
  },
];
export const FORBIDDEN_ACTIVE_BIAS_ANCHOR_SNIPPETS = [
  {
    path: '.instructions.md',
    snippets: [
      'illustrative, not exhaustive',
      'explicitly approved reference systems',
      'Do not auto-recommend frameworks',
      'prefer the latest stable compatible dependency set',
    ],
  },
  {
    path: '.agent-context/prompts/bootstrap-design.md',
    snippets: [
      'stylistic inspiration',
      'famous brand reference',
      'If no approved reference system exists',
      'explicitly approved reference systems',
    ],
  },
  {
    path: '.agent-context/prompts/init-project.md',
    snippets: [
      'Compact User Prompt Patterns',
      'latest stable compatible dependency set and official framework setup flow first',
      'Prefer official framework setup commands',
      'ask for confirmation instead of silently choosing a stack',
    ],
  },
  {
    path: 'lib/cli/project-scaffolder/design-contract.mjs',
    snippets: [
      'explicitly-approved-reference-systems',
      'approvedReferenceUsage',
    ],
  },
  {
    path: 'lib/cli/constants.mjs',
    snippets: [
      'BLUEPRINT_RECOMMENDATIONS',
      `java-${'enter'}${'prise'}-api`,
      `dotnet-${'enter'}${'prise'}-api`,
    ],
  },
  {
    path: 'lib/cli/init-detection-flow.mjs',
    snippets: [
      `Using detected ${'stack'} automatically`,
      `Use detected ${'setup'} for this existing project?`,
      'Override detected stack',
    ],
  },
  {
    path: 'scripts/ui-design-judge/prompting.mjs',
    snippets: [
      '"recommendation": string',
    ],
  },
  {
    path: 'scripts/documentation-boundary-audit.mjs',
    snippets: [
      'suggestedActions',
      'suggestedDocumentationUpdates',
    ],
  },
];
export const REQUIRED_DETERMINISTIC_BOUNDARY_ENFORCEMENT_SNIPPETS = [
  {
    path: 'scripts/documentation-boundary-audit.mjs',
    snippets: [
      'reportVersion',
      'violations',
      'requiredActions',
      'diagnosticCode',
      'autoDocsSyncScope',
      'rolloutMetrics',
      'precision',
      'recall',
    ],
  },
  {
    path: 'scripts/release-gate.mjs',
    snippets: [
      'documentation-boundary-hard-rule',
      'documentation-boundary-diagnostics-machine-readable',
      'diagnostics.documentationBoundaryAudit',
      'auto-docs-sync-scope-phase1',
      'auto-docs-sync-rollout-metrics',
      'ui-design-judge-structured-diagnostics',
    ],
  },
];
