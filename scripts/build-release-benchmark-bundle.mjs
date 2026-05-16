#!/usr/bin/env node
// @ts-check

/**
 * build-release-benchmark-bundle.mjs
 *
 * Phase 5 Task 5.4. Reads the locked benchmark artifacts produced in Phases
 * 0-3 and emits a single release bundle that references each artifact by
 * SHA-256 hash plus a non-marketing summary section. The script never
 * regenerates Phase 0-3 numbers; it only references and hashes them.
 */

import { createHash } from 'node:crypto';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const SCRIPT_FILE_PATH = fileURLToPath(import.meta.url);
const REPOSITORY_ROOT = resolve(dirname(SCRIPT_FILE_PATH), '..');
const ARGS = new Set(process.argv.slice(2));
const JSON_ONLY = ARGS.has('--json');

const SOURCE_ARTIFACTS = [
  {
    artifactId: 'phase-0-baseline',
    relativePath: 'benchmarks/results/baseline-2026-05-16.json',
    role: 'token-baseline',
    description: 'Phase 0 token-usage baseline measured across providers using free count-tokens APIs and tiktoken estimates.',
  },
  {
    artifactId: 'phase-2-cache',
    relativePath: 'benchmarks/results/cache-phase-2-2026-05-16.json',
    role: 'cache-simulation',
    description: 'Phase 2 offline warm-cache simulation. Direct provider API integration mode; see docs/plan/research-foundation.md D4 for the per-tool scope matrix.',
  },
  {
    artifactId: 'phase-3-anti-halu',
    relativePath: 'benchmarks/results/anti-halu-phase-3-2026-05-16.json',
    role: 'anti-halu-benchmark',
    description: 'Phase 3 offline provider-free anti-halu benchmark.',
  },
  {
    artifactId: 'scorecard-2026-05-16',
    relativePath: 'benchmarks/results/scorecard-2026-05-16.json',
    role: 'supply-chain-snapshot',
    description: 'Phase 5 Task 5.3 supply-chain snapshot. Scorecard CLI was not installed locally; fallback signals are documented honestly.',
  },
];

function sha256Hex(buffer) {
  const hash = createHash('sha256');
  hash.update(buffer);
  return hash.digest('hex');
}

function loadArtifact(rootDir, descriptor) {
  const absolutePath = join(rootDir, descriptor.relativePath);
  if (!existsSync(absolutePath)) {
    return {
      ...descriptor,
      status: 'missing',
      sha256: null,
      sizeBytes: 0,
      summary: null,
    };
  }
  const content = readFileSync(absolutePath);
  const sha = sha256Hex(content);
  let summary = null;
  try {
    const parsed = JSON.parse(content.toString('utf8'));
    summary = summarizeArtifact(descriptor.role, parsed);
  } catch {
    summary = { error: 'artifact is not valid JSON' };
  }
  return {
    ...descriptor,
    status: 'present',
    sha256: sha,
    sizeBytes: content.length,
    summary,
  };
}

function summarizeArtifact(role, parsed) {
  if (!parsed || typeof parsed !== 'object') {
    return null;
  }
  if (role === 'token-baseline') {
    return {
      report_version: parsed.report_version || null,
      generated_at: parsed.generated_at || null,
      provider_count: Array.isArray(parsed.providers) ? parsed.providers.length : null,
    };
  }
  if (role === 'cache-simulation') {
    const anthropicWithLoaded = Array.isArray(parsed.summary)
      ? parsed.summary.find((row) => row.provider === 'anthropic' && row.scenario === 'with_loaded_rules')
      : null;
    return {
      report_version: parsed.report_version || null,
      integration_mode: parsed.integration_mode || null,
      fixture_count: parsed.fixture_count || null,
      provider_count: parsed.provider_count || null,
      anthropic_with_loaded_avg_total_input: anthropicWithLoaded?.average_total_input_tokens ?? null,
      anthropic_with_loaded_avg_warm_read: anthropicWithLoaded?.average_warm_read_effective_tokens ?? null,
      scope_caveat_present: typeof parsed.scope_caveat === 'string' && parsed.scope_caveat.length > 0,
    };
  }
  if (role === 'anti-halu-benchmark') {
    return {
      reportVersion: parsed.reportVersion || null,
      generatedAt: parsed.generatedAt || null,
      passRatePercent: parsed.passRatePercent ?? null,
      citationValidityRatePercent: parsed.citationValidityRatePercent ?? null,
      fixtureCount: parsed.fixtureCount ?? null,
      passedCount: parsed.passedCount ?? null,
      failedCount: parsed.failedCount ?? null,
    };
  }
  if (role === 'supply-chain-snapshot') {
    return {
      report_version: parsed.report_version || null,
      status: parsed.status || null,
      npm_audit_full: parsed.fallback_signals?.npm_audit_full || null,
      lockfile_consistent: parsed.fallback_signals?.lockfile_consistent ?? null,
      runtime_dependencies_count: parsed.fallback_signals?.runtime_dependencies_count ?? null,
    };
  }
  return null;
}

