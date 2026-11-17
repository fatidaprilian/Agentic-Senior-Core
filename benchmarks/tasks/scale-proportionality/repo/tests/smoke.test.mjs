import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

describe('smoke', () => {
  it('loads routes', async () => {
    const notes = await import('../src/notes-route.mjs');
    const pay = await import('../src/payment-route.mjs');
    assert.equal(typeof notes.createNote, 'function');
    assert.equal(typeof pay.chargePayment, 'function');
  });
});
