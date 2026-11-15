// @vitest-environment node
import { describe, expect, it } from "vitest";
import { growerProfileSchema } from "@/lib/schemas";
import { SECTION_FIELDS, profilePayload, validateProfileSection, type ProfileSection } from "./grower-profile";

const contact = { phone: "+91 98765 43210", address: "12 MG Road", city: "Bengaluru", pincode: "560001" };

describe("validateProfileSection: contact", () => {
  it("accepts a complete contact block", () => {
    expect(validateProfileSection("contact", contact)).toEqual({});
  });
  it("names each problem", () => {
    const errors = validateProfileSection("contact", { phone: "123", address: "x", city: "", pincode: "5600" });
    expect(Object.keys(errors).sort()).toEqual(["address", "city", "phone", "pincode"]);
  });
});

describe("validateProfileSection: space", () => {
  it("needs a whole positive number", () => {
    expect(validateProfileSection("space", { spaceAvailable: "40" })).toEqual({});
    expect(validateProfileSection("space", { spaceAvailable: "0" }).spaceAvailable).toBeDefined();
    expect(validateProfileSection("space", { spaceAvailable: "2.5" }).spaceAvailable).toBeDefined();
    expect(validateProfileSection("space", { spaceAvailable: "" }).spaceAvailable).toBeDefined();
  });
});

describe("validateProfileSection: payout", () => {
  it("allows everything blank", () => {
    expect(validateProfileSection("payout", { upiId: "", bankAccount: "", bankIFSC: "" })).toEqual({});
  });
  it("checks the UPI id", () => {
    expect(validateProfileSection("payout", { upiId: "asha@upi", bankAccount: "", bankIFSC: "" })).toEqual({});
    expect(validateProfileSection("payout", { upiId: "asha", bankAccount: "", bankIFSC: "" }).upiId).toBeDefined();
  });
  it("needs the IFSC whenever there is an account number, and checks both formats", () => {
    expect(validateProfileSection("payout", { upiId: "", bankAccount: "123456789012", bankIFSC: "" }).bankIFSC).toMatch(/Add the IFSC/);
    expect(validateProfileSection("payout", { upiId: "", bankAccount: "123", bankIFSC: "HDFC0001234" }).bankAccount).toBeDefined();
    expect(validateProfileSection("payout", { upiId: "", bankAccount: "123456789012", bankIFSC: "nope" }).bankIFSC).toMatch(/looks like/);
    expect(validateProfileSection("payout", { upiId: "", bankAccount: "123456789012", bankIFSC: "hdfc0001234" })).toEqual({});
  });
});

describe("validateProfileSection: fssai", () => {
  it("needs exactly 14 digits, ignoring spaces and dashes", () => {
    expect(validateProfileSection("fssai", { fssaiRegNumber: "1234 5678 9012 34" })).toEqual({});
    expect(validateProfileSection("fssai", { fssaiRegNumber: "12345" }).fssaiRegNumber).toBeDefined();
    expect(validateProfileSection("fssai", { fssaiRegNumber: "" }).fssaiRegNumber).toBeDefined();
  });
});

describe("profilePayload", () => {
  it("sends only the section's own fields, trimmed", () => {
    expect(profilePayload("contact", { ...contact, city: "  Bengaluru ", upiId: "leak@upi" })).toEqual({
      ...contact,
      city: "Bengaluru",
    });
  });
  it("normalises FSSAI to digits and IFSC to upper case", () => {
    expect(profilePayload("fssai", { fssaiRegNumber: "1234 5678 9012 34" })).toEqual({ fssaiRegNumber: "12345678901234" });
    expect(profilePayload("payout", { upiId: "", bankAccount: "123456789012", bankIFSC: "hdfc0001234" }).bankIFSC).toBe("HDFC0001234");
  });
  it("produces bodies the server schema accepts", () => {
    const valid: Record<ProfileSection, Record<string, string>> = {
      contact,
      space: { spaceAvailable: "40" },
      payout: { upiId: "asha@upi", bankAccount: "123456789012", bankIFSC: "HDFC0001234" },
      fssai: { fssaiRegNumber: "12345678901234" },
    };
    for (const section of Object.keys(valid) as ProfileSection[]) {
      expect(validateProfileSection(section, valid[section])).toEqual({});
      expect(() => growerProfileSchema.parse(profilePayload(section, valid[section])), section).not.toThrow();
    }
  });
  it("lists every field the server schema can take, so none is silently uneditable", () => {
    const editable = Object.values(SECTION_FIELDS).flat().sort();
    expect(editable).toEqual(Object.keys(growerProfileSchema.shape).sort());
  });
});
