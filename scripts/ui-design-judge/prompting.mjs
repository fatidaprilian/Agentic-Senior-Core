// @ts-check

import { MAX_DIFF_CHARS } from './constants.mjs';

export function buildSystemPrompt() {
  return [
    'You are a Principal UI/UX Design Reviewer.',
    'Compare the changed UI code against the provided design contract.',
    'Treat docs/design-intent.json as the machine-readable source of truth.',
    'Treat docs/DESIGN.md as explanatory context, not a generic style guide.',
    'Treat designExecutionPolicy as the execution contract for how the UI must be planned, structured, and reviewed.',
    'Treat designExecutionHandoff as the explicit bridge between design intent and implementation decisions.',
    'Treat reviewRubric as the stable scoring frame for distinctiveness, contract fidelity, visual consistency, heuristic UX quality, and motion discipline.',
    'Use repoEvidence.designEvidenceSummary as implementation evidence when deciding whether the diff follows the intended system.',
    'Do not reward generic SaaS defaults or popular template patterns.',
    'Do not penalize originality when the implementation still aligns with the contract.',
    'Purposeful motion is allowed and can improve quality. Only flag motion when it drifts from the contract, ignores reduced-motion expectations, or adds avoidable performance/accessibility risk.',
    'Only flag drift when there is a clear mismatch with the contract, accessibility non-negotiables, or cross-viewport adaptation rules.',
    'Treat WCAG 2.2 AA failures as hard accessibility drift.',
    'Treat APCA as advisory perceptual tuning only. Do not set blocking solely because APCA indicates a stronger readability adjustment when WCAG hard requirements still pass.',
    'Check focus visibility, focus appearance, target size, keyboard access, accessible authentication, and status or dynamic state access when the diff touches those surfaces.',
    'Check design-intent.json for reviewRubric.genericityAutoFail. If true and forbiddenPatterns or genericitySignals are detected in the changed UI, this audit is no longer merely advisory for that finding: set blockingRecommended to true, mark the relevant rubric dimension as blocking, and require rebuilding the drifted surface instead of polishing it.',
    'Focus on color intent, typographic hierarchy, responsive re-layout, purposeful motion, component morphology across states, interaction behavior, and genericity drift.',
    'If you call something generic, explain the specific genericity signal or anti-pattern that caused that judgment.',
    'Separate taste from failure. A bold design that follows the contract must not be penalized only because it is unusual.',
    'Return ONLY one JSON object on a single line prefixed with JSON_VERDICT:.',
    'Schema:',
    '{"alignmentScore": number|null, "genericityAssessment": {"status": "distinctive|mixed|generic|unclear", "reason": string}, "tasteVsFailureSeparated": boolean, "rubricBreakdown": [{"dimension": string, "score": number|null, "verdict": "strong|acceptable|weak|unclear", "reason": string, "blocking": boolean}], "notes": string[], "findings": [{"area": string, "severity": "high|medium|low", "problem": string, "evidence": string, "requiredAction": string, "blockingRecommended": boolean}]}',
  ].join('\n');
}

export function buildUserMessage(designIntentContent, designGuideContent, diffContent, changedUiFiles, designExecutionSummary) {
  const truncatedDiff = diffContent.length > MAX_DIFF_CHARS
    ? `${diffContent.slice(0, MAX_DIFF_CHARS)}\n\n[DIFF TRUNCATED - ${diffContent.length - MAX_DIFF_CHARS} additional characters omitted]`
    : diffContent;

  return [
    '## Changed UI Files',
    changedUiFiles.length > 0 ? changedUiFiles.map((filePath) => `- ${filePath}`).join('\n') : '- none',
    '',
    '## design-intent.json',
    '```json',
    JSON.stringify(designIntentContent, null, 2),
    '```',
    '',
    '## Review Rubric',
    '```json',
    JSON.stringify(designIntentContent?.reviewRubric || null, null, 2),
    '```',
    '',
    '## Structured Design Handoff',
    '```json',
    JSON.stringify(designIntentContent?.designExecutionHandoff || null, null, 2),
    '```',
    '',
    '## DESIGN.md',
    '```md',
    designGuideContent.trim() || '(missing DESIGN.md)',
    '```',
    '',
    '## Structured Design Execution Summary',
    '```json',
    JSON.stringify(designExecutionSummary, null, 2),
    '```',
    '',
    '## UI Diff',
    '```diff',
    truncatedDiff.trim() || '(no UI diff)',
    '```',
    '',
    'Judge alignment to the contract. Avoid aesthetic bias toward generic web trends or toward motionless/static outputs.',
  ].join('\n');
}
