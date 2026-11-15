import { translateText } from "@/lib/i18n";

// Mirrors LanguageProvider: the same elements are skipped, and the same
// attributes are translated. Anything it returns would show up in English to a
// Kannada or Hindi user.
const IGNORED = "script,style,noscript,svg,canvas,code,pre,textarea,input,[contenteditable='true'],[data-i18n-ignore]";
const ATTRIBUTES = ["placeholder", "title", "aria-label"] as const;

// Brand names, acronyms and units that read the same in every language.
const LITERAL = new Set(["SproutBox", "UPI", "FSSAI", "GST", "PIN", "QC", "kg", "OpenStreetMap", "Leaflet"]);

function needsTranslation(text: string) {
  const value = text.replace(/\s+/g, " ").trim();
  if (!/[A-Za-z]/.test(value)) return false; // numbers, symbols, currency
  if (LITERAL.has(value)) return false;
  if (value.includes("@") || /^\+?\d/.test(value)) return false; // emails and phone examples
  return translateText(value, "kn") === value || translateText(value, "hi") === value;
}

export function findUntranslated(root: ParentNode): string[] {
  const missing = new Set<string>();

  const walker = document.createTreeWalker(root as Node, NodeFilter.SHOW_TEXT);
  for (let node = walker.nextNode(); node; node = walker.nextNode()) {
    const parent = node.parentElement;
    if (!parent || parent.closest(IGNORED)) continue;
    const text = node.nodeValue ?? "";
    if (needsTranslation(text)) missing.add(text.replace(/\s+/g, " ").trim());
  }

  const attributed = (root as Element).querySelectorAll?.(ATTRIBUTES.map((a) => `[${a}]`).join(",")) ?? [];
  attributed.forEach((element) => {
    if (element.closest(IGNORED) && !element.matches("input,textarea")) return;
    if (element.closest("[data-i18n-ignore]")) return;
    for (const attribute of ATTRIBUTES) {
      const value = element.getAttribute(attribute);
      if (value && needsTranslation(value)) missing.add(value.replace(/\s+/g, " ").trim());
    }
  });

  return Array.from(missing).sort();
}
