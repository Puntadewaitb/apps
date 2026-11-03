import { getClientIp } from "@tpl/core";
import { trustedProxies } from "./env";

const NO_STORE = { "Cache-Control": "no-store" };

export const jawab = (status: number, body: unknown, extra: Record<string, string> = {}) =>
  Response.json(body, { status, headers: { ...NO_STORE, ...extra } });
export const galat = (
  status: number,
  pesan: string,
  extra: Record<string, unknown> = {},
  headers: Record<string, string> = {},
) => jawab(status, { ok: false, galat: pesan, ...extra }, headers);

export const ipKlien = (req: Request) => getClientIp(req.headers, trustedProxies());

/**
 * Pagar umum endpoint JSON bermutasi/menghitung:
 *  1. Asal: bila header Origin ada, host-nya harus sama dengan host permintaan (cegah CSRF lintas-situs).
 *  2. Content-Type wajib application/json (formulir lintas-situs tak bisa mengirimnya tanpa preflight CORS).
 *  3. Ukuran badan dibatasi.
 * Mengembalikan data JSON mentah atau Response galat.
 */
export async function bacaJson(
  req: Request,
  maksByte: number,
): Promise<{ data: unknown } | { res: Response }> {
  const origin = req.headers.get("origin");
  if (origin) {
    let host = "";
    try {
      host = new URL(origin).host;
    } catch {
      /* origin tidak valid → ditolak di bawah */
    }
    const hostReq = req.headers.get("x-forwarded-host") ?? req.headers.get("host");
    if (!host || host !== hostReq) return { res: galat(403, "Asal permintaan tidak diizinkan.") };
  }
  if (!(req.headers.get("content-type") ?? "").toLowerCase().startsWith("application/json"))
    return { res: galat(415, "Content-Type harus application/json.") };
  if (Number(req.headers.get("content-length") ?? 0) > maksByte)
    return { res: galat(413, "Permintaan terlalu besar.") };
  const teks = await req.text();
  if (teks.length > maksByte) return { res: galat(413, "Permintaan terlalu besar.") };
  try {
    return { data: JSON.parse(teks) };
  } catch {
    return { res: galat(400, "JSON tidak valid.") };
  }
}

export const tolakMetode = (boleh = "POST") =>
  galat(405, "Metode tidak diizinkan.", {}, { Allow: boleh });
