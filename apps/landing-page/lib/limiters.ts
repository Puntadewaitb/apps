import { createRateLimiter } from "@tpl/core";

type Limiters = {
  lead: ReturnType<typeof createRateLimiter>;
  login: ReturnType<typeof createRateLimiter>;
};
const g = globalThis as unknown as { __limiters?: Limiters };

/** Singleton per proses (in-memory). Ganti store dengan Redis untuk multi-instance. */
export function limiters(): Limiters {
  g.__limiters ??= {
    // 5 pengiriman form / 10 menit / IP
    lead: createRateLimiter({
      limit: Number(process.env.LEAD_RATE_LIMIT ?? 5),
      windowMs: 10 * 60_000,
    }),
    // 5 percobaan login / 15 menit / IP
    login: createRateLimiter({ limit: 5, windowMs: 15 * 60_000 }),
  };
  return g.__limiters;
}
