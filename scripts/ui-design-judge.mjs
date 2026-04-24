#!/usr/bin/env node
// @ts-check

/**
 * ui-design-judge.mjs
 *
 * Advisory-default UI design contract judge.
 *
 * Repo-internal workflow audit; no user-facing runtime modes.
 * Stays advisory by default for this repository workflow, but genericityAutoFail
 * must escalate findings into blocking required actions when named drift signals
 * or forbidden patterns are detected.
 *
 * Validation anchors for repo governance:
 * - Do not reward generic SaaS defaults or popular template patterns.
 * - UI design judge only evaluates changed UI surfaces.
 * - Structured design execution summary was supplied to semantic review.
 * - designExecutionSignalCount
 * - designExecutionPolicy
 * - designExecutionHandoff
 * - handoffReady
 * - structuredInspectionAvailable
 */

import { collectChangedFiles, collectPullRequestDiff, isUiRelevantFilePath } from './ui-design-judge/git-input.mjs';
import { buildSystemPrompt, buildUserMessage } from './ui-design-judge/prompting.mjs';
import { selectAvailableProvider } from './ui-design-judge/providers.mjs';
import { calibrateGenericityAssessment } from './ui-design-judge/rubric-calibration.mjs';
import {
  buildReport,
  emitMachineReadableReport,
  extractVerdictObject,
  normalizeFindings,
  normalizeGenericityAssessment,
  normalizeRubricBreakdown,
} from './ui-design-judge/reporting.mjs';
import { loadDesignGuide, loadDesignIntent, summarizeDesignExecutionPolicy, summarizeReviewRubric } from './ui-design-judge/design-execution-summary.mjs';

