import { db } from "./db";
import { rentangBulanWib } from "./agenda";

const pilih = {
  id: true,
  title: true,
  description: true,
  location: true,
  startsAt: true,
  endsAt: true,
} as const;

/** Kegiatan yang beririsan dengan bulan WIB tsb (mulai < akhir bulan DAN selesai ≥ awal bulan). */
export async function agendaBulan(tahun: number, bulan: number) {
  const { mulai, akhir } = rentangBulanWib(tahun, bulan);
  return db().agenda.findMany({
    where: {
      startsAt: { lt: akhir },
      OR: [{ endsAt: { gte: mulai } }, { endsAt: null, startsAt: { gte: mulai } }],
    },
    orderBy: [{ startsAt: "asc" }, { id: "asc" }],
    select: pilih,
  });
}
