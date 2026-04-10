import { Contact } from "../models/contact.model.js";
import { normalizeEmail, normalizePhone } from "../utils/normalization.js";
import { indexContactsInRedis } from "./redis.service.js";
import { fetchContactsPage } from "./ghl.service.js";

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
