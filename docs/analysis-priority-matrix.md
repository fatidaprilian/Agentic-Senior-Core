# Analysis Priority Matrix

This document captures the strategic analysis for the next execution phases of Agentic-Senior-Core.

## Version Status

- Current released version: `1.8.0`
- No `1.9` milestone is currently defined in the roadmap.
- The next planned horizons are `V2.0`, `V2.5`, and `V3.0`.

## Executive Summary

Agentic-Senior-Core is already a strong repository-level governance engine for AI-assisted code generation.
The next step is to evolve it into a more verifiable, transactional, and enterprise-scalable governance platform.

The highest-value work is not adding more rules first.
It is tightening the delivery path, the trust model, the benchmark model, and the governance distribution model.

## Priority Matrix

### 1. Skill Distribution and Verification Platform

Risk
- Current installation and skill adoption remain too local and too direct.
- There is no formal trust-scored marketplace model for skills or plugins.

Impact
- Unverified artifacts can enter the workspace too easily.
- Installation failures may require manual cleanup.
- The platform cannot yet prove which artifacts are trusted.

Recommendation
- Move to a skill marketplace model with `verified`, `community`, and `experimental` trust tiers.
- Make installation transactional with preflight checks, backup points, and automatic rollback.
- Add compatibility and integrity validation before any new skill or plugin is accepted.

### 2. Benchmarking and Anti-Regression Controls

Risk
- Existing LLM judge and detection scripts are useful, but they do not yet form a full cross-model evaluation harness.
- A single-model judge can create confirmation bias.

Impact
- Quality drift may go unnoticed when the same model writes and evaluates the code.
- Regression detection remains local and incomplete.
- The release gate cannot yet compare model families under the same rule pack.

Recommendation
- Build a benchmark harness that runs the same rule packs across multiple models.
- Add anti-regression quality gates in CI/CD that block release when quality drops.
- Enforce multi-model evaluation for judge workflows so audit and generation are not the same trust source.

### 3. Enterprise Governance Cloud

Risk
- Governance assets still operate primarily at repository scope.
- Policy drift across many repositories is not yet centrally detectable.

Impact
- Teams may diverge from the standard without visibility.
- Override handling becomes difficult to audit at scale.
- Portfolio-level quality and architecture governance cannot be measured consistently.

Recommendation
- Create an enterprise governance layer for centrally distributed policies.
- Add policy drift detection across repositories.
- Introduce an organization-level override registry with expiry enforcement and audit trail.
- Add a portfolio dashboard for quality, compliance, and architecture conformance.

### 4. Frontend Parity and Accessibility Enforcement

Risk
- Frontend work can drift into design-system opinionation if the scope is not constrained.
- Accessibility and reduced-motion requirements are not yet enforced as hard gates everywhere.

Impact
- The project can overreach its role as a governance engine.
- UX and a11y regressions can ship without strong release-level protection.
- Protected pages may change visually without review.

Recommendation
- Keep frontend governance focused on universal standards, not on dictating visual style.
- Enforce a Frontend Parity Checklist in CI.
- Add visual regression checks for protected pages.
- Require reduced-motion safe alternatives and accessibility verification for motion-heavy flows.

### 5. Shift-Left Security and Supply Chain Discipline

Risk
- SBOM generation exists, but the security posture can still be too reactive.
- New third-party dependencies may be introduced without enough local scrutiny.

Impact
- Security issues can enter the tree before CI catches them.
- Dependency growth can become harder to audit.
- AI agents may add packages without deliberate approval.

Recommendation
- Require local security auditing before new package introduction.
- Treat dependency changes as a security-sensitive action.
- Strengthen repository instructions so agents verify supply-chain impact before commit.

### 6. Dynamic Context Delivery

Risk
- Compiled rule files can grow large and become harder to reason about.
- Static context may become inefficient when only one domain is relevant.

Impact
- Context windows may be wasted on unrelated rules.
- Agents may lose focus when the compiled file becomes too dense.
- Long-term scalability of the governance engine may be constrained.

Recommendation
- Keep the current compiler model for now, but segment it aggressively by domain and skill pack.
- Evaluate MCP-based retrieval for domain-specific rule loading once the rule corpus grows further.
- Consider RAG or targeted retrieval only after the domain segmentation proves insufficient.

## Suggested Sequence

1. Finish the guided launcher and onboarding simplification.
2. Deliver the V2.0 marketplace, trust scoring, and transactional install model.
3. Add the V2.5 benchmark harness and anti-regression gates with multi-model evaluation.
4. Build the V3.0 enterprise governance layer with drift detection and org-level policy controls.
5. Revisit RAG or MCP-native rule retrieval after the rule corpus grows beyond the current compiler model.

## Bottom Line

The project should not move to a `1.9` framing right now.
The clearer path is to treat `1.8.0` as the final repository-governance baseline and execute the next phase as `V2.0` platform hardening.

That keeps the roadmap coherent:
- `V2.0` for trust, transactionality, and onboarding clarity
- `V2.5` for benchmark rigor and anti-regression control
- `V3.0` for enterprise-scale governance distribution
