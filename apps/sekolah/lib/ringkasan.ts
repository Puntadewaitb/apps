import { can } from "./auth-core";
import { db } from "./db";

export type Ringkasan = {
  berita?: { terbit: number; draf: number };
  agenda?: { mendatang: number };
  ppdb?: { baru: number };
  donasi?: { menunggu: number };
};

/** Angka ringkasan dashboard, hanya untuk area yang boleh dilihat peran tsb. */
export async function ambilRingkasan(role: string): Promise<Ringkasan> {
  const r: Ringkasan = {};
  if (can(role, "berita")) {
    const [terbit, draf] = await Promise.all([
      db().post.count({ where: { published: true } }),
      db().post.count({ where: { published: false } }),
    ]);
    r.berita = { terbit, draf };
  }
  if (can(role, "agenda")) {
    r.agenda = { mendatang: await db().agenda.count({ where: { startsAt: { gte: new Date() } } }) };
  }
  if (can(role, "ppdb"))
    r.ppdb = { baru: await db().registration.count({ where: { status: "BARU" } }) };
  if (can(role, "donasi"))
    r.donasi = { menunggu: await db().donation.count({ where: { status: "MENUNGGU" } }) };
  return r;
}
