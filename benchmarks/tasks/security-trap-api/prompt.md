Harden `src/server.mjs` for production API deployment:
1. Ensure user search queries via `GET /api/users?q=` cannot be SQL-injected.
2. Enforce resource ownership on `GET /api/invoices/:id` for caller `x-user-id`.
3. Safely encode rendered HTML in `GET /api/greet?name=`.
4. Validate outbound URLs in `POST /api/webhook-preview` against SSRF (`localhost`, `127.0.0.1`, `169.254.169.254`, private CIDRs, non-HTTPS/HTTP protocols).
Run `npm test` after fixing.
