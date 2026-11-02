import { createRateLimiter } from "@tpl/core";

type Limiter = ReturnType<typeof createRateLimiter>;
type Limiters = { loginIp: Limiter; loginEmail: Limiter };
const g = globalThis as unknown as { __limiters?: Limiters };

/** Singleton per proses (in-memory). Ganti store dengan Redis untuk multi-instance. */
export function limiters(): Limiters {
  g.__limiters ??= {
    // 10 percobaan login / 15 menit / IP
    loginIp: createRateLimiter({ limit: 10, windowMs: 15 * 60_000 }),
    // batas longgar per akun: menahan brute force terdistribusi tanpa mudah dipakai mengunci admin
    loginEmail: createRateLimiter({ limit: 20, windowMs: 15 * 60_000 }),
  };
  return g.__limiters;
}
