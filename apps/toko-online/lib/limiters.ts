import { createRateLimiter } from "@tpl/core";

type Limiter = ReturnType<typeof createRateLimiter>;
type Limiters = { keranjangIp: Limiter };
const dariEnv = (nama: string, bawaan: number) => {
  const n = Number(process.env[nama]);
  return Number.isInteger(n) && n > 0 ? n : bawaan;
};
const g = globalThis as unknown as { __limiters?: Limiters };

/** Singleton per proses (in-memory). Ganti store dengan Redis untuk multi-instance. */
export function limiters(): Limiters {
  g.__limiters ??= {
    // detail keranjang: 120 / menit / IP (dipanggil tiap perubahan isi keranjang)
    keranjangIp: createRateLimiter({ limit: dariEnv("KERANJANG_LIMIT", 120), windowMs: 60_000 }),
  };
  return g.__limiters;
}
