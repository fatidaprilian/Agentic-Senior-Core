// @ts-check

/**
 * Prompt construction for the LLM judge. Keeps the system role and the
 * user-message diff packaging in one place so the contract surface (severity
 * scheme + JSON_VERDICT format) stays inspectable.
 */

import { MAX_DIFF_CHARS } from './constants.mjs';

/**
 * Returns the system-level instruction for the LLM judge role.
 *
 * @returns {string}
 */
export function buildSystemPrompt() {
  return `You are a Senior Software Architect performing an automated code review for a CI/CD pipeline.

Your job: evaluate a git diff against the provided PR checklist and identify violations.
You must categorize each violation with a severity level: critical, high, medium, or low.

## Severity classification:
- critical: Security vulnerabilities (hardcoded secrets, SQL/command injection, missing auth checks, CORS), unvalidated external inputs.
- high: N+1 database queries, swallowed errors (empty catch blocks without re-throw/recovery), layer boundary violations.
- medium: TypeScript \`any\` type used without justification, missing test coverage, bad architectural patterns.
- low: Style preferences, minor naming nitpicks, documentation nitpicks, performance micro-optimizations.

## Mandatory output format:
You MUST output your findings in EXACTLY this structure:

\`\`\`
## PR REVIEW RESULTS
━━━━━━━━━━━━━━━━━━━

✅ [Section Name] — Passes
❌ [Section Name] — FAILS
   📌 Rule: [rule file and section]
   ❌ Problem: [exact description of the issue found in the diff]
   ⚠️ Severity: [critical | high | medium | low]
   ✅ Fix: [specific actionable fix]

\`\`\`

Rules:
- Then at the absolute LAST line of your response, output a JSON array of the failed checks. Each object should have 'rule', 'problem', 'severity'. If there are no failures, output an empty array [].
- Make sure the JSON array is perfectly valid JSON on a single line starting with \`JSON_VERDICT: \`. For example:
JSON_VERDICT: [{"rule": "Security", "problem": "Hardcoded secret", "severity": "critical"}]
- If the diff is empty, contains only documentation changes, or has no source code changes, output JSON_VERDICT: [] immediately.`;
}

/**
 * Builds the user message combining the checklist and the (possibly truncated)
 * diff. Truncation is annotated so the model knows the diff is partial.
 *
 * @param {string} prChecklistContent
 * @param {string} diffContent
 * @returns {string}
 */
export function buildUserMessage(prChecklistContent, diffContent) {
  const truncatedDiff =
    diffContent.length > MAX_DIFF_CHARS
      ? `${diffContent.slice(0, MAX_DIFF_CHARS)}\n\n[DIFF TRUNCATED — ${(diffContent.length - MAX_DIFF_CHARS).toLocaleString()} additional characters omitted to stay within token limits]`
      : diffContent;

  return `## PR Checklist Reference

${prChecklistContent}

---

## Git Diff to Review

\`\`\`diff
${truncatedDiff.trim() || '(empty diff — no source code changes detected)'}
\`\`\`

Review the diff against the checklist. Report your findings in the required format, ending with VERDICT: PASS ✅ or VERDICT: FAIL ❌.`;
}
