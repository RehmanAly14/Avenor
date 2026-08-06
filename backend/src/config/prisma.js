// src/config/prisma.js
// ============================================================
// Singleton Prisma Client.
// A single shared instance is exported across the entire app.
// This prevents connection pool exhaustion during hot-reloads
// in development and maximises connection reuse in production.
// ============================================================

import { PrismaClient } from "@prisma/client";
import { env } from "./env.js";

const prismaClientSingleton = () => {
  return new PrismaClient({
    log:
      env.IS_DEVELOPMENT
        ? ["query", "info", "warn", "error"]
        : ["warn", "error"],

    errorFormat: env.IS_PRODUCTION ? "minimal" : "pretty",
  });
};

// In development, Node's module cache is invalidated on file changes.
// We attach the client to globalThis to survive hot-reloads.
const globalWithPrisma = globalThis;

const prisma = globalWithPrisma.prisma ?? prismaClientSingleton();

if (!env.IS_PRODUCTION) {
  globalWithPrisma.prisma = prisma;
}

export default prisma;
