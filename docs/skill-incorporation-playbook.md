# Skill Platform Incorporation Playbook

**Created:** 2026-04-02  
**Goal:** Extract + consolidate + exceed 3 benchmark repos (antigravity, awesome-copilot, MiniMax)  
**Strategy:** Build ONE superior platform with 4-tier depth model (standard → advance → expert → above)

---

## Tier Definition (Applied Per Topic)

### **STANDARD** (Fallback, use only if better coverage unavailable)
- **Definition:** Minimum viable coverage from one repo
- **Characteristics:** 100-300 words, basic examples, no advanced patterns
- **Example:** Basic React hook pattern → show `useState()` + callback

### **ADVANCE** (Default, apply to 80% of topics)
- **Definition:** Exceed 2/3 repos + add reasoning chains
- **Characteristics:** 500-1000 words, multiple examples, anti-patterns highlighted, trigger documentation
- **Example:** React hook pattern → useState + useEffect + useRef + useCallback → anti-patterns (excessive re-renders) → reasoning chain on when to use each

### **EXPERT** (For complex architecture topics)
- **Definition:** Exceed all 3 repos + cross-repo pattern synthesis
- **Characteristics:** 1500-3000 words, code templates, checklists, edge cases, version-specific notes
- **Example:** Database schema design → 3NF patterns + migration safety + index strategies + anti-patterns per DB (PostgreSQL/MongoDB) + checklist

### **ABOVE** (Unique to our platform)
- **Definition:** Solve problems no repo explicitly covers OR improve their solution
- **Characteristics:** Automation, enforcement, cross-cutting patterns, new domains
- **Example:** 
  - Database schema evolution with **zero-downtime migration validator** (no repo has this)
  - **Anti-slop enforcer** (MiniMax mentions, but no enforcement tool)
  - **API contract validator at build time** (no repo has end-to-end pipeline)

---

## Domain: BACKEND (Priority #1)

### Current State (Pre-Incorporation)
- Topic files exist but are skeleton (1-3 lines each)
- No repo-specific patterns extracted
- No "above line" improvements

### Topics to Incorporate

#### 1. **Architecture** → `backend/architecture.md`

**Repos Contributing:**
- `awesome-copilot`: Layered architecture (Transport → Service → Repository), SoC by domain/feature/layer
- `antigravity`: Microservices vs monolith decision framework
- `minimax`: Fullstack project structure, error handling patterns

**Tier: EXPERT**

**Content Structure:**
```
# Backend Architecture

## Tier: EXPERT

### Overview (150 words)
Transport → Service → Repository layering, when to apply, why it matters

### Layered Architecture (800 words)
- TRANSPORT LAYER: HTTP handlers, middleware, request/response serialization
- SERVICE LAYER: Business logic, orchestration, cross-cutting concerns
- REPOSITORY LAYER: Data access, queries, batching strategies
- Anti-patterns: Business logic in transport, data access in service
- Code template: Node.js/Python/Go examples
- Decision tree: When layering helps vs hurts

### Monolith vs Microservices (800 words)
- Awesome-copilot decision framework (monorepo vs microservices)
- Antigravity: When to split (data independence, team topology)
- Pain points: Premature optimization, big-bang refactors
- Trigger: Domain-driven microservices trigger (bounded contexts)
- Strangler fig pattern for migration
- Checklist: 7-item verification before splitting

### Feature-Based vs Layer-Based (400 words)
- awesome-copilot: Feature-based grouping preferred
- Trade-offs: Feature coupling vs layer reusability
- Anti-pattern: Both at once (creates spaghetti)

### ABOVE LINE: Dependency Graph Auditor
- Detect circular dependencies between layers
- Enforce Transport ↔ Service ↔ Repository direction
- CI gate: Fail if Transport imports Repository directly
- Provide required remediation actions
```

**Implementation Steps:**
1. Extract specific patterns from each repo
2. Write EXPERT-level content (1500+ words)
3. Add code templates (Node.js + Python + Go + Java)
4. Create checklist/decision tree
5. Design the ABOVE-LINE tool (dependency auditor script)

#### 2. **Data Access** → `backend/data-access.md`

**Repos Contributing:**
- `awesome-copilot`: 3NF normalization, FK indexing, safe migrations, query optimization
- `minimax`: Django ORM patterns, background jobs for bulk operations
- `antigravity`: N+1 query patterns + solutions

