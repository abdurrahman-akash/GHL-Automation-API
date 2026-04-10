import mongoose from "mongoose";
import { env } from "./env.js";
import { logger } from "../utils/logger.js";

export const connectDatabase = async () => {
  if (!env.DATABASE_URL) {
    throw new Error("DATABASE_URL is not configured");
  }

  await mongoose.connect(env.DATABASE_URL, {
    maxPoolSize: 30,
    minPoolSize: 5
  });

  logger.info("MongoDB connected");
};

export const disconnectDatabase = async () => {
  await mongoose.disconnect();
  logger.info("MongoDB disconnected");
};
