// @vitest-environment node
import { describe, expect, it } from "vitest";
import { growerRegisterSchema, restaurantRegisterSchema } from "@/lib/schemas";
import {
  GROWER_STEPS,
  LOCATION_ERROR,
  RESTAURANT_STEPS,
  firstInvalidStep,
  fssaiDigits,
  validateGrowerStep,
  validateRestaurantStep,
  type GrowerFormData,
  type RestaurantFormData,
} from "./join-validation";

const grower: GrowerFormData = {
  name: "Asha Rao",
  email: "asha@example.com",
  password: "secret1",
  phone: "+91 98765 43210",
  city: "Mysuru",
  address: "12 Temple Road, Mysuru",
  pincode: "570001",
  areaSize: "100",
  upiId: "asha@upi",
  fssaiRegNumber: "",
};

const restaurant: RestaurantFormData = {
  businessName: "Green Bowl",
  name: "Ravi",
  email: "ravi@example.com",
  password: "secret1",
  phone: "9876543210",
  gstNumber: "",
  address: "1 MG Road, Bengaluru",
  city: "Bengaluru",
  pincode: "560001",
};

const opts = { passwordPrefilled: false };

describe("validateGrowerStep", () => {
  it("accepts a complete, valid form at every step", () => {
    for (let step = 0; step < GROWER_STEPS.length; step++) {
      expect(validateGrowerStep(step, grower, opts)).toEqual({});
    }
  });

  it("personal: requires name, a valid email, a password and a phone number", () => {
    const errors = validateGrowerStep(0, { ...grower, name: "A", email: "nope", password: "abc", phone: "123" }, opts);
    expect(Object.keys(errors).sort()).toEqual(["email", "name", "password", "phone"]);
  });

  it("personal: skips the password when it was already entered on /register", () => {
    expect(validateGrowerStep(0, { ...grower, password: "" }, { passwordPrefilled: true })).toEqual({});
    expect(validateGrowerStep(0, { ...grower, password: "" }, opts).password).toBeDefined();
  });

  it("personal: needs a phone because the API rejects a missing one", () => {
    expect(validateGrowerStep(0, { ...grower, phone: "" }, opts).phone).toBeDefined();
  });

  it("location: requires the map to have filled address, city and PIN", () => {
    for (const missing of ["address", "city", "pincode"] as const) {
      expect(validateGrowerStep(1, { ...grower, [missing]: "" }, opts)).toEqual({ address: LOCATION_ERROR });
    }
  });

  it("space: needs an area above zero", () => {
    for (const bad of ["", "0", "-5", "abc"]) {
      expect(validateGrowerStep(2, { ...grower, areaSize: bad }, opts).areaSize).toBeDefined();
    }
    expect(validateGrowerStep(2, { ...grower, areaSize: "25" }, opts)).toEqual({});
  });

  it("kit: UPI is optional but must look like one when given", () => {
    expect(validateGrowerStep(3, { ...grower, upiId: "" }, opts)).toEqual({});
    expect(validateGrowerStep(3, { ...grower, upiId: "name@okbank" }, opts)).toEqual({});
    expect(validateGrowerStep(3, { ...grower, upiId: "not a upi" }, opts).upiId).toBeDefined();
  });

  it("compliance: FSSAI is optional, but exactly 14 digits when given", () => {
    expect(validateGrowerStep(4, { ...grower, fssaiRegNumber: "" }, opts)).toEqual({});
    expect(validateGrowerStep(4, { ...grower, fssaiRegNumber: "12345678901234" }, opts)).toEqual({});
    expect(validateGrowerStep(4, { ...grower, fssaiRegNumber: "1234 5678 9012 34" }, opts)).toEqual({});
    expect(validateGrowerStep(4, { ...grower, fssaiRegNumber: "12345" }, opts).fssaiRegNumber).toBeDefined();
  });

  it("agrees with the server schema on what it accepts", () => {
    const payload = { ...grower, kit: "Starter", areaSize: Number(grower.areaSize) };
    expect(growerRegisterSchema.safeParse(payload).success).toBe(true);
    // The phone rule must never be looser than the server's, or the wizard passes and the API fails.
    expect(growerRegisterSchema.safeParse({ ...payload, phone: "123456" }).success).toBe(false);
    expect(validateGrowerStep(0, { ...grower, phone: "123456" }, opts).phone).toBeDefined();
  });
});

describe("validateRestaurantStep", () => {
  it("accepts a complete, valid form at every step", () => {
    for (let step = 0; step < RESTAURANT_STEPS.length; step++) {
      expect(validateRestaurantStep(step, restaurant, opts)).toEqual({});
    }
  });

  it("business: requires the restaurant and contact names, email, password and phone", () => {
    const errors = validateRestaurantStep(
      0,
      { ...restaurant, businessName: "", name: "", email: "", password: "", phone: "" },
      opts
    );
    expect(Object.keys(errors).sort()).toEqual(["businessName", "email", "name", "password", "phone"]);
  });

  it("business: GST is optional, 15 characters when given", () => {
    expect(validateRestaurantStep(0, { ...restaurant, gstNumber: "22AAAAA0000A1Z5" }, opts)).toEqual({});
    expect(validateRestaurantStep(0, { ...restaurant, gstNumber: "22AAA" }, opts).gstNumber).toBeDefined();
  });

  it("location: requires the map to have filled the address", () => {
    expect(validateRestaurantStep(1, { ...restaurant, pincode: "" }, opts)).toEqual({ address: LOCATION_ERROR });
  });

  it("crops and schedule have nothing to validate", () => {
    expect(validateRestaurantStep(2, restaurant, opts)).toEqual({});
    expect(validateRestaurantStep(3, restaurant, opts)).toEqual({});
  });

  it("agrees with the server schema", () => {
    expect(restaurantRegisterSchema.safeParse({ ...restaurant, gstNumber: "" }).success).toBe(true);
    expect(restaurantRegisterSchema.safeParse({ ...restaurant, phone: "123456" }).success).toBe(false);
    expect(validateRestaurantStep(0, { ...restaurant, phone: "123456" }, opts).phone).toBeDefined();
  });
});

describe("helpers", () => {
  it("fssaiDigits keeps digits only", () => {
    expect(fssaiDigits("1234-5678 9012.34")).toBe("12345678901234");
  });

  it("firstInvalidStep finds the earliest broken step, or null", () => {
    const validate = (s: number) => validateGrowerStep(s, { ...grower, areaSize: "0", phone: "1" }, opts);
    expect(firstInvalidStep(validate, GROWER_STEPS.length)).toBe(0);
    expect(firstInvalidStep((s) => validateGrowerStep(s, grower, opts), GROWER_STEPS.length)).toBeNull();
  });
});
