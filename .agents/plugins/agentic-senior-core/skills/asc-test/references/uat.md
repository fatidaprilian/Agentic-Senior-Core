# User Acceptance Testing (UAT) & Requirements Verification

User Acceptance Testing verifies that software fulfills real operational requirements from the perspective of the end user, rather than merely passing isolated unit tests.

---

## 1. Requirements to Acceptance Criteria (Given/When/Then)

Every user requirement or feature ticket must be broken down into concrete, testable acceptance criteria using Given/When/Then structure:

```gherkin
Scenario: Developer revokes an active API key
  Given an authenticated developer with 2 active API keys
  When the developer clicks "Revoke" on key "prod-analytics-key"
  And confirms the revocation in the confirmation dialog
  Then key "prod-analytics-key" is marked as inactive immediately
  And requests using that key return HTTP 401 Unauthorized
  And the remaining key continues to function normally
```

---

## 2. Structured Acceptance Verification Matrix

When preparing for release or completing a feature milestone, verify all user journeys against an Acceptance Matrix:

| Requirement ID | Scenario / User Journey | Input / Action | Expected Result | Verification Method | Status |
|---|---|---|---|---|---|
| UAT-AUTH-01 | Login with valid credentials | Post valid email + password | Redirects to `/dashboard`, session cookie set | E2E Playwright test | PASS |
| UAT-AUTH-02 | Login with rate-limited account | 6 failed attempts within 60s | HTTP 429, displays lockout banner with timer | Integration test | PASS |
| UAT-BILL-01 | Upgrade from Free to Pro tier | Submit Stripe checkout session | Workspace tier reflects Pro, features unlock | Webhook integration test | PASS |
| UAT-DATA-01 | Export audit log with 10k rows | Click "Export CSV" | Streams CSV file within 2s, memory < 50MB | Benchmark test | PASS |

---

## 3. Ephemeral Verification Artifacts (Zero Project Disk Clutter)

Verification records, testing matrices, and UAT notes belong in the agent conversation artifacts directory (`brain/<id>/`), never in the user's project workspace.

- **Strict Invariant:** Never write `UAT.md`, `test-checklist.json`, `PRD.md`, or temporary gate files to the user repository root unless explicitly instructed by the user.
- **Reporting:** Present UAT findings clearly in direct chat messages or structured session artifacts.

---

## 4. The Edge Case Quad

Never sign off on acceptance testing by verifying only the primary happy path. Every scenario must be verified against four operational vectors:

1. **Happy Path:** Standard, valid user input under normal network conditions.
2. **Boundary Values:**
   - 0 records (empty list / table).
   - 1 record (single item formatting, no awkward pluralization).
   - Maximum capacity (pagination boundary, payload size limits).
3. **Invalid & Malicious Input:**
   - Empty strings, whitespace-only fields, oversized payloads.
   - SQL / script injection vectors (`<script>`, `' OR 1=1`).
   - Unicode, emojis, and non-ASCII characters.
4. **Failure & Degraded Mode:**
   - Database connection timeout.
   - Third-party webhook failure.
   - Client network disconnection mid-mutation.

