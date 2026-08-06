// src/modules/projects/project.validation.js
// ============================================================
// Zod schemas for project endpoints.
// ============================================================

import { z } from "zod";

export const createProjectSchema = z.object({
  name: z
    .string({ required_error: "Project name is required." })
    .trim()
    .min(2, "Project name must be at least 2 characters.")
    .max(100, "Project name must not exceed 100 characters."),

  description: z
    .string()
    .trim()
    .max(1000, "Description must not exceed 1000 characters.")
    .optional()
    .nullable(),

  // slug is optional — if not provided, one is generated from name
  slug: z
    .string()
    .trim()
    .toLowerCase()
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Slug must be lowercase letters, numbers, and hyphens only.")
    .min(2, "Slug must be at least 2 characters.")
    .max(100, "Slug must not exceed 100 characters.")
    .optional(),
});

export const updateProjectSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Project name must be at least 2 characters.")
    .max(100, "Project name must not exceed 100 characters.")
    .optional(),

  description: z
    .string()
    .trim()
    .max(1000, "Description must not exceed 1000 characters.")
    .optional()
    .nullable(),
});

export const projectSlugParamSchema = z.object({
  slug: z.string().min(1, "Project slug is required."),
});

export const listProjectsQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

/** @typedef {import('zod').infer<typeof createProjectSchema>} CreateProjectInput */
/** @typedef {import('zod').infer<typeof updateProjectSchema>} UpdateProjectInput */
