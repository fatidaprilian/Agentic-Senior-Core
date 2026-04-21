import { describe, it } from 'node:test';
import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';

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
    name: 'Layer 2: Stack Strategy Signals',
    requiredPaths: [],
    injectionKeywords: ['Stack Strategy Signals', 'dynamic stack intelligence'],
  },
  {
    name: 'Layer 3: Architecture Playbooks',
    requiredPaths: [],
    injectionKeywords: ['Architecture Playbooks', 'dynamic architecture intelligence'],
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
  { name: '.instructions.md', path: '.instructions.md' },
];

/**
 * Delegating entry points that reference the full-injection files.
 * These must at minimum reference .agent-context/rules/ and point
 * to AGENTS.md or .instructions.md for the rest.
 */
const DELEGATING_ENTRY_POINTS = [
  { name: 'AGENTS.md', path: 'AGENTS.md', delegatesTo: ['.instructions.md'] },
  { name: 'copilot-instructions.md', path: '.github/copilot-instructions.md', delegatesTo: ['.instructions.md'] },
  { name: '.cursorrules', path: '.cursorrules', delegatesTo: ['.cursorrules'] },
  { name: '.windsurfrules', path: '.windsurfrules', delegatesTo: ['.cursorrules'] },
  { name: '.gemini/instructions.md', path: '.gemini/instructions.md', delegatesTo: ['.instructions.md'] },
];

const THIN_ADAPTER_ENTRY_POINTS = [
  { name: 'AGENTS.md', path: 'AGENTS.md' },
  { name: 'copilot-instructions.md', path: '.github/copilot-instructions.md' },
  { name: '.gemini/instructions.md', path: '.gemini/instructions.md' },
];

function normalizeLineEndings(content) {
  return content.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
}

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
  it('.instructions.md keeps Layer 2 and Layer 3 explicitly adaptive', () => {
    const instructionsContent = readFileSync(join(ROOT, '.instructions.md'), 'utf-8');

    assert.match(instructionsContent, /illustrative, not exhaustive/i);
    assert.match(instructionsContent, /Do not force the project into the nearest listed stack/i);
    assert.match(instructionsContent, /not a hard whitelist/i);
    assert.match(instructionsContent, /choose or synthesize the best-fit playbook/i);
  });
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

    it(`${entryPoint.name} references stack strategy guidance`, () => {
      const normalized = fileContent.toLowerCase();
      assert.ok(
        normalized.includes('stack') && (normalized.includes('dynamic') || normalized.includes('evidence')),
        `${entryPoint.name} does not reference stack strategy guidance`
      );
    });

    it(`${entryPoint.name} references architecture playbooks`, () => {
      const normalized = fileContent.toLowerCase();
      assert.ok(
        normalized.includes('architecture') || normalized.includes('playbook'),
        `${entryPoint.name} does not reference architecture playbooks`
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

    for (const delegateTarget of entryPoint.delegatesTo) {
      it(`${entryPoint.name} delegates to ${delegateTarget}`, () => {
        assert.ok(
          fileContent.includes(delegateTarget),
          `${entryPoint.name} does not delegate to ${delegateTarget}`
        );
      });
    }
  }
});

describe('Thin Adapter Drift Metadata', () => {
  const canonicalInstructionPath = join(ROOT, '.instructions.md');
  const canonicalInstructionContent = normalizeLineEndings(readFileSync(canonicalInstructionPath, 'utf-8'));
  const canonicalSnapshotHash = createHash('sha256').update(canonicalInstructionContent).digest('hex');

  for (const adapterEntryPoint of THIN_ADAPTER_ENTRY_POINTS) {
    const adapterEntryPointPath = join(ROOT, adapterEntryPoint.path);

    it(`${adapterEntryPoint.name} is explicitly thin adapter`, () => {
      const adapterContent = readFileSync(adapterEntryPointPath, 'utf-8');
      assert.ok(
        adapterContent.includes('Adapter Mode: thin')
        && adapterContent.includes('Adapter Source: .instructions.md'),
        `${adapterEntryPoint.name} must declare thin adapter metadata`
      );
    });

    it(`${adapterEntryPoint.name} hash matches canonical snapshot`, () => {
      const adapterContent = readFileSync(adapterEntryPointPath, 'utf-8');
      const hashMatch = adapterContent.match(/Canonical Snapshot SHA256:\s*([a-f0-9]{64})/);
      assert.ok(hashMatch, `${adapterEntryPoint.name} must declare Canonical Snapshot SHA256`);
      assert.equal(
        hashMatch[1],
        canonicalSnapshotHash,
        `${adapterEntryPoint.name} hash metadata drifted from .instructions.md`
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
    const expectedLayerNames = ['rules', 'stack-strategies', 'architecture-playbooks', 'execution-contracts', 'prompts', 'governance-modes', 'state', 'policies'];
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
    const expectedStepKeywords = ['rules', 'stack', 'architecture', 'execution', 'prompts', 'governance', 'state', 'policies'];

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
