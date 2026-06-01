import { describe, it } from 'node:test';
import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import assert from 'node:assert/strict';

const ROOT = process.cwd();

/**
 * Knowledge layer definitions.
 * Each layer specifies the paths that MUST exist on disk
 * and the keywords each IDE entry point MUST mention to prove injection.
 */
const LAYERS = [
  {
    name: 'Layer 1: Rules',
    requiredPaths: [
      '.agent-context/rules/naming-conv.md',
      '.agent-context/rules/architecture.md',
      '.agent-context/rules/security.md',
      '.agent-context/rules/performance.md',
      '.agent-context/rules/error-handling.md',
      '.agent-context/rules/testing.md',
      '.agent-context/rules/git-workflow.md',
      '.agent-context/rules/efficiency-vs-hype.md',
      '.agent-context/rules/api-docs.md',
      '.agent-context/rules/microservices.md',
      '.agent-context/rules/event-driven.md',
      '.agent-context/rules/database-design.md',
      '.agent-context/rules/realtime.md',
      '.agent-context/rules/frontend-architecture.md',
      '.agent-context/rules/docker-runtime.md',
    ],
    injectionKeywords: ['.agent-context/rules/', 'naming-conv', 'architecture', 'security', 'docker-runtime'],
  },
  {
    name: 'Layer 2: Runtime Decision Signals',
    requiredPaths: [],
    injectionKeywords: ['Runtime Decision Signals', 'Runtime signals are evidence gates'],
  },
  {
    name: 'Layer 3: Structural Planning Signals',
    requiredPaths: [],
    injectionKeywords: ['Structural Planning Signals', 'dynamic structural planning'],
  },
  {
    name: 'Layer 4: Execution Contracts',
    requiredPaths: [],
    injectionKeywords: ['Execution Contracts', 'dynamic execution contracts'],
  },
  {
    name: 'Layer 5: Prompts',
    requiredPaths: [
      '.agent-context/prompts/init-project.md',
      '.agent-context/prompts/compact-natural-mode.md',
      '.agent-context/prompts/bootstrap-design.md',
      '.agent-context/prompts/refactor.md',
      '.agent-context/prompts/review-code.md',
    ],
    injectionKeywords: ['.agent-context/prompts/'],
  },
  {
    name: 'Layer 6: Governance Modes',
    requiredPaths: [],
    injectionKeywords: ['Governance Modes', 'dynamic governance context'],
  },
  {
    name: 'Layer 7: State',
    requiredPaths: [
      '.agent-context/state/architecture-map.md',
      '.agent-context/state/dependency-map.md',
    ],
    injectionKeywords: ['.agent-context/state/'],
  },
  {
    name: 'Layer 8: Policies',
    requiredPaths: [
      '.agent-context/policies/llm-judge-threshold.json',
    ],
    injectionKeywords: ['.agent-context/policies/'],
  },
];

/**
 * IDE entry points — the files each AI agent reads on init.
 * Each entry must reference ALL 8 layers.
 */
const FULL_INJECTION_ENTRY_POINTS = [
  { name: 'AGENTS.md', path: 'AGENTS.md' },
];

/**
 * Native import bridges that load the canonical AGENTS.md file.
 */
const NATIVE_IMPORT_BRIDGES = [
  { name: 'CLAUDE.md', path: 'CLAUDE.md' },
  { name: 'GEMINI.md', path: 'GEMINI.md' },
];

// ── Test: All layer files exist on disk ─────────────────────────────────────

describe('Knowledge Layer File Existence', () => {
  for (const layer of LAYERS) {
    it(`${layer.name} — all ${layer.requiredPaths.length} files exist`, () => {
      const missingPaths = [];
      for (const relativePath of layer.requiredPaths) {
        const absolutePath = join(ROOT, relativePath);
        if (!existsSync(absolutePath)) {
          missingPaths.push(relativePath);
        }
      }
      assert.deepStrictEqual(
        missingPaths,
        [],
        `Missing files for ${layer.name}: ${missingPaths.join(', ')}`
      );
    });
  }
});

// ── Test: Full-injection entry points reference ALL 8 layers ────────────────

