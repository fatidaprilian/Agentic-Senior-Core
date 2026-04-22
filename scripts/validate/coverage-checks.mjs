import { createHash } from 'node:crypto';
import { join, relative } from 'node:path';
import {
  COMPLIANCE_ALIAS_TERMS,
  COMPLIANCE_TERMINOLOGY_BOUNDARY_PATHS,
  FORMAL_ARTIFACT_PATHS,
  FORBIDDEN_TEMPLATE_BOOTSTRAP_SNIPPETS,
  REQUIRED_COMPLIANCE_CANONICAL_SNIPPETS,
  REQUIRED_DEPENDENCY_FRESHNESS_AUTOMATION_SNIPPETS,
  REQUIRED_DETECTION_TRANSPARENCY_SNIPPETS,
  REQUIRED_DETERMINISTIC_BOUNDARY_ENFORCEMENT_SNIPPETS,
  REQUIRED_DEVELOPER_FIRST_MENTION_PATTERNS,
  REQUIRED_DOCKER_RUNTIME_AUTOMATION_SNIPPETS,
  REQUIRED_HUMAN_WRITING_SNIPPETS,
  REQUIRED_STACK_RESEARCH_ENGINE_SNIPPETS,
  REQUIRED_TEMPLATE_FREE_BOOTSTRAP_SNIPPETS,
  REQUIRED_TERMINOLOGY_ROW_PATTERNS,
  REQUIRED_TERMINOLOGY_RULE_SNIPPET,
  REQUIRED_UI_DESIGN_AUTOMATION_SNIPPETS,
  REQUIRED_UNIVERSAL_SOP_SNIPPETS,
  REQUIRED_UPGRADE_UI_CONTRACT_WARNING_SNIPPETS,
  TERMINOLOGY_REFERENCE_DOCUMENT_PATH,
  TERMINOLOGY_REFERENCE_PATHS,
  THIN_ADAPTER_PATHS,
} from './config.mjs';

async function validateSnippetCoverage({
  heading,
  coverageRules,
  missingLabel,
  snippetLabel,
  context,
}) {
  const { ROOT_DIR, fileExists, readTextFile, pass, fail } = context;

  console.log(`\n${heading}`);

  for (const coverageRule of coverageRules) {
    const absoluteCoveragePath = join(ROOT_DIR, coverageRule.path);

    if (!(await fileExists(absoluteCoveragePath))) {
      fail(`Missing ${missingLabel}: ${coverageRule.path}`);
      continue;
    }

    const coverageContent = await readTextFile(absoluteCoveragePath);
    for (const requiredSnippet of coverageRule.snippets) {
      if (coverageContent.includes(requiredSnippet)) {
        pass(`${coverageRule.path} includes ${snippetLabel}: ${requiredSnippet}`);
      } else {
        fail(`${coverageRule.path} is missing ${snippetLabel}: ${requiredSnippet}`);
      }
    }
  }
}

