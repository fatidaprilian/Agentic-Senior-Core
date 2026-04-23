// @ts-check

import { detectCiProvider } from './git-input.mjs';

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

export function extractVerdictObject(rawResponseText) {
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

export function normalizeFindings(rawFindings) {
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

function normalizeRubricVerdict(rawVerdictValue) {
  const normalizedVerdictValue = String(rawVerdictValue || '').trim().toLowerCase();
  if (['strong', 'acceptable', 'weak', 'unclear'].includes(normalizedVerdictValue)) {
    return normalizedVerdictValue;
  }
  return 'unclear';
}

export function normalizeRubricBreakdown(rawRubricBreakdown, expectedDimensions = []) {
  if (!Array.isArray(rawRubricBreakdown)) {
    return [];
  }

  const expectedDimensionNames = Array.isArray(expectedDimensions)
    ? expectedDimensions.map((dimension) => String(dimension || '').trim()).filter(Boolean)
    : [];

  return rawRubricBreakdown
    .map((rawDimensionEntry) => ({
      dimension: String(rawDimensionEntry?.dimension || '').trim(),
      score: typeof rawDimensionEntry?.score === 'number' && Number.isFinite(rawDimensionEntry.score)
        ? rawDimensionEntry.score
        : null,
      verdict: normalizeRubricVerdict(rawDimensionEntry?.verdict),
      reason: String(rawDimensionEntry?.reason || 'No rubric reason provided.'),
      blocking: rawDimensionEntry?.blocking === true,
    }))
    .filter((dimensionEntry) => {
      if (!dimensionEntry.dimension) {
        return false;
      }
      return expectedDimensionNames.length === 0 || expectedDimensionNames.includes(dimensionEntry.dimension);
    });
}

export function normalizeGenericityAssessment(rawGenericityAssessment) {
  const normalizedStatus = String(rawGenericityAssessment?.status || '').trim().toLowerCase();
  return {
    status: ['distinctive', 'mixed', 'generic', 'unclear'].includes(normalizedStatus)
      ? normalizedStatus
      : 'unclear',
    reason: String(rawGenericityAssessment?.reason || 'No genericity assessment provided.'),
  };
}

export function buildReport(partialReport) {
  return {
    generatedAt: new Date().toISOString(),
    auditName: 'ui-design-judge',
    schemaVersion: '1.2',
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
      designExecutionSignalCount: 0,
      genericityStatus: 'unclear',
    },
    designExecution: {
      policyPresent: false,
      representationStrategy: null,
      contractReady: false,
      screenshotDependencyForbidden: false,
      repoEvidenceAvailable: false,
      handoffPresent: false,
      handoffVersion: null,
      handoffReady: false,
      handoffArtifactCount: 0,
      presentHandoffArtifacts: [],
      missingHandoffArtifacts: [],
      repoEvidenceSummaryVersion: null,
      requiredCapabilities: [],
      enabledCapabilities: [],
      missingCapabilities: [],
      semanticReviewFocus: [],
      notes: [],
    },
    rubric: {
      expectedDimensions: [],
      breakdown: [],
      genericityAssessment: {
        status: 'unclear',
        reason: 'No genericity assessment provided.',
      },
      tasteVsFailureSeparated: null,
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

export function emitMachineReadableReport(machineReportPayload) {
  console.log(JSON.stringify(machineReportPayload, null, 2));
}
