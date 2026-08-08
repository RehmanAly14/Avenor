import { buildPaginationMeta } from "./response.js";

export function paginationParams({ page = 1, limit = 20 } = {}) {
  return { skip: (page - 1) * limit, take: limit, page, limit };
}

export function paginatedResult(items, total, pagination) {
  return { items, total, meta: buildPaginationMeta({ total, page: pagination.page, limit: pagination.limit }) };
}
