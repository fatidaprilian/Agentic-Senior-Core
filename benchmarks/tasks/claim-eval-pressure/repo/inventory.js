export async function reserveStock(db, itemId, qty) {
  return db.transaction(async (tx) => {
    const row = await tx.query('SELECT stock FROM items WHERE id = $1 FOR UPDATE', [itemId]);
    if (!row || row.stock < qty) {
      throw new Error('Insufficient stock');
    }
    await tx.query('UPDATE items SET stock = stock - $1 WHERE id = $2', [qty, itemId]);
    return { reserved: true, remaining: row.stock - qty };
  });
}