export async function validateTerminologyMapping(context) {
  const { ROOT_DIR, fileExists, readTextFile, pass, fail } = context;

  console.log('\nChecking terminology mapping consistency...');

  const terminologyReferenceDocumentPath = join(ROOT_DIR, TERMINOLOGY_REFERENCE_DOCUMENT_PATH);

  if (!(await fileExists(terminologyReferenceDocumentPath))) {
    fail(`Missing terminology reference document: ${TERMINOLOGY_REFERENCE_DOCUMENT_PATH}`);
  } else {
    const terminologyReferenceContent = await readTextFile(terminologyReferenceDocumentPath);

    if (terminologyReferenceContent.includes('Dual-Term Mapping')) {
      pass(`${TERMINOLOGY_REFERENCE_DOCUMENT_PATH} includes Dual-Term Mapping section`);
    } else {
      fail(`${TERMINOLOGY_REFERENCE_DOCUMENT_PATH} must include Dual-Term Mapping section`);
    }

    for (const terminologyRowRule of REQUIRED_TERMINOLOGY_ROW_PATTERNS) {
      if (terminologyRowRule.pattern.test(terminologyReferenceContent)) {
        pass(`${TERMINOLOGY_REFERENCE_DOCUMENT_PATH} includes mapping row: ${terminologyRowRule.label}`);
      } else {
        fail(`${TERMINOLOGY_REFERENCE_DOCUMENT_PATH} is missing mapping row: ${terminologyRowRule.label}`);
      }
    }

    if (terminologyReferenceContent.includes('first mention must include canonical term in parentheses')) {
      pass(`${TERMINOLOGY_REFERENCE_DOCUMENT_PATH} defines first-mention canonical term rule`);
    } else {
      fail(`${TERMINOLOGY_REFERENCE_DOCUMENT_PATH} must define first-mention canonical term rule`);
    }

    if (terminologyReferenceContent.includes('Compliance and audit artifacts must keep canonical enterprise terminology')) {
      pass(`${TERMINOLOGY_REFERENCE_DOCUMENT_PATH} defines compliance terminology boundary`);
    } else {
      fail(`${TERMINOLOGY_REFERENCE_DOCUMENT_PATH} must define compliance terminology boundary`);
    }
  }

  for (const terminologyReferencePath of TERMINOLOGY_REFERENCE_PATHS) {
    const absoluteReferencePath = join(ROOT_DIR, terminologyReferencePath);

    if (!(await fileExists(absoluteReferencePath))) {
      fail(`Missing terminology reference source: ${terminologyReferencePath}`);
      continue;
    }

    const referenceContent = await readTextFile(absoluteReferencePath);

    if (referenceContent.includes('Terminology Mapping (Final)')) {
      pass(`${terminologyReferencePath} includes Terminology Mapping (Final)`);
    } else {
      fail(`${terminologyReferencePath} must include Terminology Mapping (Final)`);
    }

    for (const terminologyRowRule of REQUIRED_TERMINOLOGY_ROW_PATTERNS) {
      if (terminologyRowRule.pattern.test(referenceContent)) {
        pass(`${terminologyReferencePath} includes mapping row: ${terminologyRowRule.label}`);
      } else {
        fail(`${terminologyReferencePath} is missing mapping row: ${terminologyRowRule.label}`);
      }
    }

    if (referenceContent.includes(REQUIRED_TERMINOLOGY_RULE_SNIPPET)) {
      pass(`${terminologyReferencePath} includes first-mention canonical term rule`);
    } else {
      fail(`${terminologyReferencePath} must include first-mention canonical term rule`);
    }

    if (referenceContent.includes(TERMINOLOGY_REFERENCE_DOCUMENT_PATH)) {
      pass(`${terminologyReferencePath} links to ${TERMINOLOGY_REFERENCE_DOCUMENT_PATH}`);
    } else {
      fail(`${terminologyReferencePath} must link to ${TERMINOLOGY_REFERENCE_DOCUMENT_PATH}`);
    }
  }

  for (const firstMentionRule of REQUIRED_DEVELOPER_FIRST_MENTION_PATTERNS) {
    const absoluteFirstMentionPath = join(ROOT_DIR, firstMentionRule.path);

    if (!(await fileExists(absoluteFirstMentionPath))) {
      fail(`Missing developer-facing first-mention source: ${firstMentionRule.path}`);
      continue;
    }

    const firstMentionContent = await readTextFile(absoluteFirstMentionPath);
    if (firstMentionRule.pattern.test(firstMentionContent)) {
      pass(`${firstMentionRule.path} keeps first-mention rule: ${firstMentionRule.label}`);
    } else {
      fail(`${firstMentionRule.path} must keep first-mention rule: ${firstMentionRule.label}`);
    }
  }

  for (const compliancePath of COMPLIANCE_TERMINOLOGY_BOUNDARY_PATHS) {
    const absoluteCompliancePath = join(ROOT_DIR, compliancePath);

    if (!(await fileExists(absoluteCompliancePath))) {
      fail(`Missing compliance/audit artifact for terminology boundary: ${compliancePath}`);
      continue;
    }

    const complianceContent = await readTextFile(absoluteCompliancePath);
    for (const aliasTerm of COMPLIANCE_ALIAS_TERMS) {
      if (complianceContent.includes(aliasTerm)) {
        fail(`${compliancePath} must not use developer-facing alias in compliance context: ${aliasTerm}`);
      } else {
        pass(`${compliancePath} keeps canonical terminology boundary for alias: ${aliasTerm}`);
      }
    }
  }

  for (const complianceRule of REQUIRED_COMPLIANCE_CANONICAL_SNIPPETS) {
    const absoluteComplianceRulePath = join(ROOT_DIR, complianceRule.path);

    if (!(await fileExists(absoluteComplianceRulePath))) {
      fail(`Missing compliance canonical source: ${complianceRule.path}`);
      continue;
    }

    const complianceRuleContent = await readTextFile(absoluteComplianceRulePath);
    if (complianceRuleContent.includes(complianceRule.snippet)) {
      pass(`${complianceRule.path} keeps canonical terminology rule: ${complianceRule.label}`);
    } else {
      fail(`${complianceRule.path} must keep canonical terminology rule: ${complianceRule.label}`);
    }
  }
}

