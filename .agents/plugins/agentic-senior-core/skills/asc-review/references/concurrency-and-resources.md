# Concurrency Safety & Resource Lifecycle Hygiene

Universal runtime reliability standards grounded in MITRE CWE-404 (Improper Resource Shutdown or Release) and Google Engineering Practices concurrency checks.

---

## 1. Deterministic Resource Disposal (CWE-404)

Every acquired system resource (file descriptors, database connections, transaction handles, HTTP response streams, locks, and event subscriptions) must have deterministic cleanup across both success and exception paths:

- **Use Native Scoped Constructs:** Always bind acquired resources to deterministic scoped blocks (`using` / `await using` in C#, `with` / `async with` in Python, `try-with-resources` in Java, `defer` in Go, `try { ... } finally { ... }` in JS/TS).
- **Close Collections & Paginated Cursors:** Exhausted or aborted streams and database cursors must close cleanly on early returns or timeouts to prevent descriptor exhaustion.
- **Event Listener Symmetry:** Every subscription or timer registered during component/service initialization must pair with an explicit teardown unsubscribe or `AbortController` signal.

---

## 2. Asynchronous Execution & Event-Loop Safety

Async bugs frequently pass unit tests but trigger crashes or deadlocks under production load:

1. **Zero Blocking Calls in Async Contexts:** Never invoke synchronous disk I/O, synchronous network clients, or blocking thread-wait primitives (`Result`, `.Wait()`, synchronous sleep, `readFileSync`) inside an async request handler or event loop.
2. **No Unhandled Fire-and-Forget Tasks:** Never invoke an async function or background task without `await` or an explicit top-level error boundary and structured logging. Unhandled async exceptions silently drop work or terminate worker processes (`async void` outside top-level UI event handlers is banned).
3. **Mandatory Timeout & Cancellation Propagation:** Every outbound HTTP call, RPC request, and database query must accept and forward the caller's cancellation token or `AbortSignal` paired with explicit connection and read timeouts.
4. **No Loops With Unbounded Concurrency:** Never fan out unbounded `Promise.all` / parallel task batches over arbitrary user lists; enforce explicit concurrency caps or worker queues to prevent downstream and connection-pool exhaustion.

---

## 3. Shared Mutable State & Deadlock Guards

- **Request-Scoped Isolation:** Never store per-request user context, mutable caches, or temporary accumulator arrays in module-level singletons or static fields shared across concurrent requests.
- **Immutability by Default:** Prefer immutable inputs and pure transformations inside concurrent workers; avoid mutating caller-owned objects or shared arrays in place.
- **Deterministic Lock Ordering:** When acquiring multiple locks or row locks (`SELECT ... FOR UPDATE`), acquire them in a consistent canonical sort order (for example, ascending primary key ID) to prevent circular deadlocks.
- **Idempotent Retries:** Wrap non-atomic state transitions in database transactions and guard retryable mutations with idempotency keys or optimistic concurrency version checks.
