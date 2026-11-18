// Zero-dependency page-level UI copy & information-architecture auditor.
// Inspects complete UI source files for mixed languages, system-centered meta copy,
// prompt/logic instruction leakage, duplicate primary CTAs, multiple <h1>, and data echoing.

const fs = require('fs');
const path = require('path');

const ALLOWLIST_TERMS = new Set([
  'id', 'email', 'status', 'total', 'unit', 'admin', 'api', 'url', 'csv', 'pdf',
  'json', 'sku', 'po', 'erp', 'ui', 'ux', 'sla', 'kpi', 'idr', 'usd', 'ok',
  'ops', 'log', 'logs', 'file', 'data', 'filter', 'dashboard', 'menu', 'avatar',
  'icon', 'token', 'otp', 'pin', 'qr', 'code', 'server', 'client', 'online',
  'offline', 'timeout', 'format', 'info', 'detail', 'reset', 'sort', 'tab',
  'tabs', 'tag', 'tags', 'role', 'user', 'app', 'apps', 'web', 'mobile', 'sms',
  'chat', 'bot', 'ai', 'max', 'min',
]);

const ID_MARKERS = new Set([
  'yang', 'dan', 'atau', 'untuk', 'dengan', 'dari', 'pada', 'ke', 'di', 'ini', 'itu',
  'tidak', 'bukan', 'belum', 'sudah', 'sedang', 'akan', 'bisa', 'dapat', 'harus',
  'wajib', 'gagal', 'berhasil', 'simpan', 'hapus', 'ubah', 'tambah', 'batal',
  'tutup', 'buka', 'cari', 'muat', 'memuat', 'unggah', 'unduh', 'masuk', 'keluar',
  'halaman', 'daftar', 'tabel', 'riwayat', 'ringkasan', 'jumlah', 'biaya',
  'perhitungan', 'rumus', 'bobot', 'risiko', 'faktor', 'perintah', 'kerja',
  'silakan', 'coba', 'lagi', 'kosong', 'tersedia', 'ditemukan', 'semua', 'baru',
  'lama', 'pilih', 'klik', 'masukkan', 'mohon', 'terjadi', 'kesalahan', 'kirim',
  'ulang', 'pengaturan', 'akun', 'kata', 'sandi', 'nama', 'tanggal', 'estimasi',
  'nilai', 'skor', 'angka', 'laporan', 'komponen', 'menggunakan', 'menampilkan',
  'digunakan', 'mengelola', 'dihitung', 'dibulatkan', 'perkalian', 'atas',
]);

const EN_MARKERS = new Set([
  'the', 'and', 'or', 'for', 'with', 'from', 'to', 'in', 'on', 'of', 'is', 'are',
  'was', 'not', 'no', 'yes', 'this', 'that', 'save', 'delete', 'remove', 'edit',
  'update', 'add', 'create', 'cancel', 'close', 'open', 'search', 'loading',
  'load', 'upload', 'download', 'login', 'logout', 'page', 'list', 'table',
  'history', 'summary', 'count', 'cost', 'calculation', 'formula', 'weight',
  'risk', 'factor', 'work', 'order', 'orders', 'please', 'try', 'again', 'empty',
  'available', 'found', 'all', 'new', 'old', 'select', 'click', 'enter', 'error',
  'failed', 'success', 'settings', 'account', 'password', 'name', 'date',
  'estimated', 'score', 'report', 'submit', 'view', 'show', 'showing', 'displays',
  'using', 'manage', 'your', 'you', 'cannot', 'could', 'calculated', 'rounded',
  'multiply', 'multiplier', 'items', 'records',
]);

