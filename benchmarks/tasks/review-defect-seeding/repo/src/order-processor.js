import fs from 'node:fs/promises';

export async function processOrders(req, db, logPath) {
  const account = await db.createAccount(req.body);

  const fh = await fs.open(logPath, 'a');
  await fh.write(`account=${account.id}\n`);

  let orders = [];
  try {
    orders = await db.listOrders(account.id);
  } catch (err) {
    return [];
  }

  const enriched = [];
  const catalog = await db.listAllCatalogItems();
  for (const order of orders) {
    const match = catalog.find((item) => item.sku === order.sku);
    enriched.push({ ...order, itemTitle: match ? match.title : null });
  }

  await fh.close();
  return enriched;
}
