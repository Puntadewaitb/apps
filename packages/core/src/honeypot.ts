/** Nama field jebakan default. Sembunyikan dengan CSS (bukan type="hidden"), tabIndex=-1, autoComplete="off". */
export const HONEYPOT_FIELD = "website_url";

/** true bila field jebakan terisi → anggap bot. */
export function isHoneypotTripped(
  data: Record<string, unknown> | FormData,
  field: string = HONEYPOT_FIELD,
): boolean {
  const value = data instanceof FormData ? data.get(field) : data[field];
  return typeof value === "string" ? value.trim().length > 0 : value != null && value !== false;
}

/**
 * Time-trap: form yang dikirim lebih cepat dari `minMs` sejak render dianggap bot.
 * `renderedAt` = epoch ms yang dikirim klien (atau ditandatangani server bila perlu ketat).
 */
export function isSubmittedTooFast(renderedAt: number, minMs = 2000, now = Date.now()): boolean {
  if (!Number.isFinite(renderedAt)) return true;
  return now - renderedAt < minMs;
}
