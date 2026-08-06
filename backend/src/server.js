import app from "./app.js";
import { env } from "./config/env.js";
import { connectDatabase, disconnectDatabase } from "./database/index.js";

const PORT = env.PORT;

async function bootstrap() {
  // Step 1: Verify database connection before accepting traffic
  await connectDatabase();

  // Step 2: Start the HTTP server
  const server = app.listen(PORT, () => {
    console.log(`
╔══════════════════════════════════════════════╗
║              🚀  AVENOR BACKEND              ║
╠══════════════════════════════════════════════╣
║  Environment : ${env.NODE_ENV.padEnd(28)}║
║  Port        : ${String(PORT).padEnd(28)}║
║  API Base    : /api/${env.API_VERSION.padEnd(25)}║
╚══════════════════════════════════════════════╝
`);
  });

  const shutdown = async (signal) => {
    console.log(`\n⚡ ${signal} received. Shutting down gracefully...`);

    server.close(async () => {
      console.log("🔒 HTTP server closed.");
      await disconnectDatabase();
      console.log("👋 Goodbye.");
      process.exit(0);
    });

    // Force exit if graceful shutdown takes too long
    setTimeout(() => {
      console.error("⚠️  Forced shutdown after timeout.");
      process.exit(1);
    }, 10_000);
  };

  process.on("SIGTERM", () => shutdown("SIGTERM"));
  process.on("SIGINT", () => shutdown("SIGINT"));

  // ── Unhandled Promise Rejections ──────────────────────────
  // Log and exit — an unknown state is worse than a restart.
  process.on("unhandledRejection", (reason, promise) => {
    console.error("🔥 Unhandled Rejection:", { promise, reason });
    process.exit(1);
  });

  // ── Uncaught Exceptions ───────────────────────────────────
  process.on("uncaughtException", (err) => {
    console.error("💥 Uncaught Exception:", err);
    process.exit(1);
  });
}

bootstrap().catch((err) => {
  console.error("❌ Failed to start server:", err.message);
  process.exit(1);
});