export function buildReleaseBenchmarkBundle(options = {}) {
  const rootDir = options.rootDir ? resolve(String(options.rootDir)) : REPOSITORY_ROOT;
  const artifacts = SOURCE_ARTIFACTS.map((descriptor) => loadArtifact(rootDir, descriptor));
  const missingArtifacts = artifacts.filter((artifact) => artifact.status === 'missing');

  return {
    bundle_version: '1.0.0',
    release_target: '4.0.0',
    release_status: 'release-candidate-unpublished',
    generated_at: new Date().toISOString(),
    description: 'Phase 5 release benchmark bundle. References Phase 0-3 locked artifacts plus the Phase 5 supply-chain snapshot. No artifact is regenerated by this bundle. Artifact integrity is verified by SHA-256 hash via scripts/audit-release-bundle.mjs.',
    sources: {
      research_foundation: 'docs/plan/research-foundation.md',
      d4_caching_scope_matrix: 'docs/plan/research-foundation.md#d4',
      caching_reporting_format: 'docs/benchmark-reference.md',
      phase_2_outcome: 'docs/plan/phase-2-outcome.md',
      phase_3_outcome: 'docs/plan/phase-3-outcome.md',
      phase_5_plan: 'docs/plan/phase-5-hardening.md',
    },
    integrity: {
      hash_algorithm: 'SHA-256',
      missing_artifact_count: missingArtifacts.length,
      missing_artifacts: missingArtifacts.map((artifact) => artifact.relativePath),
    },
    artifacts: artifacts.map((artifact) => ({
      artifact_id: artifact.artifactId,
      role: artifact.role,
      relative_path: artifact.relativePath,
      description: artifact.description,
      status: artifact.status,
      sha256: artifact.sha256,
      size_bytes: artifact.sizeBytes,
      summary: artifact.summary,
    })),
  };
}

function main() {
  const bundle = buildReleaseBenchmarkBundle();

  if (bundle.integrity.missing_artifact_count > 0) {
    process.stderr.write(`build-release-benchmark-bundle: ${bundle.integrity.missing_artifact_count} artifact(s) missing: ${bundle.integrity.missing_artifacts.join(', ')}\n`);
    process.exit(1);
  }

  const outputPath = join(REPOSITORY_ROOT, 'benchmarks', 'results', 'release-bundle-4.0.0.json');
  writeFileSync(outputPath, `${JSON.stringify(bundle, null, 2)}\n`, 'utf8');

  if (JSON_ONLY) {
    process.stdout.write(`${JSON.stringify(bundle, null, 2)}\n`);
    process.exit(0);
  }

  console.log('===============================================');
  console.log('  build-release-benchmark-bundle');
  console.log('===============================================');
  console.log(`  Release target:        ${bundle.release_target}`);
  console.log(`  Release status:        ${bundle.release_status}`);
  console.log(`  Artifact count:        ${bundle.artifacts.length}`);
  console.log(`  Missing artifacts:     ${bundle.integrity.missing_artifact_count}`);
  console.log(`  Output:                benchmarks/results/release-bundle-4.0.0.json`);
  console.log('');
  console.log('  Bundle written. Run scripts/audit-release-bundle.mjs to verify integrity before release.');
  process.exit(0);
}

if (process.argv[1] && (import.meta.url === `file://${process.argv[1].replace(/\\/g, '/')}` || process.argv[1].endsWith('build-release-benchmark-bundle.mjs'))) {
  main();
}
