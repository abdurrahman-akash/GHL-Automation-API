import { describe, expect, it } from "vitest";
import { expandPhoneLookupVariants, normalizeEmail, normalizePhone } from "../utils/normalization.js";

describe("normalization utils", () => {
  it("normalizes email by trimming and lower-casing", () => {
    expect(normalizeEmail("  USER@Example.COM ")).toBe("user@example.com");
  });

  it("returns null for invalid email inputs", () => {
    expect(normalizeEmail("")).toBeNull();
    expect(normalizeEmail(undefined)).toBeNull();
  });

  it("normalizes phone and preserves leading plus", () => {
    expect(normalizePhone(" +1 (415) 555-0100 ")).toBe("+14155550100");
  });

  it("normalizes local phone to digits", () => {
    expect(normalizePhone(" 0044-7700-900123 ")).toBe("447700900123");
  });

  it("normalizes Bangladesh local mobile to E.164", () => {
    expect(normalizePhone("01303647863")).toBe("+8801303647863");
  });

  it("normalizes 880-prefixed mobile to E.164", () => {
    expect(normalizePhone("8801303647863")).toBe("+8801303647863");
  });

  it("builds lookup variants for historical phone formats", () => {
    expect(expandPhoneLookupVariants("01303647863")).toEqual([
      "+8801303647863",
      "8801303647863",
      "01303647863"
    ]);
  });
});
