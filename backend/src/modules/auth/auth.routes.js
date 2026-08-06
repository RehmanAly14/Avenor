// src/modules/auth/auth.routes.js
// ============================================================
// Auth route definitions.
//
// The structure is explicit:
//   Route → Validation Middleware → Auth Middleware → Controller
//
// Every route documents its access level in a comment.
// ============================================================

import { Router } from "express";
import { validate } from "../../middlewares/validate.middleware.js";
import { authenticate } from "../../middlewares/auth.middleware.js";
import { registerSchema, loginSchema } from "./auth.validation.js";
import * as authController from "./auth.controller.js";

const router = Router();

// ── Public routes ──────────────────────────────────────────

/**
 * @route   POST /api/v1/auth/register
 * @desc    Create a new user account
 * @access  Public
 */
router.post("/register", validate(registerSchema), authController.register);

/**
 * @route   POST /api/v1/auth/login
 * @desc    Authenticate user and return JWT
 * @access  Public
 */
router.post("/login", validate(loginSchema), authController.login);

// ── Protected routes ───────────────────────────────────────

/**
 * @route   GET /api/v1/auth/me
 * @desc    Get authenticated user's profile
 * @access  Private
 */
router.get("/me", authenticate, authController.getMe);

/**
 * @route   POST /api/v1/auth/logout
 * @desc    Stateless logout (client discards token)
 * @access  Private
 */
router.post("/logout", authenticate, authController.logout);

export default router;
