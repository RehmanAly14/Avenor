// src/routes/index.js
// ============================================================
// Central route registry.
//
// All module routers are mounted here under the API version
// prefix. Adding a new module only requires two lines in this
// file — the import and the mount.
//
// The health endpoint lives here directly since it is not
// a module — it is an infrastructure concern.
// ============================================================

import { Router } from "express";
import { sendSuccess } from "../utils/response.js";
import { HTTP_STATUS } from "../constants/http.js";
import { MESSAGES } from "../constants/messages.js";
import { env } from "../config/env.js";
import prisma from "../config/prisma.js";

import authRoutes from "../modules/auth/auth.routes.js";
import userRoutes from "../modules/users/user.routes.js";
import projectRoutes from "../modules/projects/project.routes.js";
import workspaceRoutes from "../modules/workspaces/workspace.routes.js";
import dataSourceRoutes from "../modules/datasources/datasource.routes.js";
import metadataRoutes from "../modules/metadata/metadata.routes.js";
import metadataIntelligenceRoutes from "../modules/metadata-intelligence/metadata-intelligence.routes.js";
import catalogRoutes from "../modules/catalog/catalog.routes.js";
import documentRoutes from "../modules/documents/document.routes.js";
import investigationRoutes from "../modules/investigation/investigation.routes.js";
import githubRoutes from "../integrations/github/github.routes.js";
import githubConnectionRoutes from "../integrations/github/github-connection.routes.js";

const router = Router();

// ── Health Check ───────────────────────────────────────────
/**
 * @route   GET /api/v1/health
 * @desc    Service health check (uptime, DB connectivity)
 * @access  Public
 */
router.get("/health", async (_req, res) => {
  let dbStatus = "ok";
  try {
    await prisma.$queryRaw`SELECT 1`;
  } catch {
    dbStatus = "error";
  }

  sendSuccess(res, {
    statusCode: HTTP_STATUS.OK,
    message: MESSAGES.GENERAL.HEALTH_OK,
    data: {
      service: env.APP_NAME,
      version: env.API_VERSION,
      environment: env.NODE_ENV,
      uptime: Math.floor(process.uptime()),
      database: dbStatus,
      timestamp: new Date().toISOString(),
    },
  });
});

// ── Module Routes ──────────────────────────────────────────
router.use("/auth", authRoutes);
router.use("/users", userRoutes);
router.use("/projects", projectRoutes);
router.use("/workspaces", workspaceRoutes);
router.use("/datasources", dataSourceRoutes);
router.use("/metadata", metadataRoutes);
router.use("/metadata", metadataIntelligenceRoutes);
router.use("/catalog", catalogRoutes);
router.use("/documents", documentRoutes);
router.use("/investigations", investigationRoutes);
router.use("/investigations", githubRoutes);
router.use("/github", githubConnectionRoutes);

// Future modules:
// router.use("/agents", agentRoutes);

export default router;
