import { cancelOrderService } from './orders.service.mjs';

export function postCancelOrder(repo, req) {
  const dto = cancelOrderService(repo, req.params?.id);
  if (!dto) return { status: 404, body: { error: 'Order not found' } };
  return { status: 200, body: dto };
}
