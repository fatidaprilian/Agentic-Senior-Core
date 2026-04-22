export const SUPPORTED_DOC_LANGUAGES = new Set(['en', 'id']);
export const PROJECT_DOC_FILE_NAMES = [
  'project-brief.md',
  'architecture-decision-record.md',
  'database-schema.md',
  'api-contract.md',
  'flow-overview.md',
];
export const UI_DESIGN_CONTRACT_FILE_NAMES = ['DESIGN.md', 'design-intent.json'];

// Legacy project docs may still carry this version header; keep for upgrade staleness checks.
export const PROJECT_DOC_TEMPLATE_VERSION = '1.2.0';
export const PROJECT_DOC_SYNTHESIS_PROMPT_VERSION = '2.0.0';

export const DOMAIN_CHOICES = [
  'API service',
  'Web application',
  'Mobile app',
  'CLI tool',
  'Library / SDK',
  'Other',
];

export const DATABASE_CHOICES = [
  'None (stateless service)',
  'SQL (PostgreSQL, MySQL, SQLite)',
  'NoSQL (MongoDB, Redis, DynamoDB)',
  'Both (SQL primary + cache layer)',
  'Other',
];

export const AUTH_CHOICES = [
  'None (public service)',
  'JWT (stateless token auth)',
  'OAuth 2.0 (third-party login)',
  'Session-based (server-side sessions)',
  'API Key (simple key auth)',
  'Other',
];

export const DOCKER_STRATEGY_CHOICES = [
  'No Docker (run services directly)',
  'Docker for development only',
  'Docker for production only',
  'Docker for both development and production',
];

export const ARCHITECTURE_STYLE_CHOICES = [
  'Monolith',
  'Microservice / distributed system',
];

export const DESIGN_REQUIRED_SECTIONS = [
  'Design Intent and Product Personality',
  'Audience and Use-Context Signals',
  'Visual Direction and Distinctive Moves',
  'Color Science and Semantic Roles',
  'Typographic Engineering and Hierarchy',
  'Spacing, Layout Rhythm, and Density Strategy',
  'Token Architecture and Alias Strategy',
  'Responsive Strategy and Cross-Viewport Adaptation Matrix',
  'Interaction, Motion, and Feedback Rules',
  'Component Language, Morphology, and Shared Patterns',
  'Accessibility Non-Negotiables',
  'Anti-Patterns to Avoid',
  'Implementation Notes for Future UI Tasks',
];
