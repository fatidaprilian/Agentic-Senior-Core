# PrefixBridge Security Constraints

Status: planned, unshipped.
Last updated: 2026-05-18.

## Security Model

PrefixBridge is a local user-space bridge. It is not a global man-in-the-middle proxy.

Default bind:

```text
127.0.0.1 only
```

Default logging:

```text
no raw prompt logging
no request body logging
no response body logging
```

## API Keys

Rules:

1. Do not store API keys in project state.
2. Accept keys from environment or inbound request headers.
3. Forward keys in memory only.
4. Do not write keys to logs.
5. Redact authorization headers from diagnostics.

## Local State

Allowed state:

- prefix hash
- block hash
- source file path
- provider name
- model name
- cache usage counts
- latency measurements
- invalidation reason

Forbidden by default:

- raw prompt text
- raw response text
- full source content
- API keys
- cookies
- OAuth tokens
- provider account identifiers

## Debug Mode

If debug traces are needed, require explicit opt-in.

Debug traces must be:

- redacted by default
- short-lived
- local only
- clearly labeled as sensitive

## Enterprise Constraints

Avoid:

- root certificates
- kernel hooks
- privileged install
- remote listen
- transparent interception of all traffic

Prefer:

- explicit IDE base URL configuration
- loopback-only server
- official upstream provider endpoints
- deterministic passthrough when unsupported

## Failure Mode

If security checks fail:

1. stop bridge startup, or
2. enter passthrough mode if already handling a request

Never silently log raw prompts to explain a failure.

## Threat Model Required Before Release

Before shipping, write a threat model covering:

- local malicious process on same machine
- exposed loopback port via misconfiguration
- API key leakage
- prompt leakage through debug logs
- source path leakage in manifests
- cache diagnostic privacy
- upstream provider data handling
