/** Nilai sah untuk kolom bertipe String di schema.prisma (SQLite tanpa enum). Satu sumber kebenaran. */
export const ROLES = ["ADMIN", "EDITOR"] as const;
export const POST_KINDS = ["BERITA", "PENGUMUMAN"] as const;
export const REG_STATUSES = ["BARU", "DIPROSES", "DITERIMA", "DITOLAK"] as const;
export const DONATION_STATUSES = ["MENUNGGU", "TERVERIFIKASI", "DITOLAK"] as const;
export const GENDERS = ["L", "P"] as const;

export type Role = (typeof ROLES)[number];
export type PostKind = (typeof POST_KINDS)[number];
export type RegStatus = (typeof REG_STATUSES)[number];
export type DonationStatus = (typeof DONATION_STATUSES)[number];

export const isOneOf = <T extends readonly string[]>(list: T, v: unknown): v is T[number] =>
  typeof v === "string" && (list as readonly string[]).includes(v);

/** Label tampilan (Bahasa Indonesia). */
export const REG_STATUS_LABEL: Record<RegStatus, string> = {
  BARU: "Baru diterima",
  DIPROSES: "Sedang diproses",
  DITERIMA: "Diterima",
  DITOLAK: "Tidak diterima",
};
export const DONATION_STATUS_LABEL: Record<DonationStatus, string> = {
  MENUNGGU: "Menunggu verifikasi",
  TERVERIFIKASI: "Terverifikasi",
  DITOLAK: "Ditolak",
};
