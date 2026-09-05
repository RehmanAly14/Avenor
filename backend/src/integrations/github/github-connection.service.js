// src/integrations/github/github-connection.service.js
// ============================================================
// GitHub connection lifecycle: initiate OAuth, handle the callback,
// report connection/account status, discover repositories, link one
// to a project, and disconnect.
//
// Security:
//  - OAuth state is a random 32-byte token, stored server-side
//    (GitHubOAuthState), tied to the authenticated user who requested
//    it, single-use (usedAt), and short-lived (STATE_TTL_MS). The
//    callback is unauthenticated (GitHub redirects the browser there
//    directly, with no JWT) — the validated state IS the proof of
//    which user this connection belongs to.
//  - The access token is encrypted at rest with the same AES-256-GCM
//    utility already used for DataSource credentials
//    (src/utils/encryption.js) — no separate encryption scheme.
//  - Every read/write here is scoped by userId; nothing here trusts a
//    connection/repository id without also checking ownership.
//  - Nothing in this file (or its callers) ever returns
//    encryptedAccessToken through an API response.
// ============================================================

import crypto from "crypto";
import { AppError } from "../../utils/AppError.js";
import { HTTP_STATUS } from "../../constants/http.js";
import prisma from "../../config/prisma.js";
import { encrypt, decrypt } from "../../utils/encryption.js";
import * as oauth from "./github.oauth.js";
import { GitHubApiError } from "./github.client.js";

const STATE_TTL_MS = 10 * 60 * 1000; // 10 minutes

const GITHUB_ERROR_MESSAGES = {
  401: "GitHub authorization has expired or was revoked. Reconnect GitHub.",
  403: "GitHub denied permission for this operation.",
  404: "The requested GitHub resource was not found.",
  409: "GitHub reported a conflict.",
  429: "GitHub rate limit exceeded. Try again shortly.",
};

function mapGithubError(err) {
  if (!(err instanceof GitHubApiError)) return err;
  const message = GITHUB_ERROR_MESSAGES[err.status] ?? (err.status >= 500 ? "GitHub is temporarily unavailable. Try again shortly." : "GitHub request failed.");
  const statusCode =
    { 401: HTTP_STATUS.UNAUTHORIZED, 403: HTTP_STATUS.FORBIDDEN, 404: HTTP_STATUS.NOT_FOUND, 409: HTTP_STATUS.CONFLICT, 429: HTTP_STATUS.TOO_MANY_REQUESTS }[err.status] ?? HTTP_STATUS.BAD_GATEWAY;
  return new AppError(message, statusCode);
}

function normalizeRepo(raw) {
  return {
    githubRepositoryId: String(raw.id),
    owner: raw.owner?.login ?? "",
    name: raw.name,
    fullName: raw.full_name,
    private: Boolean(raw.private),
    defaultBranch: raw.default_branch || "main",
    htmlUrl: raw.html_url,
    permissions: raw.permissions ? { pull: Boolean(raw.permissions.pull), push: Boolean(raw.permissions.push), admin: Boolean(raw.permissions.admin) } : null,
  };
}

function toPublicRepository(row) {
  return { id: row.id, owner: row.owner, name: row.name, fullName: row.fullName, private: row.private, defaultBranch: row.defaultBranch, htmlUrl: row.htmlUrl, permissions: row.permissions };
}

async function requireActiveConnection(userId) {
  const connection = await prisma.gitHubConnection.findFirst({ where: { userId, status: "ACTIVE" }, orderBy: { createdAt: "desc" } });
  if (!connection) throw new AppError("No active GitHub connection. Connect GitHub first via GET /api/v1/github/connect.", HTTP_STATUS.UNPROCESSABLE_ENTITY);
  return connection;
}

/**
 * @param {string} userId
 * @param {string} redirectUri
 * @returns {Promise<string>} the GitHub authorize URL to redirect the browser to
 */
export async function initiateConnect(userId, redirectUri) {
  if (!oauth.isOAuthConfigured()) {
    throw new AppError("GitHub OAuth is not configured (GITHUB_CLIENT_ID/GITHUB_CLIENT_SECRET).", HTTP_STATUS.SERVICE_UNAVAILABLE);
  }

  const state = crypto.randomBytes(32).toString("hex");
  await prisma.gitHubOAuthState.create({ data: { state, userId, expiresAt: new Date(Date.now() + STATE_TTL_MS) } });

  return oauth.buildAuthorizeUrl({ state, redirectUri });
}

/**
 * @param {{code: string, state: string, redirectUri: string}} params
 * @returns {Promise<{id: string, githubLogin: string, githubAvatarUrl: string|null, createdAt: Date}>}
 */
