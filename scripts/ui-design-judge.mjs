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
const DEFAULT_VISUAL_DIFF_REPORT_VERSION = 'hybrid-visual-diff-v1';
const DEFAULT_REQUIRED_VIEWPORTS = ['mobile', 'tablet', 'desktop'];

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
 *     meaningfulDiffViewportCount: number,
 *   },
 *   deterministicVisual: {
 *     reportPresent: boolean,
 *     reportVersion: string | null,
 *     baselineStrategy: string | null,
 *     coverageComplete: boolean,
 *     sectionCoverageRequired: boolean,
 *     requiredViewports: string[],
 *     coveredViewports: string[],
 *     missingViewports: string[],
 *     requiredSectionTypes: string[],
 *     coveredSectionTypes: string[],
 *     missingSectionTypes: string[],
 *     meaningfulDiffViewports: string[],
 *     meaningfulDiffSectionTypes: string[],
 *     maskedViewportCount: number,
 *     sectionCaptureCount: number,
 *     tileCaptureCount: number,
 *     semanticEscalationRecommended: boolean,
 *     notes: string[],
 *   },
 *   semanticJudge: {
 *     attempted: boolean,
 *     skipped: boolean,
 *     skipReason: string | null,
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

function toFiniteRatio(rawValue) {
  return typeof rawValue === 'number' && Number.isFinite(rawValue)
    ? rawValue
    : null;
}

function normalizeStringArray(rawValue) {
  if (!Array.isArray(rawValue)) {
    return [];
  }

  return rawValue
    .map((entryValue) => String(entryValue || '').trim())
    .filter(Boolean);
}

function loadDeterministicVisualReport() {
  if (process.env.UI_VISUAL_DIFF_REPORT_JSON) {
    try {
      return JSON.parse(process.env.UI_VISUAL_DIFF_REPORT_JSON);
    } catch {
      return {
        malformed: true,
        notes: ['UI_VISUAL_DIFF_REPORT_JSON could not be parsed as JSON.'],
      };
    }
  }

  if (process.env.UI_VISUAL_DIFF_REPORT_PATH) {
    const reportPath = resolve(REPOSITORY_ROOT, process.env.UI_VISUAL_DIFF_REPORT_PATH);
    if (!existsSync(reportPath)) {
      return {
        malformed: true,
        notes: [`UI_VISUAL_DIFF_REPORT_PATH does not exist: ${process.env.UI_VISUAL_DIFF_REPORT_PATH}`],
      };
    }

    try {
      return JSON.parse(readFileSync(reportPath, 'utf8'));
    } catch {
      return {
        malformed: true,
        notes: [`UI_VISUAL_DIFF_REPORT_PATH could not be parsed as JSON: ${process.env.UI_VISUAL_DIFF_REPORT_PATH}`],
      };
    }
  }

  return null;
}

function summarizeDeterministicVisualReport(rawVisualReport, designIntentContent) {
  const visualQaPolicy = designIntentContent?.visualQaPolicy && typeof designIntentContent.visualQaPolicy === 'object'
    ? designIntentContent.visualQaPolicy
    : {};
  const capturePlan = visualQaPolicy?.capturePlan && typeof visualQaPolicy.capturePlan === 'object'
    ? visualQaPolicy.capturePlan
    : {};
  const requiredViewports = normalizeStringArray(visualQaPolicy.requiredViewports);
  const normalizedRequiredViewports = requiredViewports.length > 0 ? requiredViewports : DEFAULT_REQUIRED_VIEWPORTS;
  const requiredSectionTypes = normalizeStringArray(capturePlan.requiredSectionTypes);
  const meaningfulDiffRatioThreshold = toFiniteRatio(visualQaPolicy?.semanticEscalation?.meaningfulDiffRatioThreshold) ?? 0.01;
  const maxUnmaskedDiffRatio = toFiniteRatio(visualQaPolicy?.stability?.maxUnmaskedDiffRatio) ?? 0.005;
  const maxMaskedDiffRatio = toFiniteRatio(visualQaPolicy?.stability?.maxMaskedDiffRatio) ?? 0.02;

  if (!rawVisualReport) {
    return {
      reportPresent: false,
      reportVersion: null,
      baselineStrategy: visualQaPolicy.baselineStrategy || null,
      coverageComplete: false,
      sectionCoverageRequired: capturePlan.requireSectionCapturesForLongPages === true,
      requiredViewports: normalizedRequiredViewports,
      coveredViewports: [],
      missingViewports: normalizedRequiredViewports,
      requiredSectionTypes,
      coveredSectionTypes: [],
      missingSectionTypes: requiredSectionTypes,
      meaningfulDiffViewports: [],
      meaningfulDiffSectionTypes: [],
      maskedViewportCount: 0,
      sectionCaptureCount: 0,
      tileCaptureCount: 0,
      semanticEscalationRecommended: false,
      notes: ['No deterministic visual diff report was supplied.'],
    };
  }

  if (rawVisualReport.malformed === true) {
    return {
      reportPresent: false,
      reportVersion: null,
      baselineStrategy: visualQaPolicy.baselineStrategy || null,
      coverageComplete: false,
      sectionCoverageRequired: capturePlan.requireSectionCapturesForLongPages === true,
      requiredViewports: normalizedRequiredViewports,
      coveredViewports: [],
      missingViewports: normalizedRequiredViewports,
      requiredSectionTypes,
      coveredSectionTypes: [],
      missingSectionTypes: requiredSectionTypes,
      meaningfulDiffViewports: [],
      meaningfulDiffSectionTypes: [],
      maskedViewportCount: 0,
      sectionCaptureCount: 0,
      tileCaptureCount: 0,
      semanticEscalationRecommended: true,
      notes: normalizeStringArray(rawVisualReport.notes).length > 0
        ? normalizeStringArray(rawVisualReport.notes)
        : ['Deterministic visual diff report was malformed.'],
    };
  }

  const viewportResults = Array.isArray(rawVisualReport.viewportResults)
    ? rawVisualReport.viewportResults
      .map((rawViewportResult) => {
        const viewportName = String(rawViewportResult?.viewport || '').trim().toLowerCase();
        const pixelDiffRatio = toFiniteRatio(rawViewportResult?.pixelDiffRatio);
        const maskedPixelDiffRatio = toFiniteRatio(rawViewportResult?.maskedPixelDiffRatio);
        const withinNoiseBudget = typeof rawViewportResult?.withinNoiseBudget === 'boolean'
          ? rawViewportResult.withinNoiseBudget
          : (pixelDiffRatio === null || pixelDiffRatio <= maxUnmaskedDiffRatio)
            && (maskedPixelDiffRatio === null || maskedPixelDiffRatio <= maxMaskedDiffRatio);
        const meaningfulDiff = typeof rawViewportResult?.meaningfulDiff === 'boolean'
          ? rawViewportResult.meaningfulDiff
          : (pixelDiffRatio !== null && pixelDiffRatio > meaningfulDiffRatioThreshold)
            || (maskedPixelDiffRatio !== null && maskedPixelDiffRatio > meaningfulDiffRatioThreshold);

        return {
          viewport: viewportName,
          pixelDiffRatio,
          maskedPixelDiffRatio,
          withinNoiseBudget,
          meaningfulDiff,
          dynamicMaskCategories: normalizeStringArray(rawViewportResult?.dynamicMaskCategories),
          notes: normalizeStringArray(rawViewportResult?.notes),
        };
      })
      .filter((viewportResult) => Boolean(viewportResult.viewport))
    : [];
  const sectionResults = Array.isArray(rawVisualReport.sectionResults)
    ? rawVisualReport.sectionResults
      .map((rawSectionResult) => {
        const sectionType = String(rawSectionResult?.sectionType || '').trim().toLowerCase();
        const captureKind = String(rawSectionResult?.captureKind || '').trim().toLowerCase();
        const tileIndex = Number.isInteger(rawSectionResult?.tileIndex) ? rawSectionResult.tileIndex : null;
        const pixelDiffRatio = toFiniteRatio(rawSectionResult?.pixelDiffRatio);
        const maskedPixelDiffRatio = toFiniteRatio(rawSectionResult?.maskedPixelDiffRatio);
        const withinNoiseBudget = typeof rawSectionResult?.withinNoiseBudget === 'boolean'
          ? rawSectionResult.withinNoiseBudget
          : (pixelDiffRatio === null || pixelDiffRatio <= maxUnmaskedDiffRatio)
            && (maskedPixelDiffRatio === null || maskedPixelDiffRatio <= maxMaskedDiffRatio);
        const meaningfulDiff = typeof rawSectionResult?.meaningfulDiff === 'boolean'
          ? rawSectionResult.meaningfulDiff
          : (pixelDiffRatio !== null && pixelDiffRatio > meaningfulDiffRatioThreshold)
            || (maskedPixelDiffRatio !== null && maskedPixelDiffRatio > meaningfulDiffRatioThreshold);

        return {
          sectionType,
          captureKind,
          tileIndex,
          pixelDiffRatio,
          maskedPixelDiffRatio,
          withinNoiseBudget,
          meaningfulDiff,
          notes: normalizeStringArray(rawSectionResult?.notes),
        };
      })
      .filter((sectionResult) => Boolean(sectionResult.sectionType))
    : [];

  const coveredViewports = Array.from(new Set(viewportResults.map((viewportResult) => viewportResult.viewport)));
  const missingViewports = normalizedRequiredViewports.filter((requiredViewport) => !coveredViewports.includes(requiredViewport));
  const sectionCoverageRequired = capturePlan.requireSectionCapturesForLongPages === true && (
    rawVisualReport.requiresSectionCoverage === true
    || String(rawVisualReport.pageLengthCategory || '').trim().toLowerCase() === 'long'
    || sectionResults.length > 0
  );
  const coveredSectionTypes = Array.from(new Set(sectionResults.map((sectionResult) => sectionResult.sectionType)));
  const missingSectionTypes = sectionCoverageRequired
    ? requiredSectionTypes.filter((requiredSectionType) => !coveredSectionTypes.includes(requiredSectionType))
    : [];
  const meaningfulDiffViewports = viewportResults
    .filter((viewportResult) => viewportResult.meaningfulDiff)
    .map((viewportResult) => viewportResult.viewport);
  const meaningfulDiffSectionTypes = Array.from(new Set(
    sectionResults
      .filter((sectionResult) => sectionResult.meaningfulDiff)
      .map((sectionResult) => sectionResult.sectionType)
  ));
  const maskedViewportCount = viewportResults.filter((viewportResult) => viewportResult.dynamicMaskCategories.length > 0).length;
  const tileCaptureCount = sectionResults.filter((sectionResult) => sectionResult.captureKind === 'tile').length;
  const reportNotes = normalizeStringArray(rawVisualReport.notes);

  const semanticEscalationRecommended = rawVisualReport?.summary?.semanticEscalationRecommended === true
    || meaningfulDiffViewports.length > 0
    || meaningfulDiffSectionTypes.length > 0
    || (
      visualQaPolicy?.semanticEscalation?.escalateWhenViewportCoverageIncomplete === true
      && missingViewports.length > 0
    )
    || (
      sectionCoverageRequired
      && missingSectionTypes.length > 0
    );
  const fallbackNotes = [];
  if (viewportResults.length === 0) {
    fallbackNotes.push('Deterministic visual diff report did not include viewportResults.');
  }
  if (sectionCoverageRequired && sectionResults.length === 0) {
    fallbackNotes.push('Long-page screenshot coverage was required, but sectionResults were not provided.');
  }
  if (sectionCoverageRequired && missingSectionTypes.length > 0) {
    fallbackNotes.push(`Long-page screenshot coverage is incomplete. Missing section captures: ${missingSectionTypes.join(', ')}.`);
  }

  return {
    reportPresent: true,
    reportVersion: String(rawVisualReport.reportVersion || DEFAULT_VISUAL_DIFF_REPORT_VERSION),
    baselineStrategy: String(rawVisualReport.baselineStrategy || visualQaPolicy.baselineStrategy || 'deterministic-screenshots'),
    coverageComplete: missingViewports.length === 0 && (!sectionCoverageRequired || missingSectionTypes.length === 0),
    sectionCoverageRequired,
    requiredViewports: normalizedRequiredViewports,
    coveredViewports,
    missingViewports,
    requiredSectionTypes,
    coveredSectionTypes,
    missingSectionTypes,
    meaningfulDiffViewports,
    meaningfulDiffSectionTypes,
    maskedViewportCount,
    sectionCaptureCount: sectionResults.length,
    tileCaptureCount,
    semanticEscalationRecommended,
    notes: reportNotes.length > 0
      ? reportNotes
      : fallbackNotes,
  };
}

function buildSystemPrompt() {
  return [
    'You are a Principal UI/UX Design Reviewer.',
    'Compare the changed UI code against the provided design contract.',
    'Treat docs/design-intent.json as the machine-readable source of truth.',
    'Treat docs/DESIGN.md as explanatory context, not a generic style guide.',
    'When deterministic visual diff evidence is provided, treat it as the first layer of truth for noise filtering, viewport coverage, long-page section coverage, and meaningful-drift detection.',
    'Do not reward generic SaaS defaults or popular template patterns.',
    'Do not penalize originality when the implementation still aligns with the contract.',
    'Purposeful motion is allowed and can improve quality. Only flag motion when it drifts from the contract, ignores reduced-motion expectations, or adds avoidable performance/accessibility risk.',
    'Only flag drift when there is a clear mismatch with the contract, accessibility non-negotiables, or cross-viewport adaptation rules.',
    'Treat WCAG 2.2 AA failures as hard accessibility drift.',
    'Treat APCA as advisory perceptual tuning only. Do not recommend blocking solely because APCA would prefer a stronger readability adjustment when WCAG hard requirements still pass.',
    'Check focus visibility, focus appearance, target size, keyboard access, accessible authentication, and status or dynamic state access when the diff touches those surfaces.',
    'This audit always runs in advisory mode for this repository workflow.',
    'Focus on color intent, typographic hierarchy, responsive re-layout, purposeful motion, component morphology across states, interaction behavior, and genericity drift.',
    'Return ONLY one JSON object on a single line prefixed with JSON_VERDICT:.',
    'Schema:',
    '{"alignmentScore": number|null, "notes": string[], "findings": [{"area": string, "severity": "high|medium|low", "problem": string, "evidence": string, "recommendation": string, "blockingRecommended": boolean}]}',
  ].join('\n');
}

function buildUserMessage(designIntentContent, designGuideContent, diffContent, changedUiFiles, deterministicVisualSummary) {
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
    '## Deterministic Visual Diff Summary',
    '```json',
    JSON.stringify(deterministicVisualSummary, null, 2),
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
    schemaVersion: '1.1',
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
      meaningfulDiffViewportCount: 0,
    },
    deterministicVisual: {
      reportPresent: false,
      reportVersion: null,
      baselineStrategy: null,
      coverageComplete: false,
      requiredViewports: [],
      coveredViewports: [],
      missingViewports: [],
      meaningfulDiffViewports: [],
      maskedViewportCount: 0,
      semanticEscalationRecommended: false,
      notes: [],
    },
    semanticJudge: {
      attempted: false,
      skipped: false,
      skipReason: null,
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
        meaningfulDiffViewportCount: 0,
      },
      notes: ['UI design judge only evaluates changed UI surfaces.'],
    }));
    return;
  }

  const deterministicVisualSummary = summarizeDeterministicVisualReport(
    loadDeterministicVisualReport(),
    designIntentContent
  );
  const shouldRunSemanticJudge = !deterministicVisualSummary.reportPresent
    || deterministicVisualSummary.semanticEscalationRecommended;

  if (!shouldRunSemanticJudge) {
    emitMachineReadableReport(buildReport({
      provider: 'none',
      contractPresent: true,
      summary: {
        changedUiFileCount: changedUiFiles.length,
        alignmentScore: null,
        driftCount: 0,
        blockingCandidateCount: 0,
        meaningfulDiffViewportCount: deterministicVisualSummary.meaningfulDiffViewports.length,
      },
      deterministicVisual: deterministicVisualSummary,
      semanticJudge: {
        attempted: false,
        skipped: true,
        skipReason: 'deterministic-clean',
      },
      notes: [
        'Deterministic visual diff reported no meaningful drift, so semantic review was skipped.',
        ...deterministicVisualSummary.notes,
      ],
    }));
    return;
  }

  const systemPrompt = buildSystemPrompt();
  const userMessage = buildUserMessage(
    designIntentContent,
    designGuideContent,
    rawDiff,
    changedUiFiles,
    deterministicVisualSummary
  );

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
        meaningfulDiffViewportCount: deterministicVisualSummary.meaningfulDiffViewports.length,
      },
      deterministicVisual: deterministicVisualSummary,
      semanticJudge: {
        attempted: false,
        skipped: true,
        skipReason: 'no-provider-configured',
      },
      notes: [
        'No LLM provider configured. UI design judge skipped provider review and stayed advisory.',
        ...deterministicVisualSummary.notes,
      ],
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
        meaningfulDiffViewportCount: deterministicVisualSummary.meaningfulDiffViewports.length,
      },
      deterministicVisual: deterministicVisualSummary,
      semanticJudge: {
        attempted: true,
        skipped: false,
        skipReason: null,
      },
      notes: [`Provider call failed: ${providerErrorMessage}`, ...deterministicVisualSummary.notes],
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
      meaningfulDiffViewportCount: deterministicVisualSummary.meaningfulDiffViewports.length,
    },
    deterministicVisual: deterministicVisualSummary,
    semanticJudge: {
      attempted: true,
      skipped: false,
      skipReason: null,
    },
    findings,
    notes: malformed
      ? ['LLM response was malformed. Advisory mode kept the audit non-blocking.', ...deterministicVisualSummary.notes]
      : [...notes, ...deterministicVisualSummary.notes],
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
