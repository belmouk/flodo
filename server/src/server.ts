import app from "./app.js";
import CONFIG from "./lib/config.js";
import { prisma } from "./lib/prisma.js";

const PORT = CONFIG.PORT;

const server = app.listen(PORT, () => {
  console.log(`Server listening on ${PORT}...`);
});

server.on("error", (err) => {
  console.error(err);
  process.exit(1);
});

const disconnect = async () => {
  try {
    await prisma.$disconnect();
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
};

let shuttingDown = false;

const shutdown = (signal: string) => {
  if (shuttingDown) return;
  shuttingDown = true;
  console.log(`${signal} received, shutting down...`);

  const forceShutdown = setTimeout(() => {
    console.error("Graceful shutdown timed out.");
    process.exit(1);
  }, 10_000);

  server.close(() => {
    clearTimeout(forceShutdown);

    console.log("HTTP server closed.");

    void disconnect();
  });
};

process.on("SIGTERM", () => void shutdown("SIGTERM"));
process.on("SIGINT", () => void shutdown("SIGINT"));
process.on("uncaughtException", (err) => {
  console.error(err);
  process.exit(1);
});

process.on("unhandledRejection", (reason) => {
  console.error(reason);
  process.exit(1);
});