describe('Full 8-Layer Injection Coverage', () => {
  for (const entryPoint of FULL_INJECTION_ENTRY_POINTS) {
    const entryPointPath = join(ROOT, entryPoint.path);
    if (!existsSync(entryPointPath)) {
      it(`${entryPoint.name} — file exists`, () => {
        assert.fail(`Entry point file not found: ${entryPoint.path}`);
      });
      continue;
    }

    const fileContent = readFileSync(entryPointPath, 'utf-8');

    for (const layer of LAYERS) {
      it(`${entryPoint.name} references ${layer.name}`, () => {
        const missingKeywords = [];
        for (const keyword of layer.injectionKeywords) {
          if (!fileContent.includes(keyword)) {
            missingKeywords.push(keyword);
          }
        }
        assert.deepStrictEqual(
          missingKeywords,
          [],
          `${entryPoint.name} is missing references for ${layer.name}: ${missingKeywords.join(', ')}`
        );
      });
    }
  }
});

describe('Adaptive Strategy Guidance', () => {
  it('AGENTS.md keeps Layer 2 and Layer 3 evidence-gated without pattern anchors', () => {
    const instructionsContent = readFileSync(join(ROOT, 'AGENTS.md'), 'utf-8');

    assert.match(instructionsContent, /Runtime signals are evidence gates/i);
    assert.match(instructionsContent, /Ignore pattern frequency/i);
    assert.match(instructionsContent, /Structural planning signals are not a hard whitelist/i);
    assert.match(instructionsContent, /Do not silently choose frameworks or architecture from offline heuristics/i);
    assert.match(instructionsContent, /WAIT for user approval/i);
  });
});

describe('Docker and Design Freshness Guidance', () => {


  it('design contract seed keeps machine-readable context hygiene boundaries', () => {
    const designContractSource = readFileSync(
      join(ROOT, 'lib', 'cli', 'project-scaffolder', 'design-contract.mjs'),
      'utf-8'
    );

    assert.match(designContractSource, /contextHygiene/);
    assert.match(designContractSource, /repoEvidenceOverridesMemory/);
    assert.match(designContractSource, /requireExplicitContinuityApproval/);
    assert.match(designContractSource, /forbidCarryoverWhenUnapproved/);
    assert.match(designContractSource, /approvedExternalConstraintUsage/);
    assert.match(designContractSource, /accessibilityPolicy/);
    assert.match(designContractSource, /designFlexibilityPolicy/);
    assert.match(designContractSource, /locked-outcomes-flexible-expression/);
    assert.match(designContractSource, /literalTranslationPolicy/);
    assert.match(designContractSource, /spatialAutopilotPolicy/);
    assert.match(designContractSource, /spatialMetaphorPolicy/);
    assert.match(designContractSource, /externalWebsiteReferencePolicy/);
    assert.match(designContractSource, /frameworkNeutralityPolicy/);
    assert.match(designContractSource, /manual-framework-scaffold-used-when-official-setup-fits/);
    assert.match(designContractSource, /hardComplianceFloor/);
    assert.match(designContractSource, /advisoryContrastModel/);
    assert.match(designContractSource, /designExecutionPolicy/);
    assert.match(designContractSource, /separateRequiredOutcomesFromCandidateMoves/);
    assert.match(designContractSource, /reviewRubric/);
    assert.match(designContractSource, /representationStrategy/);
    assert.match(designContractSource, /requireSurfacePlan/);
    assert.match(designContractSource, /forbidScreenshotDependency/);
    assert.match(designContractSource, /requireViewportMutationPlan/);
    assert.match(designContractSource, /requireInteractionStateMatrix/);
    assert.match(designContractSource, /semanticReviewFocus/);
    assert.match(designContractSource, /genericitySignals/);
    assert.match(designContractSource, /validBoldSignals/);
    assert.match(designContractSource, /mustExplainGenericity/);
  });

});

// ── Test: Delegating entry points reference rules + delegate to full file ───

describe('Native Import Bridges', () => {
  for (const entryPoint of NATIVE_IMPORT_BRIDGES) {
    const entryPointPath = join(ROOT, entryPoint.path);
    if (!existsSync(entryPointPath)) {
      it(`${entryPoint.name} — file exists`, () => {
        assert.fail(`Entry point file not found: ${entryPoint.path}`);
      });
      continue;
    }

    const fileContent = readFileSync(entryPointPath, 'utf-8');

    it(`${entryPoint.name} imports AGENTS.md`, () => {
      assert.equal(
        fileContent.trim(),
        '@AGENTS.md',
        `${entryPoint.name} must stay as a one-line native import bridge`
      );
    });
  }
});

