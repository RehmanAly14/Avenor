// src/app.js
// ============================================================
// Express application factory.
//
// app.js is responsible for:
//   - Loading and configuring all middleware
//   - Mounting the API routes
//   - Registering the error handlers
//
// It does NOT start listening — that is server.js's job.
// This separation makes it trivial to run the app in tests
// without binding to a port.
// ============================================================

import express from "express";
import helmet from "helmet";
import cors from "cors";
import morgan from "morgan";
import rateLimit from "express-rate-limit";

import { env } from "./config/env.js";
import apiRoutes from "./routes/index.js";
import { errorMiddleware, notFoundMiddleware } from "./middlewares/error.middleware.js";

const app = express();

// ── Security Headers ───────────────────────────────────────
// Helmet sets a collection of security-related HTTP headers.
app.use(helmet());

// ── CORS ───────────────────────────────────────────────────
// Only allow requests from configured origins.
app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (server-to-server, Postman, etc.)
      if (!origin) return callback(null, true);

      if (env.CORS_ORIGINS.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error(`CORS: Origin '${origin}' is not allowed.`));
      }
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

// ── Request Logging ─────────────────────────────────────────
// Use concise format in production, verbose in development.
app.use(morgan(env.IS_PRODUCTION ? "combined" : "dev"));

// ── Body Parsers ───────────────────────────────────────────
app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true, limit: "1mb" }));

// ── Rate Limiting ──────────────────────────────────────────
// Applied globally. Individual sensitive routes (login, register)
// can have stricter limits added directly on those routers.
const limiter = rateLimit({
  windowMs: env.RATE_LIMIT_WINDOW_MS,
  max: env.RATE_LIMIT_MAX,
  standardHeaders: true,   // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false,    // Disable the `X-RateLimit-*` headers
  message: {
    success: false,
    message: "Too many requests from this IP, please try again later.",
  },
});

app.use(limiter);

// ── API Routes ─────────────────────────────────────────────
app.use(`/api/${env.API_VERSION}`, apiRoutes);

// ── Root endpoint ──────────────────────────────────────────
app.get("/", (_req, res) => {
  res.json({
    name: env.APP_NAME,
    version: env.API_VERSION,
    status: "running",
    docs: `/api/${env.API_VERSION}/health`,
  });
});

// ── 404 Handler ────────────────────────────────────────────
// Must come AFTER all routes — catches any unmatched request.
app.use(notFoundMiddleware);

// ── Global Error Handler ───────────────────────────────────
// Must be the LAST middleware — Express identifies it by its
// 4-parameter signature (err, req, res, next).
app.use(errorMiddleware);

export default app;
