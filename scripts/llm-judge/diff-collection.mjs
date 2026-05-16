// @ts-check

/**
 * Git diff collection for the LLM judge. Selects the best available diff source
 * based on environment signals (PR_DIFF override, GitHub Actions, GitLab CI),
 * with a local HEAD~1..HEAD fallback that handles the initial-commit edge case
 * by diffing against Git's empty-tree object.
 */

import { execSync } from 'node:child_process';

import { REPOSITORY_ROOT } from './constants.mjs';

export function detectCiProvider() {
  if (process.env.GITHUB_ACTIONS === 'true') {
    return 'github';
  }

  if (process.env.GITLAB_CI === 'true') {
    return 'gitlab';
  }

  return 'local';
}

/**
 * Collects the pull request diff from the best available source:
 * 1. PR_DIFF env var (direct injection, highest priority)
 * 2. GitHub Actions env vars (GITHUB_BASE_SHA / GITHUB_HEAD_SHA)
 * 3. GitLab CI env vars (CI_MERGE_REQUEST_DIFF_BASE_SHA / CI_COMMIT_SHA)
 * 4. Local fallback: HEAD~1..HEAD, then empty-tree if no parent exists
 *
 * @returns {string} The raw git diff output
 */
export function collectPullRequestDiff() {
  if (process.env.PR_DIFF) {
    console.log('  Source: PR_DIFF env variable');
    return process.env.PR_DIFF;
  }

  const execOptions = {
    cwd: REPOSITORY_ROOT,
    encoding: /** @type {'utf-8'} */ ('utf-8'),
    maxBuffer: 1024 * 1024 * 8,
    stdio: /** @type {['ignore', 'pipe', 'ignore']} */ (['ignore', 'pipe', 'ignore']),
  };

  const githubBaseSha = process.env.GITHUB_BASE_SHA;
  const githubHeadSha = process.env.GITHUB_HEAD_SHA ?? 'HEAD';
  if (githubBaseSha) {
    console.log(`  Source: GitHub Actions diff (${githubBaseSha.slice(0, 8)}...${githubHeadSha.slice(0, 8)})`);
    return execSync(`git diff "${githubBaseSha}...${githubHeadSha}"`, execOptions);
  }

  const gitlabBaseSha = process.env.CI_MERGE_REQUEST_DIFF_BASE_SHA;
  const gitlabHeadSha = process.env.CI_COMMIT_SHA ?? 'HEAD';
  if (gitlabBaseSha) {
    console.log(`  Source: GitLab CI diff (${gitlabBaseSha.slice(0, 8)}...${gitlabHeadSha.slice(0, 8)})`);
    return execSync(`git diff "${gitlabBaseSha}...${gitlabHeadSha}"`, execOptions);
  }

  console.log('  Source: local HEAD~1..HEAD fallback');
  try {
    return execSync('git diff HEAD~1 HEAD', execOptions);
  } catch {
    try {
      const emptyTreeSha = '4b825dc642cb6eb9a060e54bf8d69288fbee4904';
      return execSync(`git diff "${emptyTreeSha}" HEAD`, execOptions);
    } catch {
      console.warn('  ⚠️   Unable to execute git diff. Defaulting to empty diff.');
      return '';
    }
  }
}
