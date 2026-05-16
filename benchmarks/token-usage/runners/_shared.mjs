/**
 * _shared.mjs
 *
 * Shared utilities for per-provider token-usage runners.
 *
 * Defines how the rules pack is assembled into a system prompt for measurement.
 * Phase 0 measures two scenarios per fixture:
 *   1. 'always-included' — AGENTS.md only (the lower-bound system prompt)
 *   2. 'with-loaded-rules' — AGENTS.md + rule files matched to the fixture's
 *      expected_rules_triggered list (the realistic on-demand-routed prompt)
 *
 * Together those numbers describe the current honest state of the rules pack
 * delivery: AGENTS.md is always shipped, and rules are loaded on-demand per
 * the routing table in AGENTS.md.
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildCacheLayerContract, validateCacheLayerContract } from '../lib/cache-layer-contract.mjs';

const SHARED_FILE_PATH = fileURLToPath(import.meta.url);
const SHARED_DIR = path.dirname(SHARED_FILE_PATH);
export const REPOSITORY_ROOT = path.resolve(SHARED_DIR, '..', '..', '..');

const AGENTS_MD_PATH = path.join(REPOSITORY_ROOT, 'AGENTS.md');
const RULES_DIR = path.join(REPOSITORY_ROOT, '.agent-context', 'rules');
const PROMPTS_DIR = path.join(REPOSITORY_ROOT, '.agent-context', 'prompts');
const REVIEW_CHECKLISTS_DIR = path.join(REPOSITORY_ROOT, '.agent-context', 'review-checklists');
const FIXTURES_DIR = path.join(REPOSITORY_ROOT, 'benchmarks', 'token-usage', 'fixtures');

/**
 * Resolve a rule slug from expected_rules_triggered to its file content. Returns
 * null when the slug does not map to a file (e.g. virtual prompts referenced by
 * the fixture but not present as standalone files in the rules pack).
 *
 * @param {string} ruleSlug
 * @returns {{ slug: string, source: string, filePath: string, content: string } | null}
 */
export function resolveRuleSlug(ruleSlug) {
  const candidates = [
    { source: 'rules', dir: RULES_DIR },
    { source: 'prompts', dir: PROMPTS_DIR },
    { source: 'review-checklists', dir: REVIEW_CHECKLISTS_DIR },
  ];
  for (const candidate of candidates) {
    const filePath = path.join(candidate.dir, `${ruleSlug}.md`);
    if (fs.existsSync(filePath)) {
      return {
        slug: ruleSlug,
        source: candidate.source,
        filePath,
        content: fs.readFileSync(filePath, 'utf8'),
      };
    }
  }
  return null;
}

/**
 * Read AGENTS.md from the repo root. This is always included in the system prompt
 * for every task in Phase 0 baseline.
 *
 * @returns {string}
 */
export function readAgentsMarkdown() {
  return fs.readFileSync(AGENTS_MD_PATH, 'utf8');
}

/**
 * Load all fixtures in a deterministic alphabetical order.
 *
 * @returns {Array<{
 *   id: string,
 *   category: string,
 *   description: string,
 *   user_message: string,
 *   expected_rules_triggered: string[],
 *   context_size_target: string,
 *   _filename: string,
 * }>}
 */
export function loadFixtures() {
  const filenames = fs
    .readdirSync(FIXTURES_DIR)
    .filter((filename) => filename.endsWith('.json'))
    .sort();
  return filenames.map((filename) => {
    const fullPath = path.join(FIXTURES_DIR, filename);
    const parsed = JSON.parse(fs.readFileSync(fullPath, 'utf8'));
    parsed._filename = filename;
    return parsed;
  });
}

function buildRuleAssembly(fixture) {
  const resolvedRules = [];
  const unresolvedRules = [];
  const ruleBodies = [];
  const ruleInputSources = [];

  for (const ruleSlug of fixture.expected_rules_triggered ?? []) {
    const resolved = resolveRuleSlug(ruleSlug);
    if (resolved === null) {
      unresolvedRules.push(ruleSlug);
      continue;
    }
    resolvedRules.push(ruleSlug);
    ruleInputSources.push(`${resolved.source}/${resolved.slug}.md`);
    ruleBodies.push(
      [
        `# -- ${resolved.source}/${resolved.slug}.md --`,
        resolved.content.trimEnd(),
      ].join('\n'),
    );
  }

  return {
    resolvedRules,
    unresolvedRules,
    ruleBodies,
    ruleInputSources,
    semiStaticContext: ruleBodies.join('\n\n'),
  };
}

/**
 * Build the two scenario prompts for a fixture.
 *
 * Scenario 1 'always-included' is just AGENTS.md.
 * Scenario 2 'with-loaded-rules' is AGENTS.md plus the resolvable subset of
 * expected_rules_triggered, concatenated with file separators that mirror how the
 * MCP server delivers them.
 *
 * @param {object} fixture
 * @returns {{
 *   alwaysIncluded: { systemPrompt: string, components: object },
 *   withLoadedRules: {
 *     systemPrompt: string,
 *     components: object,
 *     resolvedRules: string[],
 *     unresolvedRules: string[],
 *   },
 *   userMessage: string,
 * }}
 */
