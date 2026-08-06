// src/modules/workspaces/workspace.routes.js
// ============================================================
// Workspace route definitions.
// ============================================================

import { Router } from "express";
import { validate } from "../../middlewares/validate.middleware.js";
import { authenticate } from "../../middlewares/auth.middleware.js";
import {
  createWorkspaceSchema,
  updateWorkspaceSchema,
  listWorkspacesQuerySchema,
} from "./workspace.validation.js";
import * as workspaceController from "./workspace.controller.js";

const router = Router();

router.use(authenticate);

/**
 * @route   GET /api/v1/workspaces
 * @desc    List authenticated user's workspaces (paginated)
 * @access  Private
 */
router.get(
  "/",
  validate(listWorkspacesQuerySchema, "query"),
  workspaceController.listWorkspaces
);

/**
 * @route   POST /api/v1/workspaces
 * @desc    Create a new workspace
 * @access  Private
 */
router.post(
  "/",
  validate(createWorkspaceSchema),
  workspaceController.createWorkspace
);

/**
 * @route   GET /api/v1/workspaces/:slug
 * @desc    Get a workspace by slug
 * @access  Private (owner only)
 */
router.get("/:slug", workspaceController.getWorkspace);

/**
 * @route   PATCH /api/v1/workspaces/:slug
 * @desc    Update a workspace
 * @access  Private (owner only)
 */
router.patch(
  "/:slug",
  validate(updateWorkspaceSchema),
  workspaceController.updateWorkspace
);

/**
 * @route   DELETE /api/v1/workspaces/:slug
 * @desc    Delete a workspace
 * @access  Private (owner only)
 */
router.delete("/:slug", workspaceController.deleteWorkspace);

export default router;
