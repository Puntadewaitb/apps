import { createRateLimiter } from "@tpl/core";

type Limiter = ReturnType<typeof createRateLimiter>;
type Limiters = {
  keranjangIp: Limiter;
  ringkasanIp: Limiter;
  voucherIp: Limiter;
  pesananIp: Limiter;
  pesananTelepon: Limiter;
};
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
    // pratinjau checkout: 120 / menit / IP; yang membawa voucher juga dihitung di voucherIp (20 / 10 menit) → tebak kode mahal
    ringkasanIp: createRateLimiter({ limit: dariEnv("RINGKASAN_LIMIT", 120), windowMs: 60_000 }),
    voucherIp: createRateLimiter({ limit: dariEnv("VOUCHER_LIMIT", 20), windowMs: 10 * 60_000 }),
    // membuat pesanan: 10 / jam / IP dan 6 / jam / nomor HP (mencegah menguras stok dengan pesanan palsu)
    pesananIp: createRateLimiter({ limit: dariEnv("PESANAN_LIMIT_IP", 10), windowMs: 60 * 60_000 }),
    pesananTelepon: createRateLimiter({
      limit: dariEnv("PESANAN_LIMIT_HP", 6),
      windowMs: 60 * 60_000,
    }),
  };
  return g.__limiters;
}
