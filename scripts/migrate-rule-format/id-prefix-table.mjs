// @ts-check

/**
 * Locked ID prefix table per `docs/plan/format-spec.md` section 3.
 * The migration helper reads this map to assign frontmatter and section IDs.
 * Lock new entries here when adding a new rule file; never invent prefixes inline.
 */

export const ID_PREFIX_TABLE = Object.freeze({
  'api-docs.md': { prefix: 'API', domain: 'api-docs', priority: 'high', scope: 'backend', appliesTo: ['backend', 'fullstack'] },
  'architecture.md': { prefix: 'ARCH', domain: 'architecture', priority: 'critical', scope: 'all-tasks', appliesTo: ['backend', 'frontend', 'fullstack'] },
  'database-design.md': { prefix: 'DATA', domain: 'database-design', priority: 'high', scope: 'data', appliesTo: ['backend', 'fullstack'] },
  'docker-runtime.md': { prefix: 'DOCK', domain: 'docker-runtime', priority: 'high', scope: 'infra', appliesTo: ['backend', 'frontend', 'fullstack'] },
  'efficiency-vs-hype.md': { prefix: 'DEP', domain: 'efficiency-vs-hype', priority: 'medium', scope: 'all-tasks', appliesTo: ['backend', 'frontend', 'fullstack'] },
  'error-handling.md': { prefix: 'ERR', domain: 'error-handling', priority: 'high', scope: 'all-tasks', appliesTo: ['backend', 'frontend', 'fullstack'] },
  'event-driven.md': { prefix: 'EVT', domain: 'event-driven', priority: 'medium', scope: 'backend', appliesTo: ['backend', 'fullstack'] },
  'frontend-architecture.md': { prefix: 'FE', domain: 'frontend-architecture', priority: 'high', scope: 'ui', appliesTo: ['frontend', 'fullstack'] },
  'git-workflow.md': { prefix: 'GIT', domain: 'git-workflow', priority: 'medium', scope: 'governance', appliesTo: ['backend', 'frontend', 'fullstack'] },
  'microservices.md': { prefix: 'SVC', domain: 'microservices', priority: 'medium', scope: 'backend', appliesTo: ['backend', 'fullstack'] },
  'naming-conv.md': { prefix: 'NAME', domain: 'naming-conv', priority: 'medium', scope: 'all-tasks', appliesTo: ['backend', 'frontend', 'fullstack'] },
  'performance.md': { prefix: 'PERF', domain: 'performance', priority: 'medium', scope: 'all-tasks', appliesTo: ['backend', 'frontend', 'fullstack'] },
  'realtime.md': { prefix: 'RT', domain: 'realtime', priority: 'medium', scope: 'backend', appliesTo: ['backend', 'fullstack'] },
  'security.md': { prefix: 'SEC', domain: 'security', priority: 'critical', scope: 'all-tasks', appliesTo: ['backend', 'frontend', 'fullstack'] },
  'testing.md': { prefix: 'TEST', domain: 'testing', priority: 'high', scope: 'all-tasks', appliesTo: ['backend', 'frontend', 'fullstack'] },
});

/**
 * @param {string} filename
 * @returns {{ prefix: string, domain: string, priority: string, scope: string, appliesTo: string[] }}
 */
export function getPrefixEntry(filename) {
  const entry = ID_PREFIX_TABLE[filename];
  if (!entry) {
    throw new Error(`Unknown rule file '${filename}'. Add it to ID_PREFIX_TABLE before migrating.`);
  }
  return entry;
}