export async function validateDetectionTransparencyCoverage(context) {
  await validateSnippetCoverage({
    heading: 'Checking existing-project detection transparency coverage...',
    coverageRules: REQUIRED_DETECTION_TRANSPARENCY_SNIPPETS,
    missingLabel: 'detection transparency source',
    snippetLabel: 'detection transparency snippet',
    context,
  });
}

export async function validateStackResearchEngineCoverage(context) {
  await validateSnippetCoverage({
    heading: 'Checking stack research engine coverage...',
    coverageRules: REQUIRED_STACK_RESEARCH_ENGINE_SNIPPETS,
    missingLabel: 'stack research source',
    snippetLabel: 'stack research snippet',
    context,
  });
}

export async function validateUniversalSopConsolidationCoverage(context) {
  await validateSnippetCoverage({
    heading: 'Checking Universal SOP consolidation coverage...',
    coverageRules: REQUIRED_UNIVERSAL_SOP_SNIPPETS,
    missingLabel: 'Universal SOP source',
    snippetLabel: 'Universal SOP snippet',
    context,
  });
}

export async function validateTemplateFreeBootstrapCoverage(context) {
  const { ROOT_DIR, fileExists, readTextFile, pass, fail } = context;

  console.log('\nChecking template-free dynamic bootstrap coverage...');

  for (const coverageRule of REQUIRED_TEMPLATE_FREE_BOOTSTRAP_SNIPPETS) {
    const absoluteCoveragePath = join(ROOT_DIR, coverageRule.path);

    if (!(await fileExists(absoluteCoveragePath))) {
      fail(`Missing template-free bootstrap source: ${coverageRule.path}`);
      continue;
    }

    const coverageContent = await readTextFile(absoluteCoveragePath);
    for (const requiredSnippet of coverageRule.snippets) {
      if (coverageContent.includes(requiredSnippet)) {
        pass(`${coverageRule.path} includes template-free bootstrap snippet: ${requiredSnippet}`);
      } else {
        fail(`${coverageRule.path} is missing template-free bootstrap snippet: ${requiredSnippet}`);
      }
    }
  }

  for (const forbiddenRule of FORBIDDEN_TEMPLATE_BOOTSTRAP_SNIPPETS) {
    const absoluteForbiddenPath = join(ROOT_DIR, forbiddenRule.path);

    if (!(await fileExists(absoluteForbiddenPath))) {
      fail(`Missing template-free bootstrap source: ${forbiddenRule.path}`);
      continue;
    }

    const forbiddenContent = await readTextFile(absoluteForbiddenPath);
    for (const forbiddenSnippet of forbiddenRule.snippets) {
      if (forbiddenContent.includes(forbiddenSnippet)) {
        fail(`${forbiddenRule.path} must not include active template snippet: ${forbiddenSnippet}`);
      } else {
        pass(`${forbiddenRule.path} excludes active template snippet: ${forbiddenSnippet}`);
      }
    }
  }
}

