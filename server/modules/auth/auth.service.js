import { TenantCredential } from "../../models/tenant.model.js";
import { connectGhlSchema } from "./auth.validation.js";
import { generateAccessKey, hashAccessKey } from "../../utils/access-key.js";
import { enqueueContactSyncJob } from "../../jobs/contact-sync.queue.js";

export const connectGhlAccount = async (payload) => {
  const { locationId, ghlApiKey } = connectGhlSchema.parse(payload);

  const accessKey = generateAccessKey({ locationId, ghlApiKey });
  const accessKeyHash = hashAccessKey(accessKey);

  await TenantCredential.findOneAndUpdate(
    { locationId },
    {
      locationId,
      ghlApiKey,
      accessKeyHash
    },
    {
      upsert: true,
      new: true,
      setDefaultsOnInsert: true
    }
  );

  // Initial sync runs asynchronously via BullMQ to avoid blocking request latency.
  await enqueueContactSyncJob(locationId);

  return { accessKey };
};
