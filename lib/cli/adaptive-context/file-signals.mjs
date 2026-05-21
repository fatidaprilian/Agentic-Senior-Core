export const CONTEXT_FILE_CATALOG = [
  {
    label: 'SEC',
    patterns: [
      /(^|\/)(auth|login|session|permission|permissions|role|roles|acl|policy|guard|middleware)(\.|\/|-|$)/iu,
      /(^|\/)\.env(\.|$)/iu,
    ],
  },
  {
    label: 'API',
    patterns: [
      /(^|\/)(api|apis|route|routes|controller|controllers|contract|openapi)(\.|\/|-|$)/iu,
      /(^|\/)(commands?|cli)(\.|\/|-|$)/iu,
    ],
  },
  {
    label: 'ERR',
    patterns: [
      /(^|\/)(errors?|exceptions?|failures?)(\.|\/|-|$)/iu,
    ],
  },
  {
    label: 'TEST',
    patterns: [
      /(^|\/)(tests?|__tests__)(\/|$)/iu,
      /\.(test|spec)\.[cm]?[jt]sx?$/iu,
    ],
  },
  {
    label: 'FE',
    patterns: [
      /\.(tsx|jsx|vue|svelte|css|scss|sass)$/iu,
      /(^|\/)(app|pages|screens|components?|layouts?|styles?)(\/|$)/iu,
      /(^|\/)page\.[cm]?[jt]sx?$/iu,
    ],
  },
  {
    label: 'DATA',
    patterns: [
      /\.(sql|prisma)$/iu,
      /(^|\/)(schema|schemas|models?|repositories?|db|database)(\.|\/|-|$)/iu,
    ],
  },
  {
    label: 'MIG',
    patterns: [
      /(^|\/)(migrations?|migration)(\/|\.|-|$)/iu,
    ],
  },
  {
    label: 'PERF',
    patterns: [
      /(^|\/)(performance|perf|benchmark|benchmarks)(\.|\/|-|$)/iu,
    ],
  },
  {
    label: 'DOCK',
    patterns: [
      /(^|\/)(dockerfile|compose\.ya?ml|docker-compose\.ya?ml)$/iu,
      /(^|\/)\.dockerignore$/iu,
    ],
  },
  {
    label: 'OBS',
    patterns: [
      /(^|\/)(logging|logger|metrics?|tracing|telemetry|observability)(\.|\/|-|$)/iu,
    ],
  },
  {
    label: 'RES',
    patterns: [
      /(^|\/)(retry|retries|timeout|fallback|resilience|recovery)(\.|\/|-|$)/iu,
    ],
  },
  {
    label: 'CFG',
    patterns: [
      /(^|\/)(config|configs|settings|flags?)(\.|\/|-|$)/iu,
      /(^|\/)\.env(\.|$)/iu,
    ],
  },
  {
    label: 'JOB',
    patterns: [
      /(^|\/)(jobs?|workers?|queues?|cron|scheduler)(\.|\/|-|$)/iu,
    ],
  },
  {
    label: 'EVT',
    patterns: [
      /(^|\/)(events?|messages?|pubsub|outbox|subscribers?|producers?)(\.|\/|-|$)/iu,
    ],
  },
  {
    label: 'RT',
    patterns: [
      /(^|\/)(websocket|sse|realtime|stream|socket)(\.|\/|-|$)/iu,
    ],
  },
];
