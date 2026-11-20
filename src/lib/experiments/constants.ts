export const VISITOR_COOKIE = "sb_vid";
export const FORCE_COOKIE = "sb_force";
export const VISITOR_HEADER = "x-sb-vid";
export const BOT_HEADER = "x-sb-bot";
export const FORCE_HEADER = "x-sb-force";

export const BOT_UA =
  /bot|crawl|spider|slurp|bingpreview|facebookexternalhit|whatsapp|preview|lighthouse|headless/i;

/** ?sb_force=… is honoured outside production, or when explicitly allowed. */
export function forceAllowed(): boolean {
  return (
    process.env.NODE_ENV !== "production" ||
    process.env.ALLOW_FORCE_VARIANT === "true"
  );
}
