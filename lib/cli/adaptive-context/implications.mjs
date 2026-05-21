export const IMPLICATION_CATALOG = [
  {
    label: 'ERR',
    reason: 'migration failure language',
    requiresAnyLabel: ['MIG'],
    triggers: ['broke', 'broken', 'fail', 'failed', 'failing', 'gagal', 'stuck', 'stops', 'stopped', 'rollback'],
  },
  {
    label: 'PERF',
    reason: 'data access performance language',
    requiresAnyLabel: ['DATA'],
    triggers: ['slow', 'lemot', 'lambat', 'n+1', 'bottleneck', 'performance'],
  },
  {
    label: 'SEC',
    reason: 'configuration exposure language',
    requiresAnyLabel: ['CFG'],
    triggers: ['secret', 'secrets', 'key', 'token', 'credential', 'credentials', 'expose', 'exposed', 'exposing', 'leak', 'leaking'],
  },
  {
    label: 'ARCH',
    reason: 'security middleware structure language',
    requiresAnyLabel: ['SEC'],
    triggers: ['duplicate', 'duplicate code', 'middleware', 'refactor', 'clean up', 'cleanup', 'rapihin', 'rapikan'],
  },
  {
    label: 'OBS',
    reason: 'silent worker needs operator evidence',
    requiresAnyLabel: ['JOB'],
    triggers: ['log', 'logs', 'silent', 'silently', 'trace', 'monitoring'],
  },
  {
    label: 'ERR',
    reason: 'silent worker failure language',
    requiresAnyLabel: ['JOB'],
    triggers: ['stops', 'stopped', 'silent', 'silently', 'fail', 'failed', 'failing'],
  },
  {
    label: 'TEST',
    reason: 'runtime hardening needs regression evidence',
    requiresAnyLabel: ['ARCH'],
    triggers: ['stable', 'stability', 'miss', 'case', 'cases', 'benchmark', 'fixture', 'fixtures', 'regression'],
  },
];