function applyGenericityAutoFail({
  reviewRubricSummary,
  calibration,
  findings,
  notes,
}) {
  const autoFailEnabled = reviewRubricSummary?.genericityAutoFail === true;
  const namedGenericityDetected = Array.isArray(calibration?.matchedGenericitySignals)
    && calibration.matchedGenericitySignals.length > 0;
  const forbiddenPatternDetected = Array.isArray(calibration?.matchedForbiddenPatterns)
    && calibration.matchedForbiddenPatterns.length > 0;
  const shouldAutoFail = autoFailEnabled
    && calibration?.calibratedStatus === 'generic'
    && (namedGenericityDetected || forbiddenPatternDetected);

  if (!shouldAutoFail) {
    return {
      findings,
      notes,
      autoFailTriggered: false,
    };
  }

  const normalizedFindings = Array.isArray(findings) ? findings.map((finding) => ({ ...finding })) : [];
  const updatedFindings = normalizedFindings.length > 0
    ? normalizedFindings.map((finding) => ({
      ...finding,
      blockingRecommended: true,
    }))
    : [
      {
        area: 'design-contract',
        severity: 'high',
        problem: 'The UI matches named genericity drift signals that the contract marks as auto-fail.',
        evidence: `Matched signals: ${[...(calibration.matchedGenericitySignals || []), ...(calibration.matchedForbiddenPatterns || [])].join(', ')}`,
        requiredAction: 'Rebuild the affected UI surfaces from the contract and remove the named generic patterns instead of polishing them.',
        blockingRecommended: true,
      },
    ];

  return {
    findings: updatedFindings,
    notes: [
      ...(Array.isArray(notes) ? notes : []),
      'reviewRubric.genericityAutoFail triggered because named genericity drift signals or forbidden patterns were detected.',
    ],
    autoFailTriggered: true,
  };
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
        designExecutionSignalCount: 0,
      },
      notes: ['UI design judge only evaluates changed UI surfaces.'],
    }));
    return;
  }

  const designExecutionSummary = summarizeDesignExecutionPolicy(designIntentContent);
  const reviewRubricSummary = summarizeReviewRubric(designIntentContent);

  const systemPrompt = buildSystemPrompt();
  const userMessage = buildUserMessage(
    designIntentContent,
    designGuideContent,
    rawDiff,
    changedUiFiles,
    designExecutionSummary
  );

  const selectedProvider = selectAvailableProvider();
  if (!selectedProvider) {
    const calibration = calibrateGenericityAssessment({
      reviewRubricSummary,
      designExecutionSummary,
      genericityAssessment: { status: 'unclear', reason: 'No provider review was run.' },
      rubricBreakdown: [],
      findings: [],
      notes: [],
      tasteVsFailureSeparated: null,
    });

    emitMachineReadableReport(buildReport({
      provider: 'none',
      contractPresent: true,
      summary: {
        changedUiFileCount: changedUiFiles.length,
        alignmentScore: null,
        driftCount: 0,
        blockingCandidateCount: 0,
        designExecutionSignalCount: designExecutionSummary.enabledCapabilities.length,
        structuredInspectionAvailable: designExecutionSummary.structuredInspectionAvailable,
        genericityStatus: calibration.calibratedStatus,
      },
      designExecution: designExecutionSummary,
      rubric: {
        expectedDimensions: reviewRubricSummary.dimensions.map((dimension) => dimension.key),
        breakdown: [],
        genericityAssessment: {
          status: 'unclear',
          reason: 'No provider review was run.',
        },
        tasteVsFailureSeparated: null,
        calibration,
      },
      semanticJudge: {
        attempted: false,
        skipped: true,
        skipReason: 'no-provider-configured',
      },
      notes: [
        'No LLM provider configured. UI design judge skipped provider review and stayed advisory.',
        ...designExecutionSummary.notes,
      ],
    }));
    return;
  }

  let rawJudgeResponse;
  try {
    rawJudgeResponse = await selectedProvider.invokeProvider(systemPrompt, userMessage);
  } catch (providerError) {
    const calibration = calibrateGenericityAssessment({
      reviewRubricSummary,
      designExecutionSummary,
      genericityAssessment: { status: 'unclear', reason: 'Provider review failed before rubric scoring completed.' },
      rubricBreakdown: [],
      findings: [],
      notes: [],
      tasteVsFailureSeparated: null,
    });

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
        designExecutionSignalCount: designExecutionSummary.enabledCapabilities.length,
        structuredInspectionAvailable: designExecutionSummary.structuredInspectionAvailable,
        genericityStatus: calibration.calibratedStatus,
      },
      designExecution: designExecutionSummary,
      rubric: {
        expectedDimensions: reviewRubricSummary.dimensions.map((dimension) => dimension.key),
        breakdown: [],
        genericityAssessment: {
          status: 'unclear',
          reason: 'Provider review failed before rubric scoring completed.',
        },
        tasteVsFailureSeparated: null,
        calibration,
      },
      semanticJudge: {
        attempted: true,
        skipped: false,
        skipReason: null,
      },
      notes: [`Provider call failed: ${providerErrorMessage}`, ...designExecutionSummary.notes],
      passed: true,
    }));
    return;
  }

  const { verdict, malformed } = extractVerdictObject(rawJudgeResponse);
  const findings = normalizeFindings(verdict?.findings);
  const rubricBreakdown = normalizeRubricBreakdown(
    verdict?.rubricBreakdown,
    reviewRubricSummary.dimensions.map((dimension) => dimension.key)
  );
  const genericityAssessment = normalizeGenericityAssessment(verdict?.genericityAssessment);
  const tasteVsFailureSeparated = typeof verdict?.tasteVsFailureSeparated === 'boolean'
    ? verdict.tasteVsFailureSeparated
    : null;
  const alignmentScore = typeof verdict?.alignmentScore === 'number' ? verdict.alignmentScore : null;
  const notes = Array.isArray(verdict?.notes)
    ? verdict.notes.map((note) => String(note))
    : [];
  const calibration = calibrateGenericityAssessment({
    reviewRubricSummary,
    designExecutionSummary,
    genericityAssessment,
    rubricBreakdown,
    findings,
    notes,
    tasteVsFailureSeparated,
  });
  const autoFailResolution = applyGenericityAutoFail({
    reviewRubricSummary,
    calibration,
    findings,
    notes,
  });
  const resolvedFindings = autoFailResolution.findings;
  const resolvedNotes = autoFailResolution.notes;
  const blockingCandidateCount = resolvedFindings.filter((finding) => finding.blockingRecommended || finding.severity === 'high').length;

  emitMachineReadableReport(buildReport({
    provider: selectedProvider.providerName,
    contractPresent: true,
    passed: true,
    malformedVerdict: malformed,
    summary: {
      changedUiFileCount: changedUiFiles.length,
      alignmentScore,
      driftCount: resolvedFindings.length,
      blockingCandidateCount,
      designExecutionSignalCount: designExecutionSummary.enabledCapabilities.length,
      structuredInspectionAvailable: designExecutionSummary.structuredInspectionAvailable,
      genericityStatus: calibration.calibratedStatus,
    },
    designExecution: designExecutionSummary,
    rubric: {
      expectedDimensions: reviewRubricSummary.dimensions.map((dimension) => dimension.key),
      breakdown: rubricBreakdown,
      genericityAssessment,
      tasteVsFailureSeparated,
      calibration,
    },
    semanticJudge: {
      attempted: true,
      skipped: false,
      skipReason: null,
    },
    findings: resolvedFindings,
    notes: malformed
      ? ['LLM response was malformed. Advisory mode kept the audit non-blocking.', ...designExecutionSummary.notes]
      : [...resolvedNotes, ...calibration.notes, ...designExecutionSummary.notes],
  }));
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
