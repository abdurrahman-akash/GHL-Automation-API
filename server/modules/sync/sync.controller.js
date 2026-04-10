import { asyncHandler } from "../../utils/async-handler.js";
import { getSyncStatusForTenant, triggerManualSyncForTenant } from "./sync.service.js";

export const triggerSyncController = asyncHandler(async (req, res) => {
  const result = await triggerManualSyncForTenant({
    locationId: req.tenant.locationId
  });

  res.status(202).json(result);
});

export const getSyncStatusController = asyncHandler(async (req, res) => {
  const result = await getSyncStatusForTenant({
    locationId: req.tenant.locationId
  });

  res.status(200).json(result);
});