export async function handleCallback({ code, state, redirectUri }) {
  const stateRow = await prisma.gitHubOAuthState.findUnique({ where: { state } });
  if (!stateRow || stateRow.usedAt || stateRow.expiresAt < new Date()) {
    throw new AppError("This GitHub authorization link is invalid, expired, or was already used. Start over with GET /api/v1/github/connect.", HTTP_STATUS.BAD_REQUEST);
  }
  // Mark used immediately — a state row is consumed exactly once, even
  // if the token exchange below fails.
  await prisma.gitHubOAuthState.update({ where: { state }, data: { usedAt: new Date() } });

  let token, profile;
  try {
    token = await oauth.exchangeCodeForToken({ code, redirectUri });
    profile = await oauth.fetchAuthenticatedUser(token);
  } catch (err) {
    throw mapGithubError(err);
  }

  return prisma.gitHubConnection.upsert({
    where: { userId_githubUserId: { userId: stateRow.userId, githubUserId: String(profile.id) } },
    create: { userId: stateRow.userId, githubUserId: String(profile.id), githubLogin: profile.login, githubAvatarUrl: profile.avatar_url ?? null, encryptedAccessToken: encrypt(token), scope: "repo read:user", status: "ACTIVE" },
    update: { githubLogin: profile.login, githubAvatarUrl: profile.avatar_url ?? null, encryptedAccessToken: encrypt(token), status: "ACTIVE" },
    select: { id: true, githubLogin: true, githubAvatarUrl: true, createdAt: true },
  });
}

/** @param {string} userId */
export async function getConnectionStatus(userId) {
  const connection = await prisma.gitHubConnection.findFirst({ where: { userId, status: "ACTIVE" }, orderBy: { createdAt: "desc" }, select: { githubLogin: true, githubAvatarUrl: true, createdAt: true } });
  return { connected: Boolean(connection), githubLogin: connection?.githubLogin ?? null, githubAvatarUrl: connection?.githubAvatarUrl ?? null, connectedAt: connection?.createdAt ?? null };
}

/** @param {string} userId */
export async function getAccount(userId) {
  const connection = await requireActiveConnection(userId);
  try {
    const profile = await oauth.fetchAuthenticatedUser(decrypt(connection.encryptedAccessToken));
    return { login: profile.login, name: profile.name ?? null, avatarUrl: profile.avatar_url, htmlUrl: profile.html_url, publicRepos: profile.public_repos };
  } catch (err) {
    throw mapGithubError(err);
  }
}

/** @param {string} userId */
export async function listRepositories(userId) {
  const connection = await requireActiveConnection(userId);

  let rawRepos;
  try {
    rawRepos = await oauth.fetchUserRepositories(decrypt(connection.encryptedAccessToken));
  } catch (err) {
    throw mapGithubError(err);
  }

  const normalized = rawRepos.map(normalizeRepo);
  for (const repo of normalized) {
    await prisma.gitHubRepository.upsert({
      where: { connectionId_githubRepositoryId: { connectionId: connection.id, githubRepositoryId: repo.githubRepositoryId } },
      create: { connectionId: connection.id, ...repo },
      update: repo,
    });
  }

  const stored = await prisma.gitHubRepository.findMany({ where: { connectionId: connection.id }, orderBy: { updatedAt: "desc" } });
  return stored.map(toPublicRepository);
}

/**
 * @param {string} userId
 * @param {string} repositoryId - internal GitHubRepository id
 * @param {string} projectId
 */
export async function selectRepository(userId, repositoryId, projectId) {
  const repository = await prisma.gitHubRepository.findFirst({ where: { id: repositoryId, connection: { userId } } });
  if (!repository) throw new AppError("Repository not found, or not accessible from your GitHub connection.", HTTP_STATUS.NOT_FOUND);

  const project = await prisma.project.findFirst({ where: { id: projectId, ownerId: userId } });
  if (!project) throw new AppError("Project not found or not accessible.", HTTP_STATUS.FORBIDDEN);

  const updated = await prisma.project.update({
    where: { id: projectId },
    data: { githubRepositoryId: repository.id, githubBranch: repository.defaultBranch },
    select: { id: true, name: true, slug: true, githubBranch: true, githubRepository: { select: { owner: true, name: true, fullName: true, defaultBranch: true, htmlUrl: true } } },
  });

  return updated;
}

/**
 * Disconnects GitHub entirely for this user — every connection (a user
 * may hold more than one, one per distinct GitHub account), not just
 * the most recently used one. Cascades to GitHubRepository rows; any
 * Project.githubRepositoryId referencing them is set to null
 * (onDelete: SetNull) rather than left dangling.
 * @param {string} userId
 */
export async function disconnect(userId) {
  const { count } = await prisma.gitHubConnection.deleteMany({ where: { userId } });
  if (count === 0) throw new AppError("No GitHub connection found.", HTTP_STATUS.NOT_FOUND);
}
