#!/usr/bin/env node

/**
 * docs-quality-drift-report.mjs
 *
 * Generates a machine-readable documentation quality drift artifact.
 * Tracks plain-language readability signals and trend deltas over time.
 */

import { existsSync, readFileSync } from 'node:fs';
import fs from 'node:fs/promises';
import { dirname, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const SCRIPT_FILE_PATH = fileURLToPath(import.meta.url);
const SCRIPT_DIR = dirname(SCRIPT_FILE_PATH);
const REPOSITORY_ROOT = resolve(SCRIPT_DIR, '..');
const REPORT_PATH = join(REPOSITORY_ROOT, '.agent-context', 'state', 'docs-quality-drift-report.json');
const ARGUMENT_FLAGS = new Set(process.argv.slice(2));
const isStdoutOnlyMode = ARGUMENT_FLAGS.has('--stdout-only');
const HISTORY_LIMIT = 52;
const LONG_SENTENCE_WORD_THRESHOLD = 28;

const MONITORED_STATIC_FILE_PATHS = [
  'README.md',
  'CHANGELOG.md',
  '.instructions.md',
  'AGENTS.md',
  'CLAUDE.md',
  'GEMINI.md',
  '.github/copilot-instructions.md',
  '.github/instructions/agentic-senior-core.instructions.md',
  '.gemini/instructions.md',
  '.cursor/rules/agentic-senior-core.mdc',
  '.windsurf/rules/agentic-senior-core.md',
  'docs/deep-analysis-and-roadmap-backlog.md',
];

const MONITORED_DIRECTORY_PATHS = [
  'docs',
  '.agent-context/prompts',
  '.agent-context/review-checklists',
];

const FORBIDDEN_BUZZWORDS = [
  'delve',
  'leverage',
  'robust',
  'utilize',
  'seamless',
];

function normalizeLineEndings(content) {
  return content.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
}

function extractWordCount(content) {
  const words = content.match(/[A-Za-z0-9']+/g) || [];
  return words.length;
}

function extractSentenceWordCounts(content) {
  const sentenceFragments = content
    .split(/[.!?]+/u)
    .map((fragment) => fragment.trim())
    .filter((fragment) => fragment.length > 0);

  const sentenceWordCounts = [];
  for (const sentenceFragment of sentenceFragments) {
    const sentenceWordCount = extractWordCount(sentenceFragment);
    if (sentenceWordCount > 0) {
      sentenceWordCounts.push(sentenceWordCount);
    }
  }

  return sentenceWordCounts;
}

function countEmoji(content) {
  const emojiMatches = content.match(/[\p{Extended_Pictographic}]/gu) || [];
  return emojiMatches.length;
}

function countForbiddenBuzzwords(content) {
  const buzzwordCounts = {};

  for (const forbiddenBuzzword of FORBIDDEN_BUZZWORDS) {
    const buzzwordRegex = new RegExp(`\\b${forbiddenBuzzword}\\b`, 'gi');
    const matchCount = (content.match(buzzwordRegex) || []).length;
    buzzwordCounts[forbiddenBuzzword] = matchCount;
  }

  return buzzwordCounts;
}

async function collectMarkdownFiles(directoryPath) {
  const markdownFilePaths = [];

  async function walk(currentDirectoryPath) {
    if (!existsSync(currentDirectoryPath)) {
      return;
    }

    const directoryEntries = await fs.readdir(currentDirectoryPath, { withFileTypes: true });

    for (const directoryEntry of directoryEntries) {
      if (directoryEntry.name === 'node_modules' || directoryEntry.name === '.git' || directoryEntry.name === '.benchmarks') {
        continue;
      }

      const entryPath = join(currentDirectoryPath, directoryEntry.name);

      if (directoryEntry.isDirectory()) {
        await walk(entryPath);
        continue;
      }

      if (directoryEntry.isFile() && directoryEntry.name.toLowerCase().endsWith('.md')) {
        markdownFilePaths.push(entryPath);
      }
    }
  }

  await walk(directoryPath);
  return markdownFilePaths;
}

async function collectMonitoredFiles() {
  const collectedFilePathSet = new Set();

  for (const relativeFilePath of MONITORED_STATIC_FILE_PATHS) {
    const absoluteFilePath = join(REPOSITORY_ROOT, relativeFilePath);
    if (existsSync(absoluteFilePath)) {
      collectedFilePathSet.add(absoluteFilePath);
    }
  }

  for (const relativeDirectoryPath of MONITORED_DIRECTORY_PATHS) {
    const absoluteDirectoryPath = join(REPOSITORY_ROOT, relativeDirectoryPath);
    const markdownFiles = await collectMarkdownFiles(absoluteDirectoryPath);

    for (const markdownFilePath of markdownFiles) {
      collectedFilePathSet.add(markdownFilePath);
    }
  }

  return Array.from(collectedFilePathSet).sort((firstPath, secondPath) => firstPath.localeCompare(secondPath));
}

function readJsonOrNull(filePath) {
  if (!existsSync(filePath)) {
    return null;
  }

  try {
    return JSON.parse(readFileSync(filePath, 'utf8'));
  } catch {
    return null;
  }
}

function clamp(value, minimum, maximum) {
  return Math.max(minimum, Math.min(maximum, value));
}

function buildQualityScore(metrics) {
  const longSentencePenalty = metrics.longSentenceRatePercent * 0.4;
  const buzzwordPenalty = metrics.totalForbiddenBuzzwordHits * 1.5;
  const emojiPenalty = metrics.emojiCount * 5;
  const averageSentencePenalty = metrics.averageWordsPerSentence > 24
    ? (metrics.averageWordsPerSentence - 24) * 1.2
    : 0;

  const rawScore = 100 - longSentencePenalty - buzzwordPenalty - emojiPenalty - averageSentencePenalty;
  return Number(clamp(rawScore, 0, 100).toFixed(2));
}

function summarizeTrend(currentSummary, previousSummary) {
  if (!previousSummary) {
    return {
      hasBaseline: false,
      trend: 'baseline-created',
      deltaQualityScore: null,
      deltaLongSentenceRatePercent: null,
      deltaForbiddenBuzzwordHits: null,
      deltaEmojiCount: null,
    };
  }

  const deltaQualityScore = Number((currentSummary.qualityScore - previousSummary.qualityScore).toFixed(2));
  const deltaLongSentenceRatePercent = Number((currentSummary.longSentenceRatePercent - previousSummary.longSentenceRatePercent).toFixed(2));
  const deltaForbiddenBuzzwordHits = currentSummary.totalForbiddenBuzzwordHits - previousSummary.totalForbiddenBuzzwordHits;
  const deltaEmojiCount = currentSummary.emojiCount - previousSummary.emojiCount;

  let trend = 'stable';
  if (deltaQualityScore >= 1 && deltaLongSentenceRatePercent <= 0 && deltaForbiddenBuzzwordHits <= 0 && deltaEmojiCount <= 0) {
    trend = 'improving';
  } else if (deltaQualityScore <= -1 || deltaLongSentenceRatePercent > 0 || deltaForbiddenBuzzwordHits > 0 || deltaEmojiCount > 0) {
    trend = 'regressing';
  }

  return {
    hasBaseline: true,
    trend,
    deltaQualityScore,
    deltaLongSentenceRatePercent,
    deltaForbiddenBuzzwordHits,
    deltaEmojiCount,
  };
}

function buildHistoryEntry(report) {
  return {
    generatedAt: report.generatedAt,
    qualityScore: report.summary.qualityScore,
    documentCount: report.summary.documentCount,
    averageWordsPerSentence: report.summary.averageWordsPerSentence,
    longSentenceRatePercent: report.summary.longSentenceRatePercent,
    totalForbiddenBuzzwordHits: report.summary.totalForbiddenBuzzwordHits,
    emojiCount: report.summary.emojiCount,
  };
}

function mergeHistory(previousReport, currentHistoryEntry) {
  const existingHistory = Array.isArray(previousReport?.history) ? previousReport.history : [];
  const mergedHistory = [...existingHistory, currentHistoryEntry];

  if (mergedHistory.length <= HISTORY_LIMIT) {
    return mergedHistory;
  }

  return mergedHistory.slice(mergedHistory.length - HISTORY_LIMIT);
}

async function runDocsQualityDriftReport() {
  const monitoredFilePaths = await collectMonitoredFiles();

  const fileSummaries = [];
  let totalLineCount = 0;
  let totalWordCount = 0;
  let totalSentenceCount = 0;
  let totalLongSentenceCount = 0;
  let totalEmojiCount = 0;
  const forbiddenBuzzwordTotals = Object.fromEntries(FORBIDDEN_BUZZWORDS.map((word) => [word, 0]));

  for (const monitoredFilePath of monitoredFilePaths) {
    const rawContent = await fs.readFile(monitoredFilePath, 'utf8');
    const normalizedContent = normalizeLineEndings(rawContent);

    const lineCount = normalizedContent.length === 0 ? 0 : normalizedContent.split('\n').length;
    const wordCount = extractWordCount(normalizedContent);
    const sentenceWordCounts = extractSentenceWordCounts(normalizedContent);
    const sentenceCount = sentenceWordCounts.length;
    const longSentenceCount = sentenceWordCounts.filter((sentenceWordCount) => sentenceWordCount > LONG_SENTENCE_WORD_THRESHOLD).length;
    const emojiCount = countEmoji(normalizedContent);
    const forbiddenBuzzwordCounts = countForbiddenBuzzwords(normalizedContent);

    totalLineCount += lineCount;
    totalWordCount += wordCount;
    totalSentenceCount += sentenceCount;
    totalLongSentenceCount += longSentenceCount;
    totalEmojiCount += emojiCount;

    for (const forbiddenBuzzword of FORBIDDEN_BUZZWORDS) {
      forbiddenBuzzwordTotals[forbiddenBuzzword] += forbiddenBuzzwordCounts[forbiddenBuzzword];
    }

    fileSummaries.push({
      filePath: relative(REPOSITORY_ROOT, monitoredFilePath).replace(/\\/g, '/'),
      lineCount,
      wordCount,
      sentenceCount,
      longSentenceCount,
      emojiCount,
      forbiddenBuzzwordCounts,
    });
  }

  const averageWordsPerSentence = totalSentenceCount === 0
    ? 0
    : Number((totalWordCount / totalSentenceCount).toFixed(2));
  const longSentenceRatePercent = totalSentenceCount === 0
    ? 0
    : Number(((totalLongSentenceCount / totalSentenceCount) * 100).toFixed(2));
  const totalForbiddenBuzzwordHits = FORBIDDEN_BUZZWORDS.reduce(
    (sum, forbiddenBuzzword) => sum + forbiddenBuzzwordTotals[forbiddenBuzzword],
    0
  );

  const summary = {
    documentCount: monitoredFilePaths.length,
    totalLineCount,
    totalWordCount,
    totalSentenceCount,
    averageWordsPerSentence,
    longSentenceCount: totalLongSentenceCount,
    longSentenceRatePercent,
    emojiCount: totalEmojiCount,
    forbiddenBuzzwordTotals,
    totalForbiddenBuzzwordHits,
    qualityScore: 0,
  };

  summary.qualityScore = buildQualityScore(summary);

  const previousReport = readJsonOrNull(REPORT_PATH);
  const previousSummary = previousReport?.summary || null;
  const trend = summarizeTrend(summary, previousSummary);

  const sortedBuzzwordBreakdown = Object.entries(forbiddenBuzzwordTotals)
    .map(([term, hits]) => ({ term, hits }))
    .sort((firstEntry, secondEntry) => secondEntry.hits - firstEntry.hits);

  const docsQualityDriftReportSnapshot = {
    generatedAt: new Date().toISOString(),
    reportName: 'docs-quality-drift-report',
    passed: summary.emojiCount === 0,
    methodology: {
      monitoredStaticFiles: MONITORED_STATIC_FILE_PATHS,
      monitoredDirectories: MONITORED_DIRECTORY_PATHS,
      forbiddenBuzzwords: FORBIDDEN_BUZZWORDS,
      longSentenceWordThreshold: LONG_SENTENCE_WORD_THRESHOLD,
    },
    summary,
    trend,
    buzzwordBreakdown: sortedBuzzwordBreakdown,
    topLongSentenceRiskFiles: fileSummaries
      .map((fileSummary) => ({
        filePath: fileSummary.filePath,
        longSentenceCount: fileSummary.longSentenceCount,
      }))
      .filter((fileSummary) => fileSummary.longSentenceCount > 0)
      .sort((firstFile, secondFile) => secondFile.longSentenceCount - firstFile.longSentenceCount)
      .slice(0, 10),
    fileSummaries,
    artifact: {
      path: REPORT_PATH,
      writeMode: isStdoutOnlyMode ? 'stdout-only' : 'stdout-and-file',
    },
  };

  const history = mergeHistory(previousReport, buildHistoryEntry(docsQualityDriftReportSnapshot));
  const docsQualityDriftReport = {
    ...docsQualityDriftReportSnapshot,
    history,
  };

  if (!isStdoutOnlyMode) {
    await fs.mkdir(dirname(REPORT_PATH), { recursive: true });
    await fs.writeFile(REPORT_PATH, JSON.stringify(docsQualityDriftReport, null, 2) + '\n', 'utf8');
  }

  return docsQualityDriftReport;
}

runDocsQualityDriftReport()
  .then((docsQualityDriftReport) => {
    console.log(JSON.stringify(docsQualityDriftReport, null, 2));
  })
  .catch((docsQualityError) => {
    const errorMessage = docsQualityError instanceof Error ? docsQualityError.message : String(docsQualityError);
    console.error(`Docs quality drift report failed: ${errorMessage}`);
    process.exit(1);
  });
