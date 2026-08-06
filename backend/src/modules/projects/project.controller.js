// src/modules/projects/project.controller.js
// ============================================================
// Project controllers — HTTP layer only.
// ============================================================

import * as projectService from "./project.service.js";
import { sendSuccess } from "../../utils/response.js";
import { buildPaginationMeta } from "../../utils/response.js";
import { HTTP_STATUS } from "../../constants/http.js";
import { MESSAGES } from "../../constants/messages.js";
import { asyncHandler } from "../../utils/asyncHandler.js";

/**
 * GET /api/v1/projects
 */
export const listProjects = asyncHandler(async (req, res) => {
  const { page, limit } = req.query;
  const { projects, total } = await projectService.listProjects(req.user.id, {
    page,
    limit,
  });

  sendSuccess(res, {
    statusCode: HTTP_STATUS.OK,
    message: MESSAGES.PROJECT.LIST_FETCHED,
    data: { projects },
    meta: buildPaginationMeta({ total, page, limit }),
  });
});

/**
 * GET /api/v1/projects/:slug
 */
export const getProject = asyncHandler(async (req, res) => {
  const project = await projectService.getProjectBySlug(
    req.params.slug,
    req.user.id
  );

  sendSuccess(res, {
    statusCode: HTTP_STATUS.OK,
    message: MESSAGES.PROJECT.FETCHED,
    data: { project },
  });
});

/**
 * POST /api/v1/projects
 */
export const createProject = asyncHandler(async (req, res) => {
  const project = await projectService.createProject(req.user.id, req.body);

  sendSuccess(res, {
    statusCode: HTTP_STATUS.CREATED,
    message: MESSAGES.PROJECT.CREATED,
    data: { project },
  });
});

/**
 * PATCH /api/v1/projects/:slug
 */
export const updateProject = asyncHandler(async (req, res) => {
  const project = await projectService.updateProject(
    req.params.slug,
    req.user.id,
    req.body
  );

  sendSuccess(res, {
    statusCode: HTTP_STATUS.OK,
    message: MESSAGES.PROJECT.UPDATED,
    data: { project },
  });
});

/**
 * DELETE /api/v1/projects/:slug
 */
export const deleteProject = asyncHandler(async (req, res) => {
  await projectService.deleteProject(req.params.slug, req.user.id);

  sendSuccess(res, {
    statusCode: HTTP_STATUS.OK,
    message: MESSAGES.PROJECT.DELETED,
    data: null,
  });
});
