import { getSlopCatalog, bootstrapPreferences } from '../../core/bootstrap-wizard.mjs';
import { getPreferencesFilePath } from '../../core/adaptive-preferences.mjs';

const RECOMMENDED_PATTERN_IDS = [
  'ui-gradient-purple-blue',
  'ui-generic-card-shadcn',
  'ui-card-in-card-nesting',
  'ui-ghost-card',
  'ui-eyebrow-tracked-caps',
  'ui-gradient-text-cliche',
  'ui-transition-all-layout-cost',
  'ui-stripped-focus-ring',
  'ui-viewport-100vh-mobile',
  'ui-missing-reduced-motion',
  'copy-marketing-buzzwords',
  'copy-ai-buzzwords',
  'copy-cadence-tricolon',
  'copy-cadence-rebuttal',
  'copy-hybrid-neologism',
  'code-decorative-banner',
  'code-step-narration',
];

export async function runBootstrapCommand(args = []) {
  const catalog = getSlopCatalog();
  const isHelp = args.includes('--help') || args.includes('-h');
  const isList = args.includes('--list');
  const isRecommended = args.includes('--recommended') || args.includes('--all');
  const scope = (args.includes('--global') || args.includes('--user')) ? 'user' : 'project';
  const explicitIds = args.filter(a => !a.startsWith('-'));

  if (isHelp || isList || (!isRecommended && explicitIds.length === 0)) {
    console.log('Agentic Senior Core -- Anti-Slop Preference Bootstrap\n');
    console.log('Usage:');
    console.log('  asc bootstrap --list                    List all curated anti-slop pattern IDs');
    console.log('  asc bootstrap --recommended [--global]  Seed core UI & prose anti-slop rules');
    console.log('  asc bootstrap <id1> <id2> [--global]    Seed specific pattern IDs\n');
    console.log(`Available catalog patterns (${catalog.length}):`);
    for (const item of catalog) {
      console.log(`  ${item.id.padEnd(32)} ${item.message}`);
    }
    return;
  }

  const selectedIds = isRecommended ? RECOMMENDED_PATTERN_IDS : explicitIds;
  const results = bootstrapPreferences({
    cwd: process.cwd(),
    scope,
    selectedIds,
  });

  const targetFile = getPreferencesFilePath({ cwd: process.cwd(), scope });
  console.log(`Seeded ${results.length} preference rule(s) into ${scope} scope:`);
  console.log(`  ${targetFile}`);
}

