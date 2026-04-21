#!/usr/bin/env node
// @ts-check

/**
 * ui-design-judge.mjs
 *
 * Advisory-first UI design contract judge.
 *
 * Repo-internal workflow audit; no user-facing runtime modes.
 * Compares changed UI diffs against docs/design-intent.json and docs/DESIGN.md.
 * Runs only in advisory mode for this repository workflow.
 * Emits JSON to stdout for release-gate and CI consumption.
 */

import { execSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { resolve, dirname, extname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const REPOSITORY_ROOT = resolve(__dirname, '..');

const DESIGN_INTENT_PATH = resolve(REPOSITORY_ROOT, 'docs', 'design-intent.json');
const DESIGN_GUIDE_PATH = resolve(REPOSITORY_ROOT, 'docs', 'DESIGN.md');
const MAX_DIFF_CHARS = 12000;
const UI_FILE_EXTENSIONS = new Set(['.js', '.jsx', '.ts', '.tsx', '.vue', '.css', '.scss', '.sass']);

/**
 * @typedef {{
 *   area: string,
 *   severity: string,
 *   problem: string,
 *   evidence: string,
 *   recommendation: string,
 *   blockingRecommended: boolean,
 * }} DriftFinding
 */

/**
 * @typedef {{
 *   generatedAt: string,
 *   auditName: string,
 *   schemaVersion: string,
 *   mode: 'advisory',
 *   advisoryOnly: boolean,
 *   passed: boolean,
 *   skipped: boolean,
 *   skipReason: string | null,
 *   provider: string,
 *   ciProvider: string,
 *   contractPresent: boolean,
 *   summary: {
 *     changedUiFileCount: number,
 *     alignmentScore: number | null,
 *     driftCount: number,
 *     blockingCandidateCount: number,
 *   },
 *   malformedVerdict: boolean,
 *   providerError: boolean,
 *   findings: DriftFinding[],
 *   notes: string[],
 * }} UiDesignJudgeReport
 */

function detectCiProvider() {
  if (process.env.GITHUB_ACTIONS === 'true') {
    return 'github';
  }

  if (process.env.GITLAB_CI === 'true') {
    return 'gitlab';
  }

  return 'local';
}

function normalizeSeverity(rawSeverityValue) {
  const normalizedSeverityValue = String(rawSeverityValue || '').trim().toLowerCase();

  if (['critical', 'high', 'medium', 'low'].includes(normalizedSeverityValue)) {
    return normalizedSeverityValue;
  }

  if (normalizedSeverityValue === 'major') {
    return 'high';
  }

  if (normalizedSeverityValue === 'minor' || normalizedSeverityValue === 'info') {
    return 'low';
  }

  return 'low';
}

function collectGitDiff(baseSha, headSha) {
  const execOptions = {
    cwd: REPOSITORY_ROOT,
    encoding: /** @type {'utf-8'} */ ('utf-8'),
    maxBuffer: 1024 * 1024 * 8,
  };

  return execSync(`git diff "${baseSha}...${headSha}"`, execOptions);
}

function collectGitChangedFiles(baseSha, headSha) {
  const execOptions = {
    cwd: REPOSITORY_ROOT,
    encoding: /** @type {'utf-8'} */ ('utf-8'),
    maxBuffer: 1024 * 1024 * 2,
  };

  const output = execSync(`git diff --name-only "${baseSha}...${headSha}"`, execOptions);
  return output
    .split(/\r?\n/u)
    .map((filePath) => filePath.trim())
    .filter(Boolean);
}

function collectPullRequestDiff() {
  if (process.env.PR_DIFF) {
    return process.env.PR_DIFF;
  }

  const githubBaseSha = process.env.GITHUB_BASE_SHA;
  const githubHeadSha = process.env.GITHUB_HEAD_SHA ?? 'HEAD';
  if (githubBaseSha) {
    return collectGitDiff(githubBaseSha, githubHeadSha);
  }

  const gitlabBaseSha = process.env.CI_MERGE_REQUEST_DIFF_BASE_SHA;
  const gitlabHeadSha = process.env.CI_COMMIT_SHA ?? 'HEAD';
  if (gitlabBaseSha) {
    return collectGitDiff(gitlabBaseSha, gitlabHeadSha);
  }

  try {
    return execSync('git diff HEAD~1 HEAD', {
      cwd: REPOSITORY_ROOT,
      encoding: /** @type {'utf-8'} */ ('utf-8'),
      maxBuffer: 1024 * 1024 * 8,
    });
  } catch {
    try {
      const emptyTreeSha = '4b825dc642cb6eb9a060e54bf8d69288fbee4904';
      return execSync(`git diff "${emptyTreeSha}" HEAD`, {
        cwd: REPOSITORY_ROOT,
        encoding: /** @type {'utf-8'} */ ('utf-8'),
        maxBuffer: 1024 * 1024 * 8,
      });
    } catch {
      return '';
    }
  }
}

function collectChangedFiles() {
  if (process.env.PR_DIFF) {
    const filePathSet = new Set();
    for (const diffHeaderMatch of process.env.PR_DIFF.matchAll(/^diff --git a\/(.+?) b\/(.+)$/gm)) {
      filePathSet.add(diffHeaderMatch[2]);
    }
    return Array.from(filePathSet);
  }

  const githubBaseSha = process.env.GITHUB_BASE_SHA;
  const githubHeadSha = process.env.GITHUB_HEAD_SHA ?? 'HEAD';
  if (githubBaseSha) {
    return collectGitChangedFiles(githubBaseSha, githubHeadSha);
  }

  const gitlabBaseSha = process.env.CI_MERGE_REQUEST_DIFF_BASE_SHA;
  const gitlabHeadSha = process.env.CI_COMMIT_SHA ?? 'HEAD';
  if (gitlabBaseSha) {
    return collectGitChangedFiles(gitlabBaseSha, gitlabHeadSha);
  }

  try {
    const output = execSync('git diff --name-only HEAD~1 HEAD', {
      cwd: REPOSITORY_ROOT,
      encoding: /** @type {'utf-8'} */ ('utf-8'),
      maxBuffer: 1024 * 1024 * 2,
    });
    return output.split(/\r?\n/u).map((filePath) => filePath.trim()).filter(Boolean);
  } catch {
    return [];
  }
}

function isUiRelevantFilePath(filePath) {
  const normalizedFilePath = String(filePath || '').replace(/\\/g, '/').toLowerCase();
  const fileExtension = extname(normalizedFilePath);

  if (!UI_FILE_EXTENSIONS.has(fileExtension)) {
    return false;
  }

  return (
    normalizedFilePath.startsWith('src/')
    || normalizedFilePath.startsWith('app/')
    || normalizedFilePath.startsWith('pages/')
    || normalizedFilePath.startsWith('components/')
    || normalizedFilePath.startsWith('styles/')
    || normalizedFilePath.includes('/components/')
    || normalizedFilePath.includes('/screens/')
    || normalizedFilePath.includes('/layouts/')
  );
}

function loadDesignIntent() {
  if (!existsSync(DESIGN_INTENT_PATH)) {
    return null;
  }

  try {
    return JSON.parse(readFileSync(DESIGN_INTENT_PATH, 'utf8'));
  } catch {
    return null;
  }
}

function loadDesignGuide() {
  if (!existsSync(DESIGN_GUIDE_PATH)) {
    return '';
  }

  return readFileSync(DESIGN_GUIDE_PATH, 'utf8');
}

function buildSystemPrompt() {
  return [
    'You are a Principal UI/UX Design Reviewer.',
    'Compare the changed UI code against the provided design contract.',
    'Treat docs/design-intent.json as the machine-readable source of truth.',
    'Treat docs/DESIGN.md as explanatory context, not a generic style guide.',
    'Do not reward generic SaaS defaults or popular template patterns.',
    'Do not penalize originality when the implementation still aligns with the contract.',
    'Purposeful motion is allowed and can improve quality. Only flag motion when it drifts from the contract, ignores reduced-motion expectations, or adds avoidable performance/accessibility risk.',
    'Only flag drift when there is a clear mismatch with the contract, accessibility non-negotiables, or cross-viewport adaptation rules.',
    'This audit always runs in advisory mode for this repository workflow.',
    'Focus on color intent, typographic hierarchy, responsive re-layout, purposeful motion, component morphology across states, interaction behavior, and genericity drift.',
    'Return ONLY one JSON object on a single line prefixed with JSON_VERDICT:.',
    'Schema:',
    '{"alignmentScore": number|null, "notes": string[], "findings": [{"area": string, "severity": "high|medium|low", "problem": string, "evidence": string, "recommendation": string, "blockingRecommended": boolean}]}',
  ].join('\n');
}

function buildUserMessage(designIntentContent, designGuideContent, diffContent, changedUiFiles) {
  const truncatedDiff = diffContent.length > MAX_DIFF_CHARS
    ? `${diffContent.slice(0, MAX_DIFF_CHARS)}\n\n[DIFF TRUNCATED - ${diffContent.length - MAX_DIFF_CHARS} additional characters omitted]`
    : diffContent;

  return [
    '## Changed UI Files',
    changedUiFiles.length > 0 ? changedUiFiles.map((filePath) => `- ${filePath}`).join('\n') : '- none',
    '',
    '## design-intent.json',
    '```json',
    JSON.stringify(designIntentContent, null, 2),
    '```',
    '',
    '## DESIGN.md',
    '```md',
    designGuideContent.trim() || '(missing DESIGN.md)',
    '```',
    '',
    '## UI Diff',
    '```diff',
    truncatedDiff.trim() || '(no UI diff)',
    '```',
    '',
    'Judge alignment to the contract. Avoid aesthetic bias toward generic web trends or toward motionless/static outputs.',
  ].join('\n');
}

async function callOpenAiProvider(systemPrompt, userMessage) {
  const selectedModel = process.env.LLM_JUDGE_MODEL ?? 'gpt-4o-mini';
  const apiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      model: selectedModel,
      max_tokens: 2048,
      temperature: 0,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userMessage },
      ],
    }),
  });

  if (!apiResponse.ok) {
    const errorBody = await apiResponse.text();
    throw new Error(`OpenAI API returned ${apiResponse.status}: ${errorBody}`);
  }

  const responsePayload = await apiResponse.json();
  return responsePayload.choices[0].message.content;
}

