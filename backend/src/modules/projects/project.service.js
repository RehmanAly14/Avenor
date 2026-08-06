// src/modules/projects/project.service.js
// ============================================================
// Project business logic.
//
// Ownership is enforced at the service layer — every write
// operation checks that the requesting user owns the resource.
// This is more robust than route-level checks alone.
// ============================================================

import prisma from "../../config/prisma.js";
import { AppError } from "../../utils/AppError.js";
import { HTTP_STATUS } from "../../constants/http.js";
import { MESSAGES } from "../../constants/messages.js";
import { toSlug, toUniqueSlug } from "../../utils/slug.js";

/** Fields returned for a project response. */
const PROJECT_SELECT = {
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
 * List all projects owned by the authenticated user, with pagination.
 * @param {string} ownerId
 * @param {{ page: number, limit: number }} pagination
 */
export async function listProjects(ownerId, { page = 1, limit = 20 } = {}) {
  const skip = (page - 1) * limit;

  const [projects, total] = await prisma.$transaction([
    prisma.project.findMany({
      where: { ownerId },
      select: PROJECT_SELECT,
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
    }),
    prisma.project.count({ where: { ownerId } }),
  ]);

  return { projects, total };
}

/**
 * Get a single project by slug.
 * @param {string} slug
 * @param {string} requestingUserId - Used to enforce ownership
 */
export async function getProjectBySlug(slug, requestingUserId) {
  const project = await prisma.project.findUnique({
    where: { slug },
    select: PROJECT_SELECT,
  });

  if (!project) {
    throw new AppError(MESSAGES.PROJECT.NOT_FOUND, HTTP_STATUS.NOT_FOUND);
  }

  if (project.ownerId !== requestingUserId) {
    throw new AppError(MESSAGES.PROJECT.UNAUTHORIZED, HTTP_STATUS.FORBIDDEN);
  }

  return project;
}

/**
 * Create a new project.
 * Generates a slug from name if not provided, with collision handling.
 * @param {string} ownerId
 * @param {import('./project.validation.js').CreateProjectInput} data
 */
export async function createProject(ownerId, data) {
  const { name, description, slug: providedSlug } = data;

  // Resolve slug
  let slug = providedSlug ?? toSlug(name);

  // Check slug uniqueness
  const slugExists = await prisma.project.findUnique({ where: { slug } });
  if (slugExists) {
    if (providedSlug) {
      // User explicitly set a slug — fail with a clear message
      throw new AppError(MESSAGES.PROJECT.SLUG_EXISTS, HTTP_STATUS.CONFLICT);
    }
    // Auto-generated slug collides — append a random suffix
    slug = toUniqueSlug(name);
  }

  const project = await prisma.project.create({
    data: {
      name,
      description,
      slug,
      ownerId,
    },
    select: PROJECT_SELECT,
  });

  return project;
}

/**
 * Update an existing project.
 * Only the owner may update a project.
 * @param {string} slug
 * @param {string} requestingUserId
 * @param {import('./project.validation.js').UpdateProjectInput} data
 */
export async function updateProject(slug, requestingUserId, data) {
  const project = await prisma.project.findUnique({ where: { slug } });

  if (!project) {
    throw new AppError(MESSAGES.PROJECT.NOT_FOUND, HTTP_STATUS.NOT_FOUND);
  }

  if (project.ownerId !== requestingUserId) {
    throw new AppError(MESSAGES.PROJECT.UNAUTHORIZED, HTTP_STATUS.FORBIDDEN);
  }

  const updated = await prisma.project.update({
    where: { slug },
    data,
    select: PROJECT_SELECT,
  });

  return updated;
}

/**
 * Delete a project.
 * Only the owner may delete a project.
 * @param {string} slug
 * @param {string} requestingUserId
 */
export async function deleteProject(slug, requestingUserId) {
  const project = await prisma.project.findUnique({ where: { slug } });

  if (!project) {
    throw new AppError(MESSAGES.PROJECT.NOT_FOUND, HTTP_STATUS.NOT_FOUND);
  }

  if (project.ownerId !== requestingUserId) {
    throw new AppError(MESSAGES.PROJECT.UNAUTHORIZED, HTTP_STATUS.FORBIDDEN);
  }

  await prisma.project.delete({ where: { slug } });
}
