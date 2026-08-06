// src/utils/jwt.js
// ============================================================
// JWT token utilities — sign and verify.
// Isolated here so the algorithm, secret, and expiry are
// defined once. If we swap libraries or add refresh tokens,
// only this file changes.
// ============================================================

import jwt from "jsonwebtoken";
import { env } from "../config/env.js";
import { AppError } from "./AppError.js";
import { HTTP_STATUS } from "../constants/http.js";
import { MESSAGES } from "../constants/messages.js";

/**
 * Sign a new access token.
 * @param {object} payload  - Data to embed (userId, email, role)
 * @returns {string}        - Signed JWT string
 */
export function signToken(payload) {
  return jwt.sign(payload, env.JWT_SECRET, {
    expiresIn: env.JWT_EXPIRES_IN,
    issuer: env.APP_NAME,
  });
}

/**
 * Verify and decode an access token.
 * Throws AppError for expired or invalid tokens.
 * @param {string} token
 * @returns {object} - Decoded payload
 */
export function verifyToken(token) {
  try {
    return jwt.verify(token, env.JWT_SECRET, { issuer: env.APP_NAME });
  } catch (err) {
    if (err.name === "TokenExpiredError") {
      throw new AppError(MESSAGES.AUTH.TOKEN_EXPIRED, HTTP_STATUS.UNAUTHORIZED);
    }
    throw new AppError(MESSAGES.AUTH.TOKEN_INVALID, HTTP_STATUS.UNAUTHORIZED);
  }
}

/**
 * Extract a Bearer token from the Authorization header.
 * Returns null if the header is missing or malformed.
 * @param {import('express').Request} req
 * @returns {string|null}
 */
export function extractBearerToken(req) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith("Bearer ")) {
    return null;
  }
  return header.slice(7);
}
