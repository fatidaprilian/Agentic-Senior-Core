// @ts-check

import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import {
  ARCHITECTURE_REVIEW_CHECKLIST_PATH,
  BACKEND_ARCHITECTURE_RULE_PATH,
  BACKEND_REVIEW_CHECKLIST_PATH,
  REFACTOR_PROMPT_PATH,
  REPOSITORY_ROOT,
  REQUIRED_ARCHITECTURE_REVIEW_CHECKLIST_SNIPPETS,
  REQUIRED_BACKEND_ARCHITECTURE_RULE_SNIPPETS,
  REQUIRED_BACKEND_REVIEW_CHECKLIST_SNIPPETS,
  REQUIRED_REFACTOR_PROMPT_SNIPPETS,
  VERSION_PATTERN,
} from './constants.mjs';
import { pushResult, readText } from './runtime.mjs';
import {
  buildDesignIntentSeedFromSignals,
  validateDesignContractCompleteness,
} from '../../lib/cli/project-scaffolder.mjs';

export function runStaticReleaseChecks(results, diagnostics) {
  const packageJsonPath = 'package.json';
  const changelogPath = 'CHANGELOG.md';
  const roadmapPath = 'docs/roadmap.md';

  const packageJsonContent = readText(packageJsonPath);
  if (!packageJsonContent) {
    pushResult(results, false, 'package-json-exists', `Missing ${packageJsonPath}`);
  }

  let packageManifest = null;
  if (packageJsonContent) {
    try {
      packageManifest = JSON.parse(packageJsonContent);
      pushResult(results, true, 'package-json-parse', 'package.json is valid JSON');
    } catch (packageParseError) {
      const parseMessage = packageParseError instanceof Error ? packageParseError.message : 'Unknown parse error';
      pushResult(results, false, 'package-json-parse', `Cannot parse package.json: ${parseMessage}`);
    }
  }

  const releaseVersion = packageManifest?.version;
  diagnostics.releaseVersion = releaseVersion ?? null;

  if (!releaseVersion || !VERSION_PATTERN.test(releaseVersion)) {
    pushResult(results, false, 'version-semver', `Invalid package version: ${String(releaseVersion)}`);
  } else {
    pushResult(results, true, 'version-semver', `Version ${releaseVersion} matches x.y.z format`);
  }

  const changelogContent = readText(changelogPath);
  if (!changelogContent) {
    pushResult(results, false, 'changelog-exists', `Missing ${changelogPath}`);
  } else if (!releaseVersion) {
    pushResult(results, false, 'changelog-version-entry', 'Cannot check changelog because version is invalid');
  } else if (!changelogContent.includes(`## ${releaseVersion} - `)) {
    pushResult(results, false, 'changelog-version-entry', `Missing release header for ${releaseVersion} in CHANGELOG.md`);
  } else {
    pushResult(results, true, 'changelog-version-entry', `Found release header for ${releaseVersion}`);
  }

  const roadmapContent = readText(roadmapPath);
  if (!roadmapContent) {
    pushResult(results, false, 'roadmap-exists', `Missing ${roadmapPath}`);
  } else if (!roadmapContent.includes('V1.8')) {
    pushResult(results, false, 'roadmap-v18', 'Roadmap does not mention V1.8 release track');
  } else {
    pushResult(results, true, 'roadmap-v18', 'Roadmap includes V1.8 release track');
  }

  try {
    const designIntentSeed = JSON.parse(buildDesignIntentSeedFromSignals({
      projectName: 'Release Gate UI Contract',
      projectDescription: 'Validates deterministic UI design contract completeness before release',
      primaryDomain: 'Web application',
      initContext: {
        stackFileName: 'agent-decision-runtime.md',
        blueprintFileName: 'agent-decision-architecture.md',
      },
      status: 'release-gate-seed-validation',
    }));
    const designContractIssues = validateDesignContractCompleteness(designIntentSeed);

    if (designContractIssues.length === 0) {
      pushResult(results, true, 'ui-design-contract-completeness', 'Design intent seed includes deterministic token derivation and library verification gates');
    } else {
      pushResult(
        results,
        false,
        'ui-design-contract-completeness',
        `Design intent seed completeness issues: ${designContractIssues.join('; ')}`
      );
    }
  } catch (designContractError) {
    const designContractMessage = designContractError instanceof Error ? designContractError.message : 'Unknown design contract error';
    pushResult(results, false, 'ui-design-contract-completeness', `Cannot validate design intent seed: ${designContractMessage}`);
  }

  const requiredOperationsFiles = [
    '.agent-context/review-checklists/architecture-review.md',
    '.github/workflows/release-gate.yml',
    '.github/workflows/sbom-compliance.yml',
    '.github/workflows/governance-weekly-report.yml',
    'scripts/governance-weekly-report.mjs',
  ];

  for (const requiredOperationsFile of requiredOperationsFiles) {
    const absoluteRequiredPath = resolve(REPOSITORY_ROOT, requiredOperationsFile);
    if (!existsSync(absoluteRequiredPath)) {
      pushResult(results, false, 'required-operations-file', `Missing ${requiredOperationsFile}`);
      continue;
    }

    pushResult(results, true, 'required-operations-file', `${requiredOperationsFile} is present`);
  }

  pushResult(
    results,
    true,
    'compatibility-manifest-coverage',
    'Skill compatibility manifest gate has been retired in V3 purge mode'
  );

  const backendArchitectureRuleContent = readText(BACKEND_ARCHITECTURE_RULE_PATH);
  if (!backendArchitectureRuleContent) {
    pushResult(results, false, 'backend-universal-principles-rule-exists', `Missing ${BACKEND_ARCHITECTURE_RULE_PATH}`);
  } else {
    pushResult(results, true, 'backend-universal-principles-rule-exists', `${BACKEND_ARCHITECTURE_RULE_PATH} is present`);

    const missingBackendArchitectureRuleSnippets = REQUIRED_BACKEND_ARCHITECTURE_RULE_SNIPPETS.filter(
      (requiredSnippet) => !backendArchitectureRuleContent.includes(requiredSnippet)
    );

    if (missingBackendArchitectureRuleSnippets.length === 0) {
      pushResult(results, true, 'backend-universal-principles-rule-coverage', 'Backend universal rule snippets are complete');
    } else {
      pushResult(
        results,
        false,
        'backend-universal-principles-rule-coverage',
        `Missing backend universal rule snippets: ${missingBackendArchitectureRuleSnippets.join(', ')}`
      );
    }
  }

  const backendReviewChecklistContent = readText(BACKEND_REVIEW_CHECKLIST_PATH);
  if (!backendReviewChecklistContent) {
    pushResult(results, false, 'backend-universal-principles-checklist-exists', `Missing ${BACKEND_REVIEW_CHECKLIST_PATH}`);
  } else {
    pushResult(results, true, 'backend-universal-principles-checklist-exists', `${BACKEND_REVIEW_CHECKLIST_PATH} is present`);

    const missingBackendChecklistSnippets = REQUIRED_BACKEND_REVIEW_CHECKLIST_SNIPPETS.filter(
      (requiredSnippet) => !backendReviewChecklistContent.includes(requiredSnippet)
    );

    if (missingBackendChecklistSnippets.length === 0) {
      pushResult(results, true, 'backend-universal-principles-checklist-coverage', 'Backend review checklist snippets are complete');
    } else {
      pushResult(
        results,
        false,
        'backend-universal-principles-checklist-coverage',
        `Missing backend review checklist snippets: ${missingBackendChecklistSnippets.join(', ')}`
      );
    }
  }

  const refactorPromptContent = readText(REFACTOR_PROMPT_PATH);
  if (!refactorPromptContent) {
    pushResult(results, false, 'backend-universal-principles-refactor-guidance-exists', `Missing ${REFACTOR_PROMPT_PATH}`);
  } else {
    pushResult(results, true, 'backend-universal-principles-refactor-guidance-exists', `${REFACTOR_PROMPT_PATH} is present`);

    const missingRefactorPromptSnippets = REQUIRED_REFACTOR_PROMPT_SNIPPETS.filter(
      (requiredSnippet) => !refactorPromptContent.includes(requiredSnippet)
    );

    if (missingRefactorPromptSnippets.length === 0) {
      pushResult(results, true, 'backend-universal-principles-refactor-guidance-coverage', 'Backend refactor guidance snippets are complete');
    } else {
      pushResult(
        results,
        false,
        'backend-universal-principles-refactor-guidance-coverage',
        `Missing backend refactor guidance snippets: ${missingRefactorPromptSnippets.join(', ')}`
      );
    }
  }

  const architectureReviewChecklistContent = readText(ARCHITECTURE_REVIEW_CHECKLIST_PATH);
  if (!architectureReviewChecklistContent) {
    pushResult(results, false, 'architecture-review-checklist-exists', `Missing ${ARCHITECTURE_REVIEW_CHECKLIST_PATH}`);
  } else {
    pushResult(results, true, 'architecture-review-checklist-exists', `${ARCHITECTURE_REVIEW_CHECKLIST_PATH} is present`);

    const missingArchitectureChecklistSnippets = REQUIRED_ARCHITECTURE_REVIEW_CHECKLIST_SNIPPETS.filter(
      (requiredSnippet) => !architectureReviewChecklistContent.includes(requiredSnippet)
    );

    if (missingArchitectureChecklistSnippets.length === 0) {
      pushResult(results, true, 'architecture-review-checklist-coverage', 'Architecture review checklist sections are complete');
    } else {
      pushResult(
        results,
        false,
        'architecture-review-checklist-coverage',
        `Missing architecture review checklist sections: ${missingArchitectureChecklistSnippets.join(', ')}`
      );
    }
  }
}
