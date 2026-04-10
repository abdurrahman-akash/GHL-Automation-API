import { env } from "../../config/env.js";
import { ApiError } from "../../utils/api-error.js";
import { webhookEventSchema } from "./webhook.validation.js";
import { upsertContacts } from "../../services/sync.service.js";

export const syncWebhookContact = async ({ payload, signature, locationIdHeader }) => {
  if (env.GHL_WEBHOOK_SECRET && signature !== env.GHL_WEBHOOK_SECRET) {
    throw new ApiError(401, "Invalid webhook secret");
  }

  const event = webhookEventSchema.parse(payload);
  const contact = event.contact || event;
  const locationId = contact.locationId || event.locationId || locationIdHeader;

  if (!locationId) {
    throw new ApiError(400, "locationId is required in webhook payload or x-location-id header");
  }

  await upsertContacts({
    locationId,
    contacts: [contact]
  });

  return {
    status: "accepted"
  };
};
