/** Akses env terpusat. Dibaca saat dipanggil (bukan saat import) agar build tidak butuh rahasia. */
export function databaseUrl(): string {
  return process.env.DATABASE_URL || "file:./dev.db";
}

/** URL publik situs tanpa slash akhir. */
export function siteUrl(): string {
  return (process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3004").replace(/\/+$/, "");
}
