import { contactSyncQueue, enqueueContactSyncJob } from "../../jobs/contact-sync.queue.js";
import { TenantCredential } from "../../models/tenant.model.js";
import { ApiError } from "../../utils/api-error.js";

const PENDING_STATES = ["active", "waiting", "delayed"];

const asProgress = (value) => {
  if (typeof value !== "number" || Number.isNaN(value)) {
    return null;
  }

  return Math.min(100, Math.max(0, Math.round(value)));
};

const matchTenantJob = (jobs, locationId) =>
  jobs.find((job) => job?.data?.locationId === locationId) ?? null;

export const triggerManualSyncForTenant = async ({ locationId }) => {
  const tenant = await TenantCredential.findOne({ locationId }).lean();

  if (!tenant) {
    throw new ApiError(404, "Tenant not found");
  }

  const job = await enqueueContactSyncJob(locationId);

  return {
    message: "Sync job queued successfully",
    status: "in_progress",
    syncStatus: "in_progress",
    jobId: String(job.id)
  };
};

export const getSyncStatusForTenant = async ({ locationId }) => {
  const tenant = await TenantCredential.findOne({ locationId }, { lastSyncedAt: 1 }).lean();

  if (!tenant) {
    throw new ApiError(404, "Tenant not found");
  }

  const [pendingJobs, failedJobs] = await Promise.all([
    contactSyncQueue.getJobs(PENDING_STATES, 0, 100, false),
    contactSyncQueue.getJobs(["failed"], 0, 30, false)
  ]);

  const pendingJob = matchTenantJob(pendingJobs, locationId);
  const failedJob = matchTenantJob(failedJobs, locationId);

  let syncStatus = "idle";
  if (pendingJob) {
    syncStatus = "in_progress";
  } else if (failedJob && !tenant.lastSyncedAt) {
    syncStatus = "failed";
  } else if (tenant.lastSyncedAt) {
    syncStatus = "completed";
  }

  return {
    status: syncStatus,
    syncStatus,
    state: syncStatus,
    progress: pendingJob ? asProgress(pendingJob.progress) : null,
    lastSyncedAt: tenant.lastSyncedAt ?? null,
    lastSyncTime: tenant.lastSyncedAt ?? null,
    jobId: pendingJob ? String(pendingJob.id) : null
  };
};
