// Headless agent loop for the ASC benchmark harness.
// Talks to any OpenAI-compatible /v1/chat/completions endpoint (AgentRouter,
// OpenRouter, direct providers) and exposes a minimal tool surface:
// read_file, write_file, run_command. No CLI host required.
//
// Usage accounting is taken from each API response's `usage` object, including
// cached-token split when the provider reports it (prompt_tokens_details).

export const TOOLS = [
    {
        type: 'function',
        function: {
            name: 'read_file',
            description: 'Read a file in the working directory. Returns content with line numbers.',
            parameters: {
                type: 'object',
                properties: {
                    path: { type: 'string', description: 'Relative path from the working directory' },
                },
                required: ['path'],
            },
        },
    },
    {
        type: 'function',
        function: {
            name: 'write_file',
            description: 'Create or overwrite a file in the working directory with full content.',
            parameters: {
                type: 'object',
                properties: {
                    path: { type: 'string', description: 'Relative path from the working directory' },
                    content: { type: 'string', description: 'Complete file content to write' },
                },
                required: ['path', 'content'],
            },
        },
    },
    {
        type: 'function',
        function: {
            name: 'run_command',
            description: 'Run a shell command in the working directory. Returns stdout, stderr, and exit code.',
            parameters: {
                type: 'object',
                properties: {
                    command: { type: 'string', description: 'Command to execute' },
                },
                required: ['command'],
            },
        },
    },
];

const MAX_TURNS = 15;
const MAX_OUTPUT_CHARS = 20_000;

export function createUsageAccumulator() {
    return {
        calls: 0,
        promptTokens: 0,
        completionTokens: 0,
        cachedTokens: 0,
        toolCalls: 0,
        turns: 0,
    };
}

export function recordUsage(usage, accumulator) {
    if (!usage) return;
    accumulator.calls += 1;
    accumulator.promptTokens += usage.prompt_tokens || 0;
    accumulator.completionTokens += usage.completion_tokens || 0;
    const cached = usage.prompt_tokens_details?.cached_tokens;
    if (typeof cached === 'number') {
        accumulator.cachedTokens += cached;
    }
}

// Billed cost in USD. Rates are per 1M tokens. Cache reads are billed at the
// cached rate; the remainder of prompt tokens at the input rate.
export function computeBilledCost(usage, rates) {
    const { inputPerMTokens, outputPerMTokens, cacheReadPerMTokens, groupRatio = 1 } = rates;
    const cached = usage.cachedTokens;
    const nonCachedInput = usage.promptTokens - cached;
    const cost = (
        (nonCachedInput / 1_000_000) * inputPerMTokens
        + (cached / 1_000_000) * cacheReadPerMTokens
        + (usage.completionTokens / 1_000_000) * outputPerMTokens
    ) * groupRatio;
    return Math.round(cost * 1_000_000) / 1_000_000;
}

function truncate(text, max = MAX_OUTPUT_CHARS) {
    if (text.length <= max) return text;
    return `${text.slice(0, max)}\n... [truncated ${text.length - max} chars]`;
}

function executeToolCall(name, args, workDir) {
    if (name === 'read_file') {
        return toolReadFile(args.path, workDir);
    }
    if (name === 'write_file') {
        return toolWriteFile(args.path, args.content, workDir);
    }
    if (name === 'run_command') {
        return toolRunCommand(args.command, workDir);
    }
    return `Error: unknown tool "${name}"`;
}

function resolveSafePath(relativePath, workDir) {
    const path = require('node:path');
    const resolved = path.resolve(workDir, relativePath);
    if (!resolved.startsWith(path.resolve(workDir))) {
        return null; // path traversal guard
    }
    return resolved;
}

function toolReadFile(relativePath, workDir) {
    const fs = require('node:fs');
    const resolved = resolveSafePath(relativePath, workDir);
    if (!resolved) return 'Error: path escapes working directory';
    try {
        const content = fs.readFileSync(resolved, 'utf8');
        return truncate(content);
    } catch (error) {
        return `Error reading file: ${error.message}`;
    }
}

function toolWriteFile(relativePath, content, workDir) {
    const fs = require('node:fs');
    const path = require('node:path');
    const resolved = resolveSafePath(relativePath, workDir);
    if (!resolved) return 'Error: path escapes working directory';
    try {
        fs.mkdirSync(path.dirname(resolved), { recursive: true });
        fs.writeFileSync(resolved, content ?? '', 'utf8');
        return `Wrote ${relativePath} (${(content ?? '').length} chars)`;
    } catch (error) {
        return `Error writing file: ${error.message}`;
    }
}

function toolRunCommand(command, workDir) {
    const { execSync } = require('node:child_process');
    try {
        const stdout = execSync(command, {
            cwd: workDir,
            encoding: 'utf8',
            stdio: ['ignore', 'pipe', 'pipe'],
            timeout: 60_000,
            maxBuffer: 10 * 1024 * 1024,
            shell: process.platform === 'win32' ? 'cmd.exe' : '/bin/sh',
        });
        return truncate(stdout || '(no output)');
    } catch (error) {
        const out = [error.stdout, error.stderr ? `stderr: ${error.stderr}` : '', `exit code: ${error.status ?? 'none'}`]
            .filter(Boolean)
            .join('\n');
        return truncate(out || `Error: ${error.message}`);
    }
}

/**
 * Run one agent session against the task prompt.
 *
 * @param {object} options
 * @param {string} options.prompt - task prompt
 * @param {string} options.systemPrompt - system prompt (ASC rules or plain baseline)
 * @param {string} options.workDir - sandbox directory the tools operate in
 * @param {Function} options.transport - async ({ body }) => response JSON; injectable for tests
 * @returns {Promise<{usage, transcript, finished: boolean, stopReason: string}>}
 */
export async function runAgentSession({ prompt, systemPrompt, workDir, transport }) {
    const messages = [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: prompt },
    ];
    const usage = createUsageAccumulator();
    let stopReason = 'max-turns';

    for (let turn = 0; turn < MAX_TURNS; turn++) {
        usage.turns += 1;
        const response = await transport({
            body: {
                model: undefined, // set by caller via transport closure
                messages,
                tools: TOOLS,
                stream: false,
            },
        });

        recordUsage(response.usage, usage);

        const choice = response.choices?.[0];
        if (!choice) {
            stopReason = 'malformed-response';
            break;
        }
        if (choice.finish_reason === 'length') {
            stopReason = 'context-length';
            break;
        }

        const assistantMessage = choice.message;
        messages.push(assistantMessage);

        const toolCalls = assistantMessage.tool_calls || [];
        if (toolCalls.length === 0) {
            stopReason = 'completed';
            break;
        }

        for (const toolCall of toolCalls) {
            usage.toolCalls += 1;
            let result;
            try {
                const args = JSON.parse(toolCall.function.arguments || '{}');
                result = executeToolCall(toolCall.function.name, args, workDir);
            } catch (error) {
                result = `Error: invalid tool arguments (${error.message})`;
            }
            messages.push({
                role: 'tool',
                tool_call_id: toolCall.id,
                content: truncate(String(result)),
            });
        }
    }

    return { usage, messages, stopReason };
}
