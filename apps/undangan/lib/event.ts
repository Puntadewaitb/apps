import { cache } from "react";
import { db } from "./db";

/** Slug acara aktif (env EVENT_SLUG, default acara demo). */
export function activeSlug(): string {
  return process.env.EVENT_SLUG || "raka-anisa";
}

/** Acara aktif beserta hitungan ringkas; null bila belum ada (mis. belum seed). */
export const getActiveEvent = cache(async () => {
  return db().event.findUnique({ where: { slug: activeSlug() } });
});
