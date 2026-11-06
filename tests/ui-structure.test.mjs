import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const currentFilePath = fileURLToPath(import.meta.url);
const repositoryRoot = path.resolve(path.dirname(currentFilePath), '..');

async function computeDirSize(dirPath) {
  let total = 0;
  const entries = await fs.readdir(dirPath, { withFileTypes: true });
  for (const entry of entries) {
    const full = path.join(dirPath, entry.name);
    if (entry.isDirectory()) {
      total += await computeDirSize(full);
    } else {
      const st = await fs.stat(full);
      total += st.size;
    }
  }
  return total;
}

describe('UI Engineering Structure & Quality Floor', () => {
  const pluginDir = path.join(repositoryRoot, '.agents', 'plugins', 'agentic-senior-core');
  const uiSkillDir = path.join(pluginDir, 'skills', 'asc-ui');

  it('keeps asc-ui/SKILL.md as a lean deterministic router (<= 130 lines)', async () => {
    const skillPath = path.join(uiSkillDir, 'SKILL.md');
    const content = await fs.readFile(skillPath, 'utf8');
    const lineCount = content.split('\n').length;

    assert.ok(
      lineCount <= 130,
      `asc-ui/SKILL.md must be a lean router <= 130 lines (currently ${lineCount} lines)`
    );

    assert.ok(content.includes('## 1. The Quality Floor'), 'Must include Quality Floor');
    assert.ok(content.includes('## 2. Pre-Flight & Reuse Gate'), 'Must include Pre-Flight & Reuse Gate');
    assert.ok(content.includes('## 3. Data-to-Structure Mapping'), 'Must include Data-to-Structure Mapping');
    assert.ok(content.includes('## 4. On-Demand Engineering References'), 'Must include On-Demand Engineering References');
    assert.ok(content.includes('## 5. Verification & Handoff Sweep'), 'Must include Verification & Handoff Sweep');
  });

  it('purges bloated visuals/ directory and keeps total asc-ui footprint under 100 KB with 3 engineering references', async () => {
    const visualsStat = await fs.stat(path.join(uiSkillDir, 'references', 'visuals')).catch(() => null);
    assert.strictEqual(visualsStat, null, 'references/visuals bloat directory must not exist');

    const expectedRefs = [
      'data-to-structure.md',
      'states-and-a11y.md',
      'responsive-and-copy.md',
    ];

    const actualEntries = await fs.readdir(path.join(uiSkillDir, 'references'));
    assert.deepStrictEqual(
      actualEntries.slice().sort(),
      expectedRefs.slice().sort(),
      'references/ must contain strictly the 3 deterministic engineering reference files'
    );

    for (const ref of expectedRefs) {
      const refPath = path.join(uiSkillDir, 'references', ref);
      const stat = await fs.stat(refPath);
      assert.ok(stat.size > 500, `Reference file must have substantive content: ${ref}`);
    }

    const totalBytes = await computeDirSize(uiSkillDir);
    assert.ok(
      totalBytes < 100 * 1024,
      `Total asc-ui directory must stay under 100 KB (currently ${totalBytes} bytes)`
    );
  });

  it('validates 34 slop regexes in known-ui-slop-patterns.json with positive and negative cases', async () => {
    const slopPath = path.join(pluginDir, 'hooks', 'lib', 'known-ui-slop-patterns.json');
    const raw = await fs.readFile(slopPath, 'utf8');
    const catalog = JSON.parse(raw);

    assert.ok(Array.isArray(catalog.patterns), 'patterns must be an array');
    assert.strictEqual(catalog.patterns.length, 34, 'must have exactly 34 slop patterns');

    const testCases = {
      'ui-gradient-purple-blue': {
        pos: 'className="from-purple-500 to-blue-500"',
        neg: 'className="from-slate-900 to-slate-800"'
      },
      'ui-generic-card-shadcn': {
        pos: 'className="shadow-lg rounded-2xl p-6"',
        neg: 'className="border border-border p-4"'
      },
      'ui-inter-font-unpaired': {
        pos: "font-family: 'Inter';",
        neg: "font-family: 'Inter', sans-serif;"
      },
      'ui-colored-left-border': {
        pos: 'className="border-l-4 border-blue-500"',
        neg: 'className="border border-border"'
      },
      'ui-glassmorphism': {
        pos: 'className="backdrop-blur-md bg-white/10"',
        neg: 'className="bg-background"'
      },
      'ui-pill-badge-generic': {
        pos: 'className="rounded-full px-4 py-1 text-sm font-medium bg-blue-100 text-blue-800"',
        neg: 'className="rounded-md px-2 py-0.5 text-xs bg-muted"'
      },
      'ui-gradient-text-cliche': {
        pos: 'className="bg-clip-text text-transparent"',
        neg: 'className="text-foreground font-semibold"'
      },
      'ui-transition-all-layout-cost': {
        pos: 'className="transition-all duration-200"',
        neg: 'className="transition-colors duration-150"'
      },
      'ui-stripped-focus-ring': {
        pos: '<button className="outline-none">Click</button>',
        neg: '<button className="focus:outline-none focus-visible:ring-2">Click</button>'
      },
      'copy-marketing-buzzwords': {
        pos: 'Manage your databases seamlessly.',
        neg: 'Manage your databases directly.'
      },
      'code-decorative-banner': {
        pos: '// =====================',
        neg: '// Handle edge case for empty array'
      },
      'code-step-narration': {
        pos: '// Step 1: validate user input',
        neg: '// Reject requests exceeding rate limit'
      },
      'ui-eyebrow-tracked-caps': {
        pos: '<div className="text-[11px] uppercase tracking-wider text-muted-foreground">Category</div>',
        neg: '<h2 className="text-xl font-bold">Category Overview</h2>'
      },
      'ui-hard-offset-shadow': {
        pos: "style={{ boxShadow: '4px 4px 0 #000' }}",
        neg: 'className="shadow-sm"'
      },
      'ui-zero-offset-glow': {
        pos: 'className="shadow-[0_0_20px_rgba(120,50,255,0.5)]"',
        neg: 'className="shadow-md"'
      },
      'ui-ghost-card': {
        pos: 'className="border border-border shadow-lg rounded-lg"',
        neg: 'className="border border-border rounded-lg"'
      },
      'ui-viewport-100vh-mobile': {
        pos: '<div className="h-screen flex flex-col">',
        neg: '<div className="min-h-dvh flex flex-col">'
      },
      'ui-fixed-button-width': {
        pos: '<button className="w-[120px] px-4 py-2">Save</button>',
        neg: '<button className="min-w-[5rem] px-4 py-2">Save</button>'
      },
      'ui-empty-state-essay': {
        pos: '<p>Your workspace is a blank canvas awaiting your creativity!</p>',
        neg: '<p>No webhooks configured. Create one to receive events.</p>'
      },
      'ui-modal-by-default': {
        pos: '<Dialog open={true}><form onSubmit={handleSubmit}><input /></form></Dialog>',
        neg: '<form onSubmit={handleSubmit} className="space-y-4"><input /></form>'
      },
      'ui-missing-reduced-motion': {
        pos: '@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }',
        neg: '@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } } @media (prefers-reduced-motion: reduce) { .spin { animation: none; } }'
      },
      'ui-hover-scale-bounce': {
        pos: '<button className="hover:scale-105 transition-transform">Submit</button>',
        neg: '<button className="active:scale-[0.98] transition-colors">Submit</button>'
      },
      'copy-hybrid-neologism': {
        pos: 'Tombol ini digunakan untuk meng-generate laporan bulanan.',
        neg: 'Tombol ini digunakan untuk menghasilkan laporan bulanan.'
      },
      'ui-card-in-card-nesting': {
        pos: '<div className="rounded-2xl border p-6"><div className="rounded-xl border p-4">Nested</div></div>',
        neg: '<div className="rounded-2xl border p-6"><div className="p-4 border-b">Row</div></div>'
      },
      'ui-terracotta-cream-cliche': {
        pos: '<div className="bg-[#fdfbf7] p-8"><h1 className="text-[#c2410c] font-serif italic">Artisan</h1></div>',
        neg: '<div className="bg-background text-foreground"><h1 className="text-2xl font-bold">Artisan</h1></div>'
      },
      'ui-index-number-trope': {
        pos: '<span className="text-xs">01 / 04</span>',
        neg: '<span className="text-xs">Page 1 of 4</span>'
      },
      'ui-broadsheet-cosplay': {
        pos: '<div className="border-b border-border/40 rounded-none p-4">Section</div>',
        neg: '<div className="border border-border rounded-lg p-4">Section</div>'
      },
      'ui-agency-micro-meta': {
        pos: '<span className="text-muted-foreground">37.7749° N</span>',
        neg: '<span className="text-muted-foreground">San Francisco, CA</span>'
      },
      'copy-ai-buzzwords': {
        pos: 'Our cutting-edge engine supercharges your development workflow.',
        neg: 'The compiler processes requests in 45 milliseconds on standard hardware.'
      },
      'copy-cadence-tricolon': {
        pos: 'Fast. Simple. Secure. Start deploying now.',
        neg: 'Deploy your application with automated tests and safe rollbacks.'
      },
      'copy-cadence-rebuttal': {
        pos: "Not just a tool, it's a workflow for engineering teams.",
        neg: 'A deployment tool for engineering teams.'
      },
      'copy-filler-preamble': {
        pos: "In today's fast-paced world, software must be reliable.",
        neg: 'Real-time crash reporting with sub-second alert latency.'
      },
      'copy-clumsy-indonesian-translations': {
        pos: 'Buka laci sembul untuk melihat detail indikator.',
        neg: 'Buka panel samping untuk melihat detail indikator.'
      },
      'ui-numbered-step-card': {
        pos: '<div className="rounded-xl border p-6"><span className="badge">01</span><h3>Step One</h3></div>',
        neg: '<ol className="divide-y divide-border"><li className="py-3">1. Verify account</li></ol>'
      }
    };

    for (const pattern of catalog.patterns) {
      assert.ok(pattern.id, 'Pattern must have id');
      assert.ok(pattern.regex, `Pattern ${pattern.id} must have regex`);
      assert.ok(pattern.message, `Pattern ${pattern.id} must have message`);

      const tc = testCases[pattern.id];
      assert.ok(tc, `Test case must be defined for pattern: ${pattern.id}`);

      const rePos = new RegExp(pattern.regex, 'ig');
      assert.ok(
        rePos.test(tc.pos),
        `Pattern ${pattern.id} should match positive sample: "${tc.pos}"`
      );

      const reNeg = new RegExp(pattern.regex, 'ig');
      assert.strictEqual(
        reNeg.test(tc.neg),
        false,
        `Pattern ${pattern.id} should NOT match negative sample: "${tc.neg}"`
      );
    }
  });

  it('guarantees zero codebase contamination in UI references', async () => {
    const files = await fs.readdir(path.join(uiSkillDir, 'references'), { recursive: true });
    for (const file of files) {
      if (typeof file === 'string' && file.endsWith('.md')) {
        const fullPath = path.join(uiSkillDir, 'references', file);
        const content = await fs.readFile(fullPath, 'utf8');
        assert.ok(!content.includes('SAURAN'), `Found project contamination in ${file}`);
        assert.ok(!content.includes('THEME LOCKED:'), `Found forced lock command in ${file}`);
      }
    }
  });
});
