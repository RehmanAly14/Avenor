// src/modules/workspaces/workspace.service.js
// ============================================================
// Workspace business logic.
//
// Workspaces are the top-level organisational unit.
// In future iterations, workspaces will contain:
//   - Members with roles (admin, editor, viewer)
//   - Projects
//   - AI agent configurations
//   - Shared DataIncident connections (future)
//
// The service layer is designed to accommodate this growth
// without restructuring. Add new methods here.
// ============================================================

import prisma from "../../config/prisma.js";
import { AppError } from "../../utils/AppError.js";
import { HTTP_STATUS } from "../../constants/http.js";
import { MESSAGES } from "../../constants/messages.js";
import { toSlug, toUniqueSlug } from "../../utils/slug.js";

const WORKSPACE_SELECT = {
  id: true,
  name: true,
  slug: true,
  description: true,
  ownerId: true,
  createdAt: true,
  updatedAt: true,
  owner: {
    select: {
      id: true,
      name: true,
      email: true,
    },
  },
};

/**
 * List workspaces owned by the authenticated user.
 * @param {string} ownerId
 * @param {{ page: number, limit: number }} pagination
 */
export async function listWorkspaces(ownerId, { page = 1, limit = 20 } = {}) {
  const skip = (page - 1) * limit;

  const [workspaces, total] = await prisma.$transaction([
    prisma.workspace.findMany({
      where: { ownerId },
      select: WORKSPACE_SELECT,
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
    }),
    prisma.workspace.count({ where: { ownerId } }),
  ]);

  return { workspaces, total };
}

/**
 * Get a workspace by slug (owner only).
 * @param {string} slug
 * @param {string} requestingUserId
 */
export async function getWorkspaceBySlug(slug, requestingUserId) {
  const workspace = await prisma.workspace.findUnique({
    where: { slug },
    select: WORKSPACE_SELECT,
  });

  if (!workspace) {
    throw new AppError(MESSAGES.WORKSPACE.NOT_FOUND, HTTP_STATUS.NOT_FOUND);
  }

  if (workspace.ownerId !== requestingUserId) {
    throw new AppError(MESSAGES.AUTH.UNAUTHORIZED, HTTP_STATUS.FORBIDDEN);
  }

  return workspace;
}

/**
 * Create a new workspace.
 * @param {string} ownerId
 * @param {import('./workspace.validation.js').CreateWorkspaceInput} data
 */
export async function createWorkspace(ownerId, data) {
  const { name, description, slug: providedSlug } = data;

  let slug = providedSlug ?? toSlug(name);

  const slugExists = await prisma.workspace.findUnique({ where: { slug } });
  if (slugExists) {
    if (providedSlug) {
      throw new AppError(MESSAGES.WORKSPACE.SLUG_EXISTS, HTTP_STATUS.CONFLICT);
    }
    slug = toUniqueSlug(name);
  }

  const workspace = await prisma.workspace.create({
    data: { name, description, slug, ownerId },
    select: WORKSPACE_SELECT,
  });

  return workspace;
}

/**
 * Update a workspace (owner only).
 * @param {string} slug
 * @param {string} requestingUserId
 * @param {import('./workspace.validation.js').UpdateWorkspaceInput} data
 */
export async function updateWorkspace(slug, requestingUserId, data) {
  const workspace = await prisma.workspace.findUnique({ where: { slug } });

  if (!workspace) {
    throw new AppError(MESSAGES.WORKSPACE.NOT_FOUND, HTTP_STATUS.NOT_FOUND);
  }

  if (workspace.ownerId !== requestingUserId) {
    throw new AppError(MESSAGES.AUTH.UNAUTHORIZED, HTTP_STATUS.FORBIDDEN);
  }

  return prisma.workspace.update({
    where: { slug },
    data,
    select: WORKSPACE_SELECT,
  });
}

/**
 * Delete a workspace (owner only).
 * @param {string} slug
 * @param {string} requestingUserId
 */
export async function deleteWorkspace(slug, requestingUserId) {
  const workspace = await prisma.workspace.findUnique({ where: { slug } });

  if (!workspace) {
    throw new AppError(MESSAGES.WORKSPACE.NOT_FOUND, HTTP_STATUS.NOT_FOUND);
  }

  if (workspace.ownerId !== requestingUserId) {
    throw new AppError(MESSAGES.AUTH.UNAUTHORIZED, HTTP_STATUS.FORBIDDEN);
  }

  await prisma.workspace.delete({ where: { slug } });
}
