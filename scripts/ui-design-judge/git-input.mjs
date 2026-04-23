// @ts-check

import { execSync } from 'node:child_process';
import { extname } from 'node:path';
import { REPOSITORY_ROOT, UI_FILE_EXTENSIONS } from './constants.mjs';

export function detectCiProvider() {
  if (process.env.GITHUB_ACTIONS === 'true') {
    return 'github';
  }

  if (process.env.GITLAB_CI === 'true') {
    return 'gitlab';
  }

  return 'local';
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

export function collectPullRequestDiff() {
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

export function collectChangedFiles() {
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

export function isUiRelevantFilePath(filePath) {
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
