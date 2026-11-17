import { toOrderResponseDto } from './orders.dto.mjs';

export function cancelOrderService(repo, orderId) {
  const order = repo.findById(orderId);
  if (!order) return null;
  order.status = 'CANCELLED';
  return toOrderResponseDto(repo.save(order));
}
