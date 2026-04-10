import axios from "axios";
import { env } from "../config/env.js";
import { logger } from "../utils/logger.js";

const shouldRetry = (status) => status === 429 || status >= 500;

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const requestWithRetry = async (fn, retries = env.CONTACT_SYNC_MAX_RETRIES) => {
  let attempt = 0;

  while (attempt <= retries) {
    try {
      return await fn();
    } catch (error) {
      const status = error.response?.status;

      if (!shouldRetry(status) || attempt === retries) {
        throw error;
      }

      const retryAfterHeader = error.response?.headers?.["retry-after"];
      const retryAfterMs = retryAfterHeader ? Number(retryAfterHeader) * 1000 : undefined;
      const backoff = retryAfterMs || env.CONTACT_SYNC_BACKOFF_MS * 2 ** attempt;

      logger.warn({ status, attempt, backoff }, "Retrying GHL API request");
      await sleep(backoff);
      attempt += 1;
    }
  }

  throw new Error("Retry loop terminated unexpectedly");
};

const buildClient = (ghlApiKey) =>
  axios.create({
    baseURL: env.GHL_API_BASE_URL,
    timeout: 15000,
    headers: {
      Authorization: `Bearer ${ghlApiKey}`,
      Version: env.GHL_API_VERSION
    }
  });

export const fetchContactsPage = async ({ ghlApiKey, locationId, page, limit }) => {
  const client = buildClient(ghlApiKey);

  const response = await requestWithRetry(() =>
    client.get("/contacts/", {
      params: {
        locationId,
        page,
        limit
      }
    })
  );

  const contacts = response.data?.contacts ?? [];
  return {
    contacts,
    hasMore: contacts.length === limit
  };
};
