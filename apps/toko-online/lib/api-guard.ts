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
export function periksaAsal(req: Request): Response | null {
  const origin = req.headers.get("origin");
  if (!origin) return null;
  let host = "";
  try {
    host = new URL(origin).host;
  } catch {
    /* origin tidak valid → ditolak di bawah */
  }
  const hostReq = req.headers.get("x-forwarded-host") ?? req.headers.get("host");
  return !host || host !== hostReq ? galat(403, "Asal permintaan tidak diizinkan.") : null;
}

/** Baca badan permintaan dengan batas keras (menghentikan stream begitu melewati batas — tidak menampung badan raksasa). */
export async function bacaBadan(
  req: Request,
  maksByte: number,
): Promise<{ buf: Uint8Array } | { res: Response }> {
  if (Number(req.headers.get("content-length") ?? 0) > maksByte)
    return { res: galat(413, "Permintaan terlalu besar.") };
  if (!req.body) return { buf: new Uint8Array() };
  const reader = req.body.getReader();
  const potongan: Uint8Array[] = [];
  let total = 0;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    total += value.length;
    if (total > maksByte) {
      await reader.cancel().catch(() => {});
      return { res: galat(413, "Permintaan terlalu besar.") };
    }
    potongan.push(value);
  }
  const buf = new Uint8Array(total);
  let o = 0;
  for (const p of potongan) {
    buf.set(p, o);
    o += p.length;
  }
  return { buf };
}

export async function bacaJson(
  req: Request,
  maksByte: number,
): Promise<{ data: unknown } | { res: Response }> {
  const asal = periksaAsal(req);
  if (asal) return { res: asal };
  if (!(req.headers.get("content-type") ?? "").toLowerCase().startsWith("application/json"))
    return { res: galat(415, "Content-Type harus application/json.") };
  const b = await bacaBadan(req, maksByte);
  if ("res" in b) return b;
  try {
    return { data: JSON.parse(new TextDecoder().decode(b.buf)) };
  } catch {
    return { res: galat(400, "JSON tidak valid.") };
  }
}

export const tolakMetode = (boleh = "POST") =>
  galat(405, "Metode tidak diizinkan.", {}, { Allow: boleh });
