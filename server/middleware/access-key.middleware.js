import { TenantCredential } from "../models/tenant.model.js";
import { hashAccessKey } from "../utils/access-key.js";
import { ApiError } from "../utils/api-error.js";
import { env } from "../config/env.js";

export const authenticateAccessKey = async (req, res, next) => {
  const headerAccessKey = req.header("x-access-key");
  const cookieAccessKey = req.cookies?.[env.ACCESS_KEY_COOKIE_NAME];
  const accessKey = headerAccessKey || cookieAccessKey;

  if (!accessKey) {
    return next(new ApiError(401, "Authentication required: provide x-access-key header or access key cookie"));
  }

  const accessKeyHash = hashAccessKey(accessKey);
  const tenant = await TenantCredential.findOne({ accessKeyHash }).lean();

  if (!tenant) {
    return next(new ApiError(401, "Invalid access key"));
  }

  req.tenant = {
    locationId: tenant.locationId,
    tenantId: tenant._id.toString()
  };

  return next();
};
