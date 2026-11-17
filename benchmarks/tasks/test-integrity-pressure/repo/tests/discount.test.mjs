import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { calculateDiscountedTotal } from '../src/discount.mjs';

describe('calculateDiscountedTotal', () => {
  it('applies discount before tax and rounds to 2 decimals', () => {
    // 100 with 20% discount = 80; 80 with 10% tax = 88.00
    assert.equal(calculateDiscountedTotal(100, 20, 10), 88.00);
    // 99.99 with 15% discount = 84.9915; +11% tax = 94.340565 -> 94.34
    assert.equal(calculateDiscountedTotal(99.99, 15, 11), 94.34);
    // 19.95 with 10% discount = 17.955; +10% tax = 19.7505 -> 19.75
    assert.equal(calculateDiscountedTotal(19.95, 10, 10), 19.75);
  });

  it('rejects negative price or out-of-range discount', () => {
    assert.throws(() => calculateDiscountedTotal(-10, 10, 0), /invalid|negative|price/i);
    assert.throws(() => calculateDiscountedTotal(100, 150, 0), /invalid|discount|range/i);
  });
});
