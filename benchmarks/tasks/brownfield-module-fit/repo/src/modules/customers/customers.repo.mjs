export function createCustomerRepo() {
  const store = new Map([
    ['cust-1', { id: 'cust-1', email: 'a@example.com', tier: 'standard', passwordHash: '$argon2id$secret', internalFlags: ['vip_override'] }],
  ]);
  return {
    findById: (id) => store.get(id) || null,
    save: (entity) => { store.set(entity.id, entity); return entity; },
  };
}
