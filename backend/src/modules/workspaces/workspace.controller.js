// src/modules/workspaces/workspace.controller.js
// ============================================================
// Workspace controllers — HTTP layer only.
// ============================================================

import * as workspaceService from "./workspace.service.js";
import { sendSuccess, buildPaginationMeta } from "../../utils/response.js";
import { HTTP_STATUS } from "../../constants/http.js";
import { MESSAGES } from "../../constants/messages.js";
import { asyncHandler } from "../../utils/asyncHandler.js";

export const listWorkspaces = asyncHandler(async (req, res) => {
  const { page, limit } = req.query;
  const { workspaces, total } = await workspaceService.listWorkspaces(
    req.user.id,
    { page, limit }
  );

  sendSuccess(res, {
    statusCode: HTTP_STATUS.OK,
    message: MESSAGES.WORKSPACE.LIST_FETCHED,
    data: { workspaces },
    meta: buildPaginationMeta({ total, page, limit }),
  });
});

export const getWorkspace = asyncHandler(async (req, res) => {
  const workspace = await workspaceService.getWorkspaceBySlug(
    req.params.slug,
    req.user.id
  );

  sendSuccess(res, {
    statusCode: HTTP_STATUS.OK,
    message: MESSAGES.WORKSPACE.FETCHED,
    data: { workspace },
  });
});

export const createWorkspace = asyncHandler(async (req, res) => {
  const workspace = await workspaceService.createWorkspace(
    req.user.id,
    req.body
  );

  sendSuccess(res, {
    statusCode: HTTP_STATUS.CREATED,
    message: MESSAGES.WORKSPACE.CREATED,
    data: { workspace },
  });
});

export const updateWorkspace = asyncHandler(async (req, res) => {
  const workspace = await workspaceService.updateWorkspace(
    req.params.slug,
    req.user.id,
    req.body
  );

  sendSuccess(res, {
    statusCode: HTTP_STATUS.OK,
    message: MESSAGES.WORKSPACE.UPDATED,
    data: { workspace },
  });
});

export const deleteWorkspace = asyncHandler(async (req, res) => {
  await workspaceService.deleteWorkspace(req.params.slug, req.user.id);

  sendSuccess(res, {
    statusCode: HTTP_STATUS.OK,
    message: MESSAGES.WORKSPACE.DELETED,
    data: null,
  });
});
