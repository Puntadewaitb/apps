/**
 * Dukungan hosting di sub-path (mis. GitHub Pages: https://user.github.io/apps/<template>/).
 *
 * Semua template memakai `<a>`/`<img>` biasa (bukan next/link / next/image), sehingga `basePath` Next TIDAK
 * otomatis ditambahkan ke tautan & gambar root-relatif ("/produk", "/img/hero.svg"). `withBase` menambahkannya.
 *
 * Tanpa `NEXT_PUBLIC_BASE_PATH` (build normal/produksi) fungsi ini TIDAK mengubah apa pun.
 * Nilainya di-inline saat build, jadi server & klien selalu sepakat (tidak ada hydration mismatch).
 */
export function normalizeBase(raw: string | undefined): string {
  const t = (raw ?? "").trim().replace(/\/+$/, "");
  if (!t || t === "/") return "";
  return t.startsWith("/") ? t : `/${t}`;
}

const BASE = normalizeBase(process.env.NEXT_PUBLIC_BASE_PATH);

/**
 * Tambahkan base path ke URL root-relatif ("/x"). Dibiarkan apa adanya: URL absolut (https:, mailto:, tel:, data:,
 * blob:), protocol-relative ("//cdn"), anchor ("#x"), query-only ("?x"), path relatif ("x"), nilai kosong, dan
 * URL yang sudah berawalan base path.
 */
export function withBase<T extends string | undefined | null>(href: T, base: string = BASE): T {
  if (typeof href !== "string" || !base) return href;
  if (!href.startsWith("/") || href.startsWith("//")) return href;
  if (href === base || href.startsWith(`${base}/`) || href.startsWith(`${base}?`)) return href;
  return `${base}${href}` as T;
}
