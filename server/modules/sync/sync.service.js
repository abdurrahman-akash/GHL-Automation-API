import { TenantCredential } from "../../models/tenant.model.js";
import { ApiError } from "../../utils/api-error.js";
import { syncAllContactsForTenant } from "../../services/sync.service.js";
import { logger } from "../../utils/logger.js";
import { initRedis } from "../../services/redis.service.js";

export const triggerManualSyncForTenant = async ({ locationId }) => {
  const tenant = await TenantCredential.findOne({ locationId }, { ghlApiKey: 1 }).lean();

  if (!tenant) {
    throw new ApiError(404, "Tenant not found");
  }

  if (!tenant.ghlApiKey) {
    throw new ApiError(400, "Tenant API key is not configured");
  }

  try {
    await initRedis();

    const { totalSynced } = await syncAllContactsForTenant({
      ghlApiKey: tenant.ghlApiKey,
      locationId
    });

    const now = new Date();

    await TenantCredential.updateOne(
      { locationId },
      {
        $set: {
          lastSyncedAt: now
        }
      }
    );

    return {
      message: "Sync completed successfully",
      status: "completed",
      syncStatus: "completed",
      progress: 100,
      syncedCount: totalSynced,
      lastSyncedAt: now.toISOString(),
      lastSyncTime: now.toISOString(),
      jobId: null
    };
  } catch (error) {
    logger.error({ err: error, locationId }, "Manual contact sync failed");
    throw new ApiError(502, "Failed to sync contacts from GHL");
  }
};

export const getSyncStatusForTenant = async ({ locationId }) => {
  const tenant = await TenantCredential.findOne({ locationId }, { lastSyncedAt: 1 }).lean();

  if (!tenant) {
    throw new ApiError(404, "Tenant not found");
  }

  const syncStatus = tenant.lastSyncedAt ? "completed" : "idle";

  return {
    status: syncStatus,
    syncStatus,
    state: syncStatus,
    progress: tenant.lastSyncedAt ? 100 : null,
    lastSyncedAt: tenant.lastSyncedAt ?? null,
    lastSyncTime: tenant.lastSyncedAt ?? null,
    jobId: null
  };
};
