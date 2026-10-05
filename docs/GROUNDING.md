# Grounding — Verified Citations

Every claim in the ASC ruleset traces to a source below. All entries were verified against primary sources (publisher pages, arXiv abstracts, conference programs) in September 2026. Entries are marked **[confirmed]** (primary source checked) or **[cautionary]** (evidence that constrains how ASC itself should be designed).

## Security

- **[confirmed]** Spracklen, J. et al. (2025). "We Have a Package for You! A Comprehensive Analysis of Package Hallucinations by Code Generating LLMs." *34th USENIX Security Symposium*, pp. 3687-3706. https://www.usenix.org/conference/usenixsecurity25/presentation/spracklen — Hallucination rates of 5.2% (commercial models) to 21.7% (open-source models), creating the slopsquatting attack surface. Basis for the dependency provenance rule.
- **[confirmed]** Spira, A., Cohen, S., Feldman, E., Bitton, R., Wool, A., Nassi, B. (2026). "Beware of Agentic Botnets: Scalable Untargeted Promptware Attacks via Universal and Transferable Adversarial HalluSquatting." arXiv:2607.07433 (preprint, July 2026). — Hallucination rates up to 85% for repository cloning and 100% for skill installation. Basis for the git-clone verification rule. Note: arXiv preprint; formal venue acceptance unconfirmed as of September 2026.
- OWASP Secure Coding Practices and ASVS — basis for input validation, parameterized queries, Argon2/bcrypt, and resource-level authorization rules.

## Rules-file effectiveness (cautionary for ASC itself)

