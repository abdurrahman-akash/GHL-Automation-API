import { Contact } from "../models/contact.model.js";
import { normalizeEmail, normalizePhone } from "../utils/normalization.js";
import { indexContactsInRedis } from "./redis.service.js";
import { fetchContactsPage } from "./ghl.service.js";
import { env } from "../config/env.js";
import { logger } from "../utils/logger.js";

export const normalizeContact = (contact, locationId) => ({
  locationId,
  contactId: String(contact.id || contact.contactId || ""),
  email: normalizeEmail(contact.email),
  phone: normalizePhone(contact.phone)
});

export const upsertContacts = async ({ locationId, contacts }) => {
  const normalized = contacts
    .map((contact) => normalizeContact(contact, locationId))
    .filter((contact) => contact.contactId);

  if (!normalized.length) {
    return { syncedCount: 0 };
  }

  const operations = normalized.map((contact) => ({
    updateOne: {
      filter: {
        locationId: contact.locationId,
        contactId: contact.contactId
      },
      update: {
        $set: {
          email: contact.email,
          phone: contact.phone
        }
      },
      upsert: true
    }
  }));

  await Contact.bulkWrite(operations, { ordered: false });
  await indexContactsInRedis(locationId, normalized);

  return { syncedCount: normalized.length };
};

export const syncContactsPage = async ({ ghlApiKey, locationId, page, limit }) => {
  const { contacts, hasMore } = await fetchContactsPage({
    ghlApiKey,
    locationId,
    page,
    limit
  });

  const { syncedCount } = await upsertContacts({ locationId, contacts });

  return {
    syncedCount,
    hasMore
  };
};

export const syncAllContactsForTenant = async ({ ghlApiKey, locationId, limit = env.CONTACT_SYNC_PAGE_SIZE }) => {
  let page = 1;
  let hasMore = true;
  let totalSynced = 0;
  const maxPages = 500;

  while (hasMore && page <= maxPages) {
    const { syncedCount, hasMore: pageHasMore } = await syncContactsPage({
      ghlApiKey,
      locationId,
      page,
      limit
    });

    totalSynced += syncedCount;
    hasMore = pageHasMore;
    page += 1;
  }

  if (hasMore) {
    logger.warn({ locationId, maxPages }, "Stopped tenant sync early due to max page safety limit");
  }

  return {
    totalSynced
  };
};
