#!/usr/bin/env node
// Agentic Senior Core — PreInvocation ladder persistence hook
// Counters context rot by re-injecting a short decision-ladder reminder
// periodically, late in context, rather than relying only on rules/ content
// that sits at the start of the conversation.
// Antigravity-only: PreInvocation fires before every model call with
// invocationNum in the input payload. For other hosts, the equivalent
// pulse is integrated into post-edit-enforce.js via the sourceEditCount counter.

const { LADDER_PULSE_INTERVAL } = require('./constants.cjs');

const LADDER_REMINDER = '[ASC] Ladder check: (1) needed? (2) exists already \u2014 reuse? '
  + '(3) stdlib/native? (4) existing dep? (5) one function? Then minimal code.';

// Security constraints are negation-type ("never do X") — most vulnerable to context rot
// per arXiv:2604.20911. Reinject verbatim alongside ladder pulse.
const SECURITY_REMINDER = '[ASC SECURITY PIN — verbatim, do not paraphrase] '
  + 'NEVER: interpolate input into SQL/shell · commit secrets/tokens/credentials '
  + '· store plaintext passwords · leak stack traces/internals/PII in responses. '
  + 'ALWAYS: parameterize queries · enforce resource-level authz · rate-limit public endpoints.';

let inputBuffer = '';
process.stdin.setEncoding('utf8');
process.stdin.on('data', chunk => {
    inputBuffer += chunk;
    try {
        const payload = JSON.parse(inputBuffer);
        
        let shouldInject = false;
        const invNum = payload.invocationNum || 0;
        if (invNum > 0 && invNum % LADDER_PULSE_INTERVAL === 0) {
            shouldInject = true;
        }

        if (shouldInject) {
            process.stdout.write(JSON.stringify({
                injectSteps: [{
                    ephemeralMessage: `**ASC LADDER PULSE**: You have completed several steps. Remember to review the 1-6 decision ladder. Document deferred debt if you take shortcuts.\n\n${SECURITY_REMINDER}`
                }]
            }) + '\n');
        } else {
            process.stdout.write('{}\n');
        }
        process.exit(0);
    } catch (e) {
        // wait for more chunks
    }
});
