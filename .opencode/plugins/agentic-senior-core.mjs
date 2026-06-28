import { readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const AGENTS_PATH = resolve(ROOT, 'AGENTS.md');

function readRules() {
  try {
    return readFileSync(AGENTS_PATH, 'utf8');
  } catch {
    return '';
  }
}

export default function (ctx) {
  const rules = readRules();

  if (ctx.experimental?.chat?.system?.transform) {
    ctx.experimental.chat.system.transform((system) => {
      return rules ? `${system}\n\n${rules}` : system;
    });
  }

  if (ctx.registerCommand) {
    ctx.registerCommand('asc-help', {
      description: 'Show Agentic Senior Core commands',
      execute: () => 'Commands: /asc-refactor, /asc-review, /asc-audit, /asc-help',
    });
  }
}
