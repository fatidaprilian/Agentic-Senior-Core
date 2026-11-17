import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const audit = require('../../.agents/plugins/agentic-senior-core/hooks/page-copy-audit.cjs');

export const extractVisibleStrings = audit.extractVisibleStrings;
export const checkLanguagePurity = audit.checkLanguagePurity;
export const checkMetaCopy = audit.checkMetaCopy;
export const checkInstructionLeakage = audit.checkInstructionLeakage;
export const checkRedundancy = audit.checkRedundancy;
export const auditPageSource = audit.auditPageSource;
export const auditUiFile = audit.auditUiFile;
