import { phoneIdSchema } from "@tpl/core";
import { timingSafeEqual } from "node:crypto";
import { db } from "./db";
import {
  bolehUnggahBukti,
  labelStatus,
  normalisasiKodePesanan,
  type TampilanPesanan,
} from "./lacak";
import { getPengaturan } from "./setting";

/** Perbandingan waktu-konstan (panjang beda → tetap membandingkan agar waktu tak membocorkan panjang). */
function samaRahasia(a: string, b: string): boolean {
  const x = Buffer.from(a);
  const y = Buffer.from(b);
  const n = Math.max(x.length, y.length, 1);
  const xp = Buffer.alloc(n);
  const yp = Buffer.alloc(n);
  x.copy(xp);
  y.copy(yp);
  return timingSafeEqual(xp, yp) && x.length === y.length;
}

export const telepon62 = (input: string): string | null => {
  const r = phoneIdSchema.safeParse(input);
  return r.success ? r.data : null;
};

/**
 * Cari pesanan milik pemegang KODE + NOMOR HP yang cocok. Gagal (kode tak ada, HP salah, format salah) → null,
 * sehingga pemanggil memberi pesan IDENTIK (tidak membocorkan apakah kode itu ada).
 */
export async function cariPesananMilik(kodeInput: string, teleponInput: string) {
  const kode = normalisasiKodePesanan(kodeInput);
  const hp = telepon62(teleponInput);
  const order = kode
    ? await db().order.findUnique({
        where: { code: kode },
        include: { items: { orderBy: { id: "asc" } } },
      })
    : null;
  // Selalu jalankan perbandingan (juga saat order tak ada) agar jalur sukses/gagal serupa waktunya.
  const cocok = samaRahasia(order?.customerPhone ?? "0", hp ?? "1");
  return order && hp && cocok ? order : null;
}

type OrderLengkap = NonNullable<Awaited<ReturnType<typeof cariPesananMilik>>>;

export async function keTampilan(o: OrderLengkap): Promise<TampilanPesanan> {
  const menunggu = o.status === "MENUNGGU_BAYAR";
  const s = menunggu ? await getPengaturan() : null;
  return {
    kode: o.code,
    status: o.status,
    statusLabel: labelStatus(o.status),
    dibuat: o.createdAt.toISOString(),
    nama: o.customerName,
    kota: o.city,
    baris: o.items.map((i) => ({
      produkNama: i.productName,
      varianNama: i.variantName,
      qty: i.qty,
      unitPrice: i.unitPrice,
      lineTotal: i.lineTotal,
    })),
    subtotal: o.subtotal,
    ongkir: o.shippingCost,
    diskon: o.discount,
    voucher: o.voucherCode,
    total: o.total,
    buktiAda: o.paymentProof !== "",
    bolehUnggah: bolehUnggahBukti(o.status),
    pembayaran: s ? { rekening: s.rekening, catatan: s.catatanBayar, qris: s.qris } : null,
  };
}
