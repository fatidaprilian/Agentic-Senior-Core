#!/usr/bin/env node
// @ts-check

/**
 * scripts/llm-judge.mjs
 *
 * LLM-as-a-Judge CI gate. Enforces pr-checklist.md on every pull request.
 *
 * Reads the git diff of the current PR, loads the PR checklist, sends both
 * to the first available LLM provider, and exits 1 when CRITICAL findings
 * exist (security gaps, N+1 queries, swallowed errors, hardcoded secrets,
 * layer boundary violations, SQL injection risks).
 *
 * Implementation is split per concern under scripts/llm-judge/. This entry
 * file owns the CLI orchestration only.
 *
 * Supported providers (auto-selected by first available env key):
 *   OPENAI_API_KEY    -> gpt-4o-mini  (override with LLM_JUDGE_MODEL)
 *   ANTHROPIC_API_KEY -> claude-3-5-haiku-latest
 *   GEMINI_API_KEY    -> gemini-2.0-flash
 *
 * Usage:
 *   node scripts/llm-judge.mjs            (auto-detect diff, call LLM)
 *   node scripts/llm-judge.mjs --dry-run  (print prompt, skip LLM call)
 *
 * Environment variables:
 *   OPENAI_API_KEY         OpenAI secret key
 *   ANTHROPIC_API_KEY      Anthropic secret key
 *   GEMINI_API_KEY         Google Gemini API key
 *   LLM_JUDGE_MODEL        Override model name for the selected provider
 *   LLM_MAX_DIFF_CHARS     Max characters of diff to send (default: 12000)
 *   PR_DIFF                Inject diff directly (bypasses git commands)
 *   GITHUB_BASE_SHA        Base commit SHA for GitHub Actions PR diffs
 *   GITHUB_HEAD_SHA        Head commit SHA for GitHub Actions PR diffs
 *   CI_MERGE_REQUEST_DIFF_BASE_SHA  Base SHA for GitLab MR diffs
 *   CI_COMMIT_SHA          Head SHA for GitLab MR diffs
 *
 * Zero external dependencies — uses Node.js built-ins only (Node 18+).
 */

import { IS_DRY_RUN, MAX_DIFF_CHARS } from './llm-judge/constants.mjs';
import { collectPullRequestDiff } from './llm-judge/diff-collection.mjs';
import { loadPrChecklist, loadThresholds } from './llm-judge/checklist-loader.mjs';
import { buildSystemPrompt, buildUserMessage } from './llm-judge/prompting.mjs';
import { selectAvailableProvider } from './llm-judge/providers.mjs';
import {
  buildMachineReportPayload,
  emitMachineReadableReport,
  extractVerdict,
  normalizeViolations,
} from './llm-judge/verdict.mjs';

