import { createRateLimiter } from "@tpl/core";

type Limiter = ReturnType<typeof createRateLimiter>;
type Limiters = { rsvp: Limiter; wish: Limiter; read: Limiter; login: Limiter };
const g = globalThis as unknown as { __limiters?: Limiters };

/** Singleton per proses (in-memory). Ganti store dengan Redis untuk multi-instance. */
export function limiters(): Limiters {
  g.__limiters ??= {
    rsvp: createRateLimiter({ limit: 5, windowMs: 10 * 60_000 }),
    wish: createRateLimiter({ limit: 5, windowMs: 10 * 60_000 }),
    // pembacaan daftar ucapan (polling): longgar tapi tetap dibatasi
    read: createRateLimiter({ limit: 120, windowMs: 60_000 }),
    // 5 percobaan login / 15 menit / IP
    login: createRateLimiter({ limit: 5, windowMs: 15 * 60_000 }),
  };
  return g.__limiters;
}
