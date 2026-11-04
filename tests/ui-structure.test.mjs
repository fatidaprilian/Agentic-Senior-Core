import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const currentFilePath = fileURLToPath(import.meta.url);
const repositoryRoot = path.resolve(path.dirname(currentFilePath), '..');

describe('UI Engineering Structure & Quality Floor', () => {
  const pluginDir = path.join(repositoryRoot, '.agents', 'plugins', 'agentic-senior-core');
  const uiSkillDir = path.join(pluginDir, 'skills', 'asc-ui');

  it('keeps asc-ui/SKILL.md as a lean router (< 150 lines)', async () => {
    const skillPath = path.join(uiSkillDir, 'SKILL.md');
    const content = await fs.readFile(skillPath, 'utf8');
    const lineCount = content.split('\n').length;

    assert.ok(
      lineCount <= 150,
      `asc-ui/SKILL.md must be a lean router <= 150 lines (currently ${lineCount} lines)`
    );

    // Verify key sections are present
    assert.ok(content.includes('## 1. The Quality Floor'), 'Must include Quality Floor');
    assert.ok(content.includes('## 2. Pre-Flight & Material Inventory'), 'Must include Material Inventory');
    assert.ok(content.includes('## 3. Surface Modes & Ambition Scaling'), 'Must include Surface Modes');
    assert.ok(content.includes('## 4. Scope Classification: Refine vs. Redesign'), 'Must include Scope Classification');
    assert.ok(content.includes('## 5. On-Demand Reference Library'), 'Must include Reference Library');
    assert.ok(content.includes('## 6. Verification & Handoff Sweep'), 'Must include Verification Sweep');
  });

  it('ensures all 15 reference files exist and are non-empty', async () => {
    const references = [
      'modes/operate.md',
      'modes/persuade.md',
      'modes/read.md',
      'modes/experience.md',
      'reflexes.md',
      'craft/typography.md',
      'craft/color-surfaces.md',
      'craft/motion.md',
      'craft/browser-surfaces.md',
      'copy-i18n.md',
      'mobile-responsive.md',
      'accessibility.md',
      'states-feedback.md',
      'divergence.md',
      'redesign-audit.md',
    ];

    for (const ref of references) {
      const refPath = path.join(uiSkillDir, 'references', ref);
      const stat = await fs.stat(refPath).catch(() => null);
      assert.ok(stat !== null, `Reference file must exist: ${ref}`);
      assert.ok(stat.size > 200, `Reference file must have substantive content: ${ref} (${stat?.size} bytes)`);
    }
  });

  it('validates 28 slop regexes in known-ui-slop-patterns.json with positive and negative cases', async () => {
    const slopPath = path.join(pluginDir, 'hooks', 'lib', 'known-ui-slop-patterns.json');
    const raw = await fs.readFile(slopPath, 'utf8');
    const catalog = JSON.parse(raw);

    assert.ok(Array.isArray(catalog.patterns), 'patterns must be an array');
    assert.strictEqual(catalog.patterns.length, 28, 'must have exactly 28 slop patterns');

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
      }
    };

    for (const pattern of catalog.patterns) {
      assert.ok(pattern.id, 'Pattern must have id');
      assert.ok(pattern.regex, `Pattern ${pattern.id} must have regex`);
      assert.ok(pattern.message, `Pattern ${pattern.id} must have message`);

      const tc = testCases[pattern.id];
      assert.ok(tc, `Test case must be defined for pattern: ${pattern.id}`);

      // Evaluate like post-edit-enforce.js
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
});

