import express from "express";
import cors from "cors";
import pinoHttp from "pino-http";
import cookieParser from "cookie-parser";
import authRoutes from "./modules/auth/auth.routes.js";
import duplicateRoutes from "./modules/duplicate/duplicate.routes.js";
import syncRoutes from "./modules/sync/sync.routes.js";
import webhookRoutes from "./modules/webhook/webhook.routes.js";
import { env } from "./config/env.js";
import { logger } from "./utils/logger.js";
import { notFoundHandler } from "./middleware/not-found.middleware.js";
import { errorHandler } from "./middleware/error-handler.middleware.js";

export const createApp = () => {
  const app = express();

  app.use(
    cors({
      origin: env.CLIENT_ORIGIN,
      credentials: true
    })
  );
  app.use(express.json({ limit: "1mb" }));
  app.use(cookieParser());
  app.use(
    pinoHttp({
      logger,
      autoLogging: true
    })
  );

  app.get("/health", (req, res) => {
    res.status(200).json({ status: "ok" });
  });

  app.use("/api/v1/auth", authRoutes);
  app.use("/api/v1/duplicate", duplicateRoutes);
  app.use("/api/v1/sync", syncRoutes);
  app.use("/api/v1/webhook", webhookRoutes);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
};
