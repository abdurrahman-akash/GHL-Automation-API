import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../services/redis.service.js", () => ({
  checkDuplicateLookup: vi.fn()
}));

vi.mock("../models/tenant.model.js", () => ({
  TenantCredential: {
    findOne: vi.fn(),
    updateOne: vi.fn()
  }
}));

vi.mock("../services/sync.service.js", () => ({
  syncAllContactsForTenant: vi.fn()
}));

import { checkDuplicateLookup } from "../services/redis.service.js";
import { TenantCredential } from "../models/tenant.model.js";
import { syncAllContactsForTenant } from "../services/sync.service.js";
import { checkDuplicatesForTenant } from "../modules/duplicate/duplicate.service.js";

describe("duplicate service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("normalizes inputs and checks Redis", async () => {
    checkDuplicateLookup.mockResolvedValue({
      email: "duplicate",
      phone: "unique"
    });

    const lean = vi.fn().mockResolvedValue({
      ghlApiKey: "ghl_key_123",
      lastSyncedAt: new Date("2026-01-01T00:00:00.000Z")
    });

    TenantCredential.findOne.mockReturnValue({ lean });

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
    expect(TenantCredential.findOne).toHaveBeenCalled();
    expect(syncAllContactsForTenant).not.toHaveBeenCalled();
    expect(result).toEqual({ email: "duplicate", phone: "unique" });
  });

  it("runs cold-start sync when first lookup is unique and tenant has never synced", async () => {
    checkDuplicateLookup
      .mockResolvedValueOnce({ email: "unique", phone: "unique" })
      .mockResolvedValueOnce({ email: "null", phone: "duplicate" });

    const lean = vi.fn().mockResolvedValue({
      ghlApiKey: "ghl_key_123",
      lastSyncedAt: null
    });

    TenantCredential.findOne.mockReturnValue({ lean });
    syncAllContactsForTenant.mockResolvedValue({ totalSynced: 10 });
    TenantCredential.updateOne.mockResolvedValue({ acknowledged: true });

    const result = await checkDuplicatesForTenant({
      locationId: "loc_123",
      payload: {
        phone: "+1 (202) 555-0110"
      }
    });

    expect(TenantCredential.findOne).toHaveBeenCalledWith(
      { locationId: "loc_123" },
      { ghlApiKey: 1, lastSyncedAt: 1 }
    );
    expect(syncAllContactsForTenant).toHaveBeenCalledWith({
      ghlApiKey: "ghl_key_123",
      locationId: "loc_123"
    });
    expect(TenantCredential.updateOne).toHaveBeenCalledWith(
      { locationId: "loc_123" },
      { $set: { lastSyncedAt: expect.any(Date) } }
    );
    expect(checkDuplicateLookup).toHaveBeenCalledTimes(2);
    expect(result).toEqual({ email: "null", phone: "duplicate" });
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
