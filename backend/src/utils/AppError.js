// src/utils/AppError.js
// ============================================================
// Custom application error class.
//
// By throwing AppError instead of generic Error, the global
// error middleware can distinguish between operational errors
// (expected, safe to expose) and programmer errors (unexpected,
// should be masked in production).
//
// Usage:
//   throw new AppError("Project not found", 404);
// ============================================================

export class AppError extends Error {
  /**
   * @param {string} message     - Human-readable error message
   * @param {number} statusCode  - HTTP status code to respond with
   * @param {Array}  [errors]    - Optional array of field-level errors (Zod, etc.)
   */
  constructor(message, statusCode = 500, errors = undefined) {
    super(message);

    this.name = "AppError";
    this.statusCode = statusCode;
    this.errors = errors;

    // Marks this as an operational error — expected, safe to expose
    this.isOperational = true;

    // Capture a clean stack trace (V8 only)
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, AppError);
    }
  }
}
