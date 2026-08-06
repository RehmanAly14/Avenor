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

// Future modules are added here:
// router.use("/agents", agentRoutes);
// router.use("/datahub", datahubRoutes);

export default router;
