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

for (const file of files) {
  const p = path.resolve(file);
  if (fs.existsSync(p)) {
    let content = fs.readFileSync(p, 'utf8');
    
    // Remove the floating "For domain-specific rules" line
    const regex1 = /For domain-specific rules[^\n]*\n+/g;
    content = content.replace(regex1, '');
    
    fs.writeFileSync(p, content, 'utf8');
  }
}
