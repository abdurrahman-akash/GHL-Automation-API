import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../services/redis.service.js", () => ({
  checkDuplicateLookup: vi.fn()
}));

import { checkDuplicateLookup } from "../services/redis.service.js";
import { checkDuplicatesForTenant } from "../modules/duplicate/duplicate.service.js";

describe("duplicate service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("normalizes inputs and checks Redis only", async () => {
    checkDuplicateLookup.mockResolvedValue({
      email: "duplicate",
      phone: "unique"
    });

    const result = await checkDuplicatesForTenant({
      locationId: "loc_123",
      payload: {
        email: "  TEST@Example.com ",
        phone: " +1 (202) 555-0110 "
      }
    });

    expect(checkDuplicateLookup).toHaveBeenCalledWith({
      locationId: "loc_123",
      email: "test@example.com",
      phone: "+12025550110"
    });
    expect(result).toEqual({ email: "duplicate", phone: "unique" });
  });

  it("throws when both email and phone are missing", async () => {
    await expect(
      checkDuplicatesForTenant({
        locationId: "loc_123",
        payload: {}
      })
    ).rejects.toThrow("At least one of email or phone is required");
  });
});
