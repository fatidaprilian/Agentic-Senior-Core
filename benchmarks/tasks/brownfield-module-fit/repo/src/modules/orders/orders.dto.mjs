export function toOrderResponseDto(entity) {
  return { id: entity.id, total: entity.total, status: entity.status };
}
