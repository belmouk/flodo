import app from "./app.js";
import CONFIG from "./lib/config.js";
import { prisma } from "@repo/db";
import logger from "./lib/logger.js";

const server = app.listen(CONFIG.PORT, () => {
  logger.info({ port: CONFIG.PORT }, "Server listening");
});

server.on("error", (err) => {
  logger.error({ err }, "Server initialization error");
  process.exit(1);
});

const disconnect = async () => {
  try {
    await prisma.$disconnect();
    process.exit(0);
  } catch (err) {
    logger.error({ err }, "Server disconnection error");
    process.exit(1);
  }
};

let shuttingDown = false;

const shutdown = (signal: string) => {
  if (shuttingDown) return;
  shuttingDown = true;
  logger.info({ signal }, "Server is shutting down");

  const forceShutdown = setTimeout(() => {
    logger.error("Graceful shutdown timed out.");
    process.exit(1);
  }, 10_000);

  server.close(() => {
    clearTimeout(forceShutdown);

    logger.info("HTTP server closed.");

    void disconnect();
  });
};

process.on("SIGTERM", () => void shutdown("SIGTERM"));
process.on("SIGINT", () => void shutdown("SIGINT"));
process.on("uncaughtException", (err) => {
  logger.error({ err }, "Uncaught exception error");
  process.exit(1);
});

process.on("unhandledRejection", (reason) => {
  logger.error({ err: reason }, "Unhandled rejection error");
  process.exit(1);
});
