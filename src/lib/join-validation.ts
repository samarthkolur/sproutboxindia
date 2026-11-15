import { MIN_PASSWORD_LENGTH, isValidEmail, isValidPhone } from "@/lib/validation";

// Per-step checks for the two sign-up wizards. Pure functions, so they are tested
// without rendering. They return an error message per field; an empty object means
// the step can continue. The server re-validates everything.

export type FieldErrors = Record<string, string | undefined>;

export const GROWER_STEPS = ["Personal", "Location", "Space", "Kit", "Compliance", "Review"] as const;
export const RESTAURANT_STEPS = ["Business", "Location", "Crops", "Schedule", "Review"] as const;

export const LOCATION_ERROR = "Choose a location on the map so address, city, and PIN code can be fetched.";

/** FSSAI registration and licence numbers are 14 digits. */
export function fssaiDigits(value: string) {
  return value.replace(/\D/g, "");
}

export interface GrowerFormData {
  name: string;
  email: string;
  password: string;
  phone: string;
  city: string;
  address: string;
  pincode: string;
  areaSize: string;
  upiId: string;
  fssaiRegNumber: string;
}

export interface RestaurantFormData {
  businessName: string;
  name: string;
  email: string;
  password: string;
  phone: string;
  gstNumber: string;
  address: string;
  city: string;
  pincode: string;
}

function accountErrors(
  data: { name: string; email: string; password: string; phone: string },
  passwordPrefilled: boolean,
  nameMessage: string
): FieldErrors {
  const errors: FieldErrors = {};
  if (data.name.trim().length < 2) errors.name = nameMessage;
  if (!data.email.trim()) errors.email = "Enter your email address.";
  else if (!isValidEmail(data.email)) errors.email = "Enter a valid email address.";
  if (!passwordPrefilled && data.password.length < MIN_PASSWORD_LENGTH) {
    errors.password = "Password must be at least 6 characters.";
  }
  if (!isValidPhone(data.phone)) errors.phone = "Enter a valid phone number, at least 7 digits.";
  return errors;
}

export function validateGrowerStep(step: number, data: GrowerFormData, opts: { passwordPrefilled: boolean }): FieldErrors {
  switch (step) {
    case 0:
      return accountErrors(data, opts.passwordPrefilled, "Enter your full name.");
    case 1:
      return !data.address || !data.city || !data.pincode ? { address: LOCATION_ERROR } : {};
    case 2:
      return !(Number(data.areaSize) > 0) ? { areaSize: "Enter a growing area greater than 0 sq ft." } : {};
    case 3:
      return data.upiId.trim() && !/^[\w.\-]{2,}@[A-Za-z][\w.\-]*$/.test(data.upiId.trim())
        ? { upiId: "Enter a valid UPI ID, like name@upi." }
        : {};
    case 4:
      return data.fssaiRegNumber.trim() && fssaiDigits(data.fssaiRegNumber).length !== 14
        ? { fssaiRegNumber: "An FSSAI number has 14 digits." }
        : {};
    default:
      return {};
  }
}

export function validateRestaurantStep(
  step: number,
  data: RestaurantFormData,
  opts: { passwordPrefilled: boolean }
): FieldErrors {
  switch (step) {
    case 0: {
      const errors = accountErrors(data, opts.passwordPrefilled, "Enter your contact name.");
      if (data.businessName.trim().length < 2) errors.businessName = "Enter your restaurant's name.";
      if (data.gstNumber.trim() && !/^[0-9A-Za-z]{15}$/.test(data.gstNumber.trim())) {
        errors.gstNumber = "A GST number has 15 characters.";
      }
      return errors;
    }
    case 1:
      return !data.address || !data.city || !data.pincode ? { address: LOCATION_ERROR } : {};
    default:
      return {};
  }
}

/** The wizard step a set of field errors belongs to, so a failed submit can jump back to it. */
export function firstInvalidStep(
  validate: (step: number) => FieldErrors,
  stepCount: number
): number | null {
  for (let step = 0; step < stepCount; step++) {
    if (Object.keys(validate(step)).length > 0) return step;
  }
  return null;
}
