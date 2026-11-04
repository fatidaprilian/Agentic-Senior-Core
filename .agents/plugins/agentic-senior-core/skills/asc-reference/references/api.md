# API Design: REST & GraphQL Standards

Production APIs must be predictable, idempotent, strictly typed, and backward-compatible.

---

## 1. REST API Architecture & HTTP Semantics (RFC 9110)

### 1.1 Resource Naming & URI Grammar
- Use plural nouns for resource collections: `/v1/projects`, `/v1/projects/{id}/deployments`.
- Use HTTP verbs for actions:
  - `GET`: Safe, idempotent retrieval. No body.
  - `POST`: Create a resource or trigger a non-idempotent operation.
  - `PUT`: Idempotent full replacement of the resource.
  - `PATCH`: Partial update of specific fields (prefer JSON Merge Patch RFC 7396).
  - `DELETE`: Idempotent removal of the resource.

### 1.2 Bounded Collections & Pagination
Every endpoint returning a list must enforce an upper limit to prevent memory exhaustion:
- **Cursor-based pagination (Recommended for real-time/large datasets):**
  - Query parameters: `?after=cursor_xyz&limit=50`.
  - Response envelope:
    ```json
    {
      "items": [...],
      "page_info": {
        "has_next_page": true,
        "end_cursor": "cursor_xyz"
      }
    }
    ```
- **Offset pagination (For simple admin portals):**
  - Query parameters: `?page=1&per_page=25` (enforce max `per_page=100`).
  - Return pagination metadata in headers: `X-Total-Count`, `Link: <...>; rel="next"`.

### 1.3 Mutation Idempotency (The `Idempotency-Key` Header)
Critical mutations (payments, resource creation, batch operations) must accept an `Idempotency-Key` header:
1. When receiving a mutation request with `Idempotency-Key: <uuid>`:
   - Check cache/database for existing key within TTL (e.g. 24 hours).
   - If key exists and processing is in progress: return `409 Conflict` or wait.
   - If key exists and completed: return the cached response (headers + body) immediately.
   - If new key: save key with state `PENDING`, execute mutation in transaction, store result, return response.

---

## 2. Structured Error Details (RFC 9457)

Never return generic error strings like `{"error": "Something went wrong"}`. Use RFC 9457 Problem Details:

```json
{
  "type": "https://api.example.com/errors/validation-failed",
  "title": "Validation Failed",
  "status": 422,
  "detail": "The request payload failed validation constraints.",
  "instance": "/v1/projects/proj_982/deployments",
  "invalid_params": [
    {
      "name": "branch",
      "reason": "Branch 'feature/beta' does not exist in the connected repository."
    }
  ]
}
```

- Always return the appropriate HTTP status code (`400`, `401`, `403`, `404`, `409`, `422`, `429`, `500`, `503`).
- Set `Content-Type: application/problem+json`.

---

## 3. GraphQL Standards

### 3.1 N+1 Query Elimination via DataLoader
GraphQL resolvers execute independently, naturally producing N+1 database queries.
- **Enforced:** Wrap database lookups in a batching mechanism (e.g., `DataLoader` in JS, `graphene-dataloader` in Python):
  ```typescript
  const userLoader = new DataLoader(async (userIds: readonly string[]) => {
    const users = await db.users.findMany({ where: { id: { in: [...userIds] } } });
    const userMap = new Map(users.map(u => [u.id, u]));
    return userIds.map(id => userMap.get(id) || null);
  });
  ```

### 3.2 Query Depth & Complexity Limits
Protect GraphQL endpoints against Denial-of-Service (DoS) via deeply nested circular queries:
- Configure maximum query depth (e.g., maximum depth of 6).
- Implement query cost analysis: reject queries whose calculated complexity score exceeds budget.

### 3.3 Explicit Mutation Errors (Result Unions)
Model business failures as schema types rather than top-level GraphQL errors:
```graphql
type TransferSuccess {
  transactionId: ID!
  newBalance: Float!
}

type InsufficientFundsError {
  available: Float!
  required: Float!
}

union TransferResult = TransferSuccess | InsufficientFundsError

type Mutation {
  transferMoney(input: TransferInput!): TransferResult!
}
```

