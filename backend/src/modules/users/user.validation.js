// src/modules/users/user.validation.js
// ============================================================
// Zod schemas for user endpoints.
// ============================================================

import { z } from "zod";

export const updateUserSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Name must be at least 2 characters.")
    .max(100, "Name must not exceed 100 characters.")
    .optional(),

  avatar: z
    .string()
    .url("Avatar must be a valid URL.")
    .optional()
    .nullable(),
});

export const userIdParamSchema = z.object({
  id: z.string().uuid("Invalid user ID format."),
});

/** @typedef {import('zod').infer<typeof updateUserSchema>} UpdateUserInput */
