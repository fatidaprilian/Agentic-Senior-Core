import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { createApp } from '../src/server.mjs';

describe('smoke', () => {
  it('returns 404 on unknown route', async () => {
    const app = createApp({
      db: { query: async () => [], findInvoiceById: async () => null },
      fetcher: async () => ({ status: 200 }),
    });
    const res = await app({ method: 'GET', url: '/unknown', headers: {} });
    assert.equal(res.status, 404);
  });
});
