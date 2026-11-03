/** Akses env terpusat. Dibaca saat dipanggil (bukan saat import) agar build tidak butuh rahasia. */
export function databaseUrl(): string {
  return process.env.DATABASE_URL || "file:./dev.db";
}

/** URL publik situs tanpa slash akhir. */
export function siteUrl(): string {
  return (process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3005").replace(/\/+$/, "");
}

/** Rahasia penanda sesi (JWT). Minimal 32 karakter; bila kosong/pendek login dinonaktifkan (fail closed). */
export function authSecret(): string | null {
  const s = process.env.NEXTAUTH_SECRET;
  return s && s.length >= 32 ? s : null;
}

export const authConfigured = () => authSecret() !== null;

/** Jumlah reverse proxy tepercaya di depan app (untuk membaca IP klien dari X-Forwarded-For). */
export function trustedProxies(): number {
  const n = Number(process.env.TRUSTED_PROXIES ?? 1);
  return Number.isInteger(n) && n >= 0 ? n : 1;
}
