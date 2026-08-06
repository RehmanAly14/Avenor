// src/utils/slug.js
// ============================================================
// Slug generation utility.
// Generates URL-safe, lowercased slugs from arbitrary strings.
// Used for projects, workspaces, and any other named resources.
// ============================================================

import slugify from "slugify";

/**
 * Convert a string into a URL-safe slug.
 * e.g. "My Cool Project 2025!" → "my-cool-project-2025"
 *
 * @param {string} input
 * @returns {string}
 */
export function toSlug(input) {
  return slugify(input, {
    lower: true,
    strict: true,       // removes non-alphanumeric characters
    trim: true,
  });
}

/**
 * Generate a unique slug by appending a short random suffix.
 * Use when a slug collision is detected in the database.
 *
 * @param {string} input
 * @returns {string}
 */
export function toUniqueSlug(input) {
  const base = toSlug(input);
  const suffix = Math.random().toString(36).slice(2, 7); // e.g. "a1b2c"
  return `${base}-${suffix}`;
}
