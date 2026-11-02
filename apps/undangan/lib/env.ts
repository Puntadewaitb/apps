/** Akses env terpusat. Dibaca saat dipanggil (bukan saat import) agar build tidak butuh rahasia. */
export function databaseUrl(): string {
  return process.env.DATABASE_URL || "file:./dev.db";
}

/** Konfigurasi admin; null bila tidak lengkap → login admin dinonaktifkan (fail closed). */
export function adminConfig(): { password: string; secret: string } | null {
  const password = process.env.ADMIN_PASSWORD;
  const secret = process.env.ADMIN_SESSION_SECRET;
  if (!password || !secret || secret.length < 32) return null;
  return { password, secret };
}

/** URL publik situs tanpa slash akhir (untuk tautan undangan yang dibagikan). */
export function siteUrl(): string {
  return (process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3003").replace(/\/+$/, "");
}
