import { NextResponse, type NextRequest } from "next/server";
import { ruteDikenal, tanpaSlashAkhir } from "./lib/rute";

/**
 * Routing bahasa + gerbang 404. Struktur internal: `app/(site)/[lang]/…`.
 *  - Indonesia (default) tanpa awalan: `/layanan` → di-rewrite ke `/id/layanan` (URL di browser tetap bersih).
 *  - English dengan awalan: `/en/layanan` (langsung).
 *  - `/id/…` diarahkan (308) ke versi tanpa awalan agar tiap halaman punya satu URL kanonik.
 *  - URL yang bukan halaman dikenal (lihat lib/rute.ts) di-rewrite ke halaman 404 dengan status 404.
 *    Alasannya: dengan root layout dinamis `[lang]`, `notFound()` hanya menghasilkan cangkang error
 *    di sisi server — halaman 404 asli (navbar/footer, bahasa benar) tetap tampil tanpa JavaScript lewat cara ini.
 */
export function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;

  if (pathname === "/id" || pathname.startsWith("/id/")) {
    const url = req.nextUrl.clone();
    url.pathname = pathname.slice(3) || "/";
    return NextResponse.redirect(url, 308);
  }

  const en = pathname === "/en" || pathname.startsWith("/en/");
  const lang = en ? "en" : "id";

  if (!ruteDikenal().has(tanpaSlashAkhir(pathname))) {
    const url = req.nextUrl.clone();
    url.pathname = `/${lang}/tidak-ditemukan`;
    url.search = "";
    return NextResponse.rewrite(url, { status: 404 });
  }

  if (en) return NextResponse.next();

  const url = req.nextUrl.clone();
  url.pathname = `/id${pathname === "/" ? "" : pathname}`;
  return NextResponse.rewrite(url);
}

export const config = {
  // Lewati: aset Next, API, admin, route OG, folder /img, dan berkas ber-ekstensi di root (robots.txt, sitemap.xml,
  // icon.svg). Berkas statis baru di public/ selain /img perlu ditambahkan di sini (atau dibuat sebagai route).
  matcher: ["/((?!_next/|api/|admin(?:/|$)|og/|img/|[^/]+\\.[^/]+$).*)"],
};