**Tier: EXPERT**

**Content Structure:**
```
# Data Access Patterns

## Tier: EXPERT

### Database Design Principles (600 words)
- 3NF normalization vs denormalization trade-offs
- When to break 3NF (and why)
- FK indexing: Essential vs optional discussion
- Anti-patterns: Storing computed values, circular references

### Query Optimization (800 words)
- N+1 detection: symptoms, root causes, solutions
- JOIN strategies: INNER/LEFT/RIGHT with cost analysis
- Pagination strategies (offset vs cursor)
- Batch operations vs individual queries
- Anti-patterns: SELECT * , no LIMIT, missing indexes

### Safe Migrations (600 words)
- awesome-copilot approach: Add column → backfill → remove old → rename
- Zero-downtime strategy: Forward/backward compatibility
- Rollback procedures: Keep old column + rename triggers
- Testing: Dry-run migration on production data snapshot

### ORM vs Raw SQL (400 words)
- When ORMs help (rapid development, type safety)
- When ORMs hurt (complex queries, performance, migrations)
- Decision matrix: Django ORM vs raw SQL vs query builders

### ABOVE LINE: Zero-Downtime Migration Validator
- Parse migration files (.sql or ORM migrations)
- Detect problematic patterns: DROP COLUMN, ALTER CONSTRAINT without rollback plan
- Suggest remediation: Add soft-delete, backfill, verification steps
- CI gate: Fail if migration would cause downtime > threshold
```

#### 3. **Error Handling** → `backend/errors.md`

**Repos Contributing:**
- `awesome-copilot`: Typed error codes, never swallow errors, helpful messages
- `antigravity`: Reasoning chains in error recovery, debugging protocols
- `minimax`: Error boundary patterns, graceful degradation

**Tier: ADVANCE**

Content: Typed error codes → messages → recovery → logging pipeline

#### 4. **Validation** → `backend/validation.md`

**Repos Contributing:**
- `awesome-copilot`: Schema validation at boundary, parameterized queries, input sanitization
- `minimax`: Config validation patterns
- `antigravity`: Security halt on unvalidated input

**Tier: ADVANCE**

Content: Zod/Pydantic at API boundary → typed services → no any types

---

## Domain: FRONTEND (Priority #2)

### Topics to Incorporate

#### 1. **UI Architecture** → `frontend/ui-architecture.md`

**Repos Contributing:**
- `awesome-copilot`: Smart/Dumb component split, TanStack Query, Zustand patterns
- `antigravity`: React hooks pedagogy, component reusability
- `minimax`: Design system patterns, component/variant structure

**Tier: ADVANCE**

#### 2. **Accessibility** → `frontend/accessibility.md`

**Repos Contributing:**
- `awesome-copilot`: WCAG compliance, keyboard navigation, semantic HTML
- `minimax`: Reduced motion, Dynamic Type, dark mode detection
- `antigravity`: A11y anti-patterns (skip links, focus management)

**Tier: ADVANCE**

#### 3. **Performance** → `frontend/performance.md`

**Repos Contributing:**
- `minimax`: Animation performance, CSS containment, will-change
- `awesome-copilot`: Memoization strategies, code splitting, bundle analysis
- `antigravity`: Profiling tools, render path optimization

**Tier: EXPERT**

#### 4. **Motion** → `frontend/motion.md`

**Repos Contributing:**
- `minimax`: 40+ animation patterns (Bento grid, parallax, glassmorphism), animation libraries
- `antigravity`: Animation performance, browser paint costs
- `awesome-copilot`: Accessibility + motion (reduced-motion media query)

**Tier: ADVANCE**

---

## Domain: FULLSTACK (Priority #3)

### Topics to Incorporate

#### 1. **Feature Slicing** → `fullstack/feature-slicing.md`

**Repos Contributing:**
- `awesome-copilot`: Feature-based architecture, avoid layer spaghetti
- `antigravity`: Feature-driven monolith structure
- `minimax`: Fullstack project structure patterns

**Tier: ADVANCE**

#### 2. **API Contracts** → `fullstack/contracts.md`

**Repos Contributing:**
- `awesome-copilot`: OpenAPI 3.1 mandatory, API documentation standards
- `antigravity`: Type-safe API design (TypeScript implications)
- `minimax`: API validation patterns, error response standardization

