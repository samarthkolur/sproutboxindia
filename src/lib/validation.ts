// Client-side checks shared by the auth and join forms. The server (zod schemas
// in lib/schemas.ts) stays the source of truth; these only give faster, kinder
// feedback, so they mirror its rules and never loosen them.

export const MIN_PASSWORD_LENGTH = 6;

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function isValidEmail(value: string) {
  return EMAIL_PATTERN.test(value.trim());
}

// Phone numbers vary too much to pattern-match; the server only requires 7+ characters.
export function isValidPhone(value: string) {
  return value.replace(/[^\d]/g, "").length >= 7;
}

/**
 * Only follow a callback that stays on this site. A link like
 * /login?callbackUrl=https://evil.example would otherwise bounce a freshly signed-in user elsewhere.
 */
export function safeCallbackUrl(value: string | null | undefined, fallback = "/dashboard") {
  if (!value) return fallback;
  if (!value.startsWith("/") || value.startsWith("//") || value.startsWith("/\\")) return fallback;
  return value;
}