async function callAnthropicProvider(systemPrompt, userMessage) {
  const selectedModel = process.env.LLM_JUDGE_MODEL ?? 'claude-3-5-haiku-latest';
  const apiResponse = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': process.env.ANTHROPIC_API_KEY ?? '',
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: selectedModel,
      max_tokens: 2048,
      system: systemPrompt,
      messages: [{ role: 'user', content: userMessage }],
    }),
  });

  if (!apiResponse.ok) {
    const errorBody = await apiResponse.text();
    throw new Error(`Anthropic API returned ${apiResponse.status}: ${errorBody}`);
  }

  const responsePayload = await apiResponse.json();
  return responsePayload.content[0].text;
}

async function callGeminiProvider(systemPrompt, userMessage) {
  const selectedModel = process.env.LLM_JUDGE_MODEL ?? 'gemini-2.0-flash';
  const apiKey = process.env.GEMINI_API_KEY ?? '';
  const endpointUrl = `https://generativelanguage.googleapis.com/v1beta/models/${selectedModel}:generateContent?key=${apiKey}`;

  const apiResponse = await fetch(endpointUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      system_instruction: { parts: [{ text: systemPrompt }] },
      contents: [{ role: 'user', parts: [{ text: userMessage }] }],
      generationConfig: { temperature: 0, maxOutputTokens: 2048 },
    }),
  });

  if (!apiResponse.ok) {
    const errorBody = await apiResponse.text();
    throw new Error(`Gemini API returned ${apiResponse.status}: ${errorBody}`);
  }

  const responsePayload = await apiResponse.json();
  return responsePayload.candidates[0].content.parts[0].text;
}