**Tier: EXPERT**

**ABOVE LINE:**
- Zod schema in backend + frontend type generation
- Contract validation at both ends (OpenAPI + types)
- Breaking change detection in CI

#### 3. **End-to-End** → `fullstack/end-to-end.md`

**Repos Contributing:**
- `minimax`: 6-gate release checklist (functional → security → deployment)
- `awesome-copilot`: Release gates, deployment patterns
- `antigravity`: Deployment checklists, smoke tests

**Tier: ADVANCE**

---

## Domain: CLI (Priority #4)

### Topics to Incorporate

#### 1. **Init** → `cli/init.md`

**Repos Contributing:**
- `awesome-copilot`: Scaffolding patterns, blueprint selection, auto-detection
- `minimax`: Project structure initialization
- `antigravity`: Onboarding workflows

**Tier: ADVANCE**

**ABOVE LINE:**
- Interactive CLI with live-reload preview
- Skill domain auto-detection + activation
- Configuration validation

#### 2. **Upgrade** → `cli/upgrade.md`

**Repos Contributing:**
- `awesome-copilot`: Version management, migration guides
- `minimax`: Breaking change management, rollback procedures
- `antigravity`: Evolution patterns, gradual migration

**Tier: ADVANCE**

**ABOVE LINE:**
- Automated changelog generation
- Breaking change detection from git history
- Dry-run with rollback simulation

#### 3. **Output** → `cli/output.md`

**Repos Contributing:**
- `awesome-copilot`: Machine-readable JSON output, structured logging
- `minimax`: CLI formatting (check/fix/run/demo pattern)
- `antigravity`: Progress indication

**Tier: ADVANCE**

---

## Domain: DISTRIBUTION (Priority #5)

### Topics to Incorporate

#### 1. **Publish** → `distribution/publish.md`

**Repos Contributing:**
- `awesome-copilot`: Artifact publishing, plugin distribution
- `minimax`: 6-gate release, version compatibility
- `antigravity`: Release notes generation

**Tier: ADVANCE**

**ABOVE LINE:**
- Multi-platform automation (npm + PyPI + crate + gem)
- SBOM generation + supply chain security
- Automated release notes from conventional commits

#### 2. **Rollback** → `distribution/rollback.md`

**Repos Contributing:**
- `minimax`: Rollback procedures, health checks
- `awesome-copilot`: Dependency management, safe downgrades
- `antigravity`: Version pinning strategies

**Tier: ADVANCE**

**ABOVE LINE:**
- Automated rollback with health check gates
- Data migration rollback
- Feature flag-backed rollback

#### 3. **Compatibility** → `distribution/compatibility.md`

**Repos Contributing:**
- `minimax`: Version compatibility matrix, breaking changes
- `awesome-copilot`: Dependency conflict resolution
- `antigravity`: Semver enforcement

**Tier: ADVANCE**

**ABOVE LINE:**
- Compatibility matrix validator
- Multi-version testing strategy
- Dependency diamond detection

---

## Domain: REVIEW_QUALITY (Priority #6)

### Topics to Incorporate

#### 1. **Planning** → `review-quality/planning.md`

**Repos Contributing:**
- `antigravity`: Reasoning chains in planning, trigger documentation
- `awesome-copilot`: Architecture review framework, SoC checklist
- `minimax`: Pre-implementation checklist

**Tier: EXPERT**

#### 2. **Security** → `review-quality/security.md`

**Repos Contributing:**
- `awesome-copilot`: OWASP API Top 10, threat modeling, input validation
- `antigravity`: Security halt protocol
- `minimax`: 6-gate security verification

**Tier: ADVANCE**

**ABOVE LINE:**
- Automated security scanner (SAST) with required remediation actions
- Dependency vulnerability scanning + license compliance
- Hardcoded secret detection

#### 3. **Benchmark** → `review-quality/benchmark.md`

**Repos Contributing:**
- `antigravity`: Quality metrics, anti-pattern detection
- `awesome-copilot`: Performance thresholds, regression gates
- `minimax`: Functional verification checklist

**Tier: ADVANCE**

**ABOVE LINE:**
- Automated regression detection vs 3 benchmark repos
- Performance SLO enforcement (latency/throughput)
- Accessibility regression detection

