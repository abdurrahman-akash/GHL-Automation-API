import { asyncHandler } from "../../utils/async-handler.js";
import { checkDuplicatesForTenant } from "./duplicate.service.js";

export const checkDuplicateController = asyncHandler(async (req, res) => {
  const result = await checkDuplicatesForTenant({
    locationId: req.tenant.locationId,
    payload: req.body
  });

  res.status(200).json(result);
});
