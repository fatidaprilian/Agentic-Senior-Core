Harden `fetchExchangeRate(url, { fetchImpl = fetch, timeoutMs = 500, signal } = {})` in `src/fx-client.mjs` so that:
- Upstream 5xx/4xx errors and timeouts fail fast with an operational `Error` preserving the underlying `cause` (do NOT catch and return `null` or `0` silently).
- Acquired timeout timers are deterministically cleared in `finally` (zero leaked timers/handles) and caller `signal` cancellation propagates cleanly.
Run `npm test` after fixing.
