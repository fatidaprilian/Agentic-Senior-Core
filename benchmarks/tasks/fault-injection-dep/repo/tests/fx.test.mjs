import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { fetchExchangeRate } from '../src/fx-client.mjs';

describe('fx-client', () => {
  it('returns rate on 200 JSON payload', async () => {
    const rate = await fetchExchangeRate('https://fx.example/usd', {
      fetchImpl: async () => ({ ok: true, status: 200, json: async () => ({ rate: 15800 }) }),
    });
    assert.equal(rate, 15800);
  });
});
