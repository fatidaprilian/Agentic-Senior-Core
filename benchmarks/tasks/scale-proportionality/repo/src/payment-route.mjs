export async function chargePayment(db, gateway, req) {
  const { amount, orderId } = req.body || {};
  const result = await gateway.charge({ orderId, amount });
  await db.query('INSERT INTO payments (order_id, amount) VALUES ($1, $2)', [orderId, amount]);
  return { status: 200, body: result };
}
