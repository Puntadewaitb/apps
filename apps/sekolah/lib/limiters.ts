import { createRateLimiter } from "@tpl/core";

type Limiter = ReturnType<typeof createRateLimiter>;
type Limiters = {
  loginIp: Limiter;
  loginEmail: Limiter;
  daftarIp: Limiter;
  statusIp: Limiter;
  statusNomor: Limiter;
};
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
    // PPDB: 5 pendaftaran / jam / IP (formulir panjang + unggah berkas)
    daftarIp: createRateLimiter({ limit: dariEnv("PPDB_LIMIT_DAFTAR", 5), windowMs: 60 * 60_000 }),
    // cek status: 10 / 15 menit / IP dan 8 / 15 menit / nomor (menahan tebak-token terdistribusi)
    statusIp: createRateLimiter({
      limit: dariEnv("PPDB_LIMIT_STATUS_IP", 10),
      windowMs: 15 * 60_000,
    }),
    statusNomor: createRateLimiter({ limit: 8, windowMs: 15 * 60_000 }),
  };
  return g.__limiters;
}
