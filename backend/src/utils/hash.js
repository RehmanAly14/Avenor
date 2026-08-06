// src/utils/hash.js
// ============================================================
// Password hashing utilities using bcryptjs.
// We use bcryptjs (pure JS) over bcrypt (native) for:
//   - Zero native dependencies → simpler Docker builds
//   - Works without node-gyp / Python / build tools
// ============================================================

import bcrypt from "bcryptjs";
import { env } from "../config/env.js";

/**
 * Hash a plain-text password.
 * @param {string} password
 * @returns {Promise<string>} - bcrypt hash
 */
export async function hashPassword(password) {
  return bcrypt.hash(password, env.BCRYPT_ROUNDS);
}

/**
 * Compare a plain-text password against a stored hash.
 * @param {string} password
 * @param {string} hash
 * @returns {Promise<boolean>}
 */
export async function comparePassword(password, hash) {
  return bcrypt.compare(password, hash);
}
