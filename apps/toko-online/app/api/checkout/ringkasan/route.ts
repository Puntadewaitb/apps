import { galat, ipKlien, jawab, bacaJson, tolakMetode } from "../../../../lib/api-guard";
import { ringkasanSchema } from "../../../../lib/checkout-schema";
import { hitungRingkasan } from "../../../../lib/checkout-server";
import { db } from "../../../../lib/db";
import { limiters } from "../../../../lib/limiters";

/**
 * POST { items:[{varianId,qty}], kota, voucher } → rincian pesanan yang dihitung SERVER (baca-saja, tidak mengubah stok/voucher).
 * Dipakai halaman checkout untuk pratinjau; angka final tetap dihitung ulang saat POST /api/pesanan.
 */
export async function POST(req: Request) {
  const ip = ipKlien(req);
  // Batas lebih ketat untuk pengecekan voucher (cegah tebak-kode): hitung tiap panggilan yang membawa voucher.
  const rl = limiters().ringkasanIp.check(ip);
  if (!rl.allowed)
    return galat(
      429,
      "Terlalu banyak permintaan. Coba lagi sebentar.",
      {},
      { "Retry-After": String(rl.retryAfterSec) },
    );
  const b = await bacaJson(req, 4096);
  if ("res" in b) return b.res;
  const p = ringkasanSchema.safeParse(b.data);
  if (!p.success) return galat(400, "Permintaan tidak valid.");
  if (p.data.voucher) {
    const rv = limiters().voucherIp.check(ip);
    if (!rv.allowed)
      return galat(
        429,
        "Terlalu banyak percobaan voucher. Coba lagi nanti.",
        {},
        { "Retry-After": String(rv.retryAfterSec) },
      );
  }
  const { ringkasan } = await hitungRingkasan(db(), p.data);
  return jawab(200, { ok: true, ringkasan });
}

export const GET = () => tolakMetode();
