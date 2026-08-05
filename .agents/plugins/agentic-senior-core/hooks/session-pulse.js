#!/usr/bin/env node
// Agentic Senior Core — PreInvocation session pulse hook (Antigravity-specific)
// Antigravity has no SessionStart event. This fires on the FIRST model call
// (invocationNum === 0) to inject AGENTS.md into the conversation — the same
// role session-start.js fills for Claude Code / Codex / Copilot via their
// real SessionStart hook.
// Does NOT replace session-start.js — that file still serves other hosts.

const fs = require('fs');
const path = require('path');

const pluginRoot = process.env.CLAUDE_PLUGIN_ROOT || path.resolve(__dirname, '..');

let inputBuffer = '';
process.stdin.setEncoding('utf8');
process.stdin.on('data', chunk => {
    inputBuffer += chunk;
    try {
        const data = JSON.parse(inputBuffer);
        
        // Only fire on the very first model call of the session
        if (data.invocationNum !== 0) {
            process.stdout.write(JSON.stringify({}) + '\n');
            process.exit(0);
            return;
        }

        const agentsPath = path.join(pluginRoot, 'rules', 'agentic-senior-core.md');
        let content;
        try {
            content = fs.readFileSync(agentsPath, 'utf8');
        } catch (_) {
            process.stdout.write(JSON.stringify({}) + '\n');
            process.exit(0);
            return;
        }

        process.stdout.write(JSON.stringify({
            injectSteps: [{ ephemeralMessage: content }],
        }) + '\n');
        process.exit(0);
    } catch (e) {
        // wait for more chunks
    }
});
