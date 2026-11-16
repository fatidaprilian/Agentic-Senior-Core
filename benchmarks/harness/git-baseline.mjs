import { execSync } from 'node:child_process';

export function ensureBaselineCommit(dir) {
  try {
    execSync('git rev-parse --git-dir', { cwd: dir, stdio: 'pipe' });
  } catch {
    execSync('git init', { cwd: dir, stdio: 'pipe' });
  }
  execSync('git add -A', { cwd: dir, stdio: 'pipe' });
  // Inline author identity + --no-verify avoid CI failures on VMs without global git config
  execSync(
    'git -c commit.gpgsign=false -c user.name="ASC Benchmark" -c user.email="bench@local" commit --no-verify -m "benchmark-baseline" --allow-empty',
    {
      cwd: dir,
      stdio: 'pipe',
      env: {
        ...process.env,
        GIT_AUTHOR_NAME: 'ASC Benchmark',
        GIT_AUTHOR_EMAIL: 'bench@local',
        GIT_COMMITTER_NAME: 'ASC Benchmark',
        GIT_COMMITTER_EMAIL: 'bench@local',
      },
    }
  );
  return execSync('git rev-parse HEAD', { cwd: dir, encoding: 'utf8', stdio: 'pipe' }).trim();
}

export function measureGitDiff(repoDir, baselineRef) {
  try {
    execSync('git add -A', { cwd: repoDir, stdio: 'pipe' });
    const stat = execSync(`git diff --stat ${baselineRef}`, { cwd: repoDir, encoding: 'utf8', stdio: 'pipe' });
    const lines = stat.trim().split('\n');
    const summary = lines[lines.length - 1] || '';
    const insertions = parseInt((summary.match(/(\d+) insertion/) || ['', '0'])[1], 10);
    const deletions = parseInt((summary.match(/(\d+) deletion/) || ['', '0'])[1], 10);
    return {
      linesAdded: insertions,
      linesRemoved: deletions,
      netDelta: insertions - deletions,
      filesChanged: Math.max(0, lines.length - 1),
    };
  } catch {
    return { linesAdded: 0, linesRemoved: 0, netDelta: 0, filesChanged: 0 };
  }
}
