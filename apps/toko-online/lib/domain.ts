/** Nilai sah untuk kolom bertipe String di schema.prisma (SQLite tanpa enum). Satu sumber kebenaran. */
export const ROLES = ["ADMIN", "STAFF"] as const;
export const ORDER_STATUSES = [
  "MENUNGGU_BAYAR",
  "DIBAYAR",
  "DIPROSES",
  "DIKIRIM",
  "SELESAI",
  "DIBATALKAN",
] as const;
export const VOUCHER_TYPES = ["PERSEN", "NOMINAL"] as const;

export type Role = (typeof ROLES)[number];
export type OrderStatus = (typeof ORDER_STATUSES)[number];
export type VoucherType = (typeof VOUCHER_TYPES)[number];

export const isOneOf = <T extends readonly string[]>(list: T, v: unknown): v is T[number] =>
  typeof v === "string" && (list as readonly string[]).includes(v);

export const ORDER_STATUS_LABEL: Record<OrderStatus, string> = {
  MENUNGGU_BAYAR: "Menunggu pembayaran",
  DIBAYAR: "Sudah dibayar",
  DIPROSES: "Sedang diproses",
  DIKIRIM: "Dikirim",
  SELESAI: "Selesai",
  DIBATALKAN: "Dibatalkan",
};
