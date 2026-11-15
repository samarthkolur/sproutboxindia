// @vitest-environment node
import { describe, expect, it } from "vitest";
import { passwordSchema } from "@/lib/schemas";
import { MIN_PASSWORD_LENGTH, isValidEmail, isValidPhone, safeCallbackUrl } from "./validation";

describe("isValidEmail", () => {
  it.each(["a@b.co", "first.last@example.com", " padded@example.com "])("accepts %s", (value) => {
    expect(isValidEmail(value)).toBe(true);
  });

  it.each(["", "plain", "a@b", "a b@c.com", "@b.com", "a@.com "])("rejects %j", (value) => {
    expect(isValidEmail(value)).toBe(false);
  });
});

describe("isValidPhone", () => {
  it("counts digits, ignoring formatting", () => {
    expect(isValidPhone("+91 98765 43210")).toBe(true);
    expect(isValidPhone("123-4567")).toBe(true);
  });

  it("needs at least seven digits, as the API does", () => {
    expect(isValidPhone("12345")).toBe(false);
    expect(isValidPhone("")).toBe(false);
  });
});

describe("password rule", () => {
  it("matches the server schema", () => {
    expect(passwordSchema.safeParse("a".repeat(MIN_PASSWORD_LENGTH)).success).toBe(true);
    expect(passwordSchema.safeParse("a".repeat(MIN_PASSWORD_LENGTH - 1)).success).toBe(false);
  });
});

describe("safeCallbackUrl", () => {
  it("keeps a path on this site", () => {
    expect(safeCallbackUrl("/grower/tasks")).toBe("/grower/tasks");
    expect(safeCallbackUrl("/admin/qc?batch=1")).toBe("/admin/qc?batch=1");
  });

  it("falls back for nothing at all", () => {
    expect(safeCallbackUrl(null)).toBe("/dashboard");
    expect(safeCallbackUrl("")).toBe("/dashboard");
    expect(safeCallbackUrl(undefined, "/home")).toBe("/home");
  });

  it.each(["https://evil.example", "//evil.example", "/\\evil.example", "javascript:alert(1)", "grower/tasks"])(
    "refuses %s",
    (value) => {
      expect(safeCallbackUrl(value)).toBe("/dashboard");
    }
  );
});
