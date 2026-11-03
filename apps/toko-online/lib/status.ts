import { ORDER_STATUSES, isOneOf, type OrderStatus } from "./domain";

/**
 * Peta transisi status pesanan (satu-satunya sumber kebenaran). Hanya maju selangkah, atau BATAL selama belum dikirim.
 * SELESAI dan DIBATALKAN bersifat final.
 */
export const TRANSISI: Record<OrderStatus, readonly OrderStatus[]> = {
  MENUNGGU_BAYAR: ["DIBAYAR", "DIBATALKAN"],
  DIBAYAR: ["DIPROSES", "DIBATALKAN"],
  DIPROSES: ["DIKIRIM", "DIBATALKAN"],
  DIKIRIM: ["SELESAI"],
  SELESAI: [],
  DIBATALKAN: [],
};

export const bolehPindah = (dari: string, ke: string): boolean =>
  isOneOf(ORDER_STATUSES, dari) && isOneOf(ORDER_STATUSES, ke) && TRANSISI[dari].includes(ke);

export const pilihanStatus = (dari: string): readonly OrderStatus[] =>
  isOneOf(ORDER_STATUSES, dari) ? TRANSISI[dari] : [];

/** Status yang mengembalikan stok & kuota voucher (pembatalan). */
export const mengembalikanStok = (ke: string) => ke === "DIBATALKAN";
