import { cookies, headers } from "next/headers";
import { assignAll, parseForce } from "./assign";
import type { Assignments } from "./config";
import {
  BOT_HEADER,
  FORCE_COOKIE,
  FORCE_HEADER,
  VISITOR_COOKIE,
  VISITOR_HEADER,
  forceAllowed,
} from "./constants";

export type ExperimentContext = {
  assignments: Assignments;
  /** Bots and QA-forced views are never tracked. */
  trackable: boolean;
  isQA: boolean;
};

/**
 * Reads the visitor id set by middleware and returns every experiment's
 * variant for this request. Call from a server component / layout so the
 * right variant is in the first HTML (no flicker).
 */
export function getExperimentContext(): ExperimentContext {
  const h = headers();
  const c = cookies();

  // On the very first request the cookie isn't readable yet, so middleware
  // also forwards the id as a request header.
  const visitorId = c.get(VISITOR_COOKIE)?.value ?? h.get(VISITOR_HEADER) ?? "anonymous";
  const isBot = h.get(BOT_HEADER) === "1";

  const force = forceAllowed()
    ? parseForce(h.get(FORCE_HEADER) ?? c.get(FORCE_COOKIE)?.value)
    : {};
  const isQA = Object.keys(force).length > 0;

  return {
    assignments: assignAll(visitorId, { isBot, force }),
    trackable: !isBot && !isQA,
    isQA,
  };
}
