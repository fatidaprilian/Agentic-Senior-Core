import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { addRule } from './adaptive-preferences.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Loads the curated catalog of known UI/code slop patterns.
 * @returns {Array<{ id: string, regex: string, message: string }>} Catalog patterns.
 */
export function getSlopCatalog() {
  const catalogPath = path.resolve(
    __dirname,
    '../../.agents/plugins/agentic-senior-core/hooks/lib/known-ui-slop-patterns.json'
  );

  if (!fs.existsSync(catalogPath)) {
    return [];
  }

  try {
    const content = fs.readFileSync(catalogPath, 'utf8');
    const parsed = JSON.parse(content);
    return parsed.patterns || [];
  } catch (err) {
    return [];
  }
}

/**
 * Seeds selected slop pattern IDs into the target preference scope (Khroma Elicitation pattern).
 * @param {Object} options
 * @param {string} [options.cwd] Working directory.
 * @param {'user'|'project'} [options.scope] Target scope.
 * @param {Array<string>} options.selectedIds List of pattern IDs selected by the user.
 * @returns {Array<Object>} List of added rule results.
 */
export function bootstrapPreferences({ cwd = process.cwd(), scope = 'project', selectedIds = [] } = {}) {
  const catalog = getSlopCatalog();
  const results = [];

  for (const id of selectedIds) {
    const matched = catalog.find(item => item.id === id);
    if (!matched) continue;

    const res = addRule({
      cwd,
      scope,
      rule: {
        id: `bootstrap_${matched.id}`,
        type: 'syntactic',
        pattern: matched.regex,
        reason: matched.message,
        source: 'bootstrap'
      }
    });

    results.push(res);
  }

  return results;
}
