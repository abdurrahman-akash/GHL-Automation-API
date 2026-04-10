import { env } from "./config/env.js";
import { connectDatabase, disconnectDatabase } from "./config/database.js";
import { initRedis, closeRedis } from "./services/redis.service.js";
import { startContactSyncWorker, stopContactSyncWorker } from "./jobs/contact-sync.worker.js";
import { startContactSyncScheduler, stopContactSyncScheduler } from "./jobs/contact-sync.scheduler.js";
import { contactSyncQueue } from "./jobs/contact-sync.queue.js";
import { logger } from "./utils/logger.js";
import { createApp } from "./app.js";

const app = createApp();
let server;

const bootstrap = async () => {
  await connectDatabase();
  await initRedis();

  if (env.ENABLE_SYNC_WORKER) {
    startContactSyncWorker();
    startContactSyncScheduler();
  }

  server = app.listen(env.PORT, () => {
    logger.info({ port: env.PORT }, "Server started");
  });
};

const gracefulShutdown = async (signal) => {
  logger.info({ signal }, "Shutting down server");

  if (server) {
    await new Promise((resolve) => server.close(resolve));
  }

  await stopContactSyncWorker();
  stopContactSyncScheduler();
  await contactSyncQueue.close();
  await closeRedis();
  await disconnectDatabase();

  process.exit(0);
};

process.on("SIGINT", gracefulShutdown);
process.on("SIGTERM", gracefulShutdown);

bootstrap().catch((error) => {
  logger.error({ err: error }, "Failed to start application");
  process.exit(1);
});
