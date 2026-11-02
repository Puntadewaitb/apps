import { createRateLimiter } from "@tpl/core";

type Limiter = ReturnType<typeof createRateLimiter>;
type Limiters = { loginIp: Limiter; loginEmail: Limiter };
/** Bilangan bulat positif dari env; selain itu pakai bawaan. */
const dariEnv = (nama: string, bawaan: number) => {
  const n = Number(process.env[nama]);
  return Number.isInteger(n) && n > 0 ? n : bawaan;
};
const g = globalThis as unknown as { __limiters?: Limiters };

/** Singleton per proses (in-memory). Ganti store dengan Redis untuk multi-instance. */
export function limiters(): Limiters {
  g.__limiters ??= {
    // Bawaan 10 percobaan login / 15 menit / IP (LOGIN_LIMIT_IP)
    loginIp: createRateLimiter({ limit: dariEnv("LOGIN_LIMIT_IP", 10), windowMs: 15 * 60_000 }),
    // batas longgar per akun (LOGIN_LIMIT_EMAIL, bawaan 20): menahan brute force terdistribusi tanpa mudah dipakai mengunci admin
    loginEmail: createRateLimiter({
      limit: dariEnv("LOGIN_LIMIT_EMAIL", 20),
      windowMs: 15 * 60_000,
    }),
  };
  return g.__limiters;
}
