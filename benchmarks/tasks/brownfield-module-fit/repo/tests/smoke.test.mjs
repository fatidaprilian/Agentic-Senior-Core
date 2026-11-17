import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { createCustomerRepo } from '../src/modules/customers/customers.repo.mjs';

describe('brownfield module smoke', () => {
  it('loads customer repository', () => {
    const repo = createCustomerRepo();
    assert.equal(repo.findById('cust-1').tier, 'standard');
  });
});
