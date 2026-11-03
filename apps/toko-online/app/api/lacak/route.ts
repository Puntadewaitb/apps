import { z } from "zod";
import { bacaJson, galat, ipKlien, jawab, tolakMetode } from "../../../lib/api-guard";
import { normalisasiKodePesanan } from "../../../lib/lacak";
import { cariPesananMilik, keTampilan } from "../../../lib/lacak-server";
import { limiters } from "../../../lib/limiters";

const skema = z.object({ kode: z.string().max(40), telepon: z.string().max(30) }).strict();
const PESAN_TAK_COCOK = "Kode pesanan atau nomor HP tidak cocok.";

/** POST { kode, telepon } → status & rincian pesanan, HANYA bila kode + nomor HP cocok. Pesan galat identik untuk semua kegagalan. */
export async function POST(req: Request) {
  const b = await bacaJson(req, 1024);
  if ("res" in b) return b.res;
  const p = skema.safeParse(b.data);
  if (!p.success) return galat(400, "Permintaan tidak valid.");
  const l = limiters();
  const ip = l.lacakIp.check(ipKlien(req));
  // Batas per-kode memakai bentuk yang dinormalkan (kode asal-asalan dipetakan ke satu kunci).
  const kunci = normalisasiKodePesanan(p.data.kode) || "tidak-sah";
  const kd = l.lacakKode.check(kunci);
  for (const r of [ip, kd])
    if (!r.allowed)
      return galat(
        429,
        "Terlalu banyak percobaan. Coba lagi beberapa saat lagi.",
        {},
        { "Retry-After": String(r.retryAfterSec) },
      );
  const order = await cariPesananMilik(p.data.kode, p.data.telepon);
  if (!order) return galat(404, PESAN_TAK_COCOK);
  return jawab(200, { ok: true, pesanan: await keTampilan(order) });
}

export const GET = () => tolakMetode();
