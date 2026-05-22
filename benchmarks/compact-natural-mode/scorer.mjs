import { estimateOutputTokens } from '../../lib/cli/ascx/token-estimate.mjs';

const DEFAULT_MINIMUM_CQS = 0.8;
const DEFAULT_MINIMUM_REDUCTION_PERCENT = 0;

const FILLER_PATTERNS = [
  /\bsure[,.!]?/iu,
  /\bgreat question\b/iu,
  /\bi(?:'|’)ll now\b/iu,
  /\blet me\b/iu,
  /\bi(?:'|’)d be happy to\b/iu,
  /\bhope this helps\b/iu,
  /\blet me know if\b/iu,
];

const REGISTER_FAILURE_PATTERNS = [
  /\bwhy use many token\b/iu,
  /\boog\b/iu,
  /\bcaveman\b/iu,
  /\bgrunt\b/iu,
  /\bbrain still big\b/iu,
];

function normalizeText(value) {
  return String(value || '').toLowerCase();
}

function toRequirementLabel(requirementEntry, fallbackIndex) {
  if (typeof requirementEntry === 'string') {
    return requirementEntry;
  }

  return requirementEntry.id || requirementEntry.text || requirementEntry.regex || `requirement-${fallbackIndex + 1}`;
}

function matchRequirement(text, requirementEntry) {
  const rawText = String(text || '');
  const normalized = normalizeText(rawText);

  if (typeof requirementEntry === 'string') {
    return normalized.includes(normalizeText(requirementEntry));
  }

  if (requirementEntry.text) {
    return normalized.includes(normalizeText(requirementEntry.text));
  }

  if (Array.isArray(requirementEntry.all)) {
    return requirementEntry.all.every((part) => normalized.includes(normalizeText(part)));
  }

  if (Array.isArray(requirementEntry.any)) {
    return requirementEntry.any.some((part) => normalized.includes(normalizeText(part)));
  }

  if (requirementEntry.regex) {
    return new RegExp(requirementEntry.regex, 'iu').test(rawText);
  }

  return false;
}

function findMissingRequirements(text, requirementEntries) {
  return (requirementEntries || []).filter((requirementEntry, index) => {
    return !matchRequirement(text, requirementEntry);
  }).map(toRequirementLabel);
}

function findMatchedPatterns(text, patterns) {
  return (patterns || []).filter((patternEntry) => {
    if (patternEntry instanceof RegExp) {
      return patternEntry.test(text);
    }

    return new RegExp(String(patternEntry), 'iu').test(text);
  }).map((patternEntry) => String(patternEntry));
}

function countSentences(text) {
  const matches = String(text || '').match(/[^.!?\n]+[.!?]/gu);

  return matches ? matches.length : 0;
}

function scoreCoverage(totalCount, missingCount) {
  if (totalCount === 0) {
    return 3;
  }

  const coverage = (totalCount - missingCount) / totalCount;

  if (coverage === 1) {
    return 3;
  }

  if (coverage >= 0.75) {
    return 2;
  }

  if (coverage >= 0.5) {
    return 1;
  }

  return 0;
}

function scoreRegister({ candidateText, fixtureEntry }) {
  const matchedGlobalPatterns = findMatchedPatterns(candidateText, REGISTER_FAILURE_PATTERNS);
  const matchedFixturePatterns = findMatchedPatterns(candidateText, fixtureEntry.forbiddenRegisterPatterns || []);
  const violationCount = matchedGlobalPatterns.length + matchedFixturePatterns.length;

  if (violationCount === 0) {
    return {
      score: 3,
      matchedGlobalPatterns,
      matchedFixturePatterns,
    };
  }

  if (violationCount === 1) {
    return {
      score: 2,
      matchedGlobalPatterns,
      matchedFixturePatterns,
    };
  }

  if (violationCount === 2) {
    return {
      score: 1,
      matchedGlobalPatterns,
      matchedFixturePatterns,
    };
  }

  return {
    score: 0,
    matchedGlobalPatterns,
    matchedFixturePatterns,
  };
}

function scoreRedundancy({
  baselineText,
  candidateText,
  reductionPercent,
  fixtureEntry,
}) {
  const fillerMatches = findMatchedPatterns(candidateText, FILLER_PATTERNS);
  const baselineSentenceCount = countSentences(baselineText);
  const candidateSentenceCount = countSentences(candidateText);
  const targetReduction = typeof fixtureEntry.redundancyReductionTargetPercent === 'number'
    ? fixtureEntry.redundancyReductionTargetPercent
    : Math.min(Math.max(fixtureEntry.minimumReductionPercent || 0, 10), 35);
  const sentenceRatio = baselineSentenceCount === 0
    ? 1
    : candidateSentenceCount / baselineSentenceCount;

  if (fillerMatches.length === 0 && reductionPercent >= targetReduction && sentenceRatio <= 1) {
    return {
      score: 3,
      fillerMatches,
      baselineSentenceCount,
      candidateSentenceCount,
      targetReduction,
    };
  }

  if (fillerMatches.length <= 1 && reductionPercent >= 0 && sentenceRatio <= 1.2) {
    return {
      score: 2,
      fillerMatches,
      baselineSentenceCount,
      candidateSentenceCount,
      targetReduction,
    };
  }

  if (fillerMatches.length <= 2) {
    return {
      score: 1,
      fillerMatches,
      baselineSentenceCount,
      candidateSentenceCount,
      targetReduction,
    };
  }

  return {
    score: 0,
    fillerMatches,
    baselineSentenceCount,
    candidateSentenceCount,
    targetReduction,
  };
}

export function scoreCompactNaturalCandidate(fixtureEntry, candidateText) {
  const baselineText = fixtureEntry.baseline || '';
  const rawTokens = estimateOutputTokens(baselineText);
  const compactTokens = estimateOutputTokens(candidateText);
  const reductionPercent = rawTokens === 0
    ? 0
    : Number((((rawTokens - compactTokens) / rawTokens) * 100).toFixed(2));
  const missingEvidenceAtoms = findMissingRequirements(candidateText, fixtureEntry.evidenceAtoms);
  const missingRequiredClaims = findMissingRequirements(candidateText, fixtureEntry.requiredClaims);
  const missingRequiredActions = findMissingRequirements(candidateText, fixtureEntry.requiredActions);
  const missingCalibrationRequirements = findMissingRequirements(candidateText, fixtureEntry.calibrationRequirements);
  const forbiddenOverconfidence = findMatchedPatterns(candidateText, fixtureEntry.forbiddenOverconfidence || []);
  const register = scoreRegister({ candidateText, fixtureEntry });
  const redundancy = scoreRedundancy({
    baselineText,
    candidateText,
    reductionPercent,
    fixtureEntry,
  });

  const dimensionScores = {
    evidencePreservation: scoreCoverage((fixtureEntry.evidenceAtoms || []).length, missingEvidenceAtoms.length),
    semanticEquivalence: scoreCoverage((fixtureEntry.requiredClaims || []).length, missingRequiredClaims.length),
    actionability: scoreCoverage((fixtureEntry.requiredActions || []).length, missingRequiredActions.length),
    calibration: Math.min(
      scoreCoverage((fixtureEntry.calibrationRequirements || []).length, missingCalibrationRequirements.length),
      forbiddenOverconfidence.length > 0 ? 1 : 3
    ),
    registerQuality: register.score,
    redundancyElimination: redundancy.score,
  };
  const totalScore = Object.values(dimensionScores).reduce((sum, score) => sum + score, 0);
  const compactQualityScore = Number((totalScore / 18).toFixed(4));
  const minimumCqs = fixtureEntry.minimumCqs ?? DEFAULT_MINIMUM_CQS;
  const minimumReductionPercent = fixtureEntry.minimumReductionPercent ?? DEFAULT_MINIMUM_REDUCTION_PERCENT;
  const mandatoryEvidenceFailed = missingEvidenceAtoms.length > 0;
  const reductionPassed = reductionPercent >= minimumReductionPercent;
  const cqsPassed = compactQualityScore >= minimumCqs;
  const passed = !mandatoryEvidenceFailed
    && missingRequiredClaims.length === 0
    && missingRequiredActions.length === 0
    && missingCalibrationRequirements.length === 0
    && forbiddenOverconfidence.length === 0
    && register.score >= 2
    && cqsPassed
    && reductionPassed;

  return {
    passed,
    taskType: fixtureEntry.taskType,
    rawTokens,
    compactTokens,
    reductionPercent,
    minimumReductionPercent,
    compactQualityScore,
    minimumCqs,
    dimensionScores,
    mandatoryEvidenceFailed,
    missingEvidenceAtoms,
    missingRequiredClaims,
    missingRequiredActions,
    missingCalibrationRequirements,
    forbiddenOverconfidence,
    register,
    redundancy,
  };
}

function evaluateNegativeControls(fixtureEntry) {
  return (fixtureEntry.negativeControls || []).map((negativeControl) => {
    const score = scoreCompactNaturalCandidate(fixtureEntry, negativeControl.text);

    return {
      id: negativeControl.id,
      escaped: score.passed,
      score,
    };
  });
}

export function evaluateCompactNaturalFixtures(fixtures) {
  const results = fixtures.map((fixtureEntry) => {
    const score = scoreCompactNaturalCandidate(fixtureEntry, fixtureEntry.candidate);
    const negativeControls = evaluateNegativeControls(fixtureEntry);

    return {
      id: fixtureEntry.id,
      taskType: fixtureEntry.taskType,
      passed: score.passed && negativeControls.every((negativeControl) => !negativeControl.escaped),
      score,
      negativeControls,
    };
  });
  const failedResults = results.filter((result) => !result.passed);
  const negativeControlCount = results.reduce((total, result) => total + result.negativeControls.length, 0);
  const negativeControlEscapeCount = results.reduce((total, result) => {
    return total + result.negativeControls.filter((negativeControl) => negativeControl.escaped).length;
  }, 0);
  const rawTokens = results.reduce((total, result) => total + result.score.rawTokens, 0);
  const compactTokens = results.reduce((total, result) => total + result.score.compactTokens, 0);
  const mandatoryEvidenceFailureCount = results.filter((result) => result.score.mandatoryEvidenceFailed).length;
  const registerFailureCount = results.filter((result) => result.score.dimensionScores.registerQuality < 2).length;
  const averageCompactQualityScore = results.length === 0
    ? 0
    : Number((results.reduce((total, result) => total + result.score.compactQualityScore, 0) / results.length).toFixed(4));

  return {
    reportName: 'compact-natural-mode-benchmark',
    generatedAt: new Date().toISOString(),
    fixtureCount: results.length,
    passed: failedResults.length === 0 && negativeControlEscapeCount === 0,
    passedCount: results.length - failedResults.length,
    failedCount: failedResults.length,
    negativeControlCount,
    negativeControlEscapeCount,
    summary: {
      rawTokens,
      compactTokens,
      estimatedTokenReductionPercent: rawTokens === 0
        ? 0
        : Number((((rawTokens - compactTokens) / rawTokens) * 100).toFixed(2)),
      averageCompactQualityScore,
      mandatoryEvidenceFailureCount,
      registerFailureCount,
      semanticFailureCount: results.filter((result) => result.score.missingRequiredClaims.length > 0).length,
      actionabilityFailureCount: results.filter((result) => result.score.missingRequiredActions.length > 0).length,
      calibrationFailureCount: results.filter((result) => {
        return result.score.missingCalibrationRequirements.length > 0
          || result.score.forbiddenOverconfidence.length > 0;
      }).length,
    },
    results,
  };
}
