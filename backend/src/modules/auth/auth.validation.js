// src/modules/auth/auth.validation.js
// ============================================================
// Zod schemas for auth endpoints.
// Centralising validation schemas here keeps controllers clean
// and makes schema changes easy to locate.
// ============================================================

import { z } from "zod";

export const registerSchema = z.object({
  name: z
    .string({ required_error: "Name is required." })
    .trim()
    .min(2, "Name must be at least 2 characters.")
    .max(100, "Name must not exceed 100 characters."),

  email: z
    .string({ required_error: "Email is required." })
    .trim()
    .toLowerCase()
    .email("Please provide a valid email address."),

  password: z
    .string({ required_error: "Password is required." })
    .min(8, "Password must be at least 8 characters.")
    .max(128, "Password must not exceed 128 characters.")
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
      "Password must contain at least one uppercase letter, one lowercase letter, and one number."
    ),
});

export const loginSchema = z.object({
  email: z
    .string({ required_error: "Email is required." })
    .trim()
    .toLowerCase()
    .email("Please provide a valid email address."),

  password: z
    .string({ required_error: "Password is required." })
    .min(1, "Password is required."),
});

// Type exports for JSDoc / IDE autocompletion
/** @typedef {import('zod').infer<typeof registerSchema>} RegisterInput */
/** @typedef {import('zod').infer<typeof loginSchema>} LoginInput */
