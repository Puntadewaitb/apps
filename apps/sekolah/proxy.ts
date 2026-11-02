import { getToken } from "next-auth/jwt";
import { NextResponse, type NextRequest } from "next/server";

/**
 * Gerbang pertama untuk /admin/* dan /api/admin/*: tanpa JWT sesi yang valid →
 * halaman: redirect ke /admin/login (membawa callbackUrl); API: 401 JSON.
 * Ini HANYA lapisan pertama — setiap halaman/route handler memeriksa ulang sesi (lib/session.ts), termasuk
 * ke DB (akun dihapus/diturunkan), sesuai prinsip defense in depth (mis. CVE-2025-29927).
 *
 * Next 16: file bernama `proxy.ts` (pengganti `middleware.ts`), diekspor sebagai fungsi `proxy`.
 */
export async function proxy(req: NextRequest) {
  const { pathname, search } = req.nextUrl;
  if (pathname === "/admin/login") return NextResponse.next();

  const secret = process.env.NEXTAUTH_SECRET;
  const https = (process.env.NEXTAUTH_URL ?? "").startsWith("https://");
  const token =
    secret && secret.length >= 32
      ? await getToken({ req, secret, secureCookie: https }).catch(() => null)
      : null;
  if (token && typeof token.uid === "number") return NextResponse.next();

  if (pathname.startsWith("/api/")) {
    return Response.json(
      { error: "Belum login." },
      { status: 401, headers: { "Cache-Control": "no-store" } },
    );
  }
  const url = req.nextUrl.clone();
  url.pathname = "/admin/login";
  url.search = `?callbackUrl=${encodeURIComponent(pathname + search)}`;
  return NextResponse.redirect(url);
}

export const config = { matcher: ["/admin/:path*", "/api/admin/:path*"] };
