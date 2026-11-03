import { createRateLimiter } from "@tpl/core";

type Limiter = ReturnType<typeof createRateLimiter>;
type Limiters = {
  loginIp: Limiter;
  loginEmail: Limiter;
  keranjangIp: Limiter;
  ringkasanIp: Limiter;
  voucherIp: Limiter;
  pesananIp: Limiter;
  pesananTelepon: Limiter;
  lacakIp: Limiter;
  lacakKode: Limiter;
  buktiIp: Limiter;
  buktiKode: Limiter;
};
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
    // detail keranjang: 120 / menit / IP (dipanggil tiap perubahan isi keranjang)
    keranjangIp: createRateLimiter({ limit: dariEnv("KERANJANG_LIMIT", 120), windowMs: 60_000 }),
    // pratinjau checkout: 120 / menit / IP; yang membawa voucher juga dihitung di voucherIp (20 / 10 menit) → tebak kode mahal
    ringkasanIp: createRateLimiter({ limit: dariEnv("RINGKASAN_LIMIT", 120), windowMs: 60_000 }),
    voucherIp: createRateLimiter({ limit: dariEnv("VOUCHER_LIMIT", 20), windowMs: 10 * 60_000 }),
    // membuat pesanan: 10 / jam / IP dan 6 / jam / nomor HP (mencegah menguras stok dengan pesanan palsu)
    pesananIp: createRateLimiter({ limit: dariEnv("PESANAN_LIMIT_IP", 10), windowMs: 60 * 60_000 }),
    pesananTelepon: createRateLimiter({
      limit: dariEnv("PESANAN_LIMIT_HP", 6),
      windowMs: 60 * 60_000,
    }),
    // lacak pesanan: 10 / 15 menit / IP dan 8 / 15 menit / kode (menahan tebak kode+HP, termasuk terdistribusi)
    lacakIp: createRateLimiter({ limit: dariEnv("LACAK_LIMIT_IP", 10), windowMs: 15 * 60_000 }),
    lacakKode: createRateLimiter({ limit: dariEnv("LACAK_LIMIT_KODE", 8), windowMs: 15 * 60_000 }),
    // unggah bukti bayar: 5 / jam / IP dan 5 / jam / kode
    buktiIp: createRateLimiter({ limit: dariEnv("BUKTI_LIMIT_IP", 5), windowMs: 60 * 60_000 }),
    buktiKode: createRateLimiter({ limit: dariEnv("BUKTI_LIMIT_KODE", 5), windowMs: 60 * 60_000 }),
  };
  return g.__limiters;
}