async function main() {
  console.log('');
  console.log('🔍  LLM Judge — Automated Code Review Gate');
  console.log('════════════════════════════════════════════');
  console.log('');

  // ── Step 1: Load checklist and thresholds ──────────────
  const prChecklistContent = loadPrChecklist();
  const thresholdsObj = loadThresholds();
  const selectedProfile = thresholdsObj.selectedProfile || 'balanced';
  const profileConfig = thresholdsObj.profileThresholds[selectedProfile] || {};
  const blockingSeverities = profileConfig.blockingSeverities || ['critical', 'high'];
  const failOnMalformedResponse = profileConfig.failOnMalformedResponse !== false;
  const failOnProviderError = profileConfig.failOnProviderError || false;

  console.log(`✅  PR checklist loaded (${prChecklistContent.length} chars)`);
  console.log(`✅  Threshold profile loaded: ${selectedProfile} (blocking: ${blockingSeverities.join(', ')})`);

  // ── Step 2: Collect diff ────────────────────────────────
  const rawDiff = collectPullRequestDiff();
  console.log(`✅  Git diff collected (${rawDiff.length} chars${rawDiff.length > MAX_DIFF_CHARS ? ` — will truncate to ${MAX_DIFF_CHARS}` : ''})`);

  // ── Step 3: Build prompt ────────────────────────────────
  const systemPrompt = buildSystemPrompt();
  const userMessage = buildUserMessage(prChecklistContent, rawDiff);

  // ── Step 4: Dry run mode ────────────────────────────────
  if (IS_DRY_RUN) {
    console.log('');
    console.log('── DRY RUN MODE ──────────────────────────────────────────');
    console.log('[SYSTEM PROMPT PREVIEW]');
    console.log(systemPrompt.slice(0, 400) + '...');
    console.log('');
    console.log('[USER MESSAGE PREVIEW]');
    console.log(userMessage.slice(0, 400) + '...');
    console.log('─────────────────────────────────────────────────────────');
    console.log('');
    const dryRunReportPayload = buildMachineReportPayload({
      provider: 'dry-run',
      selectedProfile,
      blockingSeverities,
      finalViolations: [],
      blockingFound: [],
      isDryRun: true,
      malformedVerdict: false,
      providerError: false,
    });
    emitMachineReadableReport(dryRunReportPayload);
    console.log('VERDICT: JSON_VERDICT: []  (dry run — no LLM call made)');
    process.exit(0);
  }

  // ── Step 5: Select provider ─────────────────────────────
  const selectedProvider = selectAvailableProvider();
  if (!selectedProvider) {
    console.warn('');
    console.warn('⚠️   No LLM API key detected.');
    console.warn('    Set OPENAI_API_KEY, ANTHROPIC_API_KEY, or GEMINI_API_KEY');
    console.warn('    to enable automated code review.');
    console.warn('');
    console.warn('⏭️   Skipping LLM review — pipeline continues (PASS).');
    const skippedReportPayload = buildMachineReportPayload({
      provider: 'none',
      selectedProfile,
      blockingSeverities,
      finalViolations: [],
      blockingFound: [],
      isDryRun: false,
      malformedVerdict: false,
      providerError: false,
    });
    emitMachineReadableReport(skippedReportPayload);
    process.exit(0);
  }

  console.log(`✅  Provider selected: ${selectedProvider.providerName}`);
  if (process.env.LLM_JUDGE_MODEL) {
    console.log(`    Model override: ${process.env.LLM_JUDGE_MODEL}`);
  }
  console.log('');
  console.log('⏳  Sending diff to LLM for review...');
  console.log('');

  // ── Step 6: Call LLM ────────────────────────────────────
  let llmReviewText;
  try {
    llmReviewText = await selectedProvider.invokeProvider(systemPrompt, userMessage);
  } catch (providerCallError) {
    console.warn(`⚠️   LLM call failed: ${/** @type {Error} */ (providerCallError).message}`);
    const providerErrorReportPayload = buildMachineReportPayload({
      provider: selectedProvider.providerName,
      selectedProfile,
      blockingSeverities,
      finalViolations: [],
      blockingFound: [],
      isDryRun: false,
      malformedVerdict: false,
      providerError: Boolean(failOnProviderError),
    });
    emitMachineReadableReport(providerErrorReportPayload);
    if (failOnProviderError) {
      console.error('❌  Failing pipeline because provider errors are not allowed by the profile.');
      process.exit(1);
    }
    console.warn('    Skipping LLM review — pipeline continues (PASS).');
    process.exit(0);
  }

  // ── Step 7: Print report ────────────────────────────────
  console.log('── LLM Review Report ─────────────────────────────────────');
  console.log('');
  console.log(llmReviewText);
  console.log('');
  console.log('──────────────────────────────────────────────────────────');
  console.log('');

  // ── Step 8: Enforce verdict ─────────────────────────────
  const rawVerdictViolations = extractVerdict(llmReviewText, failOnMalformedResponse);
  const finalViolations = normalizeViolations(rawVerdictViolations);
  const hasMalformedVerdict = !/JSON_VERDICT:\s*\[/i.test(llmReviewText);

  const blockingFound = finalViolations.filter((v) => blockingSeverities.includes(v.severity.toLowerCase()));
  const machineReportPayload = buildMachineReportPayload({
    provider: selectedProvider.providerName,
    selectedProfile,
    blockingSeverities,
    finalViolations,
    blockingFound,
    isDryRun: false,
    malformedVerdict: hasMalformedVerdict,
    providerError: false,
  });
  emitMachineReadableReport(machineReportPayload);

  if (blockingFound.length > 0) {
    console.error(`❌  LLM Judge: ${blockingFound.length} blocking violations found (severities: ${blockingSeverities.join(', ')}). Pipeline FAILED.`);
    console.error('    Fix the issues listed above before merging.');
    process.exit(1);
  }

  console.log('✅  LLM Judge: No blocking violations. Pipeline PASSED.');
  process.exit(0);
}

main().catch((unexpectedError) => {
  console.error('❌  Unexpected error in llm-judge:', unexpectedError);
  process.exit(1);
});
