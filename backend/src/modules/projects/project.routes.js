// src/modules/projects/project.routes.js
// ============================================================
// Project route definitions.
// All project routes require authentication.
// ============================================================

import { Router } from "express";
import { validate } from "../../middlewares/validate.middleware.js";
import { authenticate } from "../../middlewares/auth.middleware.js";
import {
  createProjectSchema,
  updateProjectSchema,
  listProjectsQuerySchema,
} from "./project.validation.js";
import * as projectController from "./project.controller.js";

const router = Router();

// All project routes require authentication
router.use(authenticate);

/**
 * @route   GET /api/v1/projects
 * @desc    List authenticated user's projects (paginated)
 * @access  Private
 */
router.get(
  "/",
  validate(listProjectsQuerySchema, "query"),
  projectController.listProjects
);

/**
 * @route   POST /api/v1/projects
 * @desc    Create a new project
 * @access  Private
 */
router.post("/", validate(createProjectSchema), projectController.createProject);

/**
 * @route   GET /api/v1/projects/:slug
 * @desc    Get a project by slug
 * @access  Private (owner only)
 */
router.get("/:slug", projectController.getProject);

/**
 * @route   PATCH /api/v1/projects/:slug
 * @desc    Update a project
 * @access  Private (owner only)
 */
router.patch(
  "/:slug",
  validate(updateProjectSchema),
  projectController.updateProject
);

/**
 * @route   DELETE /api/v1/projects/:slug
 * @desc    Delete a project
 * @access  Private (owner only)
 */
router.delete("/:slug", projectController.deleteProject);

export default router;
