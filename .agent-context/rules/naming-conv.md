# Naming Boundary

Use the target language and framework conventions. Do not invent a naming style from this repo.

Reject only these common LLM bad habits:
- vague names that hide meaning, such as `data`, `result`, `item`, `thing`, `temp`, `handle`, or `process` when a precise domain name exists
- names that require reading the implementation to understand the value
- mixed file or directory naming styles inside the same feature without a framework reason
- booleans, units, and side-effect functions whose names hide what they represent or change

Prefer names that explain domain intent, user action, state, and boundary responsibility.

Inline comments must explain why, not what. Non-obvious choices (retry strategy, index column order, denormalized field, intentional swallow with named recovery, magic constant tied to an external system) deserve a one-line rationale near the code; comments that paraphrase the code are noise.
