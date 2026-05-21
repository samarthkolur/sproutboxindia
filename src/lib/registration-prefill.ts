export const registrationPrefillKey = "sproutbox-registration-prefill";

export type RegistrationPrefill = {
  role: "GROWER" | "RESTAURANT";
  name: string;
  email: string;
  password: string;
};

export function saveRegistrationPrefill(prefill: RegistrationPrefill) {
  window.sessionStorage.setItem(registrationPrefillKey, JSON.stringify(prefill));
}

export function readRegistrationPrefill(role: RegistrationPrefill["role"]) {
  if (typeof window === "undefined") return null;

  const stored = window.sessionStorage.getItem(registrationPrefillKey);
  if (!stored) return null;

  try {
    const parsed = JSON.parse(stored) as RegistrationPrefill;
    return parsed.role === role ? parsed : null;
  } catch {
    window.sessionStorage.removeItem(registrationPrefillKey);
    return null;
  }
}

export function clearRegistrationPrefill() {
  if (typeof window !== "undefined") {
    window.sessionStorage.removeItem(registrationPrefillKey);
  }
}
