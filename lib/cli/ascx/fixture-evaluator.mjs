import fs from 'node:fs/promises';
import path from 'node:path';

import { runAscx } from './runtime.mjs';
import { estimateOutputTokens } from './token-estimate.mjs';

function combineOutput(stdout, stderr) {
  return [stdout, stderr].filter(Boolean).join('\n');
}

async function fileExists(filePath) {
  if (!filePath) {
    return false;
  }

  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

function buildFakeExecutor(fixtureEntry) {
  return async () => ({
    stdout: fixtureEntry.capture.stdout,
    stderr: fixtureEntry.capture.stderr,
    exitCode: fixtureEntry.capture.exitCode,
  });
}

function evaluateContinuationChecks(fixtureEntry, output, teeExists) {
  return (fixtureEntry.continuationChecks || []).map((continuationCheck) => {
    const missingRequiredSubstrings = (continuationCheck.requiredSubstrings || [])
      .filter((requiredSubstring) => !output.includes(requiredSubstring));
    const presentForbiddenSubstrings = (continuationCheck.forbiddenSubstrings || [])
      .filter((forbiddenSubstring) => output.includes(forbiddenSubstring));
    const teeStateMatched = typeof continuationCheck.expectTee === 'boolean'
      ? continuationCheck.expectTee === teeExists
      : true;

    return {
      id: continuationCheck.id,
      action: continuationCheck.action,
      passed: missingRequiredSubstrings.length === 0
        && presentForbiddenSubstrings.length === 0
        && teeStateMatched,
      missingRequiredSubstrings,
      presentForbiddenSubstrings,
      expectedTee: continuationCheck.expectTee ?? null,
      teeStateMatched,
    };
  });
}

async function evaluateFixture(fixtureEntry, options) {
  const result = await runAscx(fixtureEntry.commandArguments, {
    cwd: options.cwd,
    executeCommand: buildFakeExecutor(fixtureEntry),
    teeDirectoryPath: options.teeDirectoryPath,
  });
  const output = combineOutput(result.stdout, result.stderr);
  const missingRequiredSubstrings = (fixtureEntry.requiredSubstrings || [])
    .filter((requiredSubstring) => !output.includes(requiredSubstring));
  const presentForbiddenSubstrings = (fixtureEntry.forbiddenSubstrings || [])
    .filter((forbiddenSubstring) => output.includes(forbiddenSubstring));
  const exitCodePreserved = result.exitCode === fixtureEntry.capture.exitCode;
  const compressionStateMatched = result.compressed === fixtureEntry.expectCompressed;
  const teeExists = await fileExists(result.rawTeePath);
  const teeStateMatched = fixtureEntry.expectTee === teeExists;
  const falseSuccess = fixtureEntry.capture.exitCode !== 0 && result.exitCode === 0;
  const rawOutput = combineOutput(fixtureEntry.capture.stdout, fixtureEntry.capture.stderr);
  const rawTokens = estimateOutputTokens(rawOutput);
  const outputTokens = estimateOutputTokens(output);
  const continuationChecks = evaluateContinuationChecks(fixtureEntry, output, teeExists);
  const failedContinuationChecks = continuationChecks.filter((continuationCheck) => {
    return !continuationCheck.passed;
  });

  return {
    id: fixtureEntry.id,
    passed: missingRequiredSubstrings.length === 0
      && presentForbiddenSubstrings.length === 0
      && exitCodePreserved
      && compressionStateMatched
      && teeStateMatched
      && !falseSuccess
      && failedContinuationChecks.length === 0,
    command: fixtureEntry.commandArguments.join(' '),
    classification: result.classification,
    exitCode: result.exitCode,
    expectedExitCode: fixtureEntry.capture.exitCode,
    exitCodePreserved,
    compressed: result.compressed,
    expectedCompressed: fixtureEntry.expectCompressed,
    rawTeePath: result.rawTeePath,
    teeExists,
    expectedTee: fixtureEntry.expectTee,
    missingRequiredSubstrings,
    requiredSubstringCount: (fixtureEntry.requiredSubstrings || []).length,
    presentForbiddenSubstrings,
    forbiddenSubstringCount: (fixtureEntry.forbiddenSubstrings || []).length,
    falseSuccess,
    continuationChecks,
    continuationCheckCount: continuationChecks.length,
    failedContinuationChecks,
    rawTokens,
    outputTokens,
    reductionPercent: rawTokens === 0
      ? 0
      : Number((((rawTokens - outputTokens) / rawTokens) * 100).toFixed(2)),
  };
}

export async function evaluateAscxFixtures(fixtures, options = {}) {
  const cwd = options.cwd || process.cwd();
  const teeDirectoryPath = path.resolve(
    options.teeDirectoryPath || path.join(cwd, '.agent-context', 'state', 'token-saver', 'tee')
  );
  const results = [];

  for (const fixtureEntry of fixtures) {
    results.push(await evaluateFixture(fixtureEntry, {
      cwd,
      teeDirectoryPath,
    }));
  }

  const failedResults = results.filter((result) => !result.passed);
  const evidenceCheckCount = results.reduce((totalCount, result) => {
    return totalCount
      + result.requiredSubstringCount
      + result.forbiddenSubstringCount
      + 4;
  }, 0);
  const failedEvidenceCheckCount = results.reduce((totalCount, result) => {
    return totalCount
      + result.missingRequiredSubstrings.length
      + result.presentForbiddenSubstrings.length
      + (result.exitCodePreserved ? 0 : 1)
      + (result.compressed === result.expectedCompressed ? 0 : 1)
      + (result.teeExists === result.expectedTee ? 0 : 1)
      + (result.falseSuccess ? 1 : 0);
  }, 0);
  const rawTokens = results.reduce((totalCount, result) => totalCount + result.rawTokens, 0);
  const outputTokens = results.reduce((totalCount, result) => totalCount + result.outputTokens, 0);
  const continuationCheckCount = results.reduce((totalCount, result) => {
    return totalCount + result.continuationCheckCount;
  }, 0);
  const failedContinuationCheckCount = results.reduce((totalCount, result) => {
    return totalCount + result.failedContinuationChecks.length;
  }, 0);

  return {
    reportName: 'ascx-runtime-token-saver-benchmark',
    generatedAt: new Date().toISOString(),
    fixtureCount: results.length,
    passed: failedResults.length === 0,
    passedCount: results.length - failedResults.length,
    failedCount: failedResults.length,
    summary: {
      rawTokens,
      outputTokens,
      estimatedTokenReductionPercent: rawTokens === 0
        ? 0
        : Number((((rawTokens - outputTokens) / rawTokens) * 100).toFixed(2)),
      evidencePreservationPassRate: evidenceCheckCount === 0
        ? 1
        : Number(((evidenceCheckCount - failedEvidenceCheckCount) / evidenceCheckCount).toFixed(4)),
      falseSuccessCount: results.filter((result) => result.falseSuccess).length,
      teeWriteFailures: results.filter((result) => result.expectedTee && !result.teeExists).length,
      continuationPassRate: continuationCheckCount === 0
        ? 1
        : Number(((continuationCheckCount - failedContinuationCheckCount) / continuationCheckCount).toFixed(4)),
      continuationCheckCount,
      failedContinuationCheckCount,
    },
    results,
  };
}
