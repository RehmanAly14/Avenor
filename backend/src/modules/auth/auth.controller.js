// src/modules/auth/auth.controller.js
// ============================================================
// Auth controllers — HTTP layer only.
//
// Controllers must ONLY:
//   1. Call the appropriate service function
//   2. Send the response using sendSuccess / sendError
//
// Zero business logic lives here. This makes controllers
// trivially readable and ensures logic is testable separately.
// ============================================================

import * as authService from "./auth.service.js";
import { sendSuccess } from "../../utils/response.js";
import { HTTP_STATUS } from "../../constants/http.js";
import { MESSAGES } from "../../constants/messages.js";
import { asyncHandler } from "../../utils/asyncHandler.js";

/**
 * POST /api/v1/auth/register
 */
export const register = asyncHandler(async (req, res) => {
  const result = await authService.registerUser(req.body);

  sendSuccess(res, {
    statusCode: HTTP_STATUS.CREATED,
    message: MESSAGES.AUTH.REGISTERED,
    data: {
      user: result.user,
      token: result.token,
    },
  });
});

/**
 * POST /api/v1/auth/login
 */
export const login = asyncHandler(async (req, res) => {
  const result = await authService.loginUser(req.body);

  sendSuccess(res, {
    statusCode: HTTP_STATUS.OK,
    message: MESSAGES.AUTH.LOGGED_IN,
    data: {
      user: result.user,
      token: result.token,
    },
  });
});

/**
 * POST /api/v1/auth/logout
 * Stateless logout — instructs the client to discard the token.
 * For token blacklisting, use Redis in a future iteration.
 */
export const logout = asyncHandler(async (_req, res) => {
  sendSuccess(res, {
    statusCode: HTTP_STATUS.OK,
    message: MESSAGES.AUTH.LOGGED_OUT,
    data: null,
  });
});

/**
 * GET /api/v1/auth/me
 * Returns the authenticated user's profile.
 * req.user is populated by the authenticate middleware.
 */
export const getMe = asyncHandler(async (req, res) => {
  const user = await authService.getProfile(req.user.id);

  sendSuccess(res, {
    statusCode: HTTP_STATUS.OK,
    message: MESSAGES.USER.FETCHED,
    data: { user },
  });
});
