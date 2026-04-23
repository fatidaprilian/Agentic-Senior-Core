// @ts-check

function normalizeForSignalMatch(rawValue) {
  return String(rawValue || '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
    .replace(/\s+/g, ' ');
}

function collectEvidenceTexts({
  genericityAssessment,
  rubricBreakdown,
  findings,
  notes,
}) {
  const textParts = [
    genericityAssessment?.reason,
    ...(Array.isArray(rubricBreakdown)
      ? rubricBreakdown.flatMap((dimensionEntry) => [dimensionEntry?.dimension, dimensionEntry?.reason])
      : []),
    ...(Array.isArray(findings)
      ? findings.flatMap((finding) => [
        finding?.area,
        finding?.problem,
        finding?.evidence,
        finding?.recommendation,
      ])
      : []),
    ...(Array.isArray(notes) ? notes : []),
  ];

  return textParts
    .map((textValue) => normalizeForSignalMatch(textValue))
    .filter(Boolean);
}

export function collectMatchedSignals(signalList, evidenceTexts) {
  const normalizedEvidenceText = Array.isArray(evidenceTexts)
    ? evidenceTexts.join(' ')
    : normalizeForSignalMatch(evidenceTexts);

  if (!normalizedEvidenceText) {
    return [];
  }

  return (Array.isArray(signalList) ? signalList : [])
    .map((signalValue) => ({
      raw: String(signalValue || '').trim(),
      normalized: normalizeForSignalMatch(signalValue),
    }))
    .filter((signalEntry) => signalEntry.raw && signalEntry.normalized)
    .filter((signalEntry) => normalizedEvidenceText.includes(signalEntry.normalized))
    .map((signalEntry) => signalEntry.raw);
}

function detectContractDrift(rubricBreakdown, findings, designExecutionSummary) {
  const contractFidelityEntry = Array.isArray(rubricBreakdown)
    ? rubricBreakdown.find((dimensionEntry) => dimensionEntry?.dimension === 'contractFidelity')
    : null;
  const blockingFindingCount = Array.isArray(findings)
    ? findings.filter((finding) => finding?.blockingRecommended === true || ['critical', 'high'].includes(String(finding?.severity || '').toLowerCase())).length
    : 0;
  const contractFidelityWeak = contractFidelityEntry
    ? contractFidelityEntry.verdict === 'weak'
      || contractFidelityEntry.verdict === 'unclear'
      || (typeof contractFidelityEntry.score === 'number' && contractFidelityEntry.score < 70)
    : false;
  const contractReady = designExecutionSummary?.contractReady === true;

  return {
    blockingFindingCount,
    contractFidelityWeak,
    contractDriftDetected: !contractReady || contractFidelityWeak || blockingFindingCount > 0,
  };
}

export function calibrateGenericityAssessment({
  reviewRubricSummary,
  designExecutionSummary,
  genericityAssessment,
  rubricBreakdown,
  findings,
  notes,
  tasteVsFailureSeparated,
}) {
  const providerStatus = String(genericityAssessment?.status || 'unclear').trim().toLowerCase() || 'unclear';
  const evidenceTexts = collectEvidenceTexts({
    genericityAssessment,
    rubricBreakdown,
    findings,
    notes,
  });
  const matchedGenericitySignals = collectMatchedSignals(reviewRubricSummary?.genericitySignals, evidenceTexts);
  const matchedValidBoldSignals = collectMatchedSignals(reviewRubricSummary?.validBoldSignals, evidenceTexts);
  const { blockingFindingCount, contractFidelityWeak, contractDriftDetected } = detectContractDrift(
    rubricBreakdown,
    findings,
    designExecutionSummary
  );
  const namedGenericityRequired = reviewRubricSummary?.reportingRules?.mustExplainGenericity === true;
  const calibrationNotes = [];
  let calibratedStatus = providerStatus;

  if (
    namedGenericityRequired
    && ['generic', 'mixed'].includes(providerStatus)
    && matchedGenericitySignals.length === 0
  ) {
    calibratedStatus = 'unclear';
    calibrationNotes.push('Genericity claim was not backed by any named drift signal.');
  }

  if (matchedGenericitySignals.length > 0 && matchedValidBoldSignals.length === 0) {
    calibratedStatus = contractDriftDetected || matchedGenericitySignals.length >= 2
      ? 'generic'
      : 'mixed';
    calibrationNotes.push('Named genericity drift signals dominate the review evidence.');
  } else if (matchedValidBoldSignals.length > 0 && matchedGenericitySignals.length === 0) {
    if (contractDriftDetected) {
      calibratedStatus = 'mixed';
      calibrationNotes.push('Authored signals are present, but contract drift prevents a distinctive verdict.');
    } else if (matchedValidBoldSignals.length >= 2) {
      calibratedStatus = 'distinctive';
      calibrationNotes.push('Multiple valid bold signals were named without generic drift evidence.');
    } else if (providerStatus === 'unclear') {
      calibratedStatus = 'mixed';
      calibrationNotes.push('One valid bold signal was named, but evidence is not strong enough for a distinctive verdict.');
    }
  } else if (matchedGenericitySignals.length > 0 && matchedValidBoldSignals.length > 0) {
    calibratedStatus = contractDriftDetected ? 'mixed' : 'mixed';
    calibrationNotes.push('The evidence contains both generic drift and legitimate authored moves.');
  } else if (providerStatus === 'distinctive' && contractDriftDetected) {
    calibratedStatus = 'mixed';
    calibrationNotes.push('Distinctive tone does not override contract drift or blocking findings.');
  }

  if (tasteVsFailureSeparated === false && calibratedStatus === 'distinctive') {
    calibratedStatus = 'mixed';
    calibrationNotes.push('The review did not separate taste preference from real failure conditions.');
  }

  if (calibrationNotes.length === 0) {
    calibrationNotes.push('Provider verdict stayed intact after rubric calibration.');
  }

  return {
    version: 'ui-rubric-calibration-v1',
    providerStatus,
    calibratedStatus,
    statusChanged: calibratedStatus !== providerStatus,
    namedGenericityRequired,
    matchedGenericitySignals,
    matchedValidBoldSignals,
    blockingFindingCount,
    contractFidelityWeak,
    contractDriftDetected,
    tasteVsFailureSeparated,
    evidenceTextCount: evidenceTexts.length,
    notes: calibrationNotes,
  };
}

export function buildRubricCalibrationReport({
  cases,
  reviewRubricSummary,
}) {
  const normalizedCases = Array.isArray(cases) ? cases : [];
  const results = normalizedCases.map((caseEntry) => {
    const calibration = calibrateGenericityAssessment({
      reviewRubricSummary,
      designExecutionSummary: caseEntry.designExecutionSummary,
      genericityAssessment: caseEntry.genericityAssessment,
      rubricBreakdown: caseEntry.rubricBreakdown,
      findings: caseEntry.findings,
      notes: caseEntry.notes,
      tasteVsFailureSeparated: caseEntry.tasteVsFailureSeparated,
    });
    const expected = caseEntry.expected && typeof caseEntry.expected === 'object'
      ? caseEntry.expected
      : {};

    const statusMatches = String(expected.calibratedStatus || '') === calibration.calibratedStatus;
    const contractDriftMatches = typeof expected.contractDriftDetected === 'boolean'
      ? expected.contractDriftDetected === calibration.contractDriftDetected
      : true;

    return {
      id: String(caseEntry.id || 'unknown-case'),
      label: String(caseEntry.label || ''),
      passed: statusMatches && contractDriftMatches,
      expected,
      calibration,
    };
  });

  const passedCaseCount = results.filter((resultEntry) => resultEntry.passed).length;
  const totalCases = results.length;

  return {
    generatedAt: new Date().toISOString(),
    reportName: 'ui-rubric-calibration',
    schemaVersion: '1.0',
    passed: passedCaseCount === totalCases,
    failureCount: totalCases - passedCaseCount,
    totalCases,
    passedCaseCount,
    accuracyPercent: totalCases === 0 ? 0 : Number(((passedCaseCount / totalCases) * 100).toFixed(1)),
    results,
  };
}
