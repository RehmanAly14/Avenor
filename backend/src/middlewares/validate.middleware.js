// src/middlewares/validate.middleware.js
// ============================================================
// Zod request validation middleware factory.
//
// Usage:
//   router.post("/register", validate(registerSchema), controller);
//
// The schema should be a Zod object describing the shape of
// req.body (default), req.query, or req.params.
// ============================================================

import { ZodError } from "zod";
import { sendError } from "../utils/response.js";
import { HTTP_STATUS } from "../constants/http.js";
import { MESSAGES } from "../constants/messages.js";

/**
 * Creates a validation middleware for the given Zod schema.
 *
 * @param {import('zod').ZodSchema} schema   - Zod schema to validate against
 * @param {"body"|"query"|"params"} [source] - Which part of req to validate
 * @returns {import('express').RequestHandler}
 */
export function validate(schema, source = "body") {
  return (req, res, next) => {
    try {
      // parseStrict replaces req[source] with the parsed (stripped of unknown keys) result
      const parsed = schema.parse(req[source]);
      req[source] = parsed;
      next();
    } catch (err) {
      if (err instanceof ZodError) {
        const errors = err.errors.map((e) => ({
          field: e.path.join("."),
          message: e.message,
        }));

        return sendError(res, {
          statusCode: HTTP_STATUS.UNPROCESSABLE_ENTITY,
          message: MESSAGES.GENERAL.VALIDATION_ERROR,
          errors,
        });
      }
      next(err);
    }
  };
}
