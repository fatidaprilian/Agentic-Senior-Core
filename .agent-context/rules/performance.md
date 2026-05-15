# Performance Boundary

Do not over-optimize by habit. Do reject obvious scale and runtime failures.

Performance is a decision input, not a blanket veto against modern libraries, motion, richer UI, or maintained tooling. Compare the real cost of the dependency or implementation against the cost of custom code, lost accessibility, weaker UX, duplicated maintenance, and slower delivery.

Hard rejections:
- repeated network, database, filesystem, or model calls inside loops without batching, limits, or caching rationale
- unbounded reads, renders, exports, or searches when the data can grow
- shipping large client/runtime payloads without a reason, split point, or loading strategy
- synchronous blocking work in request, UI, worker, or async paths where it can stall the product
- caches without invalidation, expiry, ownership, and staleness trade-offs

When performance matters, measure the real bottleneck, change the smallest useful thing, and verify the result. Do not downshift product quality, UI ambition, or library fit from performance fear alone; name the concrete budget, bottleneck, device limit, or runtime evidence.

Caching is a tier decision before a technology decision. Prefer browser, CDN, or HTTP cache layers when data is shared and public; prefer in-process caches for hot per-instance data; reach for distributed caches such as Redis or Memcached only when shared mutable state across instances is the actual requirement. Record cache-aside, write-through, or write-behind shape, invalidation strategy, and stampede prevention (request coalescing or stale-while-revalidate) when the cache fronts an expensive backend.