function selectAvailableProvider() {
  if (process.env.UI_DESIGN_JUDGE_MOCK_RESPONSE) {
    return {
      providerName: 'mock',
      invokeProvider: async () => process.env.UI_DESIGN_JUDGE_MOCK_RESPONSE,
    };
  }

  if (process.env.OPENAI_API_KEY) {
    return { providerName: 'openai', invokeProvider: callOpenAiProvider };
  }

  if (process.env.ANTHROPIC_API_KEY) {
    return { providerName: 'anthropic', invokeProvider: callAnthropicProvider };
  }

  if (process.env.GEMINI_API_KEY) {
    return { providerName: 'gemini', invokeProvider: callGeminiProvider };
  }

  return null;
}

function extractVerdictObject(rawResponseText) {
  const verdictMatch = rawResponseText.match(/JSON_VERDICT:\s*(\{[\s\S]*\})/i);
  if (!verdictMatch) {
    return { verdict: null, malformed: true };
  }

  try {
    return {
      verdict: JSON.parse(verdictMatch[1]),
      malformed: false,
    };
  } catch {
    return {
      verdict: null,
      malformed: true,
    };
  }
}

function normalizeFindings(rawFindings) {
  if (!Array.isArray(rawFindings)) {
    return [];
  }

  return rawFindings.map((rawFinding) => ({
    area: String(rawFinding?.area || 'general'),
    severity: normalizeSeverity(rawFinding?.severity),
    problem: String(rawFinding?.problem || 'No problem description provided.'),
    evidence: String(rawFinding?.evidence || 'No evidence provided.'),
    recommendation: String(rawFinding?.recommendation || 'No recommendation provided.'),
    blockingRecommended: rawFinding?.blockingRecommended === true,
  }));
}