export function buildScenarioPrompts(fixture) {
  const agentsMarkdown = readAgentsMarkdown();
  const alwaysIncludedSystemPrompt = agentsMarkdown;

  const resolvedRules = [];
  const unresolvedRules = [];
  const ruleBodies = [];
  for (const ruleSlug of fixture.expected_rules_triggered ?? []) {
    const resolved = resolveRuleSlug(ruleSlug);
    if (resolved === null) {
      unresolvedRules.push(ruleSlug);
      continue;
    }
    resolvedRules.push(ruleSlug);
    ruleBodies.push(
      [
        `# ── ${resolved.source}/${resolved.slug}.md ──`,
        resolved.content.trimEnd(),
      ].join('\n'),
    );
  }

  const withLoadedRulesSystemPrompt = [agentsMarkdown.trimEnd(), ...ruleBodies].join('\n\n');

  return {
    alwaysIncluded: {
      systemPrompt: alwaysIncludedSystemPrompt,
      components: {
        agents_md: agentsMarkdown.length,
      },
    },
    withLoadedRules: {
      systemPrompt: withLoadedRulesSystemPrompt,
      components: {
        agents_md: agentsMarkdown.length,
        loaded_rules_chars: ruleBodies.join('\n\n').length,
      },
      resolvedRules,
      unresolvedRules,
    },
    userMessage: fixture.user_message,
  };
}

/**
 * Build Phase 2 cache-layer contracts for each historical benchmark scenario.
 * This keeps measureFixture output unchanged while giving cache simulation code
 * a deterministic layered view of the same fixture assembly.
 *
 * @param {object} fixture
 * @returns {object}
 */
export function buildCacheLayeredScenarioPrompts(fixture) {
  const built = buildScenarioPrompts(fixture);
  const agentsMarkdown = readAgentsMarkdown();
  const ruleAssembly = buildRuleAssembly(fixture);
  const staticPrefix = agentsMarkdown;
  const userMessage = built.userMessage ?? '';
  const legacyLoadedPromptPrefix = agentsMarkdown.trimEnd();
  const semiStaticContext = built.withLoadedRules.systemPrompt
    .startsWith(legacyLoadedPromptPrefix)
    ? built.withLoadedRules.systemPrompt
      .slice(legacyLoadedPromptPrefix.length)
      .replace(/^\n\n/, '')
    : ruleAssembly.semiStaticContext;

  const alwaysIncluded = buildCacheLayerContract({
    layer1StaticPrefix: staticPrefix,
    layer2SemiStaticContext: '',
    layer3DynamicSuffix: userMessage,
    layer2InputSources: [],
  });
  const withLoadedRules = buildCacheLayerContract({
    layer1StaticPrefix: staticPrefix,
    layer2SemiStaticContext: semiStaticContext,
    layer3DynamicSuffix: userMessage,
    layer2InputSources: ruleAssembly.ruleInputSources,
  });

  validateCacheLayerContract(alwaysIncluded);
  validateCacheLayerContract(withLoadedRules);

  return {
    alwaysIncluded,
    withLoadedRules: {
      ...withLoadedRules,
      resolvedRules: built.withLoadedRules.resolvedRules,
      unresolvedRules: built.withLoadedRules.unresolvedRules,
    },
    userMessage,
  };
}

/**
 * Run a token-counting function across both scenarios for one fixture and produce
 * a normalized result entry. The countFn is provider-specific and is supplied by
 * each runner.
 *
 * @param {object} fixture
 * @param {{ provider: string, model: string }} providerSpec
 * @param {(text: string, provider: string, model: string) => Promise<{token_count: number, method: string, accurate: boolean}>} countFn
 * @returns {Promise<object>}
 */
export async function measureFixture(fixture, providerSpec, countFn) {
  const built = buildScenarioPrompts(fixture);
  const userMessageCount = await countFn(built.userMessage, providerSpec.provider, providerSpec.model);
  const alwaysIncludedSystemCount = await countFn(
    built.alwaysIncluded.systemPrompt,
    providerSpec.provider,
    providerSpec.model,
  );
  const withLoadedRulesSystemCount = await countFn(
    built.withLoadedRules.systemPrompt,
    providerSpec.provider,
    providerSpec.model,
  );

  const fallbackReasons = Array.from(
    new Set(
      [userMessageCount, alwaysIncludedSystemCount, withLoadedRulesSystemCount]
        .map((r) => r.fallback_reason)
        .filter((r) => typeof r === 'string' && r.length > 0),
    ),
  );

  return {
    fixture_id: fixture.id,
    fixture_filename: fixture._filename,
    fixture_category: fixture.category,
    provider: providerSpec.provider,
    model: providerSpec.model,
    measurement_method: alwaysIncludedSystemCount.method,
    accurate: alwaysIncludedSystemCount.accurate
      && withLoadedRulesSystemCount.accurate
      && userMessageCount.accurate,
    fallback_reasons: fallbackReasons,
    scenarios: {
      always_included: {
        description: 'AGENTS.md only — lower-bound system prompt always shipped to the agent',
        input_token_breakdown: {
          system_prompt: alwaysIncludedSystemCount.token_count,
          user_message: userMessageCount.token_count,
          total: alwaysIncludedSystemCount.token_count + userMessageCount.token_count,
        },
        component_chars: built.alwaysIncluded.components,
      },
      with_loaded_rules: {
        description:
          'AGENTS.md plus rules resolved from expected_rules_triggered — realistic on-demand-routed delivery',
        input_token_breakdown: {
          system_prompt: withLoadedRulesSystemCount.token_count,
          user_message: userMessageCount.token_count,
          total: withLoadedRulesSystemCount.token_count + userMessageCount.token_count,
        },
        component_chars: built.withLoadedRules.components,
        resolved_rules: built.withLoadedRules.resolvedRules,
        unresolved_rules: built.withLoadedRules.unresolvedRules,
      },
    },
  };
}
