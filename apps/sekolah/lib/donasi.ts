import { db } from "./db";
import { persen } from "./rupiah";

export type ProgresProgram = {
  terkumpul: number;
  menunggu: number;
  donatur: number;
  persen: number;
};

/** Agregasi donasi per program: hanya status TERVERIFIKASI yang masuk progres. */
export async function progresSemua(): Promise<Map<number, ProgresProgram>> {
  const g = await db().donation.groupBy({
    by: ["programId", "status"],
    _sum: { amount: true },
    _count: { _all: true },
  });
  const targets = new Map(
    (await db().donationProgram.findMany({ select: { id: true, target: true } })).map((p) => [
      p.id,
      p.target,
    ]),
  );
  const m = new Map<number, ProgresProgram>();
  for (const r of g) {
    const cur = m.get(r.programId) ?? { terkumpul: 0, menunggu: 0, donatur: 0, persen: 0 };
    if (r.status === "TERVERIFIKASI") {
      cur.terkumpul += r._sum.amount ?? 0;
      cur.donatur += r._count._all;
    } else if (r.status === "MENUNGGU") cur.menunggu += r._count._all;
    m.set(r.programId, cur);
  }
  for (const [id, p] of m) p.persen = persen(p.terkumpul, targets.get(id) ?? 0);
  return m;
}

export const progresKosong = (): ProgresProgram => ({
  terkumpul: 0,
  menunggu: 0,
  donatur: 0,
  persen: 0,
});

/** Program terbuka untuk donasi: aktif dan (tanpa batas waktu atau belum lewat). */
export const terbukaUntukDonasi = (
  p: { active: boolean; deadline: Date | null },
  sekarang = new Date(),
) => p.active && (p.deadline === null || p.deadline.getTime() > sekarang.getTime());

export const programAktif = () =>
  db().donationProgram.findMany({
    where: { active: true },
    orderBy: [{ createdAt: "asc" }, { id: "asc" }],
  });

export const programBySlug = (slug: string) =>
  /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)
    ? db().donationProgram.findUnique({ where: { slug } })
    : Promise.resolve(null);

/** Donatur terverifikasi terbaru; yang anonim ditampilkan sebagai "Hamba Allah" (nama asli tidak dikirim ke halaman). */
export async function donaturTerbaru(programId: number, take = 8) {
  const rows = await db().donation.findMany({
    where: { programId, status: "TERVERIFIKASI" },
    orderBy: [{ verifiedAt: "desc" }, { id: "desc" }],
    take,
    select: {
      id: true,
      donorName: true,
      anonymous: true,
      message: true,
      verifiedAt: true,
      createdAt: true,
    },
  });
  return rows.map((r) => ({
    id: r.id,
    nama: r.anonymous ? "Hamba Allah" : r.donorName,
    pesan: r.message,
    tanggal: r.verifiedAt ?? r.createdAt,
  }));
}
