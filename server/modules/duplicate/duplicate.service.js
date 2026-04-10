import { duplicateCheckSchema } from "./duplicate.validation.js";
import { normalizeEmail, normalizePhone } from "../../utils/normalization.js";
import { checkDuplicateLookup } from "../../services/redis.service.js";

export const checkDuplicatesForTenant = async ({ locationId, payload }) => {
  const validated = duplicateCheckSchema.parse(payload);

  const normalizedEmail = normalizeEmail(validated.email);
  const normalizedPhone = normalizePhone(validated.phone);

  return checkDuplicateLookup({
    locationId,
    email: normalizedEmail,
    phone: normalizedPhone
  });
};
