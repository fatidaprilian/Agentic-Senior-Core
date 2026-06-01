import { toTitleCase } from '../utils.mjs';
import {
  PROJECT_DOC_SYNTHESIS_PROMPT_VERSION,
} from './constants.mjs';

function buildDockerStrategyExecutionBlock(dockerStrategy) {
  const selectedDockerStrategy = String(dockerStrategy || '').trim();
  const normalizedDockerStrategy = selectedDockerStrategy.toLowerCase();

  if (!selectedDockerStrategy || normalizedDockerStrategy.startsWith('no docker')) {
    return [
      '## Docker Execution Gate',
      'Docker was not selected. Do not create container assets unless the user changes scope.',
    ];
  }

  const requiredAssetFloor = [
    '.dockerignore',
    normalizedDockerStrategy.includes('development') || normalizedDockerStrategy.includes('both') ? 'compose.yaml for development' : null,
    normalizedDockerStrategy.includes('production') || normalizedDockerStrategy.includes('both') ? 'compose.prod.yaml or a documented production Compose override' : null,
    'Dockerfile stage(s) derived from the actual stack',
    'docs/docker-runtime.md or a deployment runbook with ports, entrypoints, health checks, and source URLs',
  ].filter(Boolean).join(', ');

  return [
    '## Docker Execution Gate',
    `Selected Docker strategy: ${selectedDockerStrategy}`,
    '- Load .agent-context/rules/docker-runtime.md and verify current official Docker docs before authoring assets.',
    '- Materialize Docker assets from the actual stack; do not stop at docs-only acknowledgement or runtime notes.',
    '- Required asset floor: ' + requiredAssetFloor + '.',
    '- Keep development and production lanes separate when both are selected.',
    '- If the user asks to create files without commands, write the files and documented commands, but do not execute Docker build, Compose, or registry commands.',
    '- If Docker is enabled for development, local development setup and first-build instructions in the README must use Docker (e.g., `docker compose up`) rather than fallback local commands like `npm run dev`.',
  ];
}

