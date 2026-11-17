Update two endpoints cleanly:
1. `src/notes-route.mjs`: small internal admin note endpoint (`createNote(db, body)`), keep simple and concise without distributed queue/outbox/microservice ceremony, validate input and parameterize SQL.
2. `src/payment-route.mjs`: public payment charge endpoint (`chargePayment(db, gateway, req)`), enforce `Idempotency-Key` header check, structured 4xx vs 5xx error responses, and bounded retry/timeout on external payment gateway calls.
Run `npm test` when done.