export async function validateUpgradeUiContractWarningCoverage(context) {
  await validateSnippetCoverage({
    heading: 'Checking upgrade UI contract warning coverage...',
    coverageRules: REQUIRED_UPGRADE_UI_CONTRACT_WARNING_SNIPPETS,
    missingLabel: 'upgrade UI contract warning source',
    snippetLabel: 'upgrade UI contract warning snippet',
    context,
  });
}

export async function validateUiDesignAutomationCoverage(context) {
  await validateSnippetCoverage({
    heading: 'Checking UI design automation coverage...',
    coverageRules: REQUIRED_UI_DESIGN_AUTOMATION_SNIPPETS,
    missingLabel: 'UI design automation source',
    snippetLabel: 'UI design automation snippet',
    context,
  });
}

export async function validateDockerRuntimeAutomationCoverage(context) {
  await validateSnippetCoverage({
    heading: 'Checking Docker runtime automation coverage...',
    coverageRules: REQUIRED_DOCKER_RUNTIME_AUTOMATION_SNIPPETS,
    missingLabel: 'Docker runtime automation source',
    snippetLabel: 'Docker runtime automation snippet',
    context,
  });
}

export async function validateDependencyFreshnessAutomationCoverage(context) {
  await validateSnippetCoverage({
    heading: 'Checking dependency freshness automation coverage...',
    coverageRules: REQUIRED_DEPENDENCY_FRESHNESS_AUTOMATION_SNIPPETS,
    missingLabel: 'dependency freshness automation source',
    snippetLabel: 'dependency freshness automation snippet',
    context,
  });
}

export async function validateDeterministicBoundaryEnforcementCoverage(context) {
  await validateSnippetCoverage({
    heading: 'Checking deterministic boundary enforcement coverage...',
    coverageRules: REQUIRED_DETERMINISTIC_BOUNDARY_ENFORCEMENT_SNIPPETS,
    missingLabel: 'deterministic boundary source',
    snippetLabel: 'deterministic boundary snippet',
    context,
  });
}

export async function validateHumanWritingGovernance(context) {
  const { ROOT_DIR, fileExists, readTextFile, pass, fail } = context;

  console.log('\nChecking human writing governance...');

  const disallowedEmojiPattern = /[\u2705\u274C\u26A0\u{1F4CC}\u{1F536}\u{1F4CE}\u{1F534}\u{1F7E0}\u{1F7E1}\u{1F7E2}]/u;

  for (const formalArtifactPath of FORMAL_ARTIFACT_PATHS) {
    const absoluteFormalArtifactPath = join(ROOT_DIR, formalArtifactPath);

    if (!(await fileExists(absoluteFormalArtifactPath))) {
      fail(`Missing formal artifact for writing governance: ${formalArtifactPath}`);
      continue;
    }

    const formalArtifactContent = await readTextFile(absoluteFormalArtifactPath);
    if (disallowedEmojiPattern.test(formalArtifactContent)) {
      fail(`${formalArtifactPath} contains disallowed emoji symbols in formal text`);
    } else {
      pass(`${formalArtifactPath} has no disallowed emoji symbols`);
    }
  }

  for (const snippetRule of REQUIRED_HUMAN_WRITING_SNIPPETS) {
    const absoluteRulePath = join(ROOT_DIR, snippetRule.path);
    if (!(await fileExists(absoluteRulePath))) {
      fail(`Missing writing governance source: ${snippetRule.path}`);
      continue;
    }

    const writingRuleContent = await readTextFile(absoluteRulePath);
    for (const requiredSnippet of snippetRule.snippets) {
      if (writingRuleContent.includes(requiredSnippet)) {
        pass(`${snippetRule.path} includes writing governance snippet: ${requiredSnippet}`);
      } else {
        fail(`${snippetRule.path} is missing writing governance snippet: ${requiredSnippet}`);
      }
    }
  }
}

