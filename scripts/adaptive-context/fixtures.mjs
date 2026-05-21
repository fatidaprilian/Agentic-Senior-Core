export const ADAPTIVE_CONTEXT_FIXTURES = [
  {
    id: 'auth-flow-review',
    requestText: 'Review this login auth flow. Check JWT session handling, API response errors, and what tests should cover.',
    requiredLabels: ['SEC', 'API', 'ERR', 'TEST'],
    allowedLabels: ['SEC', 'API', 'ERR', 'TEST'],
  },
  {
    id: 'frontend-redesign',
    requestText: 'Redesign this frontend screen from zero with responsive layout, motion, and UI design docs.',
    requiredLabels: ['FE'],
    allowedLabels: ['FE'],
  },
  {
    id: 'database-migration-failure',
    requestText: 'The database migration fails during rollback after a schema change. Check query impact and validation coverage.',
    requiredLabels: ['DATA', 'MIG', 'ERR', 'TEST'],
    allowedLabels: ['DATA', 'MIG', 'ERR', 'TEST'],
  },
  {
    id: 'docker-env-setup',
    requestText: 'Set up Docker Compose with env config and validation so the container can run locally.',
    requiredLabels: ['DOCK', 'CFG', 'TEST'],
    allowedLabels: ['DOCK', 'CFG', 'TEST'],
  },
  {
    id: 'worker-retry-observability',
    requestText: 'Fix the queue worker retry flow. It publishes events, needs fallback behavior, and should log trace data.',
    requiredLabels: ['JOB', 'EVT', 'RES', 'OBS', 'ERR'],
    allowedLabels: ['JOB', 'EVT', 'RES', 'OBS', 'ERR'],
  },
  {
    id: 'service-refactor-clean-code',
    requestText: 'Refactor this service module. Clean up helper names, avoid over-engineering, and keep tests readable.',
    requiredLabels: ['ARCH', 'NAME', 'TEST'],
    allowedLabels: ['ARCH', 'NAME', 'TEST'],
  },
  {
    id: 'versioned-api-endpoint',
    requestText: 'Design a versioned API endpoint contract with safe request validation, error responses, and backward compatibility.',
    requiredLabels: ['API', 'VER', 'ERR', 'SEC', 'TEST'],
    allowedLabels: ['API', 'VER', 'ERR', 'SEC', 'TEST'],
  },
  {
    id: 'slow-query-performance',
    requestText: 'The SQL query is slow and may be an N+1 issue. Add observability and a performance test.',
    requiredLabels: ['PERF', 'DATA', 'OBS', 'TEST'],
    allowedLabels: ['PERF', 'DATA', 'OBS', 'TEST'],
  },
  {
    id: 'config-secret-feature-flag',
    requestText: 'Add a feature flag from env config without leaking secrets in errors.',
    requiredLabels: ['CFG', 'SEC', 'ERR'],
    allowedLabels: ['CFG', 'SEC', 'ERR'],
  },
  {
    id: 'realtime-stream-contract',
    requestText: 'Plan a realtime WebSocket stream API with timeout recovery and monitoring.',
    requiredLabels: ['RT', 'API', 'RES', 'OBS'],
    allowedLabels: ['RT', 'API', 'RES', 'OBS'],
  },
];
