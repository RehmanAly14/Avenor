// src/utils/asyncHandler.js
// ============================================================
// Express async route wrapper.
//
// Eliminates the need for try/catch blocks inside every
// controller. Any thrown error (AppError or otherwise) is
// automatically passed to next(), reaching the global handler.
//
// Usage:
//   router.get("/path", asyncHandler(myController));
// ============================================================

/**
 * @param {Function} fn - Async route handler / controller function
 * @returns {Function}  - Express-compatible middleware
 */
export const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};
