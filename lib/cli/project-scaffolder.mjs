/**
 * Project scaffolder public surface.
 *
 * The implementation is grouped by function under `lib/cli/project-scaffolder/`
 * so discovery, design-contract logic, prompt building, and persistence do not
 * collapse into one oversized module.
 */

export {
  PROJECT_DOC_TEMPLATE_VERSION,
  PROJECT_DOC_SYNTHESIS_PROMPT_VERSION,
} from './project-scaffolder/constants.mjs';

export {
  normalizeDocsLanguage,
  runProjectDiscovery,
  resolveProjectDocTargets,
  buildSynthesisContext,
  loadProjectConfig,
} from './project-scaffolder/discovery.mjs';

export {
  shouldBootstrapDesignDocument,
  validateDesignIntentContract,
  validateDesignContractCompleteness,
  buildDesignIntentSeedFromSignals,
} from './project-scaffolder/design-contract.mjs';

export {
  generateProjectDocumentation,
  isDirectoryEffectivelyEmpty,
  hasExistingProjectDocs,
  detectProjectDocTemplateStaleness,
} from './project-scaffolder/storage.mjs';
