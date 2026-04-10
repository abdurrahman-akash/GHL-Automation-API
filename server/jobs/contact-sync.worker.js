import { Worker } from "bullmq";
import { env } from "../config/env.js";
import { buildBullConnection, CONTACT_SYNC_QUEUE } from "../config/bullmq.js";
import { TenantCredential } from "../models/tenant.model.js";
import { syncContactsPage } from "../services/sync.service.js";
import { logger } from "../utils/logger.js";

let worker;

export const startContactSyncWorker = () => {
  if (worker) {
    return worker;
  }

  worker = new Worker(
    CONTACT_SYNC_QUEUE,
    async (job) => {
      const { locationId } = job.data;
      const tenant = await TenantCredential.findOne({ locationId }).lean();

      if (!tenant) {
        throw new Error(`Tenant not found for locationId ${locationId}`);
      }

      let page = 1;
      let hasMore = true;
      let totalSynced = 0;

      while (hasMore) {
        const { syncedCount, hasMore: pageHasMore } = await syncContactsPage({
          ghlApiKey: tenant.ghlApiKey,
          locationId,
          page,
          limit: env.CONTACT_SYNC_PAGE_SIZE
        });

        totalSynced += syncedCount;
        hasMore = pageHasMore;
        page += 1;
      }

      await TenantCredential.updateOne(
        { locationId },
        {
          $set: {
            lastSyncedAt: new Date()
          }
        }
      );

      logger.info({ locationId, totalSynced }, "Contact sync job finished");
      return { locationId, totalSynced };
    },
    {
      connection: buildBullConnection(),
      concurrency: 3
    }
  );

  worker.on("failed", (job, error) => {
    logger.error({ err: error, jobId: job?.id, locationId: job?.data?.locationId }, "Contact sync failed");
  });

  worker.on("completed", (job) => {
    logger.info({ jobId: job.id, locationId: job.data.locationId }, "Contact sync completed");
  });

  return worker;
};

export const stopContactSyncWorker = async () => {
  if (worker) {
    await worker.close();
    worker = undefined;
  }
};
