# End-to-End (E2E) & Playwright Testing

E2E browser tests verify integrated user journeys across the full application stack (HTML, CSS, JS, network, database).

---

## 1. Reconnaissance Before Action

Never write browser test steps by guessing selectors or UI timing.

```
┌──────────────────┐      ┌──────────────────┐      ┌──────────────────┐
│ 1. RECONNAISSANCE│ ───► │  2. VERIFY DOM   │ ───► │   3. EXECUTE     │
└──────────────────┘      └──────────────────┘      └──────────────────┘
Navigate to route         Capture rendered DOM      Target resilient
Wait for networkidle      or test snapshot          user-facing locator
```

### 1.1 The Inspection Protocol
1. **Navigate and Settle:** Navigate to the target URL and wait for asynchronous network activity to stabilize (`networkidle` or specific locator hydration).
2. **Inspect Rendered State:** Extract the accessibility tree or screenshot to inspect the actual DOM elements currently visible to users.
3. **Select Resilient Locators:** Use Playwright's user-facing locator hierarchy:
   - Priority 1: `page.getByRole('button', { name: 'Deploy' })`
   - Priority 2: `page.getByLabel('Work email')`
   - Priority 3: `page.getByPlaceholder('Search repositories...')`
   - Priority 4: `page.getByTestId('billing-summary-table')`
   - **Banned:** Brittle internal CSS class selectors: `page.locator('.sc-bdVaJa > div:nth-child(2)')` or compiled Tailwind classes `page.locator('.p-4.border.rounded-xl')`.

---

## 2. The Ban on Arbitrary Sleep Delays

Hardcoded time delays are the primary cause of flaky CI builds and slow test runs.

- **Strictly Banned:**
  ```typescript
  // BANNED: Flaky, slow, and non-deterministic
  await page.waitForTimeout(5000);
  await new Promise(r => setTimeout(r, 3000));
  ```

- **Enforced: Auto-waiting and State Assertions:**
  Playwright automatically waits for elements to be actionable (visible, stable, enabled) before clicking or filling.
  ```typescript
  // ENFORCED: Waits dynamically up to timeout, proceeds immediately upon readiness
  await expect(page.getByRole('dialog')).toBeVisible();
  await page.getByRole('button', { name: 'Confirm deletion' }).click();
  await expect(page.getByText('Repository deleted')).toBeVisible();
  ```

---

## 3. Web Server Lifecycle Management

E2E tests require a running backend or frontend server.

### 3.1 Playwright `webServer` Configuration
Configure the web server within `playwright.config.ts` so Playwright manages process startup and teardown automatically:

```typescript
import { defineConfig } from '@playwright/test';

export default defineConfig({
  webServer: {
    command: 'npm run start',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
    timeout: 120 * 1000,
  },
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
  },
});
```

### 3.2 Ephemeral Test Ports
When running tests in parallel or in multi-branch environments, avoid hardcoded port conflicts:
- Bind dev/test servers to port `0` or assign dynamic test ports via environment variables (`PORT=3100`).

---

## 4. Test State Setup: API Seeding Over UI Form Clicking

Do not use browser UI steps to set up prerequisite data for every test.

- **Slow & Brittle:** Logging in via UI form $\to$ clicking through 5 wizards $\to$ creating a project $\to$ finally testing the billing page.
- **Fast & Resilient:** Seed prerequisite users, workspaces, or API keys directly via database fixtures or HTTP API calls (`request.post('/api/test/seed')`), then navigate straight to the billing page.