export function buildProjectContextBootstrapPrompt({
  discoveryAnswers,
  initContext,
  expectedDocFileNames,
  docsLanguage,
}) {
  const featuresList = Array.isArray(discoveryAnswers.features) && discoveryAnswers.features.length > 0
    ? discoveryAnswers.features.map((feature, featureIndex) => `${featureIndex + 1}. ${feature}`).join('\n')
    : 'Derive the first concrete feature set from the project name, description, and domain. Do not invent arbitrary modules just to fill space.';

  const expectedDocsList = [
    'README.md',
    ...expectedDocFileNames.map((fileName) => `docs/${fileName}`),
  ]
    .map((filePath, fileIndex) => `${fileIndex + 1}. ${filePath}`)
    .join('\n');

  return [
    '# Bootstrap Prompt: Dynamic Project Context Synthesis',
    '',
    `Protocol version: ${PROJECT_DOC_SYNTHESIS_PROMPT_VERSION}`,
    '',
    'You are a Lead Solution Architect and Principal Engineer.',
    'Write project context docs from scratch (no template rendering, no placeholder boilerplate).',
    '',
    '## Mission',
    `Create or update these files in ${docsLanguage.toUpperCase()} language:`,
    expectedDocsList,
    '',
    '## Hard Rules',
    '1. No copy-paste from external prose.',
    '2. Every major section must explain rationale, constraints, and required action.',
    '3. Keep database, auth, runtime, and architecture aligned with explicit project constraints below unless user requests migration.',
    '4. Output must be implementation-ready for engineers, not generic textbook explanation.',
    '5. For any ecosystem or technology claim, perform live web research and include citation metadata (source + fetchedAt timestamp) rather than relying on offline heuristics.',
    '6. Write for native English speakers at an 8th-grade reading level. Use clear, direct, plain language.',
    '7. Avoid emoji, AI cliches, buzzwords, academic phrasing, padding, and generic filler.',
    '8. Separate confirmed facts from assumptions explicitly. When context is incomplete, add an `Assumptions to Validate` section and a `Next Validation Action` line.',
    '9. If user inputs conflict with repo evidence, call out the conflict and choose the safer interpretation instead of silently forcing a generic answer.',
    '10. Do not invent modules or architecture layers only to make the docs look complete.',
    '11. If runtime or framework setup is unresolved, recommend the latest stable compatible option from the brief, constraints, and live official documentation before coding. If an official setup flow yields newer, better-supported defaults than manual package assembly, use that path after approval.',
    '12. Treat topology as an agent decision unless the user explicitly constrained it. If monolith fits, explain why. If a service split fits, document the evidence and service boundary logic.',
    '13. Required docs coverage must include a public and developer README entrypoint, feature plan, architecture rationale, flow, public API or integration contracts when relevant, data model when relevant, UI/design when relevant, security assumptions, testing strategy, runtime/deployment notes, and next validation actions.',
    '14. Use Mermaid.js as the default diagram format for flow, sequence, ER, architecture, C4, and state diagrams embedded in Markdown docs. Do not use PlantUML, ASCII art diagrams, Graphviz DOT, or Structurizr DSL. When updating existing docs that contain prose-only descriptions, convert relevant sections to Mermaid diagrams in the same change.',
    '15. README.md must be public and developer friendly, including for private projects: what it is, who it is for, setup, core workflow, configuration, and links to deeper docs. Do not include secrets, internal agent notes, private reasoning, or governance policy dumps.',
    '16. docs/doc-index.md is the low-token routing map for docs/*. Keep it short, list each active doc, and explain when an agent should read it. Do not make it the source of truth for requirements or architecture.',
    '17. Keep docs complete but compact. Add extra docs files only for stable, distinct, or long workflows such as hardware setup, deployment, operations, testing validation, or troubleshooting.',
    '18. Add SRS, PRD, technical-design, or ERD docs only when project evidence triggers them. Use PRD for product-roadmap/user-story ownership, SRS for contractual or multi-stakeholder acceptance criteria, technical-design for non-trivial architecture decisions, and ERD only as a separate file when the schema is too complex for docs/database-schema.md.',
    '',
    '## Project Inputs',
    `- Project name: ${discoveryAnswers.projectName}`,
    `- Project description: ${discoveryAnswers.projectDescription}`,
    `- Project topology decision: ${discoveryAnswers.architectureStyle}`,
    `- Primary domain: ${discoveryAnswers.primaryDomain}`,
    `- Database strategy: ${discoveryAnswers.databaseChoice}`,
    `- Auth strategy: ${discoveryAnswers.authStrategy}`,
    `- Docker strategy: ${discoveryAnswers.dockerStrategy}`,
    `- Runtime environment: ${initContext.runtimeEnvironmentLabel || initContext.runtimeEnvironmentKey || 'Linux'}`,
    `- Runtime constraint: ${initContext.stackFileName === 'agent-decision-runtime.md' ? 'agent recommendation required before coding' : toTitleCase(initContext.stackFileName)}`,
    `- Architecture constraint: ${initContext.blueprintFileName === 'agent-decision-architecture.md' ? 'agent recommendation required before coding' : toTitleCase(initContext.blueprintFileName)}`,
    `- Additional runtime constraints: ${Array.isArray(initContext.additionalStackFileNames) && initContext.additionalStackFileNames.length > 0 ? initContext.additionalStackFileNames.map((stackFileName) => toTitleCase(stackFileName)).join(', ') : 'none'}`,
    `- Additional architecture constraints: ${Array.isArray(initContext.additionalBlueprintFileNames) && initContext.additionalBlueprintFileNames.length > 0 ? initContext.additionalBlueprintFileNames.map((blueprintFileName) => toTitleCase(blueprintFileName)).join(', ') : 'none'}`,
    '',
    ...buildDockerStrategyExecutionBlock(discoveryAnswers.dockerStrategy),
    '',
    '## Key Features',
    featuresList,
    '',
    '## Additional Context',
    discoveryAnswers.additionalContext || 'No additional context provided.',
    '',
    '## Required Execution',
    '1. Create all required docs files listed above with complete Markdown content.',
    '2. Make the docs adaptive to the real repo and prompt context. These are living references, not frozen templates.',
    '3. In docs/doc-index.md, include a compact table with document path, purpose, reads-when triggers, status, and last-updated date.',
    '4. In docs/project-brief.md and docs/architecture-decision-record.md, include explicit sections for confirmed facts, assumptions to validate, and next validation actions whenever context is incomplete.',
    '5. Before implementation, use README.md plus docs/doc-index.md to select only the relevant docs for the current task instead of broad-reading docs/*.md.',
    '6. Before implementation, use the docs to confirm stack, runtime, architecture, public contracts, data, validation, and delivery assumptions.',
    '7. Keep content original, specific to this project, and actionable for implementation.',
    '8. After writing docs, continue coding tasks using these docs as living project context.',
    '',
  ].join('\n');
}

