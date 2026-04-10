import { duplicateCheckSchema } from "./duplicate.validation.js";
import { normalizeEmail, normalizePhone } from "../../utils/normalization.js";
import { checkDuplicateLookup } from "../../services/redis.service.js";
import { TenantCredential } from "../../models/tenant.model.js";
import { syncAllContactsForTenant } from "../../services/sync.service.js";
import { logger } from "../../utils/logger.js";

export const checkDuplicatesForTenant = async ({ locationId, payload }) => {
  const validated = duplicateCheckSchema.parse(payload);

  const normalizedEmail = normalizeEmail(validated.email);
  const normalizedPhone = normalizePhone(validated.phone);

  const initialResult = await checkDuplicateLookup({
    locationId,
    email: normalizedEmail,
    phone: normalizedPhone
  });

  const hasPotentialMiss =
    (normalizedEmail && initialResult.email === "unique") ||
    (normalizedPhone && initialResult.phone === "unique");

  if (!hasPotentialMiss) {
    return initialResult;
  }

  const tenant = await TenantCredential.findOne(
    { locationId },
    { ghlApiKey: 1, lastSyncedAt: 1 }
  ).lean();

  const shouldRunColdStartSync = Boolean(tenant?.ghlApiKey) && !tenant?.lastSyncedAt;

  if (!shouldRunColdStartSync) {
    return initialResult;
  }

  try {
    await syncAllContactsForTenant({
      ghlApiKey: tenant.ghlApiKey,
      locationId
    });

    await TenantCredential.updateOne(
      { locationId },
      { $set: { lastSyncedAt: new Date() } }
    );

    return checkDuplicateLookup({
      locationId,
      email: normalizedEmail,
      phone: normalizedPhone
    });
  } catch (error) {
    logger.warn(
      {
        locationId,
        error: error?.message
      },
      "Duplicate check cold-start sync failed; returning cached duplicate result"
    );

    return initialResult;
  }
};
