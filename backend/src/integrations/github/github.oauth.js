// src/integrations/github/github.oauth.js
// ============================================================
// GitHub OAuth App flow — authorize URL, code exchange, and the two
// GitHub API reads the connection flow needs (authenticated user,
// accessible repositories). Deliberately an OAuth App, not a full
// GitHub App: no installation/JWT-signed-private-key machinery, one
// user-scoped access token per connection. See
// src/integrations/github/README.md for the tradeoff.
//
// Reuses github.client.js's GitHubApiError so callers normalize
// errors through the same map (github-connection.service.js) rather
// than a second error type.
// ============================================================

import { env } from "../../config/env.js";
import { GitHubApiError } from "./github.client.js";

const AUTHORIZE_URL = "https://github.com/login/oauth/authorize";
const TOKEN_URL = "https://github.com/login/oauth/access_token";
const API_BASE = "https://api.github.com";
const SCOPE = "repo read:user";

export function isOAuthConfigured() {
  return Boolean(env.GITHUB_CLIENT_ID && env.GITHUB_CLIENT_SECRET);
}

/** @param {{state: string, redirectUri: string}} options */
export function buildAuthorizeUrl({ state, redirectUri }) {
  const params = new URLSearchParams({
    client_id: env.GITHUB_CLIENT_ID,
    redirect_uri: redirectUri,
    scope: SCOPE,
    state,
    allow_signup: "false",
  });
  return `${AUTHORIZE_URL}?${params.toString()}`;
}

/** @param {{code: string, redirectUri: string}} options @returns {Promise<string>} access token */
export async function exchangeCodeForToken({ code, redirectUri }) {
  const response = await fetch(TOKEN_URL, {
    method: "POST",
    headers: { "content-type": "application/json", accept: "application/json" },
    body: JSON.stringify({ client_id: env.GITHUB_CLIENT_ID, client_secret: env.GITHUB_CLIENT_SECRET, code, redirect_uri: redirectUri }),
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok || data.error) throw new GitHubApiError(`GitHub OAuth token exchange failed: ${data.error_description || data.error || response.status}`, response.ok ? 400 : response.status);
  if (!data.access_token) throw new GitHubApiError("GitHub OAuth token exchange did not return an access token.", 400);
  return data.access_token;
}

/** @param {string} token @returns {Promise<object>} GitHub user profile */
export async function fetchAuthenticatedUser(token) {
  const response = await fetch(`${API_BASE}/user`, { headers: { authorization: `Bearer ${token}`, accept: "application/vnd.github+json", "x-github-api-version": "2022-11-28" } });
  if (!response.ok) throw new GitHubApiError(`Failed to fetch the GitHub user profile (${response.status}).`, response.status);
  return response.json();
}

/** @param {string} token @returns {Promise<object[]>} raw GitHub repository objects */
export async function fetchUserRepositories(token) {
  const response = await fetch(`${API_BASE}/user/repos?per_page=100&sort=updated&affiliation=owner,collaborator,organization_member`, {
    headers: { authorization: `Bearer ${token}`, accept: "application/vnd.github+json", "x-github-api-version": "2022-11-28" },
  });
  if (!response.ok) throw new GitHubApiError(`Failed to list GitHub repositories (${response.status}).`, response.status);
  return response.json();
}