- **[confirmed] [cautionary]** Gloaguen, T., Mündler, N., Müller, M., Raychev, V., Vechev, M. (2026). "Evaluating AGENTS.md: Are Repository-Level Context Files Helpful for Coding Agents?" arXiv:2602.11988. ETH Zurich SRI Lab / LogicStar.ai. — LLM-generated context files reduced success rates ~3% while increasing cost ~20%; developer-written files improved success by only ~4%. This is why ASC keeps deterministic checks in hooks (not the model) and scopes rules via progressive disclosure, and why the ASC benchmark must be run with adequate n.
- **[unverified — verify against proceedings before citing]** dos Santos et al. (2026). "Configuration Smells in AGENTS.md Files"; Ardic et al. (2026). "Uncovering AGENTS.md." Reported as SCAM 2026 accepted papers (Sept 14-15, Benevento, https://conf.researchr.org/home/scam-2026) by one search source; a second independent search could not locate them. The SCAM 2026 conference itself is confirmed to exist.
- **[confirmed]** Lulla et al. (2026). "On the Impact of AGENTS.md Files on the Efficiency of AI Coding Agents." arXiv:2601.20404. — Closest published methodological template to the ASC benchmark: paired within-task design on 124 real PRs from 10 repos; AGENTS.md presence associated with -28.64% median runtime and -16.58% output tokens at comparable completion rates.
- **[confirmed]** DAIR.AI review (Feb 2026) of AGENTS.md literature: human-written, specific, non-redundant context files improve performance; auto-generated files that duplicate existing docs hurt performance. Design constraint on ASC rules: stay specific and non-redundant.

## Workflow

- **[confirmed]** Horthy, D. (2024). "No Vibes Allowed: Solving Hard Problems in Complex Codebases." AI Engineer World's Fair — origin of RPI (Research-Plan-Implement).
- **[confirmed]** Horthy, D. (2026). "Everything We Got Wrong About Research-Plan-Implement." Coding Agents Conference, Computer History Museum, March 2026 — QRSPI 8-stage revision after production failure modes. ASC adapts stages 2/5/7 and skips 1/3/4/6/8 as too heavyweight for individual-developer workflows.

## Resilience, Fallbacks & User Feedback

- **[confirmed]** AWS Well-Architected Framework: Reliability Pillar (REL05-BP01) — transforming hard dependencies into soft dependencies via graceful degradation, static responses, and stale cache fallbacks. Basis for ASC's dependency fallback rules.
- **[confirmed]** Nielsen Norman Group (2024). "Visibility of System Status" (Heuristic #1) and "Error Message Design" (Heuristic #9) — user feedback must be visible, proportionate, constructive, and contextual (inline validation for forms; toasts/banners with actionable retries for mutations).
- **[confirmed]** W3C WAI-ARIA 1.2 / Authoring Practices Guide (APG) — accessibility standards for alerts (`role="alert"`) and status notifications (`role="status"`, `aria-live="polite"`), prohibiting keyboard focus-stealing on transient toasts.
- **[confirmed]** Google Site Reliability Engineering (SRE) & Engineering Practices — fail-fast for system invariants and invalid arguments; fail-safe with graceful degradation for external runtime services.

## Benchmark methodology

- Ouyang, S., Zhang, J., Harman, M., Wang, M. (2023). "An Empirical Study of the Non-Determinism of ChatGPT in Code Generation." *ACM TOSEM*. https://doi.org/10.1145/3697010 — 47-76% of identical code-generation requests produced different outputs across runs; only 21% of surveyed papers considered this threat. Basis for the n>=5 repeat requirement in benchmarks/METHODOLOGY.md.
- RigorBench (2026). arXiv:2606.22678 — disciplined process harness vs baseline ReAct agent, mean +/- SD reporting.
- "Does Code Cleanliness Affect Coding Agents?" (2026). arXiv:2605.20049 — minimal-pair controlled study, 10 trials per side.
- "Resolution Diagnostics for Paired LLM Evaluation" (2026). arXiv:2606.30315 — standard power calculators (Cohen 1988, G*Power) misestimate minimum-detectable-effect by ~2x for paired LLM comparisons; use Benjamini-Yekutieli/FDR correction across metrics.
- Kitchenham & Madeyski (2024). *EMSE*. https://doi.org/10.1007/s10664-024-10504-1 — at small n, prefer distribution-robust nonparametric analyses (probability of superiority, Cliff's d) over parametric t-tests.
- Crupi et al. (2025). *IEEE TSE*. — even GPT-4-turbo frequently misjudges code correctness; LLM-as-judge is not a valid primary metric. If used at all: different model family than the system under test, position-swapped, calibrated against human labels.
- Metrics validity: cyclomatic complexity shows no meaningful correlation with defect presence (Kendall tau 0.064, arXiv:1912.01142) — use it as context, never as a primary quality metric. Static-analysis warning counts are secondary noisy signals (false-positive distortion documented in IEEE TSE 2023/49).
- Anthropic "Claude for Open Source" (Feb 2026): 6 months Claude Max 20x for qualifying OSS maintainers (~$1,200 value). Verify API/CLI eligibility at anthropic.com before relying on it for automated evals.

## Token efficiency (grounds for ascx and rules design)

- **[confirmed — directly studies wrappers like ascx]** Weinberger & Hozez, PointFive (2026). "Token Reduction Is Not Cost Reduction." arXiv:2607.12161 — 2,908 paid Claude Code runs, 103 tasks, paired baseline vs CLI-output compressors. Key finding: prompt-cache traffic dominates cost (~87% of reconstructed spend); aggressive compression consistently RAISED total cost by breaking cache locality. Only minimal compression (near-passthrough) was cost-neutral. Implication: ascx must be measured on billed cost with cache-hit accounting, not on token counts alone.
- "The Impact of Reasoning on Model Accuracy" / token-complexity findings (arXiv:2503.01141, arXiv:2507.04023): concise-answer instructions cut tokens 63% but lose accuracy on tasks requiring long reasoning; accuracy needs output length above a task-intrinsic threshold. Implication: blanket "answer briefly" rules carry measurable accuracy risk on complex tasks — scope conciseness by task type.
- Anthropic prompt caching (docs, Sept 2026): cache read = 0.1x input price; a variable element (timestamp, request ID) placed before stable content invalidates the entire cache. Rules files must sit at a stable prefix with nothing mutable injected before them.
- AgentDiet (arXiv:2509.23586): reflection-based trajectory reduction, -39.9% to -59.7% input tokens, -21.1% to -35.9% cost, performance within -1.0%/+2.0% of baseline — a validated-safe compression approach.
- Code minification (arXiv:2606.01326): -42% tokens but -12% absolute resolution rate — documented example of compression that is NOT safe.
- Multi-agent token economics (Anthropic research, June 2025; arXiv:2604.02460): multi-agent systems use ~15x chat tokens; single agents are more information-efficient at fixed reasoning budget. Sub-agents pay off for context isolation (fresh-context worker returning a compressed summary), not as a default token-saving measure.
- Model routing (arXiv:2602.09924): utility routing matched strongest-model accuracy at 37-70% cost reduction depending on benchmark.
- Progressive disclosure (ASC's on-demand skill loading) vs always-on rules loading: no published head-to-head exists. This is a genuine research gap — must be validated with our own benchmark, not assumed.
- **[confirmed — independent, directly relevant to ascx]** tokbench pilot (Entelligentsia/tokbench, 2026): pre-registered, transcript-audited comparison (N=1 per arm, replication in progress) of native vs. rtk vs. headroom vs. lean-ctx on a real 180-240-turn agentic task, judged by provider-billed input tokens. Result: every middleware INCREASED total billed tokens — rtk +27%, headroom +43%, lean-ctx +38-59%. Headroom's per-request compression was independently verified real (342K tokens removed, reconciled to the bill within 0.0004%), yet the session still cost more because integration lengthened the run (237 vs 180 turns). Payload-level savings do not guarantee session-level savings. A second independent replay (codepointer.dev, 500 real Claude Code sessions, 614M tokens, $926 baseline) found vendor reduction percentages are computed against a narrow denominator (single payload/command) and shrink to single-digit percent of total session cost. Caution: ascx is architecturally closest to rtk (deterministic CLI output filtering via hooks) — the same net-cost risk applies until measured. This is why ASC_CACHE_SAFE exists as the default-off A/B condition.
- Headroom's "CacheAligner" (never rewrite the frozen prefix; compress only the live zone) is the architecturally correct response to the cache-locality problem — but has no first-party end-to-end billed-cost number. If ASC ever adds context-level features, live-zone-only is the pattern to follow.

## Static analysis / false positives

- Sadowski, C. et al., "Lessons from Building Static Analysis Tools at Google." *Communications of the ACM* 61(4), 2018 / Software Engineering at Google ch. 20 — low false-positive rates are critical for adoption; Google disabled its own HTML linter over unusable signal. Basis for tiering the dependency blocklist (block vs review) instead of blanket bans.
- Guo, Z. et al. (2023). "Mitigating False Positive Static Analysis Warnings." *IEEE TSE* 49. — false positives remain the central adoption problem.

## Retracted / corrected citations

- ~~"Cheng 2026"~~ — removed. The real Cheng et al. 2026 paper (arXiv:2607.26083) covers parallel CLRS algorithm accuracy, not general code quality; the original citation was a mismatch.
- ~~"HalluSquatting, USENIX Security 2026"~~ — corrected to arXiv:2607.07433 preprint (Spira et al.). Venue claim could not be confirmed against the USENIX Security 2026 program.
- ~~"IBM Systems Sciences Institute 15x defect cost"~~ — never used in ASC rules, and documented as folklore (Bossavit investigation: the institute's data does not exist; traces to 1981 IBM training notes at oldest). Boehm/Basili 2001's real finding: ~5:1 on small projects, up to 100x only on large ones. Do not cite the 15x/100x chart.
