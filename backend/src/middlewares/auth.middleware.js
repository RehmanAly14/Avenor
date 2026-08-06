// src/middlewares/auth.middleware.js
// ============================================================
// JWT authentication middleware.
//
// Reads the Bearer token from the Authorization header,
// verifies it, and attaches the decoded user payload to
// req.user for downstream handlers.
//
// Protected routes simply add this middleware:
//   router.get("/me", authenticate, userController.getProfile);
// ============================================================

import { extractBearerToken, verifyToken } from "../utils/jwt.js";
import { AppError } from "../utils/AppError.js";
import { HTTP_STATUS } from "../constants/http.js";
import { MESSAGES } from "../constants/messages.js";
import prisma from "../config/prisma.js";

/**
 * Middleware: Require a valid JWT to access the route.
 * Attaches req.user = { id, email, name } on success.
 */
export async function authenticate(req, _res, next) {
  try {
    const token = extractBearerToken(req);

    if (!token) {
      throw new AppError(MESSAGES.AUTH.TOKEN_MISSING, HTTP_STATUS.UNAUTHORIZED);
    }

    const payload = verifyToken(token);

    // Verify the user still exists in the database.
    // This catches the case where an account is deleted but an old
    // valid token is still in circulation.
    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      select: { id: true, name: true, email: true },
    });

    if (!user) {
      throw new AppError(MESSAGES.AUTH.TOKEN_INVALID, HTTP_STATUS.UNAUTHORIZED);
    }

    req.user = user;
    next();
  } catch (err) {
    next(err);
  }
}

/**
 * Middleware: Optionally authenticate.
 * If a valid token is present, populates req.user.
 * If no token (or invalid), continues without error.
 * Useful for routes that behave differently for authenticated users.
 */
export async function optionalAuthenticate(req, _res, next) {
  try {
    const token = extractBearerToken(req);
    if (!token) return next();

    const payload = verifyToken(token);
    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      select: { id: true, name: true, email: true },
    });

    if (user) req.user = user;
    next();
  } catch {
    // Silently ignore auth errors for optional routes
    next();
  }
}
