import { getClientIp } from "@tpl/core";
import { trustedProxies } from "../../../lib/env";
import { detailKeranjang, permintaanSchema } from "../../../lib/keranjang-server";
import { limiters } from "../../../lib/limiters";

const MAKS_BYTE = 4096;
const header = { "Cache-Control": "no-store" };
const galat = (status: number, pesan: string, extra: Record<string, string> = {}) =>
  Response.json({ galat: pesan }, { status, headers: { ...header, ...extra } });

/** POST { ids: number[] } → detail terkini (nama, harga, stok) varian di keranjang. Baca-saja; tidak mengubah data. */
export async function POST(req: Request) {
  const ip = getClientIp(req.headers, trustedProxies());
  const rl = limiters().keranjangIp.check(ip);
  if (!rl.allowed)
    return galat(429, "Terlalu banyak permintaan. Coba lagi sebentar.", {
      "Retry-After": String(rl.retryAfterSec),
    });
  // JSON wajib: formulir lintas-situs tidak bisa mengirim application/json tanpa preflight.
  if (!(req.headers.get("content-type") ?? "").toLowerCase().startsWith("application/json"))
    return galat(415, "Content-Type harus application/json.");
  const len = Number(req.headers.get("content-length") ?? 0);
  if (len > MAKS_BYTE) return galat(413, "Permintaan terlalu besar.");
  const teks = await req.text();
  if (teks.length > MAKS_BYTE) return galat(413, "Permintaan terlalu besar.");
  let data: unknown;
  try {
    data = JSON.parse(teks);
  } catch {
    return galat(400, "JSON tidak valid.");
  }
  const p = permintaanSchema.safeParse(data);
  if (!p.success) return galat(400, "Permintaan tidak valid.");
  return Response.json({ items: await detailKeranjang(p.data.ids) }, { headers: header });
}

export const GET = () => galat(405, "Metode tidak diizinkan.", { Allow: "POST" });
