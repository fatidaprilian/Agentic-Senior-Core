import fs from 'node:fs';
import path from 'node:path';
import { execSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { findLayoutShells } from '../../lib/core/component-registry.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(HERE, '..', '..');
const SLOP_PATH = path.join(REPO_ROOT, '.agents', 'plugins', 'agentic-senior-core', 'hooks', 'lib', 'known-ui-slop-patterns.json');

function loadSlopPatterns() {
  try {
    return JSON.parse(fs.readFileSync(SLOP_PATH, 'utf8')).patterns || [];
  } catch {
    return [];
  }
}

function collectSourceFiles(dir, out = []) {
  if (!fs.existsSync(dir)) return out;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.name === 'node_modules' || entry.name === '.git' || entry.name === 'tests') continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) collectSourceFiles(full, out);
    else if (/\.(tsx|jsx|ts|js|mjs|html|css|vue|svelte|razor|py|cs)$/i.test(entry.name)) out.push(full);
  }
  return out;
}

function runProjectTests(workDir) {
  const pkgPath = path.join(workDir, 'package.json');
  if (!fs.existsSync(pkgPath)) return null;
  try {
    const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
    if (!pkg.scripts || !pkg.scripts.test) return null;
    execSync('npm test', { cwd: workDir, stdio: 'pipe', timeout: 20_000 });
    return true;
  } catch {
    return false;
  }
}

function countCardGrids(content) {
  const matches = content.match(/<(?:section|div|article)\b[^>]*class(?:Name)?=[^>]*\bgrid\b/gi);
  if (!matches) return 0;
  let count = 0;
  for (const tag of matches) {
    if (/rounded-(?:xl|2xl|3xl|lg)/.test(tag) || /\bborder\b/.test(tag)) count++;
  }
  return count;
}

export function gradeWorkspace(workDir, options = {}) {
  const patterns = loadSlopPatterns();
  const shells = findLayoutShells(workDir);
  const srcFiles = collectSourceFiles(path.join(workDir, 'src').toString() && fs.existsSync(path.join(workDir, 'src')) ? path.join(workDir, 'src') : workDir);

  let slopHits = 0;
  let shellCollisions = 0;
  let cardSoupFiles = 0;
  let swallowedErrors = 0;
  let reusedComponentsCount = 0;
  const matchedPatterns = [];

  for (const filePath of srcFiles) {
    const rel = path.relative(workDir, filePath).replace(/\\/g, '/');
    const content = fs.readFileSync(filePath, 'utf8');
    const isUi = /\.(tsx|jsx|html|vue|svelte|razor)$/i.test(filePath);
    const isLayout = /^(?:_?layout|applayout|mainlayout|rootlayout|\+layout)\./i.test(path.basename(filePath));

    for (const p of patterns) {
      if (!isUi && !p.id.startsWith('code-') && !p.id.startsWith('copy-')) continue;
      try {
        if (new RegExp(p.regex, 'i').test(content)) {
          slopHits++;
          matchedPatterns.push(`${rel}:${p.id}`);
        }
      } catch {}
    }

    if (isUi && !isLayout && shells.length > 0 && /<nav\b|<header\b[^>]*role=["']banner/i.test(content)) {
      shellCollisions++;
    }

    if (isUi && countCardGrids(content) >= 2 && !/<(?:table|ol|thead|tbody)[\s>]|\bdivide-y\b/i.test(content)) {
      cardSoupFiles++;
    }

    if (/catch\s*\([^)]*\)\s*\{\s*(?:return\s+(?:null|\[\]|false)\s*;?)?\s*\}/m.test(content)) {
      swallowedErrors++;
    }

    if (/from\s+['"][^'"]*components\/ui\//.test(content) || /\b(?:DataTable|PageHeader)\b/.test(content) && !isLayout && rel.includes('pages/')) {
      const imports = content.match(/import\s+\{[^}]+\}\s+from\s+['"][^'"]*components\/ui\/[^'"]+['"]/g) || [];
      reusedComponentsCount += imports.length;
    }
  }

  const testPassed = options.skipTests ? null : runProjectTests(workDir);
  const penalties = (slopHits * 10) + (shellCollisions * 25) + (cardSoupFiles * 20) + (swallowedErrors * 15) + (testPassed === false ? 30 : 0);
  const bonus = Math.min(10, reusedComponentsCount * 5);
  const qualityScore = Math.max(0, Math.min(100, 100 - penalties + bonus - (reusedComponentsCount === 0 && shells.length > 0 ? 15 : 0)));

  return {
    testPassed,
    slopHits,
    shellCollisions,
    cardSoupFiles,
    swallowedErrors,
    reusedComponentsCount,
    matchedPatterns,
    qualityScore,
  };
}
