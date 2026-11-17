import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

describe('baseline', () => {
  it('runs test runner', () => {
    assert.equal(1 + 1, 2);
  });
});