---

## Implementation Sequence

### Week 1: Backend Domain

**Day 1-2:** Extract architecture patterns
- [ ] Read antigravity skill routing + microservices
- [ ] Read awesome-copilot layered architecture
- [ ] Read minimax fullstack structure
- [ ] Write `backend/architecture.md` (EXPERT tier, ~2000 words)
- [ ] Implement dependency auditor script

**Day 3-4:** Extract data access patterns
- [ ] Read awesome-copilot database design + migrations
- [ ] Read minimax Django patterns
- [ ] Read antigravity N+1 patterns
- [ ] Write `backend/data-access.md` (EXPERT tier, ~1800 words)
- [ ] Implement migration validator script

**Day 5:** Extract error handling + validation
- [ ] Write `backend/errors.md` + `backend/validation.md` (ADVANCE tier, ~800 words each)
- [ ] Integrate Zod/Pydantic examples

**Validation:**
- [ ] npm run validate (all backend READMEs present, tier structure enforced)
- [ ] npm test (backend domain content verified)

### Week 2-3: Frontend Domain

### Week 4: Fullstack Domain

### Week 5: CLI + Distribution

### Week 6: Review Quality

### Week 7-8: Expansion Domains (Mobile, Multimodal, Observability)

---

## Quality Gates (Per Domain)

### Completion Checklist

For each domain, before marking COMPLETE:

- [ ] **Coverage:** All topics extracted from 3 repos with credit
- [ ] **Tier Structure:** Each topic has ADVANCE (minimum) + some EXPERT + some ABOVE
- [ ] **Examples:** Code samples for each major pattern (Node.js, Python, Go if applicable)
- [ ] **Anti-Patterns:** Explicitly list what NOT to do
- [ ] **Checklist:** Decision tree or verification checklist
- [ ] **Automation:** At least 1 "ABOVE LINE" tool/script per domain
- [ ] **Tests:** Smoke tests verify tier structure + example code compiles
- [ ] **Documentation:** README updated with coverage matrix vs 3 repos

### Superiority Markers

Domain is **ABOVE the line** if:
- [ ] Exceeds 2/3 repos in depth (measure: word count, code examples, decision trees)
- [ ] Adds 3+ unique insights not in any repo
- [ ] Includes 1+ automation tool (enforcement, validation, generation)
- [ ] Reasoning chains explain WHY (not just HOW)

---

## Success Metrics

### By End of Phase 1 (Backend)
- `backend/` has 5 topics, all ADVANCE+ tier
- Dependency auditor deployed and tested
- Coverage validated: backend domain exceeds 2/3 repos

### By End of Phase 4 (All Domains)
- 6 domains × 4 topics = 24 comprehensive topics
- 80%+ topics are EXPERT+ tier
- 6 "ABOVE LINE" automation tools deployed
- Comparative matrix shows superiority vs 3 repos

### By Ship Date
- README has comparative table: OUR PLATFORM vs antigravity vs awesome-copilot vs MiniMax
- All 6 domains have 4+ topics each
- All topics have ADVANCE+ tier content
- CLI includes `agentic-senior-core benchmark` command showing coverage matrix

---

## Expected Content Volume

| Domain | Topics | Avg Words/Topic | Format |
|--------|--------|-----------------|--------|
| backend | 5 | 1500 | EXPERT |
| frontend | 5 | 1200 | ADVANCE-EXPERT |
| fullstack | 4 | 1000 | ADVANCE |
| cli | 3 | 800 | ADVANCE |
| distribution | 3 | 800 | ADVANCE |
| review_quality | 3 | 1200 | ADVANCE-EXPERT |
| mobile | 5 | 1000 | ADVANCE (new domain) |
| multimodal | 5 | 1200 | ADVANCE (new domain) |
| observability | 4 | 1000 | ADVANCE (new domain) |
| **TOTAL** | **37** | **~39,800 words** | **Comprehensive platform** |

This is equivalent to a 100+ page technical book focused on production engineering.

---

## References

- Benchmark Analysis: `.agent-context/state/benchmark-analysis.json`
- Skill Platform: `.agent-context/skills/` (all domains)
- Validator: `scripts/validate.mjs` (ensures tier structure + README presence)
- Tests: `tests/cli-smoke.test.mjs` + `tests/operations.test.mjs`
