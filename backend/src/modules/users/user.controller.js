// src/modules/users/user.controller.js
// ============================================================
// User controllers — HTTP layer only.
// ============================================================

import * as userService from "./user.service.js";
import { sendSuccess } from "../../utils/response.js";
import { HTTP_STATUS } from "../../constants/http.js";
import { MESSAGES } from "../../constants/messages.js";
import { asyncHandler } from "../../utils/asyncHandler.js";

/**
 * GET /api/v1/users/me
 * Returns the authenticated user's profile.
 */
export const getMyProfile = asyncHandler(async (req, res) => {
  const user = await userService.getUserById(req.user.id);
  sendSuccess(res, {
    statusCode: HTTP_STATUS.OK,
    message: MESSAGES.USER.FETCHED,
    data: { user },
  });
});

/**
 * PATCH /api/v1/users/me
 * Update the authenticated user's own profile.
 */
export const updateMyProfile = asyncHandler(async (req, res) => {
  const user = await userService.updateUser(req.user.id, req.body);
  sendSuccess(res, {
    statusCode: HTTP_STATUS.OK,
    message: MESSAGES.USER.UPDATED,
    data: { user },
  });
});

/**
 * DELETE /api/v1/users/me
 * Delete the authenticated user's account.
 */
export const deleteMyAccount = asyncHandler(async (req, res) => {
  await userService.deleteUser(req.user.id);
  sendSuccess(res, {
    statusCode: HTTP_STATUS.OK,
    message: MESSAGES.USER.DELETED,
    data: null,
  });
});
