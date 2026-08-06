// src/constants/messages.js
// ============================================================
// Centralised human-readable API messages.
// Keeping messages here means a future i18n migration only
// touches this file, and all error messages stay consistent.
// ============================================================

export const MESSAGES = Object.freeze({
  // ---- Auth ----
  AUTH: {
    REGISTERED: "Account created successfully.",
    LOGGED_IN: "Logged in successfully.",
    LOGGED_OUT: "Logged out successfully.",
    INVALID_CREDENTIALS: "Invalid email or password.",
    TOKEN_MISSING: "Authentication token is missing.",
    TOKEN_INVALID: "Authentication token is invalid or expired.",
    TOKEN_EXPIRED: "Authentication token has expired.",
    UNAUTHORIZED: "You do not have permission to perform this action.",
  },

  // ---- Users ----
  USER: {
    FETCHED: "User retrieved successfully.",
    UPDATED: "User updated successfully.",
    DELETED: "User deleted successfully.",
    NOT_FOUND: "User not found.",
    EMAIL_EXISTS: "An account with this email already exists.",
  },

  // ---- Projects ----
  PROJECT: {
    CREATED: "Project created successfully.",
    FETCHED: "Project retrieved successfully.",
    UPDATED: "Project updated successfully.",
    DELETED: "Project deleted successfully.",
    NOT_FOUND: "Project not found.",
    SLUG_EXISTS: "A project with this slug already exists.",
    UNAUTHORIZED: "You do not have access to this project.",
    LIST_FETCHED: "Projects retrieved successfully.",
  },

  // ---- Workspaces ----
  WORKSPACE: {
    CREATED: "Workspace created successfully.",
    FETCHED: "Workspace retrieved successfully.",
    UPDATED: "Workspace updated successfully.",
    DELETED: "Workspace deleted successfully.",
    NOT_FOUND: "Workspace not found.",
    SLUG_EXISTS: "A workspace with this slug already exists.",
    LIST_FETCHED: "Workspaces retrieved successfully.",
  },

  // ---- General ----
  GENERAL: {
    VALIDATION_ERROR: "Validation failed. Please check your input.",
    INTERNAL_ERROR: "An unexpected error occurred. Please try again.",
    NOT_FOUND: "The requested resource was not found.",
    RATE_LIMITED: "Too many requests. Please slow down.",
    HEALTH_OK: "Service is healthy.",
  },
});