describe('Bootstrap Reliability Floor', () => {
  it('AGENTS.md carries the canonical bootstrap contract', () => {
    const agentsContent = readFileSync(join(ROOT, 'AGENTS.md'), 'utf-8');

    assert.match(agentsContent, /Canonical project instructions/i);
    assert.match(agentsContent, /Bootstrap Receipt/);
    assert.match(agentsContent, /bootstrap-design\.md/);
    assert.match(agentsContent, /frontend-architecture\.md/);
    assert.match(agentsContent, /docs\/DESIGN\.md/);
    assert.match(agentsContent, /docs\/design-intent\.json/);
    assert.match(agentsContent, /onboarding-report\.json/i);
    assert.match(agentsContent, /perform live web research/i);
  });
});

// ── Test: mcp.json declares all 8 layers ────────────────────────────────────

describe('MCP Knowledge Layer Declaration', () => {
  const mcpPath = join(ROOT, 'mcp.json');

  it('mcp.json exists', () => {
    assert.ok(existsSync(mcpPath), 'mcp.json not found');
  });

  it('mcp.json declares knowledgeLayers enabled', () => {
    const mcpConfig = JSON.parse(readFileSync(mcpPath, 'utf-8'));
    assert.ok(mcpConfig.knowledgeLayers, 'knowledgeLayers key missing');
    assert.strictEqual(mcpConfig.knowledgeLayers.enabled, true, 'knowledgeLayers not enabled');
  });

  it('mcp.json declares all 9 layer paths', () => {
    const mcpConfig = JSON.parse(readFileSync(mcpPath, 'utf-8'));
    const expectedLayerNames = [
      'rules',
      'stack-strategies',
      'architecture-playbooks',
      'execution-contracts',
      'prompts',
      'governance-modes',
      'state',
      'policies',
      'project-context',
    ];
    const actualLayerNames = Object.keys(mcpConfig.knowledgeLayers.layers);

    const missingLayers = expectedLayerNames.filter(
      (layerName) => !actualLayerNames.includes(layerName)
    );
    assert.deepStrictEqual(
      missingLayers,
      [],
      `mcp.json is missing layer declarations: ${missingLayers.join(', ')}`
    );
  });

  it('mcp.json auto-loads governance layers and keeps project docs lazy', () => {
    const mcpConfig = JSON.parse(readFileSync(mcpPath, 'utf-8'));
    const layerEntries = Object.entries(mcpConfig.knowledgeLayers.layers);
    const nonAutoLoadLayers = layerEntries
      .filter(([layerName]) => layerName !== 'project-context')
      .filter(([, layerConfig]) => layerConfig.autoLoad !== true)
      .map(([layerName]) => layerName);

    assert.deepStrictEqual(
      nonAutoLoadLayers,
      [],
      `These layers do not have autoLoad=true: ${nonAutoLoadLayers.join(', ')}`
    );
    assert.equal(
      mcpConfig.knowledgeLayers.layers['project-context']?.autoLoad,
      false,
      'project-context must stay lazy so docs are injected only when relevant'
    );
  });

  it('mcp.json includes full-knowledge-injection workflow', () => {
    const mcpConfig = JSON.parse(readFileSync(mcpPath, 'utf-8'));
    assert.ok(
      mcpConfig.workflows?.['full-knowledge-injection'],
      'full-knowledge-injection workflow missing from mcp.json'
    );
  });

  it('mcp.json injection workflow covers all scoped layers', () => {
    const mcpConfig = JSON.parse(readFileSync(mcpPath, 'utf-8'));
    const injectionSteps = mcpConfig.workflows['full-knowledge-injection'].steps;
    const expectedStepKeywords = [
      'scope',
      'rules',
      'runtime',
      'structural',
      'execution',
      'prompts',
      'governance',
      'state',
      'policies',
      'project_context',
    ];

    for (const keyword of expectedStepKeywords) {
      const hasStep = injectionSteps.some((step) => step.includes(keyword));
      assert.ok(hasStep, `Injection workflow missing step for: ${keyword}`);
    }
  });
});

// ── Test: .gitignore rule exists in git-workflow.md ─────────────────────────

describe('Gitignore Governance', () => {

});