export function buildDesignBootstrapPrompt({
  discoveryAnswers,
  initContext,
  docsLanguage,
}) {

  return [
    '# Bootstrap Prompt: Dynamic Design Contract Synthesis',
    '',
    `Protocol version: ${PROJECT_DOC_SYNTHESIS_PROMPT_VERSION}`,
    '',
    'You are the Lead UI/UX Art Director for this project.',
    'Create a dynamic design contract, not a fixed stylistic template.',
    '',
    '## Mission',
    `Author docs/DESIGN.md in ${docsLanguage.toUpperCase()} language with strong art direction and engineering-ready guidance.`,
    '',
    '## Deliverables',
    '1. docs/DESIGN.md',
    '',
    '## Design Direction Process',
    'Follow `.agent-context/prompts/bootstrap-design.md` for the three-step design direction:',
    '1. Name your defaults (three temptations and why each flattens this product)',
    '2. Choose a concrete anchor (googleable, specific, not a generic quality word)',
    '3. Record creative commitments (typography, palette, motion, composition)',
    '',
    '## Hard Rules',
    '1. Do not copy external style guides or anchor to famous product surfaces.',
    '2. Do not choose final style, library, palette, typography, or motion from this offline scaffold.',
    '3. Use repo evidence, active brief, current docs, and current official docs for technology choices.',
    '4. WCAG 2.2 AA is the hard floor. APCA is advisory perceptual tuning only.',
    '5. Research current official docs before importing any new UI-related library.',
    '6. Do not default to any component kit by habit, and do not avoid them when they fit.',
    '7. Keep research vocabulary internal; evidence, anchor, and category-code labels must not appear in public-facing docs.',
    '8. Treat production content as blocking: remove demo, placeholder, lorem, TODO, and scaffold copy.',
    '',
    '## Project Inputs',
    `- Project name: ${discoveryAnswers.projectName}`,
    `- Product context: ${discoveryAnswers.projectDescription}`,
    `- Project topology decision: ${discoveryAnswers.architectureStyle}`,
    `- Domain: ${discoveryAnswers.primaryDomain}`,
    `- Runtime constraint: ${initContext.stackFileName === 'agent-decision-runtime.md' ? 'agent recommendation required before coding' : toTitleCase(initContext.stackFileName)}`,
    `- Architecture constraint: ${initContext.blueprintFileName === 'agent-decision-architecture.md' ? 'agent recommendation required before coding' : toTitleCase(initContext.blueprintFileName)}`,
    '',
    '## Required Execution',
    '1. Create or update docs/DESIGN.md with complete content covering: design intent, audience signals, visual direction, color/typography/spacing decisions, responsive strategy, motion rules, component language, accessibility non-negotiables, and anti-patterns.',
    '2. Make the contract executable without screenshot dependency.',
    '3. Preserve repoEvidence.designEvidenceSummary when onboarding or detector evidence exists.',
    '4. After the contract exists, use it as a first-class source for future UI tasks.',
    '',
  ].join('\n');
}
