import Redis from "ioredis";
import { env } from "../config/env.js";
import { logger } from "../utils/logger.js";

let redisClient;

export const buildEmailKey = (locationId, email) => `email:${locationId}:${email}`;
export const buildPhoneKey = (locationId, phone) => `phone:${locationId}:${phone}`;

export const initRedis = async () => {
  if (redisClient) {
    return redisClient;
  }

  if (!env.REDIS_URL) {
    throw new Error("REDIS_URL is not configured");
  }

  redisClient = new Redis(env.REDIS_URL, {
    maxRetriesPerRequest: null,
    enableReadyCheck: true,
    lazyConnect: true
  });

  redisClient.on("error", (error) => {
    logger.error({ err: error }, "Redis connection error");
  });

  redisClient.on("connect", () => {
    logger.info("Redis connected");
  });

  await redisClient.connect();
  return redisClient;
};

export const getRedisClient = () => {
  if (!redisClient) {
    throw new Error("Redis client is not initialized");
  }

  return redisClient;
};

export const closeRedis = async () => {
  if (redisClient) {
    await redisClient.quit();
    redisClient = undefined;
    logger.info("Redis disconnected");
  }
};

export const indexContactsInRedis = async (locationId, contacts) => {
  if (!contacts.length) {
    return;
  }

  const redis = getRedisClient();
  const pipeline = redis.pipeline();

  for (const contact of contacts) {
    if (contact.email) {
      pipeline.set(buildEmailKey(locationId, contact.email), contact.contactId);
    }

    if (contact.phone) {
      pipeline.set(buildPhoneKey(locationId, contact.phone), contact.contactId);
    }
  }

  await pipeline.exec();
};

export const checkDuplicateLookup = async ({ locationId, email, phone }) => {
  const redis = getRedisClient();
  const pipeline = redis.pipeline();

  if (email) {
    pipeline.exists(buildEmailKey(locationId, email));
  }

  if (phone) {
    pipeline.exists(buildPhoneKey(locationId, phone));
  }

  const result = await pipeline.exec();

  let pointer = 0;
  const emailStatus = email ? (result[pointer++][1] ? "duplicate" : "unique") : "unique";
  const phoneStatus = phone ? (result[pointer++][1] ? "duplicate" : "unique") : "unique";

  return {
    email: emailStatus,
    phone: phoneStatus
  };
};
