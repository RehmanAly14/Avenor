// src/modules/users/user.routes.js
// ============================================================
// User route definitions.
// All user routes are private — require JWT authentication.
// ============================================================

import { Router } from "express";
import { validate } from "../../middlewares/validate.middleware.js";
import { authenticate } from "../../middlewares/auth.middleware.js";
import { updateUserSchema } from "./user.validation.js";
import * as userController from "./user.controller.js";

const router = Router();

// All user routes require authentication
router.use(authenticate);

/**
 * @route   GET /api/v1/users/me
 * @desc    Get authenticated user's profile
 * @access  Private
 */
router.get("/me", userController.getMyProfile);

/**
 * @route   PATCH /api/v1/users/me
 * @desc    Update authenticated user's profile (name, avatar)
 * @access  Private
 */
router.patch("/me", validate(updateUserSchema), userController.updateMyProfile);

/**
 * @route   DELETE /api/v1/users/me
 * @desc    Delete authenticated user's account
 * @access  Private
 */
router.delete("/me", userController.deleteMyAccount);

export default router;
