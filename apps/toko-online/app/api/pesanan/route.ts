import { isHoneypotTripped, randomCode } from "@tpl/core";
import { galat, ipKlien, jawab, bacaJson, tolakMetode } from "../../../lib/api-guard";
import { galatField, pesananSchema } from "../../../lib/checkout-schema";
import { buatPesanan } from "../../../lib/checkout-server";
import { sekali } from "../../../lib/idempotensi";
import { limiters } from "../../../lib/limiters";

const retry = (s: number) => ({ "Retry-After": String(s) });

/**
 * POST — buat pesanan. Seluruh angka (harga, ongkir, diskon, total) dihitung ulang dari DB; permintaan hanya
 * membawa ID varian + jumlah, data pembeli, kota, kode voucher, dan `totalPreview` (pembanding, bukan sumber nilai).
 * Skema ketat: properti asing (mis. `harga`, `total`, `ongkir`) → 400.
 */
export async function POST(req: Request) {
  const ip = ipKlien(req);
  const b = await bacaJson(req, 8192);
  if ("res" in b) return b.res;
  const p = pesananSchema.safeParse(b.data);
  if (!p.success) return galat(400, "Periksa kembali isian Anda.", { field: galatField(p.error) });
  const d = p.data;

  // Honeypot: bot mengisi kolom jebakan → pura-pura sukses (tidak ada yang disimpan, stok tidak berubah).
  if (isHoneypotTripped({ website_url: d.website_url }))
    return jawab(200, {
      ok: true,
      kode: `TKO-${randomCode(8)}`,
      subtotal: 0,
      ongkir: 0,
      diskon: 0,
      total: d.totalPreview,
      baris: [],
      rekening: [],
      catatanBayar: "",
      qris: "",
      waUrl: "",
    });

  const l = limiters();
  const a = l.pesananIp.check(ip);
  if (!a.allowed)
    return galat(
      429,
      "Terlalu banyak pesanan dari jaringan Anda. Coba lagi nanti.",
      {},
      retry(a.retryAfterSec),
    );
  const t = l.pesananTelepon.check(d.telepon);
  if (!t.allowed)
    return galat(
      429,
      "Terlalu banyak pesanan untuk nomor ini. Coba lagi nanti.",
      {},
      retry(t.retryAfterSec),
    );

  const hasil = await sekali(`pesanan:${d.kunci}`, () => buatPesanan(d), {
    simpanBila: (h) => h.ok,
  });
  if (hasil.ok) return jawab(200, hasil);
  return jawab(hasil.jenis === "tidak-bisa" ? 422 : 409, hasil);
}

export const GET = () => tolakMetode();
