// src/modules/users/user.service.js
// ============================================================
// User business logic.
// ============================================================

import prisma from "../../config/prisma.js";
import { AppError } from "../../utils/AppError.js";
import { HTTP_STATUS } from "../../constants/http.js";
import { MESSAGES } from "../../constants/messages.js";

/** Fields returned in public/profile responses — never the password. */
const USER_SELECT = {
  id: true,
  name: true,
  email: true,
  avatar: true,
  createdAt: true,
  updatedAt: true,
};

/**
 * Get a user by their ID.
 * @param {string} userId
 */
export async function getUserById(userId) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: USER_SELECT,
  });

  if (!user) {
    throw new AppError(MESSAGES.USER.NOT_FOUND, HTTP_STATUS.NOT_FOUND);
  }

  return user;
}

/**
 * Update the authenticated user's profile.
 * Users may only update their own profile — enforced by the controller
 * which passes req.user.id as userId.
 * @param {string} userId
 * @param {import('./user.validation.js').UpdateUserInput} data
 */
export async function updateUser(userId, data) {
  // Ensure user exists before attempting update
  const exists = await prisma.user.findUnique({ where: { id: userId } });
  if (!exists) {
    throw new AppError(MESSAGES.USER.NOT_FOUND, HTTP_STATUS.NOT_FOUND);
  }

  const user = await prisma.user.update({
    where: { id: userId },
    data,
    select: USER_SELECT,
  });

  return user;
}

/**
 * Delete the authenticated user's account.
 * Cascades are handled by Prisma schema relations.
 * @param {string} userId
 */
export async function deleteUser(userId) {
  const exists = await prisma.user.findUnique({ where: { id: userId } });
  if (!exists) {
    throw new AppError(MESSAGES.USER.NOT_FOUND, HTTP_STATUS.NOT_FOUND);
  }

  await prisma.user.delete({ where: { id: userId } });
}
