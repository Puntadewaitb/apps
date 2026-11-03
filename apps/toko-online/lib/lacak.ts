import { ORDER_STATUS_LABEL, isOneOf, ORDER_STATUSES, type OrderStatus } from "./domain";

const KODE = /^TKO-[2-9A-HJKMNP-Z]{8}$/;

/** "tko k7m2xq4p" / "TKOK7M2XQ4P" / "k7m2xq4p" → "TKO-K7M2XQ4P"; bentuk tak sah → "" . */
export function normalisasiKodePesanan(input: string | undefined | null): string {
  const s = (input ?? "").toUpperCase().replace(/[\s-]/g, "");
  const inti = s.startsWith("TKO") ? s.slice(3) : s;
  const kode = `TKO-${inti}`;
  return KODE.test(kode) ? kode : "";
}

/** Urutan tahap normal; DIBATALKAN di luar alur. */
export const TAHAP: readonly OrderStatus[] = [
  "MENUNGGU_BAYAR",
  "DIBAYAR",
  "DIPROSES",
  "DIKIRIM",
  "SELESAI",
];

export const labelStatus = (s: string) =>
  isOneOf(ORDER_STATUSES, s) ? ORDER_STATUS_LABEL[s] : "Tidak diketahui";

/** Bukti bayar hanya boleh diunggah/diganti saat pesanan masih menunggu pembayaran. */
export const bolehUnggahBukti = (status: string) => status === "MENUNGGU_BAYAR";

export type TampilanPesanan = {
  kode: string;
  status: string;
  statusLabel: string;
  dibuat: string;
  nama: string;
  kota: string;
  baris: Array<{
    produkNama: string;
    varianNama: string;
    qty: number;
    unitPrice: number;
    lineTotal: number;
  }>;
  subtotal: number;
  ongkir: number;
  diskon: number;
  voucher: string;
  total: number;
  buktiAda: boolean;
  bolehUnggah: boolean;
  pembayaran: {
    rekening: Array<{ bank: string; nomor: string; atasNama: string }>;
    catatan: string;
    qris: string;
  } | null;
};
