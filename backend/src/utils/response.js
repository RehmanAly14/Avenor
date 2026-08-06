// src/utils/response.js
// ============================================================
// Standardised API response helpers.
// Every endpoint uses these — guarantees a uniform JSON shape
// across all modules regardless of which developer wrote them.
//
// Success: { success: true,  message, data, meta? }
// Error:   { success: false, message, errors? }
// ============================================================

import { HTTP_STATUS } from "../constants/http.js";

/**
 * Send a successful JSON response.
 *
 * @param {import('express').Response} res
 * @param {object} options
 * @param {number}  [options.statusCode=200]
 * @param {string}  [options.message='']
 * @param {*}       [options.data=null]
 * @param {object}  [options.meta]           - pagination, counts, etc.
 */
export function sendSuccess(res, { statusCode = HTTP_STATUS.OK, message = "", data = null, meta } = {}) {
  const payload = {
    success: true,
    message,
    data,
  };

  if (meta !== undefined) {
    payload.meta = meta;
  }

  return res.status(statusCode).json(payload);
}

/**
 * Send an error JSON response.
 *
 * @param {import('express').Response} res
 * @param {object} options
 * @param {number}   [options.statusCode=500]
 * @param {string}   [options.message='']
 * @param {Array}    [options.errors]         - field-level validation errors
 */
export function sendError(res, { statusCode = HTTP_STATUS.INTERNAL_SERVER_ERROR, message = "", errors } = {}) {
  const payload = {
    success: false,
    message,
  };

  if (errors !== undefined) {
    payload.errors = errors;
  }

  return res.status(statusCode).json(payload);
}

/**
 * Build a pagination meta object for list responses.
 *
 * @param {object} options
 * @param {number} options.total   - total number of records
 * @param {number} options.page    - current page (1-based)
 * @param {number} options.limit   - items per page
 */
export function buildPaginationMeta({ total, page, limit }) {
  return {
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
    hasNextPage: page * limit < total,
    hasPrevPage: page > 1,
  };
}
