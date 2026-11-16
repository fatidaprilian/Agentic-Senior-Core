// Zero-dependency UI component and layout-shell inventory scanner.
// Emits a compact registry summary for PreInvocation / SessionStart context
// so agents reuse existing primitives instead of regenerating duplicates.

const fs = require('fs');
const path = require('path');

const IGNORE_DIRS = new Set(['node_modules', '.git', '.next', 'dist', 'build', 'coverage', 'obj', 'bin', '.asc', '.worktrees']);
const COMPONENT_ROOTS = ['components', 'src/components', 'app/components', 'client/src/components', 'Components', 'Shared'];
const COMPONENT_EXTS = new Set(['.tsx', '.jsx', '.vue', '.svelte', '.razor']);
const LAYOUT_BASENAME_RE = /^(?:_?layout|applayout|mainlayout|rootlayout|\+layout)\.(?:tsx|jsx|ts|js|vue|svelte|razor|cshtml)$/i;

function isIgnoredDir(name) {
  return IGNORE_DIRS.has(name) || name.startsWith('.');
}

function walkLimited(dir, depth, maxDepth, out, limit) {
  if (depth > maxDepth || out.length >= limit || !fs.existsSync(dir)) return;
  let entries;
  try {
    entries = fs.readdirSync(dir, { withFileTypes: true });
  } catch (_) {
    return;
  }
  for (let i = 0; i < entries.length && out.length < limit; i++) {
    const entry = entries[i];
    if (isIgnoredDir(entry.name)) continue;
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      walkLimited(fullPath, depth + 1, maxDepth, out, limit);
    } else if (entry.isFile()) {
      out.push(fullPath);
    }
  }
}

function findLayoutShells(workspaceRoot) {
  if (!workspaceRoot || !fs.existsSync(workspaceRoot)) return [];
  const candidates = [];
  walkLimited(workspaceRoot, 0, 4, candidates, 250);
  const shells = [];
  for (let i = 0; i < candidates.length; i++) {
    const rel = path.relative(workspaceRoot, candidates[i]).replace(/\\/g, '/');
    if (rel.startsWith('benchmarks/') || rel.startsWith('tests/')) continue;
    if (LAYOUT_BASENAME_RE.test(path.basename(rel))) {
      shells.push(rel);
    }
  }
  return shells;
}

function extractExports(source, fallbackName) {
  const names = new Set();
  let match;
  const declRe = /export\s+(?:default\s+)?(?:async\s+)?(?:function|const|class)\s+([A-Z][A-Za-z0-9_]*)/g;
  while ((match = declRe.exec(source)) !== null) {
    names.add(match[1]);
  }
  const namedRe = /export\s*\{([^}]+)\}/g;
  while ((match = namedRe.exec(source)) !== null) {
    const parts = match[1].split(',');
    for (let i = 0; i < parts.length; i++) {
      const sym = parts[i].trim().split(/\s+as\s+/)[0].trim();
      if (/^[A-Z][A-Za-z0-9_]*$/.test(sym)) names.add(sym);
    }
  }
  if (names.size === 0 && /^[A-Z]/.test(fallbackName)) {
    names.add(fallbackName);
  }
  return Array.from(names).slice(0, 6);
}

function extractPropKeys(source) {
  const keys = new Set();
  const ifaceMatch = source.match(/(?:interface|type)\s+[A-Z][A-Za-z0-9_]*Props\s*(?:=\s*)?\{([\s\S]{1,800}?)\}/);
  if (ifaceMatch) {
    const fieldRe = /^\s*([a-zA-Z_][a-zA-Z0-9_]*)\??\s*:/gm;
    let m;
    while ((m = fieldRe.exec(ifaceMatch[1])) !== null && keys.size < 8) {
      keys.add(m[1]);
    }
  }
  if (keys.size === 0) {
    const destructMatch = source.match(/(?:function|const)\s+[A-Z][A-Za-z0-9_]*[^({]*\(\s*\{\s*([^}]{1,240})\}/);
    if (destructMatch) {
      const items = destructMatch[1].split(',');
      for (let i = 0; i < items.length && keys.size < 8; i++) {
        const clean = items[i].trim().split(/[=:]/)[0].trim();
        if (/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(clean) && !clean.startsWith('...')) {
          keys.add(clean);
        }
      }
    }
  }
  if (keys.size === 0) {
    const blazorRe = /\[Parameter\][\s\S]{0,60}?public\s+[^\s]+\s+([A-Z][A-Za-z0-9_]*)/g;
    let m;
    while ((m = blazorRe.exec(source)) !== null && keys.size < 8) {
      keys.add(m[1]);
    }
  }
  return Array.from(keys);
}

function scanComponentRegistry(workspaceRoot, options) {
  const opts = options || {};
  const maxComponents = opts.maxComponents || 25;
  const maxChars = opts.maxChars || 1600;
  const layoutShells = findLayoutShells(workspaceRoot);
  const componentFiles = [];

  if (workspaceRoot && fs.existsSync(workspaceRoot)) {
    for (let i = 0; i < COMPONENT_ROOTS.length && componentFiles.length < 60; i++) {
      const rootDir = path.join(workspaceRoot, COMPONENT_ROOTS[i]);
      if (fs.existsSync(rootDir)) {
        walkLimited(rootDir, 0, 4, componentFiles, 60);
      }
    }
  }

  const components = [];
  for (let i = 0; i < componentFiles.length && components.length < maxComponents; i++) {
    const absPath = componentFiles[i];
    const ext = path.extname(absPath);
    if (!COMPONENT_EXTS.has(ext)) continue;
    let source = '';
    try {
      source = fs.readFileSync(absPath, 'utf8');
    } catch (_) {
      continue;
    }
    const relPath = path.relative(workspaceRoot, absPath).replace(/\\/g, '/');
    const baseName = path.basename(absPath, ext);
    const exportsList = extractExports(source, baseName);
    const props = extractPropKeys(source);
    if (exportsList.length > 0) {
      components.push({ path: relPath, exports: exportsList, props: props });
    }
  }

  const lines = [];
  if (layoutShells.length > 0) {
    lines.push('[ASC Layout Shell Active] Existing shell(s): ' + layoutShells.slice(0, 4).join(', ')
      + '. Page components must NOT declare duplicate <nav>, page header bars, or outer wrappers.');
  }
  if (components.length > 0) {
    lines.push('[ASC Component Registry — REUSE before creating new UI files]');
    for (let i = 0; i < components.length; i++) {
      const c = components[i];
      const propPart = c.props.length > 0 ? ' (props: ' + c.props.join(', ') + ')' : '';
      const entry = '- ' + c.path + ': ' + c.exports.join(', ') + propPart;
      if ((lines.join('\n').length + entry.length + 1) > maxChars) break;
      lines.push(entry);
    }
  }

  return {
    components: components,
    layoutShells: layoutShells,
    formatted: lines.join('\n'),
  };
}

module.exports = {
  findLayoutShells,
  scanComponentRegistry,
};
