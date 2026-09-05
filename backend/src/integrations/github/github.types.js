// src/integrations/github/github.types.js
// ============================================================
// JSDoc-only type definitions for the GitHub integration. No runtime
// code — kept as a single source of truth for the shapes passed
// between github.service.js and its callers.
// ============================================================

/**
 * @typedef {object} GitHubFileChange
 * @property {string} path - repo-relative file path
 * @property {string} content - full new file content (UTF-8, not base64)
 */

/**
 * @typedef {object} GitHubPullRequestResult
 * @property {string} branch
 * @property {number} prNumber
 * @property {string} prUrl
 */

export {};
