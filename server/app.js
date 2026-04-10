import express from "express";
import cors from "cors";
import pinoHttp from "pino-http";
import cookieParser from "cookie-parser";
import authRoutes from "./modules/auth/auth.routes.js";
import duplicateRoutes from "./modules/duplicate/duplicate.routes.js";
import syncRoutes from "./modules/sync/sync.routes.js";
import webhookRoutes from "./modules/webhook/webhook.routes.js";
import { env } from "./config/env.js";
import { connectDatabase } from "./config/database.js";
import { initRedis } from "./services/redis.service.js";
import { logger } from "./utils/logger.js";
import { notFoundHandler } from "./middleware/not-found.middleware.js";
import { errorHandler } from "./middleware/error-handler.middleware.js";

export const createApp = () => {
  const app = express();
  const allowedOrigins = env.CLIENT_ORIGIN;

  app.use(
    cors({
      origin(origin, callback) {
        // Allow non-browser requests (no Origin header) like server-to-server webhooks.
        if (!origin) {
          return callback(null, true);
        }

        const normalizedOrigin = origin.replace(/\/$/, "");
        if (allowedOrigins.includes(normalizedOrigin)) {
          return callback(null, true);
        }

        return callback(new Error("Origin is not allowed by CORS"));
      },
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

const app = createApp();
let runtimeInitPromise;

const initializeRuntime = async () => {
  if (!runtimeInitPromise) {
    runtimeInitPromise = (async () => {
      await connectDatabase();
      await initRedis();
      logger.info("Runtime dependencies initialized");
    })().catch((error) => {
      runtimeInitPromise = undefined;
      throw error;
    });
  }

  return runtimeInitPromise;
};

const shouldInitializeRuntime = (url) => {
  if (!url || typeof url !== "string") {
    return false;
  }

  return url === "/health" || url.startsWith("/api/");
};

// Vercel Node.js runtime requires a default export function for serverless entry files.
export default async function handler(req, res) {
  if (shouldInitializeRuntime(req.url)) {
    try {
      await initializeRuntime();
    } catch (error) {
      logger.error({ err: error, url: req.url }, "Runtime initialization failed");
      return res.status(503).json({
        message: "Backend dependencies are not available",
        details: process.env.NODE_ENV === "development" ? error.message : undefined
      });
    }
  }

  return app(req, res);
}
