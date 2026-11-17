import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { slugify } from '../src/slug.mjs';

describe('slug', () => {
  it('slugifies plain text', () => {
    assert.equal(slugify('Hello World!'), 'hello-world');
  });
});
