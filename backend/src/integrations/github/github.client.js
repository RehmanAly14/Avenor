// src/integrations/github/github.client.js
// ============================================================
// Thin GitHub REST API v3 client — a single `fetch` wrapper, no SDK.
// Every exported function maps to one GitHub endpoint used by the
// incident-PR flow: read a branch ref, create a branch, read/write a
// file's content, open a pull request.
//
// Phase 4A: every function now accepts an optional trailing `ctx`
// ({ token, owner, repo }) so callers can supply per-project GitHub
// connection credentials. Omitting ctx (or any of its fields) falls
// back to the legacy global GITHUB_TOKEN/GITHUB_OWNER/GITHUB_REPO env
// vars — existing callers (and Phase 3 tests) are unaffected.
// ============================================================

import { env } from "../../config/env.js";

const API_BASE = "https://api.github.com";
const MAX_RETRIES = 2;
const RETRY_BASE_DELAY_MS = 300;

export class GitHubNotConfiguredError extends Error {
  constructor() {
    super("GitHub is not connected for this project, and no default GITHUB_TOKEN/GITHUB_OWNER/GITHUB_REPO is configured.");
    this.name = "GitHubNotConfiguredError";
  }
}

export class GitHubApiError extends Error {
  constructor(message, status) {
    super(message);
    this.name = "GitHubApiError";
    this.status = status;
  }
}

function resolveCredentials(ctx = {}) {
  return {
    token: ctx.token || env.GITHUB_TOKEN,
    owner: ctx.owner || env.GITHUB_OWNER,
    repo: ctx.repo || env.GITHUB_REPO,
  };
}

/** @param {{token?: string, owner?: string, repo?: string}} [ctx] */
export function isConfigured(ctx) {
  const { token, owner, repo } = resolveCredentials(ctx);
  return Boolean(token && owner && repo);
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function rawRequest({ token, owner, repo }, method, path, body) {
  const response = await fetch(`${API_BASE}${path.replace("{owner}", owner).replace("{repo}", repo)}`, {
    method,
    headers: {
      authorization: `Bearer ${token}`,
      accept: "application/vnd.github+json",
      "content-type": "application/json",
      "x-github-api-version": "2022-11-28",
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  if (!response.ok) {
    const detail = await response.text().catch(() => "");
    throw new GitHubApiError(`GitHub API request failed (${response.status} ${method} ${path}): ${detail.slice(0, 300)}`, response.status);
  }
  if (response.status === 204) return null;
  return response.json();
}

/** Bounded retry (network errors and 429/5xx only) — not a retry framework, just enough for transient blips. */
async function request(ctx, method, path, body, attempt = 0) {
  const credentials = resolveCredentials(ctx);
  if (!credentials.token || !credentials.owner || !credentials.repo) throw new GitHubNotConfiguredError();

  try {
    return await rawRequest(credentials, method, path, body);
  } catch (err) {
    const isRetryableApiError = err instanceof GitHubApiError && (err.status === 429 || err.status >= 500);
    const isNetworkError = !(err instanceof GitHubApiError) && !(err instanceof GitHubNotConfiguredError);
    if ((isRetryableApiError || isNetworkError) && attempt < MAX_RETRIES) {
      await sleep(RETRY_BASE_DELAY_MS * 2 ** attempt);
      return request(ctx, method, path, body, attempt + 1);
    }
    throw err;
  }
}

/** @param {string} branch @param {{token?: string, owner?: string, repo?: string}} [ctx] */
export function getBranchRef(branch, ctx) {
  return request(ctx, "GET", `/repos/{owner}/{repo}/git/ref/heads/${encodeURIComponent(branch)}`);
}

/** @param {string} branch @param {string} sha @param {object} [ctx] */
export function createBranch(branch, sha, ctx) {
  return request(ctx, "POST", `/repos/{owner}/{repo}/git/refs`, { ref: `refs/heads/${branch}`, sha });
}

/** @param {string} path @param {string} ref @param {object} [ctx] @returns {Promise<{sha: string}|null>} null if the file doesn't exist yet */
export async function getFileContent(path, ref, ctx) {
  try {
    return await request(ctx, "GET", `/repos/{owner}/{repo}/contents/${encodeURIComponent(path)}?ref=${encodeURIComponent(ref)}`);
  } catch (err) {
    if (err instanceof GitHubApiError && err.status === 404) return null;
    throw err;
  }
}

/** @param {string} path @param {{message: string, content: string, branch: string, sha?: string}} options @param {object} [ctx] */
export function putFileContent(path, { message, content, branch, sha }, ctx) {
  return request(ctx, "PUT", `/repos/{owner}/{repo}/contents/${encodeURIComponent(path)}`, {
    message,
    content: Buffer.from(content, "utf8").toString("base64"),
    branch,
    ...(sha && { sha }),
  });
}

/** @param {{title: string, head: string, base: string, body: string}} options @param {object} [ctx] */
export function createPullRequest({ title, head, base, body }, ctx) {
  return request(ctx, "POST", `/repos/{owner}/{repo}/pulls`, { title, head, base, body });
}
