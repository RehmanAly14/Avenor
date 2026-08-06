// src/modules/workspaces/workspace.validation.js
// ============================================================
// Zod schemas for workspace endpoints.
// ============================================================

import { z } from "zod";

export const createWorkspaceSchema = z.object({
  name: z
    .string({ required_error: "Workspace name is required." })
    .trim()
    .min(2, "Workspace name must be at least 2 characters.")
    .max(100, "Workspace name must not exceed 100 characters."),

  description: z
    .string()
    .trim()
    .max(1000, "Description must not exceed 1000 characters.")
    .optional()
    .nullable(),

  slug: z
    .string()
    .trim()
    .toLowerCase()
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Slug must be lowercase letters, numbers, and hyphens only.")
    .min(2)
    .max(100)
    .optional(),
});

export const updateWorkspaceSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Workspace name must be at least 2 characters.")
    .max(100, "Workspace name must not exceed 100 characters.")
    .optional(),

  description: z
    .string()
    .trim()
    .max(1000)
    .optional()
    .nullable(),
});

export const listWorkspacesQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

/** @typedef {import('zod').infer<typeof createWorkspaceSchema>} CreateWorkspaceInput */
/** @typedef {import('zod').infer<typeof updateWorkspaceSchema>} UpdateWorkspaceInput */