export async function validateInstructionAdapters(context) {
  const {
    ROOT_DIR,
    CANONICAL_INSTRUCTION_PATH,
    fileExists,
    readTextFile,
    normalizeLineEndings,
    pass,
    fail,
  } = context;

  console.log('\nChecking instruction adapter consolidation...');

  const canonicalInstructionContent = normalizeLineEndings(await readTextFile(CANONICAL_INSTRUCTION_PATH));
  const canonicalSnapshotHash = createHash('sha256').update(canonicalInstructionContent).digest('hex');

  for (const thinAdapterPath of THIN_ADAPTER_PATHS) {
    const absoluteAdapterPath = join(ROOT_DIR, thinAdapterPath);

    if (!(await fileExists(absoluteAdapterPath))) {
      fail(`Missing thin adapter file: ${thinAdapterPath}`);
      continue;
    }

    const thinAdapterContent = await readTextFile(absoluteAdapterPath);

    if (
      thinAdapterContent.includes('Adapter Mode: thin')
      && thinAdapterContent.includes('Adapter Source: .instructions.md')
    ) {
      pass(`${thinAdapterPath} declares thin adapter metadata`);
    } else {
      fail(`${thinAdapterPath} must declare Adapter Mode: thin and Adapter Source: .instructions.md`);
    }

    const hashMatch = thinAdapterContent.match(/Canonical Snapshot SHA256:\s*([a-f0-9]{64})/);
    if (!hashMatch) {
      fail(`${thinAdapterPath} must declare Canonical Snapshot SHA256`);
      continue;
    }

    if (hashMatch[1] === canonicalSnapshotHash) {
      pass(`${thinAdapterPath} canonical hash matches .instructions.md`);
    } else {
      fail(`${thinAdapterPath} canonical hash drift detected (expected ${canonicalSnapshotHash})`);
    }

    const thinAdapterLineCount = thinAdapterContent.split(/\r?\n/u).length;
    if (thinAdapterLineCount <= 80) {
      pass(`${thinAdapterPath} remains thin (${thinAdapterLineCount} lines)`);
    } else {
      fail(`${thinAdapterPath} is too large for thin-adapter mode (${thinAdapterLineCount} lines)`);
    }
  }
}

export async function validateSkillPurgeSurface(context) {
  const { ROOT_DIR, AGENT_CONTEXT_DIR, fileExists, pass, fail } = context;

  console.log('\nChecking skill and tier purge surface...');

  const skillDirectoryPath = join(AGENT_CONTEXT_DIR, 'skills');
  if (await fileExists(skillDirectoryPath)) {
    fail('Skills directory must be removed: .agent-context/skills');
  } else {
    pass('Skills directory removed: .agent-context/skills');
  }

  const retiredFiles = [
    join(ROOT_DIR, 'lib', 'cli', 'skill-selector.mjs'),
    join(ROOT_DIR, 'scripts', 'skill-tier-policy.mjs'),
    join(ROOT_DIR, 'scripts', 'trust-scorer.mjs'),
  ];

  for (const retiredFilePath of retiredFiles) {
    const relativeRetiredPath = relative(ROOT_DIR, retiredFilePath).replace(/\\/g, '/');
    if (await fileExists(retiredFilePath)) {
      fail(`Retired file still present: ${relativeRetiredPath}`);
    } else {
      pass(`Retired file removed: ${relativeRetiredPath}`);
    }
  }
}
