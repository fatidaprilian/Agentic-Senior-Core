# Security Boundary

Use the security model and libraries already present in the project. If security tooling is unresolved, the LLM must recommend current, maintained options from official docs and OWASP-aligned guidance before implementation.

Hard rules:
- validate and normalize all data crossing a trust boundary
- never interpolate untrusted input into queries, shell commands, file paths, templates, logs, or HTML
- never commit secrets, tokens, credentials, private keys, or production identifiers
- never invent custom crypto, session, token, or password handling when maintained standards exist
- enforce authorization at the server or trusted boundary, not only in UI state
- return safe client-facing errors and keep sensitive detail in protected logs
- document auth, permission, data exposure, rate-limit, and abuse assumptions before changing sensitive flows

For high-risk changes, check current framework security docs and record the relevant source or assumption in the implementation notes.
