// src/modules/auth/auth.service.js
// ============================================================
// Auth business logic.
//
// Services own all business logic. Controllers call services;
// services call the database (via Prisma).
// This separation means:
//  - Business logic is testable without HTTP
//  - Controllers stay thin and readable
//  - Logic can be reused across multiple transports (REST, WS, etc.)
// ============================================================

import prisma from "../../config/prisma.js";
import { hashPassword, comparePassword } from "../../utils/hash.js";
import { signToken } from "../../utils/jwt.js";
import { AppError } from "../../utils/AppError.js";
import { HTTP_STATUS } from "../../constants/http.js";
import { MESSAGES } from "../../constants/messages.js";

/**
 * Sanitise a user object for API responses.
 * NEVER include the password hash in any response.
 */
function sanitiseUser(user) {
  const { password: _password, ...safe } = user;
  return safe;
}

/**
 * Register a new user.
 * @param {import('./auth.validation.js').RegisterInput} input
 * @returns {{ user: object, token: string }}
 */
export async function registerUser(input) {
  const { name, email, password } = input;

  // Check for duplicate email
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    throw new AppError(MESSAGES.USER.EMAIL_EXISTS, HTTP_STATUS.CONFLICT);
  }

  const hashedPassword = await hashPassword(password);

  const user = await prisma.user.create({
    data: {
      name,
      email,
      password: hashedPassword,
    },
  });

  const token = signToken({ userId: user.id, email: user.email });

  return { user: sanitiseUser(user), token };
}

/**
 * Authenticate an existing user.
 * Returns a generic error for both "user not found" and "wrong password"
 * to prevent user enumeration attacks.
 * @param {import('./auth.validation.js').LoginInput} input
 * @returns {{ user: object, token: string }}
 */
export async function loginUser(input) {
  const { email, password } = input;

  const user = await prisma.user.findUnique({ where: { email } });

  // Deliberately use the same error for "not found" and "wrong password"
  if (!user) {
    throw new AppError(MESSAGES.AUTH.INVALID_CREDENTIALS, HTTP_STATUS.UNAUTHORIZED);
  }

  const isPasswordValid = await comparePassword(password, user.password);
  if (!isPasswordValid) {
    throw new AppError(MESSAGES.AUTH.INVALID_CREDENTIALS, HTTP_STATUS.UNAUTHORIZED);
  }

  const token = signToken({ userId: user.id, email: user.email });

  return { user: sanitiseUser(user), token };
}

/**
 * Get the currently authenticated user's profile.
 * @param {string} userId
 * @returns {object} - Sanitised user
 */
export async function getProfile(userId) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      name: true,
      email: true,
      avatar: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  if (!user) {
    throw new AppError(MESSAGES.USER.NOT_FOUND, HTTP_STATUS.NOT_FOUND);
  }

  return user;
}