const META_COPY_PATTERNS = [
  {
    id: 'meta-self-narration',
    re: /(?:halaman|bagian|komponen|tabel|kartu|panel|fitur|sistem|aplikasi)\s+ini\s+(?:menampilkan|berisi|menyediakan|digunakan\s+untuk|memungkinkan|mengelola|menunjukkan)/i,
    msg: 'Self-narrating UI chrome copy describes the component instead of serving the user task.',
  },
  {
    id: 'meta-self-narration-en',
    re: /(?:this|the)\s+(?:page|section|component|table|card|panel|screen|view)\s+(?:displays?|shows?|contains?|lists?|provides?|is used to|allows you to)/i,
    msg: 'Self-narrating UI chrome copy describes the component instead of serving the user task.',
  },
  {
    id: 'meta-purpose-filler',
    re: /\bdigunakan\s+untuk\s+(?:mengelola|menampilkan|menghitung|menyimpan|memproses)\b/i,
    msg: 'Implementation narration ("digunakan untuk ...") leaked into UI text.',
  },
  {
    id: 'meta-formula-narration',
    re: /(?:perhitungan|kalkulasi|nilai|skor|rumus)\s+ini\s+(?:menggunakan|dihitung|memakai|berdasarkan)|(?:calculated|computed|derived|rounded)\s+(?:using|with|by|from)\b/i,
    msg: 'Internal calculation logic narration leaked into visible UI copy.',
  },
  {
    id: 'meta-dev-jargon-leak',
    re: /\b(?:NullReferenceException|TypeError|SyntaxError|ReferenceError|SQLSTATE|prisma\.|db\.query|db\.transaction|FOR UPDATE|unhandled exception|stack trace|HTTP [45]\d\d|JSON\.parse|useState|useEffect|req\.body)\b/i,
    msg: 'Internal developer/runtime jargon or exception identifier exposed in UI copy (CWE-209).',
  },
  {
    id: 'meta-prose-bloat-calque',
    re: /\b(?:(?:perform|conduct|carry out)\s+(?:an?\s+)?(?:validation|analysis|verification|check|inspection)\s+(?:on|of)|in\s+order\s+to\s+be\s+able\s+to|melakukan\s+(?:validasi|analisis|pengujian|pengecekan|pemeriksaan)\s+(?:terhadap|pada|atas)|dalam\s+rangka\s+untuk|yang\s+mana\s+hal\s+(?:ini|tersebut)|di\s+era\s+digital\b|bukan\s+sekadar\s+\w+,\s*melainkan)\b/i,
    msg: 'Verbose light-verb nominalization, clausal calque, or AI rhetorical filler detected in visible UI copy.',
  },
];

const UI_PROP_NAMES = '(?:title|subtitle|label|placeholder|emptyMessage|errorMessage|description|header|alt|aria-label|confirmText|cancelText|heading)';

const JSX_HTML_TAGS = new Set([
  'a', 'article', 'aside', 'b', 'blockquote', 'body', 'button', 'caption', 'code',
  'dd', 'details', 'dialog', 'div', 'dl', 'dt', 'em', 'fieldset', 'figcaption',
  'figure', 'footer', 'form', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'head',
  'header', 'html', 'i', 'label', 'legend', 'li', 'main', 'nav', 'ol', 'option',
  'p', 'pre', 'section', 'select', 'small', 'span', 'strong', 'summary', 'table',
  'tbody', 'td', 'textarea', 'tfoot', 'th', 'thead', 'title', 'tr', 'ul',
]);

function preserveNewlines(str) {
  return String(str || '').replace(/[^\n]/g, ' ');
}

