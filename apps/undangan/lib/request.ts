/**
 * Proteksi CSRF dasar untuk request yang mengubah state: Origin (bila ada) harus sama dengan Host.
 * Request tanpa Origin (mis. curl/server-to-server) diizinkan; browser modern selalu mengirim Origin pada POST.
 */
export function isSameOrigin(req: Request): boolean {
  const origin = req.headers.get("origin");
  if (!origin) return true;
  const host = req.headers.get("x-forwarded-host") ?? req.headers.get("host");
  try {
    return !!host && new URL(origin).host === host;
  } catch {
    return false;
  }
}
