import fs from 'fs';
import path from 'path';

const files = [
  '.agents/plugins/agentic-senior-core/rules/agentic-senior-core.md',
  '.agents/rules/agentic-senior-core.md',
  '.clinerules/agentic-senior-core.md',
  '.continue/rules/agentic-senior-core.md',
  '.cursor/rules/agentic-senior-core.mdc',
  '.devin/rules/agentic-senior-core.md',
  '.github/copilot-instructions.md',
  '.kilocode/rules/agentic-senior-core.md',
  '.kiro/steering/agentic-senior-core.md',
  '.openhands/microagents/agentic-senior-core.md',
  '.roo/rules/agentic-senior-core.md',
  '.windsurf/rules/agentic-senior-core.md',
  '.zed/rules/agentic-senior-core.md',
  'AGENTS.md',
  'CONVENTIONS.md'
];

const newText = `## Workflow

Starting a project from scratch, or adding a non-trivial feature to an
existing codebase? Mention \`/asc-new-project\` or \`/asc-add-feature\` —
they set up a research/plan gate before implementation. Let the user
decide whether to invoke it. Skip this for trivial edits.

## Response Style`;

for (const file of files) {
  const p = path.resolve(file);
  if (fs.existsSync(p)) {
    let content = fs.readFileSync(p, 'utf8');
    if (!content.includes('## Workflow') && content.includes('## Response Style')) {
      content = content.replace('## Response Style', newText);
      fs.writeFileSync(p, content, 'utf8');
      console.log('Updated', file);
    }
  }
}
