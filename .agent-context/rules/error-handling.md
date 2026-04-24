# Error Handling Boundary

Use the target language and framework's normal error model. Do not invent a custom exception architecture from this repo.

Reject these failure patterns:
- swallowed errors
- generic errors that erase the domain cause
- client-facing leaks of stack traces, secrets, SQL, infrastructure details, or provider internals
- retries without transient-failure evidence, limits, backoff, and a clear final outcome
- logs that say only "something failed" without action, target, actor, or trace context

At boundaries, validate early, return safe user-facing errors, and keep machine-readable error context for operators and callers.
