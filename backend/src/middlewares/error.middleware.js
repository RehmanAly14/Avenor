// src/middlewares/error.middleware.js
// ============================================================
// Global error handling middleware.
//
// This is the LAST middleware registered in app.js.
// All errors — thrown via next(err), or caught by asyncHandler
// — flow here for a consistent JSON response.
//
// Behaviour:
//   - AppError (operational): expose message & status to client
//   - Prisma errors: map known codes to friendly messages
//   - Zod validation: format field-level errors
//   - Unknown errors: log internally, return 500 to client
//
// In production we NEVER send stack traces or raw DB errors
// to the client.
// ============================================================

import { ZodError } from "zod";
import { Prisma } from "@prisma/client";
import { AppError } from "../utils/AppError.js";
import { sendError } from "../utils/response.js";
import { HTTP_STATUS } from "../constants/http.js";
import { MESSAGES } from "../constants/messages.js";
import { env } from "../config/env.js";

/**
 * Format Zod validation errors into a simple array.
 * [{ field: "email", message: "Invalid email address" }, ...]
 */
function formatZodErrors(error) {
  return error.errors.map((e) => ({
    field: e.path.join("."),
    message: e.message,
  }));
}

/**
 * Map Prisma error codes to user-friendly AppErrors.
 */
function handlePrismaError(err) {
  switch (err.code) {
    case "P2002": {
      // Unique constraint violation
      const fields = err.meta?.target?.join(", ") ?? "field";
      return new AppError(`A record with this ${fields} already exists.`, HTTP_STATUS.CONFLICT);
    }
    case "P2025":
      // Record not found (e.g. delete/update non-existent record)
      return new AppError(MESSAGES.GENERAL.NOT_FOUND, HTTP_STATUS.NOT_FOUND);

    case "P2003":
      // Foreign key constraint failed
      return new AppError("Related record not found.", HTTP_STATUS.BAD_REQUEST);

    case "P2014":
      return new AppError("The operation violates a relational constraint.", HTTP_STATUS.BAD_REQUEST);

    default:
      // Unknown Prisma error — do not expose to client
      return new AppError(MESSAGES.GENERAL.INTERNAL_ERROR, HTTP_STATUS.INTERNAL_SERVER_ERROR);
  }
}

// eslint-disable-next-line no-unused-vars
export function errorMiddleware(err, req, res, _next) {
  // ── Zod validation errors ──────────────────────────────────
  if (err instanceof ZodError) {
    return sendError(res, {
      statusCode: HTTP_STATUS.UNPROCESSABLE_ENTITY,
      message: MESSAGES.GENERAL.VALIDATION_ERROR,
      errors: formatZodErrors(err),
    });
  }

  // ── Prisma errors ─────────────────────────────────────────
  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    const appError = handlePrismaError(err);
    return sendError(res, {
      statusCode: appError.statusCode,
      message: appError.message,
    });
  }

  if (err instanceof Prisma.PrismaClientValidationError) {
    return sendError(res, {
      statusCode: HTTP_STATUS.BAD_REQUEST,
      message: "Invalid data provided.",
    });
  }

  // ── Operational errors (AppError) ─────────────────────────
  if (err instanceof AppError && err.isOperational) {
    return sendError(res, {
      statusCode: err.statusCode,
      message: err.message,
      errors: err.errors,
    });
  }

  // ── Unknown / programmer errors ───────────────────────────
  // Always log unexpected errors for debugging
  console.error("[Unhandled Error]", {
    message: err.message,
    stack: err.stack,
    url: req.originalUrl,
    method: req.method,
    timestamp: new Date().toISOString(),
  });

  return sendError(res, {
    statusCode: HTTP_STATUS.INTERNAL_SERVER_ERROR,
    message: MESSAGES.GENERAL.INTERNAL_ERROR,
    // In development, include the stack trace for debugging
    ...(env.IS_DEVELOPMENT && { stack: err.stack }),
  });
}

/**
 * 404 handler — catches requests to unregistered routes.
 * Must be registered BEFORE errorMiddleware in app.js.
 */
export function notFoundMiddleware(req, res, next) {
  next(new AppError(`Route not found: ${req.method} ${req.originalUrl}`, HTTP_STATUS.NOT_FOUND));
}
