// src/database/index.js
// ============================================================
// Database connection lifecycle management.
//
// connect()    — Test the DB connection and surface clear errors
// disconnect() — Gracefully close all Prisma connections on shutdown
//
// Both are called in server.js, not in the app bootstrap, because
// connection management is a server-level (infrastructure) concern,
// not an application concern.
// ============================================================

import prisma from "../config/prisma.js";

/**
 * Test the database connection.
 * Called on server startup to fail fast if the DB is unavailable.
 */
export async function connectDatabase() {
  await prisma.$connect();
  console.log("✅ Database connected successfully.");
}

/**
 * Gracefully disconnect from the database.
 * Called on SIGTERM / SIGINT to allow in-flight queries to finish.
 */
export async function disconnectDatabase() {
  await prisma.$disconnect();
  console.log("🔌 Database disconnected.");
}