function stripCommentsAndImports(source) {
  return String(source || '')
    .replace(/\{\/\*[\s\S]*?\*\/\}/g, preserveNewlines)
    .replace(/\/\*[\s\S]*?\*\//g, preserveNewlines)
    .replace(/^\s*import\s+[\s\S]*?from\s+['"][^'"]+['"];?\s*$/gm, preserveNewlines)
    .replace(/^\s*import\s+['"][^'"]+['"];?\s*$/gm, preserveNewlines)
    .replace(/(^|\s)\/\/[^\n]*/g, function (m, lead) { return lead + ' '.repeat(m.length - lead.length); });
}

function getLineNumber(source, index) {
  if (index <= 0) return 1;
  return source.slice(0, index).split('\n').length;
}

function cleanCandidateText(raw) {
  return String(raw || '')
    .replace(/\s+/g, ' ')
    .trim();
}

function isMeaningfulUiText(text) {
  if (!text || text.length < 2) return false;
  if (/^[\d\s.,:%+\-*/—·|()[\]{}!?]+$/.test(text)) return false;
  if (/^https?:\/\/|^\/[a-z0-9/_-]+$/i.test(text)) return false;
  if (/^[a-z0-9_-]+(?:\s+[a-z0-9_-]+){2,}$/.test(text) && /(?:flex|grid|px-|py-|text-|bg-|border-|rounded-|gap-|items-|justify-|w-\[|h-\[)/.test(text)) {
    return false;
  }
  return /[a-zA-Z]{2,}/.test(text);
}

function isJsxTagStart(src, idx) {
  if (src[idx] !== '<') return false;
  const next = src[idx + 1] || '';
  if (next === '>') return true;
  if (next === '/') {
    return src[idx + 2] === '>' || /[A-Za-z]/.test(src[idx + 2] || '');
  }
  const prev = idx > 0 ? src[idx - 1] : '';
  if (/[A-Za-z0-9_$.]/.test(prev)) return false;
  const m = src.slice(idx + 1, idx + 48).match(/^([A-Za-z][A-Za-z0-9_.]*)(?=[\s/>])/);
  if (!m) return false;
  const tagName = m[1];
  return /^[A-Z]/.test(tagName) || JSX_HTML_TAGS.has(tagName.toLowerCase());
}

function findTagClose(src, ltIdx) {
  let i = ltIdx + 1;
  let braceDepth = 0;
  let quote = null;
  const limit = Math.min(src.length, ltIdx + 4000);
  while (i < limit) {
    const ch = src[i];
    if (quote) {
      if (ch === '\\') { i += 2; continue; }
      if (ch === quote) quote = null;
      i++;
      continue;
    }
    if (ch === '"' || ch === "'" || ch === '`') {
      quote = ch;
      i++;
      continue;
    }
    if (ch === '{') { braceDepth++; i++; continue; }
    if (ch === '}') { if (braceDepth > 0) braceDepth--; i++; continue; }
    if (ch === '>' && braceDepth === 0) {
      return i;
    }
    if (braceDepth === 0 && ch === ';') return -1;
    i++;
  }
  return -1;
}

function isCodeFragment(text) {
  if (!text) return false;
  return /\b(?:const|let|var|export|interface|type|return|function|typeof|instanceof|null|undefined)\b|=>|\.\w+\s*\(|\b(?:useState|useEffect|useMemo|useCallback|useRef)\s*\(|^\s*[):?&|]|;\s*$/.test(text);
}

function extractVisibleStrings(source) {
  const cleaned = stripCommentsAndImports(source);
  const results = [];
  const seenKey = new Set();

  function pushText(rawText, index, kind) {
    const text = cleanCandidateText(rawText);
    if (!isMeaningfulUiText(text)) return;
    const line = getLineNumber(cleaned, index);
    const key = line + ':' + text;
    if (seenKey.has(key)) return;
    seenKey.add(key);
    results.push({ text: text, line: line, kind: kind });
  }

  // 1. JSX/HTML inner text via balanced tag/expression scanner (immune to TS generics & => handlers)
  let jsxDepth = 0;
  let i = 0;
  while (i < cleaned.length) {
    if (cleaned[i] !== '<' || !isJsxTagStart(cleaned, i)) {
      i++;
      continue;
    }
    const gtIdx = findTagClose(cleaned, i);
    if (gtIdx === -1) {
      i++;
      continue;
    }
    const isClosing = cleaned[i + 1] === '/';
    const isSelfClosing = !isClosing && gtIdx > i && cleaned[gtIdx - 1] === '/';
    if (isClosing) jsxDepth = Math.max(0, jsxDepth - 1);
    else if (!isSelfClosing) jsxDepth++;

    i = gtIdx + 1;
    if (jsxDepth <= 0) continue;

    // Scan child text & inline expressions until the next JSX tag start (outside string literals)
    const childStart = i;
    let braceDepth = 0;
    let quote = null;
    let plainChars = '';
    let litStart = -1;
    let litBuf = '';
    while (i < cleaned.length) {
      const ch = cleaned[i];
      if (quote) {
        if (ch === '\\' && i + 1 < cleaned.length) {
          if (braceDepth > 0) litBuf += cleaned[i + 1];
          i += 2;
          continue;
        }
        if (ch === quote) {
          if (braceDepth > 0 && litBuf.length >= 2) {
            pushText(litBuf, litStart, 'expr-literal');
          }
          quote = null;
          litBuf = '';
          i++;
          continue;
        }
        if (braceDepth > 0) litBuf += ch;
        i++;
        continue;
      }
      if (braceDepth > 0 && (ch === '"' || ch === "'" || ch === '`')) {
        quote = ch;
        litStart = i;
        litBuf = '';
        i++;
        continue;
      }
      if (ch === '{') { braceDepth++; i++; continue; }
      if (ch === '}' && braceDepth > 0) { braceDepth--; i++; continue; }
      if (isJsxTagStart(cleaned, i)) {
        break;
      }
      if (braceDepth === 0) plainChars += ch;
      i++;
    }

    const plainOnly = plainChars.trim();
    if (plainOnly && !isCodeFragment(plainOnly)) {
      pushText(plainOnly, childStart, 'jsx-text');
    }
  }

  let m;

  // 2. Explicit UI-facing attribute/prop string literals
  const propRe = new RegExp('\\b' + UI_PROP_NAMES + '\\s*=\\s*(?:([\'"])((?:\\\\.|(?!\\1)[^\\\\]){2,240})\\1|\\{\\s*([\'"])((?:\\\\.|(?!\\3)[^\\\\]){2,240})\\3\\s*\\})', 'gi');
  while ((m = propRe.exec(cleaned)) !== null) {
    const val = m[2] || m[4] || '';
    pushText(val, m.index, 'ui-prop');
  }

  // 3. Explicit UI header/error/toast literals in JS/TS objects (e.g. header: 'Estimasi Biaya')
  const objPropRe = /\b(?:header|label|title|subtitle|placeholder|emptyMessage|error|message)\s*:\s*(['"])((?:\\.|(?!\1)[^\\]){2,240})\1/gi;
  while ((m = objPropRe.exec(cleaned)) !== null) {
    pushText(m[2], m.index, 'obj-prop');
  }

  return results;
}

function tokenizeWords(text) {
  return (String(text || '').toLowerCase().match(/\b[a-z]{2,}\b/g) || []);
}

function classifyWords(words) {
  const idHits = [];
  const enHits = [];
  for (let i = 0; i < words.length; i++) {
    const w = words[i];
    if (ALLOWLIST_TERMS.has(w)) continue;
    if (ID_MARKERS.has(w)) idHits.push(w);
    else if (EN_MARKERS.has(w)) enHits.push(w);
  }
  return { idHits: idHits, enHits: enHits };
}

function detectDominantLanguage(entries) {
  let totalId = 0;
  let totalEn = 0;
  for (let i = 0; i < entries.length; i++) {
    const c = classifyWords(tokenizeWords(entries[i].text));
    totalId += c.idHits.length;
    totalEn += c.enHits.length;
  }
  if (totalId === 0 && totalEn === 0) return null;
  if (totalId >= totalEn) return 'id';
  return 'en';
}

function extractAllowedPromptLabels(userPrompt) {
  const allowed = new Set();
  if (!userPrompt) return allowed;
  const btRe = /`([^`]{2,40})`/g;
  let m;
  while ((m = btRe.exec(String(userPrompt))) !== null) {
    const label = cleanCandidateText(m[1]).toLowerCase();
    if (label && label.split(/\s+/).length <= 4 && !/[/.(){}=]/.test(label)) {
      allowed.add(label);
    }
  }
  return allowed;
}

function checkLanguagePurity(entries, preferredLang, allowedLabels) {
  const dominant = preferredLang || detectDominantLanguage(entries);
  const violations = [];
  if (!dominant) return { dominantLang: null, violations: violations };

  for (let i = 0; i < entries.length; i++) {
    const entry = entries[i];
    const norm = entry.text.toLowerCase();
    if (allowedLabels && allowedLabels.has(norm)) continue;
    const words = tokenizeWords(entry.text);
    const c = classifyWords(words);

    if (c.idHits.length > 0 && c.enHits.length > 0) {
      violations.push({
        type: 'MIXED_LANGUAGE_STRING',
        line: entry.line,
        text: entry.text,
        detail: 'Mixed Indonesian (' + c.idHits.join(', ') + ') and English (' + c.enHits.join(', ') + ') in one UI string.',
      });
    } else if (dominant === 'id' && c.enHits.length > 0 && c.idHits.length === 0) {
      violations.push({
        type: 'LANGUAGE_MISMATCH',
        line: entry.line,
        text: entry.text,
        detail: 'English UI copy ("' + entry.text + '") mixed into an Indonesian surface.',
      });
    } else if (dominant === 'en' && c.idHits.length > 0 && c.enHits.length === 0) {
      violations.push({
        type: 'LANGUAGE_MISMATCH',
        line: entry.line,
        text: entry.text,
        detail: 'Indonesian UI copy ("' + entry.text + '") mixed into an English surface.',
      });
    }
  }
  return { dominantLang: dominant, violations: violations };
}

function checkMetaCopy(entries) {
  const violations = [];
  for (let i = 0; i < entries.length; i++) {
    const entry = entries[i];
    for (let j = 0; j < META_COPY_PATTERNS.length; j++) {
      const p = META_COPY_PATTERNS[j];
      if (p.re.test(entry.text)) {
        violations.push({
          type: 'SYSTEM_META_COPY',
          id: p.id,
          line: entry.line,
          text: entry.text,
          detail: p.msg,
        });
      }
    }
  }
  return violations;
}

function extractInstructionPhrases(userPrompt) {
  if (!userPrompt) return [];
  const phrases = new Set();
  const prompt = String(userPrompt);

  // Extract explicit formula / implementation phrases following logic directives
  const directiveRe = /(?:perkalian|rumus|formula|bulatkan\s+ke\s+atas|faktor\s+risiko(?:\s+[\d.]+)?|bobot\s*[x*×]\s*[a-z0-9_. ]+|multiply\s+by\s+[a-z0-9_. ]+|round(?:ed)?\s+up|stored\s+in\s+[a-z0-9_.-]+|select\s+from\s+[a-z0-9_]+|for\s+update)/gi;
  let m;
  while ((m = directiveRe.exec(prompt)) !== null) {
    const p = m[0].replace(/\s+/g, ' ').trim().toLowerCase();
    if (p.length >= 6) phrases.add(p);
  }
  return Array.from(phrases);
}

function checkInstructionLeakage(entries, userPrompt) {
  const violations = [];
  const leakedPhrases = extractInstructionPhrases(userPrompt);
  if (leakedPhrases.length === 0) return violations;

  for (let i = 0; i < entries.length; i++) {
    const entry = entries[i];
    const lowerText = entry.text.toLowerCase();
    for (let j = 0; j < leakedPhrases.length; j++) {
      if (lowerText.includes(leakedPhrases[j])) {
        violations.push({
          type: 'INSTRUCTION_LEAKAGE',
          line: entry.line,
          text: entry.text,
          detail: 'Implementation/logic phrase from session prompt ("' + leakedPhrases[j] + '") leaked into visible UI copy.',
        });
        break;
      }
    }
  }
  return violations;
}

function checkRedundancy(source, entries) {
  const violations = [];
  const cleaned = stripCommentsAndImports(source);

  // 1. Multiple <h1> tags
  const h1Matches = cleaned.match(/<h1\b/gi) || [];
  if (h1Matches.length > 1) {
    violations.push({
      type: 'MULTIPLE_H1',
      line: 1,
      text: '<h1> x' + h1Matches.length,
      detail: 'Page contains ' + h1Matches.length + ' <h1> headings; enforce one page title heading.',
    });
  }

  // 2. Multiple primary CTA buttons (solid bg-primary) or duplicate button labels
  const primaryBtns = cleaned.match(/<(?:button|Button)\b[^>]*\bbg-primary\b/gi) || [];
  if (primaryBtns.length > 1) {
    violations.push({
      type: 'MULTIPLE_PRIMARY_CTA',
      line: 1,
      text: 'bg-primary buttons x' + primaryBtns.length,
      detail: 'Found ' + primaryBtns.length + ' primary solid buttons; enforce single primary CTA per viewport region.',
    });
  }

  // 3. Duplicate meaningful visible copy blocks (>= 3 words)
  const copyMap = Object.create(null);
  for (let i = 0; i < entries.length; i++) {
    const norm = entries[i].text.toLowerCase().replace(/[^a-z0-9\s]/g, '').replace(/\s+/g, ' ').trim();
    if (norm.split(' ').length < 3) continue;
    if (!copyMap[norm]) copyMap[norm] = [];
    copyMap[norm].push(entries[i].line);
  }
  Object.keys(copyMap).forEach(function (norm) {
    if (copyMap[norm].length > 1) {
      violations.push({
        type: 'DUPLICATE_UI_COPY',
        line: copyMap[norm][1],
        text: norm,
        detail: 'Identical multi-word copy ("' + norm + '") repeated at lines ' + copyMap[norm].join(', ') + '.',
      });
    }
  });

  // 4. Data expression echoing across sibling containers (<dl> / summary vs detail blocks)
  const exprCounts = Object.create(null);
  const exprRe = /\{([a-zA-Z_][a-zA-Z0-9_]*\.[a-zA-Z0-9_.]+)\}/g;
  let m;
  while ((m = exprRe.exec(cleaned)) !== null) {
    const expr = m[1];
    // Ignore loop row bindings like row.id or item.name unless echoed >= 3 times
    if (/^(?:row|item|c|col|props)\./.test(expr)) continue;
    const line = getLineNumber(cleaned, m.index);
    if (!exprCounts[expr]) exprCounts[expr] = [];
    exprCounts[expr].push(line);
  }
  Object.keys(exprCounts).forEach(function (expr) {
    if (exprCounts[expr].length > 1) {
      violations.push({
        type: 'DATA_ECHO',
        line: exprCounts[expr][1],
        text: '{' + expr + '}',
        detail: 'Data expression {' + expr + '} rendered multiple times (lines ' + exprCounts[expr].join(', ') + '). Assign each data field to one region.',
      });
    }
  });

  return violations;
}

function auditPageSource(source, options) {
  const opts = options || {};
  const entries = extractVisibleStrings(source);
  const allowedLabels = extractAllowedPromptLabels(opts.userPrompt || '');
  const langResult = checkLanguagePurity(entries, opts.preferredLang || null, allowedLabels);
  const metaViolations = checkMetaCopy(entries);
  const leakViolations = checkInstructionLeakage(entries, opts.userPrompt || '');
  const redundancyViolations = checkRedundancy(source, entries);

  const allViolations = []
    .concat(langResult.violations)
    .concat(metaViolations)
    .concat(leakViolations)
    .concat(redundancyViolations);

  return {
    dominantLang: langResult.dominantLang,
    extractedCount: entries.length,
    languageViolations: langResult.violations,
    metaCopyViolations: metaViolations,
    instructionLeakageViolations: leakViolations,
    redundancyViolations: redundancyViolations,
    totalViolations: allViolations.length,
    violations: allViolations,
  };
}

function auditUiFile(filePath, options) {
  if (!filePath || !fs.existsSync(filePath)) return null;
  try {
    const st = fs.statSync(filePath);
    if (!st.isFile() || st.size > 262144) return null;
    const source = fs.readFileSync(filePath, 'utf8');
    return auditPageSource(source, options);
  } catch (_) {
    return null;
  }
}

module.exports = {
  extractVisibleStrings,
  checkLanguagePurity,
  checkMetaCopy,
  checkInstructionLeakage,
  checkRedundancy,
  auditPageSource,
  auditUiFile,
};
