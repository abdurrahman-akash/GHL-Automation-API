import { Queue } from "bullmq";
import { buildBullConnection, CONTACT_SYNC_QUEUE } from "../config/bullmq.js";

const queueConnection = buildBullConnection();

export const contactSyncQueue = new Queue(CONTACT_SYNC_QUEUE, {
  connection: queueConnection,
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: "exponential",
      delay: 1000
    },
    removeOnComplete: {
      age: 86400,
      count: 1000
    },
    removeOnFail: {
      age: 604800,
      count: 5000
    }
  }
});

export const enqueueContactSyncJob = async (locationId) =>
  contactSyncQueue.add(
    "sync-location-contacts",
    { locationId },
    {
      jobId: `sync:${locationId}:${Date.now()}`
    }
  );
