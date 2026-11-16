import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const registry = require('../../.agents/plugins/agentic-senior-core/hooks/component-registry.cjs');

export const findLayoutShells = registry.findLayoutShells;
export const scanComponentRegistry = registry.scanComponentRegistry;
