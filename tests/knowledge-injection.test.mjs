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
    ],
    injectionKeywords: ['.agent-context/rules/', 'naming-conv', 'architecture', 'security'],
  },
  {
    name: 'Layer 2: Stacks',
    requiredPaths: [
      '.agent-context/stacks/typescript.md',
      '.agent-context/stacks/python.md',
      '.agent-context/stacks/java.md',
      '.agent-context/stacks/php.md',
      '.agent-context/stacks/go.md',
      '.agent-context/stacks/csharp.md',
      '.agent-context/stacks/rust.md',
      '.agent-context/stacks/ruby.md',
    ],
    injectionKeywords: ['.agent-context/stacks/', 'typescript', 'python'],
  },
  {
    name: 'Layer 3: Blueprints',
    requiredPaths: [
      '.agent-context/blueprints/api-nextjs.md',
      '.agent-context/blueprints/nestjs-logic.md',
      '.agent-context/blueprints/fastapi-service.md',
      '.agent-context/blueprints/laravel-api.md',
      '.agent-context/blueprints/spring-boot-api.md',
      '.agent-context/blueprints/go-service.md',
      '.agent-context/blueprints/aspnet-api.md',
      '.agent-context/blueprints/ci-github-actions.md',
      '.agent-context/blueprints/ci-gitlab.md',
      '.agent-context/blueprints/observability.md',
      '.agent-context/blueprints/graphql-grpc-api.md',
      '.agent-context/blueprints/infrastructure-as-code.md',
      '.agent-context/blueprints/kubernetes-manifests.md',
      '.agent-context/blueprints/mobile-app.md',
    ],
    injectionKeywords: ['.agent-context/blueprints/'],
  },
  {
    name: 'Layer 4: Skills',
    requiredPaths: [
      '.agent-context/skills/backend.md',
      '.agent-context/skills/frontend.md',
      '.agent-context/skills/cli.md',
      '.agent-context/skills/distribution.md',
      '.agent-context/skills/fullstack.md',
      '.agent-context/skills/review-quality.md',
    ],
    injectionKeywords: ['.agent-context/skills/'],
  },
  {
    name: 'Layer 5: Prompts',
    requiredPaths: [
      '.agent-context/prompts/init-project.md',
      '.agent-context/prompts/refactor.md',
      '.agent-context/prompts/review-code.md',
    ],
    injectionKeywords: ['.agent-context/prompts/'],
  },
  {
    name: 'Layer 6: Profiles',
    requiredPaths: [
      '.agent-context/profiles/platform.md',
      '.agent-context/profiles/regulated.md',
      '.agent-context/profiles/startup.md',
    ],
    injectionKeywords: ['.agent-context/profiles/'],
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
const IDE_ENTRY_POINTS = [
  { name: 'AGENTS.md', path: 'AGENTS.md' },
  { name: '.instructions.md', path: '.instructions.md' },
  { name: 'copilot-instructions.md', path: '.github/copilot-instructions.md' },
  // .cursorrules and .windsurfrules delegate layers 4-8 via
  // ".cursorrules" → AGENTS.md and ".instructions.md", so they only need
  // to reference .agent-context/rules/, stacks/, blueprints/, and state/.
  // Full 8-layer injection is guaranteed via the bootstrap chain.
];

/**
 * These are the "full 8-layer" entry points that must reference every
 * single layer directory.
 */
const FULL_INJECTION_ENTRY_POINTS = [
  { name: 'AGENTS.md', path: 'AGENTS.md' },
  { name: '.instructions.md', path: '.instructions.md' },
  { name: 'copilot-instructions.md', path: '.github/copilot-instructions.md' },
];

/**
 * Delegating entry points that reference the full-injection files.
 * These must at minimum reference .agent-context/rules/ and point
 * to AGENTS.md or .instructions.md for the rest.
 */
const DELEGATING_ENTRY_POINTS = [
  { name: '.cursorrules', path: '.cursorrules', delegatesTo: ['AGENTS.md', '.cursorrules'] },
  { name: '.windsurfrules', path: '.windsurfrules', delegatesTo: ['AGENTS.md', '.cursorrules'] },
  { name: '.gemini/instructions.md', path: '.gemini/instructions.md', delegatesTo: ['AGENTS.md'] },
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

// ── Test: Delegating entry points reference rules + delegate to full file ───

describe('Delegating Entry Point Chain', () => {
  for (const entryPoint of DELEGATING_ENTRY_POINTS) {
    const entryPointPath = join(ROOT, entryPoint.path);
    if (!existsSync(entryPointPath)) {
      it(`${entryPoint.name} — file exists`, () => {
        assert.fail(`Entry point file not found: ${entryPoint.path}`);
      });
      continue;
    }

    const fileContent = readFileSync(entryPointPath, 'utf-8');

    it(`${entryPoint.name} references .agent-context/rules/`, () => {
      assert.ok(
        fileContent.includes('.agent-context/rules/'),
        `${entryPoint.name} does not reference .agent-context/rules/`
      );
    });

    it(`${entryPoint.name} references .agent-context/stacks/`, () => {
      assert.ok(
        fileContent.includes('stacks/'),
        `${entryPoint.name} does not reference stacks/`
      );
    });

    it(`${entryPoint.name} references .agent-context/blueprints/`, () => {
      assert.ok(
        fileContent.includes('blueprint') || fileContent.includes('.agent-context/blueprints/'),
        `${entryPoint.name} does not reference blueprints`
      );
    });

    it(`${entryPoint.name} references .agent-context/review-checklists/`, () => {
      assert.ok(
        fileContent.includes('review-checklist') || fileContent.includes('pr-checklist'),
        `${entryPoint.name} does not reference review checklists`
      );
    });

    it(`${entryPoint.name} references state awareness`, () => {
      assert.ok(
        fileContent.includes('.agent-context/state/') || fileContent.includes('architecture-map'),
        `${entryPoint.name} does not reference state awareness`
      );
    });
  }
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

  it('mcp.json declares all 8 layer paths', () => {
    const mcpConfig = JSON.parse(readFileSync(mcpPath, 'utf-8'));
    const expectedLayerNames = ['rules', 'stacks', 'blueprints', 'skills', 'prompts', 'profiles', 'state', 'policies'];
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

  it('mcp.json sets autoLoad=true for all layers', () => {
    const mcpConfig = JSON.parse(readFileSync(mcpPath, 'utf-8'));
    const layerEntries = Object.entries(mcpConfig.knowledgeLayers.layers);
    const nonAutoLoadLayers = layerEntries
      .filter(([, layerConfig]) => layerConfig.autoLoad !== true)
      .map(([layerName]) => layerName);

    assert.deepStrictEqual(
      nonAutoLoadLayers,
      [],
      `These layers do not have autoLoad=true: ${nonAutoLoadLayers.join(', ')}`
    );
  });

  it('mcp.json includes full-knowledge-injection workflow', () => {
    const mcpConfig = JSON.parse(readFileSync(mcpPath, 'utf-8'));
    assert.ok(
      mcpConfig.workflows?.['full-knowledge-injection'],
      'full-knowledge-injection workflow missing from mcp.json'
    );
  });

  it('mcp.json injection workflow covers all 8 layers', () => {
    const mcpConfig = JSON.parse(readFileSync(mcpPath, 'utf-8'));
    const injectionSteps = mcpConfig.workflows['full-knowledge-injection'].steps;
    const expectedStepKeywords = ['rules', 'stacks', 'blueprints', 'skills', 'prompts', 'profiles', 'state', 'policies'];

    for (const keyword of expectedStepKeywords) {
      const hasStep = injectionSteps.some((step) => step.includes(keyword));
      assert.ok(hasStep, `Injection workflow missing step for: ${keyword}`);
    }
  });
});

// ── Test: .gitignore rule exists in git-workflow.md ─────────────────────────

describe('Gitignore Governance', () => {
  it('git-workflow.md contains .gitignore standards section', () => {
    const gitWorkflowPath = join(ROOT, '.agent-context/rules/git-workflow.md');
    const fileContent = readFileSync(gitWorkflowPath, 'utf-8');
    assert.ok(
      fileContent.includes('.gitignore') && fileContent.includes('.env'),
      'git-workflow.md must contain .gitignore standards with .env rules'
    );
  });

  it('security.md enforces .env is never committed', () => {
    const securityPath = join(ROOT, '.agent-context/rules/security.md');
    const fileContent = readFileSync(securityPath, 'utf-8');
    assert.ok(
      fileContent.includes('.env') && fileContent.includes('.gitignore'),
      'security.md must reference .env and .gitignore'
    );
  });
});
