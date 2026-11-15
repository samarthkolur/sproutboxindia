import { fssaiDigits, type FieldErrors } from "@/lib/join-validation";
import { isValidPhone } from "@/lib/validation";

// What the grower profile page may edit, and the checks it runs first. The server
// (growerProfileSchema, PATCH /api/grower/profile) stays the source of truth; these
// give faster, kinder feedback and never accept more than it does.

export type ProfileSection = "contact" | "space" | "payout" | "fssai";

export const SECTION_FIELDS: Record<ProfileSection, readonly string[]> = {
  contact: ["phone", "address", "city", "pincode"],
  space: ["spaceAvailable"],
  payout: ["upiId", "bankAccount", "bankIFSC"],
  fssai: ["fssaiRegNumber"],
};

const UPI = /^[\w.\-]{2,}@[A-Za-z][\w.\-]*$/;
const IFSC = /^[A-Z]{4}0[A-Z0-9]{6}$/;

export function validateProfileSection(section: ProfileSection, values: Record<string, string>): FieldErrors {
  const get = (name: string) => (values[name] ?? "").trim();
  const errors: FieldErrors = {};

  switch (section) {
    case "contact":
      if (!isValidPhone(get("phone"))) errors.phone = "Enter a valid phone number, at least 7 digits.";
      if (get("address").length < 5) errors.address = "Enter your full address.";
      if (get("city").length < 2) errors.city = "Enter your city.";
      if (!/^\d{6}$/.test(get("pincode"))) errors.pincode = "A PIN code has 6 digits.";
      break;
    case "space":
      if (!(Number.isInteger(Number(get("spaceAvailable"))) && Number(get("spaceAvailable")) > 0)) {
        errors.spaceAvailable = "Enter a whole number of square feet, greater than 0.";
      }
      break;
    case "payout":
      if (get("upiId") && !UPI.test(get("upiId"))) errors.upiId = "Enter a valid UPI ID, like name@upi.";
      if (get("bankAccount") && !/^\d{9,18}$/.test(get("bankAccount"))) errors.bankAccount = "A bank account number has 9 to 18 digits.";
      if (get("bankIFSC") && !IFSC.test(get("bankIFSC").toUpperCase())) errors.bankIFSC = "An IFSC code looks like HDFC0001234.";
      if (get("bankAccount") && !get("bankIFSC")) errors.bankIFSC = "Add the IFSC code for this account.";
      break;
    case "fssai":
      if (fssaiDigits(get("fssaiRegNumber")).length !== 14) errors.fssaiRegNumber = "An FSSAI number has 14 digits.";
      break;
  }
  return errors;
}

/** The request body for one section: trimmed, with only that section's fields. */
export function profilePayload(section: ProfileSection, values: Record<string, string>) {
  const payload: Record<string, string> = {};
  for (const name of SECTION_FIELDS[section]) {
    const raw = (values[name] ?? "").trim();
    payload[name] = name === "fssaiRegNumber" ? fssaiDigits(raw) : name === "bankIFSC" ? raw.toUpperCase() : raw;
  }
  return payload;
}
