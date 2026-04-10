import { TenantCredential } from "../models/tenant.model.js";
import { env } from "../config/env.js";
import { enqueueContactSyncJob } from "./contact-sync.queue.js";
import { logger } from "../utils/logger.js";

let schedulerHandle;

export const startContactSyncScheduler = () => {
  if (schedulerHandle) {
    return schedulerHandle;
  }

  schedulerHandle = setInterval(async () => {
    try {
      const tenants = await TenantCredential.find({}, { locationId: 1 }).lean();

      await Promise.all(
        tenants.map((tenant) => enqueueContactSyncJob(tenant.locationId))
      );

      logger.info({ tenantCount: tenants.length }, "Scheduled contact sync enqueued");
    } catch (error) {
      logger.error({ err: error }, "Failed to enqueue scheduled contact sync jobs");
    }
  }, env.CONTACT_SYNC_INTERVAL_MS);

  return schedulerHandle;
};

export const stopContactSyncScheduler = () => {
  if (schedulerHandle) {
    clearInterval(schedulerHandle);
    schedulerHandle = undefined;
  }
};
