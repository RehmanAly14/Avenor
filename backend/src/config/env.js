// src/config/env.js
// ============================================================
// Central environment configuration & validation.
// All modules import from here — never from process.env directly.
// This ensures fail-fast behavior if a required variable is missing.
// ============================================================

import { config } from "dotenv";

// Load .env file before anything else
config();

/**
 * Validates that a required environment variable is set.
 * Throws on startup if missing — this is intentional.
 * A crashed server with a clear error is better than silent failures.
 */
function requireEnv(key) {
  const value = process.env[key];
  if (!value) {
    throw new Error(
      `[Config] Missing required environment variable: ${key}\n` +
        `  → Check your .env file against .env.example`
    );
  }
  return value;
}

function optionalEnv(key, defaultValue) {
  return process.env[key] ?? defaultValue;
}

const dataEncryptionKey = optionalEnv("DATA_ENCRYPTION_KEY", "");

if (process.env.NODE_ENV === "production" && !dataEncryptionKey) {
  throw new Error(
    "[Config] Missing required environment variable: DATA_ENCRYPTION_KEY\n" +
      "  → A dedicated encryption key is required in production."
  );
}

export const env = Object.freeze({
  // ---- Server ----
  NODE_ENV: optionalEnv("NODE_ENV", "development"),
  PORT: parseInt(optionalEnv("PORT", "5000"), 10),
  IS_PRODUCTION: process.env.NODE_ENV === "production",
  IS_DEVELOPMENT: process.env.NODE_ENV === "development",
  IS_TEST: process.env.NODE_ENV === "test",

  // ---- Database ----
  DATABASE_URL: requireEnv("DATABASE_URL"),

  // ---- JWT ----
  JWT_SECRET: requireEnv("JWT_SECRET"),
  JWT_EXPIRES_IN: optionalEnv("JWT_EXPIRES_IN", "7d"),
  JWT_REFRESH_EXPIRES_IN: optionalEnv("JWT_REFRESH_EXPIRES_IN", "30d"),
  // A dedicated key is recommended for datasource credentials. JWT_SECRET is
  // retained as a development fallback so existing deployments remain runnable.
  DATA_ENCRYPTION_KEY: dataEncryptionKey,

  // ---- CORS ----
  CORS_ORIGINS: optionalEnv("CORS_ORIGINS", "http://localhost:3000")
    .split(",")
    .map((o) => o.trim()),

  // ---- Rate Limiting ----
  RATE_LIMIT_WINDOW_MS: parseInt(
    optionalEnv("RATE_LIMIT_WINDOW_MS", "900000"),
    10
  ),
  RATE_LIMIT_MAX: parseInt(optionalEnv("RATE_LIMIT_MAX", "100"), 10),

  // ---- Bcrypt ----
  BCRYPT_ROUNDS: parseInt(optionalEnv("BCRYPT_ROUNDS", "12"), 10),

  // ---- App ----
  APP_NAME: optionalEnv("APP_NAME", "Avenor"),
  API_VERSION: optionalEnv("API_VERSION", "v1"),

  // ---- AI Provider (optional — agents fall back to deterministic
  // templates when unset, see src/ai/providers/) ----
  AI_PROVIDER: optionalEnv("AI_PROVIDER", ""),
  AI_MODEL: optionalEnv("AI_MODEL", "accounts/fireworks/models/llama-v3p1-70b-instruct"),
  FIREWORKS_API_KEY: optionalEnv("FIREWORKS_API_KEY", ""),

  // ---- GitHub Integration (optional — PR creation returns a clean
  // config error, never crashes, when unset; see src/integrations/github/) ----
  // Legacy global fallback (Phase 3) — used only when a project has no
  // GitHub repository connected via the OAuth flow below.
  GITHUB_TOKEN: optionalEnv("GITHUB_TOKEN", ""),
  GITHUB_OWNER: optionalEnv("GITHUB_OWNER", ""),
  GITHUB_REPO: optionalEnv("GITHUB_REPO", ""),
  GITHUB_DEFAULT_BRANCH: optionalEnv("GITHUB_DEFAULT_BRANCH", "main"),

  // GitHub OAuth App (Phase 4A) — user-facing "Connect GitHub" flow.
  // GITHUB_REDIRECT_URI must exactly match the callback URL registered
  // with the OAuth App; left unset, it's derived from the request
  // (fine for local dev, set explicitly in production).
  GITHUB_CLIENT_ID: optionalEnv("GITHUB_CLIENT_ID", ""),
  GITHUB_CLIENT_SECRET: optionalEnv("GITHUB_CLIENT_SECRET", ""),
  GITHUB_REDIRECT_URI: optionalEnv("GITHUB_REDIRECT_URI", ""),
  GITHUB_WEBHOOK_SECRET: optionalEnv("GITHUB_WEBHOOK_SECRET", ""),
});
