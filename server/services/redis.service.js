import Redis from "ioredis";
import { env } from "../config/env.js";
import { logger } from "../utils/logger.js";
import { Contact } from "../models/contact.model.js";

let redisClient;

export const buildEmailKey = (locationId, email) => `dup:v2:email:${locationId}:${email}`;
export const buildPhoneKey = (locationId, phone) => `dup:v2:phone:${locationId}:${phone}`;
export const buildContactKey = (locationId, contactId) => `dup:v2:contact:${locationId}:${contactId}`;

const asNullableString = (value) => (typeof value === "string" && value.length ? value : null);

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
  const indexedContacts = contacts.filter((contact) => Boolean(contact.contactId));

  if (!indexedContacts.length) {
    return;
  }

  const redis = getRedisClient();
  const readPipeline = redis.pipeline();

  for (const contact of indexedContacts) {
    readPipeline.hmget(buildContactKey(locationId, contact.contactId), "email", "phone");
  }

  const currentState = await readPipeline.exec();
  const writePipeline = redis.pipeline();

  for (let index = 0; index < indexedContacts.length; index += 1) {
    const contact = indexedContacts[index];
    const [readError, values] = currentState[index] || [];
    if (readError) {
      throw readError;
    }

    const [oldEmailRaw, oldPhoneRaw] = values || [];
    const oldEmail = asNullableString(oldEmailRaw);
    const oldPhone = asNullableString(oldPhoneRaw);
    const newEmail = asNullableString(contact.email);
    const newPhone = asNullableString(contact.phone);
    const contactKey = buildContactKey(locationId, contact.contactId);

    if (oldEmail && oldEmail !== newEmail) {
      writePipeline.srem(buildEmailKey(locationId, oldEmail), contact.contactId);
    }

    if (oldPhone && oldPhone !== newPhone) {
      writePipeline.srem(buildPhoneKey(locationId, oldPhone), contact.contactId);
    }

    if (newEmail) {
      writePipeline.sadd(buildEmailKey(locationId, newEmail), contact.contactId);
    }

    if (newPhone) {
      writePipeline.sadd(buildPhoneKey(locationId, newPhone), contact.contactId);
    }

    if (!newEmail && oldEmail) {
      writePipeline.hdel(contactKey, "email");
    }

    if (!newPhone && oldPhone) {
      writePipeline.hdel(contactKey, "phone");
    }

    if (newEmail || newPhone) {
      const metadata = {};

      if (newEmail) {
        metadata.email = newEmail;
      }

      if (newPhone) {
        metadata.phone = newPhone;
      }

      writePipeline.hset(contactKey, metadata);
    } else {
      writePipeline.del(contactKey);
    }
  }

  await writePipeline.exec();
};

export const checkDuplicateLookup = async ({ locationId, email, phone }) => {
  const redis = getRedisClient();
  const pipeline = redis.pipeline();

  if (email) {
    pipeline.scard(buildEmailKey(locationId, email));
  }

  if (phone) {
    pipeline.scard(buildPhoneKey(locationId, phone));
  }

  const result = await pipeline.exec();

  let pointer = 0;
  let emailCount = email ? Number(result[pointer++][1] || 0) : 0;
  let phoneCount = phone ? Number(result[pointer++][1] || 0) : 0;

  try {
    const [mongoEmailCount, mongoPhoneCount] = await Promise.all([
      email ? Contact.countDocuments({ locationId, email }) : Promise.resolve(0),
      phone ? Contact.countDocuments({ locationId, phone }) : Promise.resolve(0)
    ]);

    // MongoDB remains source of truth; Redis is used for fast indexing.
    emailCount = email ? mongoEmailCount : 0;
    phoneCount = phone ? mongoPhoneCount : 0;
  } catch (error) {
    logger.warn({ err: error, locationId }, "Falling back to Redis-only duplicate counts");
  }

  const emailStatus = email && emailCount > 1 ? "duplicate" : "unique";
  const phoneStatus = phone && phoneCount > 1 ? "duplicate" : "unique";

  return {
    email: emailStatus,
    phone: phoneStatus
  };
};
