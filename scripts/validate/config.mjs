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
    label: 'Init prompt first mention includes Federated Governance baseline',
    pattern: /rules operations context\s*\(Federated Governance baseline\)/iu,
  },
  {
    path: 'lib/cli/commands/init.mjs',
    label: 'Init command wording includes Federated Governance baseline',
    pattern: /rules operations\s+(assets|pack)[^\n]*\(Federated Governance baseline\)/iu,
  },
  {
    path: 'lib/cli/commands/upgrade.mjs',
    label: 'Upgrade command wording includes Federated Governance baseline',
    pattern: /rules operations upgrade assistant\s*\(Federated Governance baseline\)/iu,
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
    path: 'lib/cli/commands/init.mjs',
    snippets: [
      'Existing project detection transparency:',
      'Use detected setup for this existing project?',
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
export const REQUIRED_STACK_RESEARCH_ENGINE_SNIPPETS = [
  {
    path: 'lib/cli/architect.mjs',
    snippets: [
      'STACK_SIGNAL_WEIGHTS',
      'briefType',
      'recommendArchitecture',
      'formatArchitectureRecommendation',
    ],
  },
  {
    path: 'lib/cli/commands/init.mjs',
    snippets: [
      'recommendArchitecture',
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
      'perform live web research',
    ],
  },
  {
    path: '.instructions.md',
    snippets: [
      'UI Design Mode',
      'bootstrap-design.md',
      'frontend-architecture.md',
      'do not eagerly load unrelated backend-only rules',
      'valid style context',
      'explicitly approved reference systems',
      'WCAG 2.2 AA as the hard compliance floor',
      'APCA as advisory perceptual tuning only',
    ],
  },
  {
    path: '.agent-context/prompts/bootstrap-design.md',
    snippets: [
      'UI Design Mode is context-isolated by default:',
      'Token Architecture and Alias Strategy',
      '`tokenSystem`',
      '`repoEvidence.designEvidenceSummary`',
      'Responsive Strategy and Cross-Viewport Adaptation Matrix',
      '`colorTruth.format`',
      '`crossViewportAdaptation.mutationRules.mobile/tablet/desktop`',
      '`motionSystem`',
      '`componentMorphology`',
      '`accessibilityPolicy`',
      '`visualQaPolicy`',
      '`contextHygiene`',
      'Do not reuse a color palette, component skin, or motion signature from prior chats, memories, or unrelated projects',
      'If no approved reference system exists, synthesize the design from zero using current product context, constraints, and content only.',
      'Design continuity is opt-in.',
      'WCAG 2.2 AA as the blocking baseline',
      'APCA only as advisory perceptual tuning',
      'Hybrid visual QA must stay deterministic-first',
      'long-page capture strategy',
      'anchor-based section or tiled-scroll captures',
    ],
  },
  {
    path: 'scripts/ui-design-judge.mjs',
    snippets: [
      'Advisory-first UI design contract judge.',
      'Repo-internal workflow audit; no user-facing runtime modes.',
      'Runs only in advisory mode for this repository workflow.',
      'Do not reward generic SaaS defaults or popular template patterns.',
      'UI design judge only evaluates changed UI surfaces.',
      'Deterministic visual diff reported no meaningful drift, so semantic review was skipped.',
      'UI_VISUAL_DIFF_REPORT_JSON',
      'meaningfulDiffViewportCount',
    ],
  },
  {
    path: 'lib/cli/project-scaffolder/design-contract.mjs',
    snippets: [
      'tokenSystem',
      'colorTruth',
      'crossViewportAdaptation',
      'motionSystem',
      'componentMorphology',
      'accessibilityPolicy',
      'visualQaPolicy',
      'deterministicFirst',
      'baselineStrategy',
      'requiredViewports',
      'capturePlan',
      'longPageStrategy',
      'tileOverlapRatio',
      'meaningfulDiffRatioThreshold',
      'hardComplianceFloor',
      'advisoryContrastModel',
      'contextHygiene',
      'repoEvidenceOverridesMemory',
      'requireExplicitContinuityApproval',
      'forbidCarryoverWhenUnapproved',
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
      'tokenBypassSignals',
    ],
  },
  {
    path: 'lib/cli/compiler.mjs',
    snippets: [
      'LAYER 5: EXECUTION PROMPTS AND UI TRIGGERS',
      'bootstrap-design.md -> ui, ux, layout, screen, tailwind, frontend, redesign',
      'Keep UI-only requests context-isolated',
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
      'Prefer current `docker compose` workflows and `compose.yaml`.',
      'Do not add the top-level Compose `version` field by default.',
      'Prefer the latest stable compatible Docker base image',
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
      'prefer the latest stable compatible dependency set and official setup flow',
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
      'latest stable compatible dependency set and official framework setup flow first',
      'Prefer official framework setup commands or canonical starter flows',
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
export const REQUIRED_DETERMINISTIC_BOUNDARY_ENFORCEMENT_SNIPPETS = [
  {
    path: 'scripts/documentation-boundary-audit.mjs',
    snippets: [
      'reportVersion',
      'violations',
      'suggestedActions',
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
      'ui-design-judge-hybrid-diagnostics',
    ],
  },
];