/**
 * @param {Partial<UiDesignJudgeReport>} partialReport
 * @returns {UiDesignJudgeReport}
 */
function buildReport(partialReport) {
  return {
    generatedAt: new Date().toISOString(),
    auditName: 'ui-design-judge',
    schemaVersion: '1.0',
    mode: 'advisory',
    advisoryOnly: true,
    passed: true,
    skipped: false,
    skipReason: null,
    provider: 'none',
    ciProvider: detectCiProvider(),
    contractPresent: false,
    summary: {
      changedUiFileCount: 0,
      alignmentScore: null,
      driftCount: 0,
      blockingCandidateCount: 0,
    },
    malformedVerdict: false,
    providerError: false,
    findings: [],
    notes: [],
    ...partialReport,
  };
}

function emitMachineReadableReport(machineReportPayload) {
  console.log(JSON.stringify(machineReportPayload, null, 2));
}

async function main() {
  const changedFiles = collectChangedFiles();
  const changedUiFiles = changedFiles.filter(isUiRelevantFilePath);
  const rawDiff = collectPullRequestDiff();
  const designIntentContent = loadDesignIntent();
  const designGuideContent = loadDesignGuide();

  if (!designIntentContent) {
    emitMachineReadableReport(buildReport({
      skipped: true,
      skipReason: 'Design contract is missing or unreadable. Skipping UI design judge.',
      contractPresent: false,
      notes: ['docs/design-intent.json is required for contract-aware UI judging.'],
    }));
    return;
  }

  if (changedUiFiles.length === 0) {
    emitMachineReadableReport(buildReport({
      skipped: true,
      skipReason: 'No UI-relevant changed files detected.',
      contractPresent: true,
      summary: {
        changedUiFileCount: 0,
        alignmentScore: null,
        driftCount: 0,
        blockingCandidateCount: 0,
      },
      notes: ['UI design judge only evaluates changed UI surfaces.'],
    }));
    return;
  }

  const systemPrompt = buildSystemPrompt();
  const userMessage = buildUserMessage(designIntentContent, designGuideContent, rawDiff, changedUiFiles);

  const selectedProvider = selectAvailableProvider();
  if (!selectedProvider) {
    emitMachineReadableReport(buildReport({
      provider: 'none',
      contractPresent: true,
      summary: {
        changedUiFileCount: changedUiFiles.length,
        alignmentScore: null,
        driftCount: 0,
        blockingCandidateCount: 0,
      },
      notes: ['No LLM provider configured. UI design judge skipped provider review and stayed advisory.'],
    }));
    return;
  }

  let rawJudgeResponse;
  try {
    rawJudgeResponse = await selectedProvider.invokeProvider(systemPrompt, userMessage);
  } catch (providerError) {
    const providerErrorMessage = providerError instanceof Error
      ? providerError.message
      : 'Unknown provider error';

    emitMachineReadableReport(buildReport({
      provider: selectedProvider.providerName,
      contractPresent: true,
      providerError: true,
      summary: {
        changedUiFileCount: changedUiFiles.length,
        alignmentScore: null,
        driftCount: 0,
        blockingCandidateCount: 0,
      },
      notes: [`Provider call failed: ${providerErrorMessage}`],
      passed: true,
    }));
    return;
  }

  const { verdict, malformed } = extractVerdictObject(rawJudgeResponse);
  const findings = normalizeFindings(verdict?.findings);
  const blockingCandidateCount = findings.filter((finding) => finding.blockingRecommended || finding.severity === 'high').length;
  const alignmentScore = typeof verdict?.alignmentScore === 'number' ? verdict.alignmentScore : null;
  const notes = Array.isArray(verdict?.notes)
    ? verdict.notes.map((note) => String(note))
    : [];

  const reportPayload = buildReport({
    provider: selectedProvider.providerName,
    contractPresent: true,
    passed: true,
    malformedVerdict: malformed,
    summary: {
      changedUiFileCount: changedUiFiles.length,
      alignmentScore,
      driftCount: findings.length,
      blockingCandidateCount,
    },
    findings,
    notes: malformed
      ? ['LLM response was malformed. Advisory mode kept the audit non-blocking.']
      : notes,
  });

  emitMachineReadableReport(reportPayload);
}

main().catch((unexpectedError) => {
  const errorMessage = unexpectedError instanceof Error
    ? unexpectedError.message
    : 'Unknown unexpected error';

  emitMachineReadableReport(buildReport({
    provider: 'none',
    providerError: true,
    passed: true,
    notes: [`Unexpected ui-design-judge failure: ${errorMessage}`],
  }));
});
