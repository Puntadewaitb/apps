import { createRateLimiter } from "@tpl/core";

type Limiter = ReturnType<typeof createRateLimiter>;
type Limiters = { kontak: Limiter; login: Limiter };
const g = globalThis as unknown as { __limiters?: Limiters };

/** Singleton per proses (in-memory). Ganti store dengan Redis untuk multi-instance. */
export function limiters(): Limiters {
  g.__limiters ??= {
    // 5 pesan / 10 menit / IP
    kontak: createRateLimiter({ limit: 5, windowMs: 10 * 60_000 }),
    // 5 percobaan login admin / 15 menit / IP
    login: createRateLimiter({ limit: 5, windowMs: 15 * 60_000 }),
  };
  return g.__limiters;
}
