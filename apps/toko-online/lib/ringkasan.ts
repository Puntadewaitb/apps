import { can } from "./auth-core";
import { db } from "./db";
import { awalHariWib } from "./waktu";

/** Status yang dihitung sebagai omzet: sudah dibayar dan tidak dibatalkan. */
export const STATUS_OMZET = ["DIBAYAR", "DIPROSES", "DIKIRIM", "SELESAI"] as const;
export const AMBANG_STOK_MENIPIS = 5;

export type Ringkasan = {
  pesananHariIni: number;
  /** Jumlah total pesanan (tanggal pesanan hari ini WIB) berstatus dibayar/diproses/dikirim/selesai */
  omzetHariIni: number;
  menungguBayar: number;
  perluDiproses: number;
  stokMenipis: number;
  stokHabis: number;
  produkAktif: number;
  terbaru: Array<{
    code: string;
    customerName: string;
    total: number;
    status: string;
    createdAt: Date;
  }>;
};

export async function ambilRingkasan(role: string, now = new Date()): Promise<Ringkasan | null> {
  if (!can(role, "ringkasan")) return null;
  const awal = awalHariWib(now);
  const varianAktif = { active: true, product: { active: true } };
  const [
    pesananHariIni,
    omzet,
    menungguBayar,
    perluDiproses,
    menipis,
    habis,
    produkAktif,
    terbaru,
  ] = await Promise.all([
    db().order.count({ where: { createdAt: { gte: awal } } }),
    db().order.aggregate({
      _sum: { total: true },
      where: { createdAt: { gte: awal }, status: { in: [...STATUS_OMZET] } },
    }),
    db().order.count({ where: { status: "MENUNGGU_BAYAR" } }),
    db().order.count({ where: { status: "DIBAYAR" } }),
    db().variant.count({ where: { ...varianAktif, stock: { gt: 0, lte: AMBANG_STOK_MENIPIS } } }),
    db().variant.count({ where: { ...varianAktif, stock: { lte: 0 } } }),
    db().product.count({ where: { active: true } }),
    db().order.findMany({
      orderBy: [{ createdAt: "desc" }, { id: "desc" }],
      take: 5,
      select: { code: true, customerName: true, total: true, status: true, createdAt: true },
    }),
  ]);
  return {
    pesananHariIni,
    omzetHariIni: omzet._sum.total ?? 0,
    menungguBayar,
    perluDiproses,
    stokMenipis: menipis,
    stokHabis: habis,
    produkAktif,
    terbaru,
  };
}
