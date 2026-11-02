import { db } from "./db";

/** Guru & staf aktif, urut sesuai kolom `sort` (nonaktif tidak tampil di publik). */
export async function guruAktif() {
  return db().teacher.findMany({
    where: { active: true },
    orderBy: [{ sort: "asc" }, { id: "asc" }],
    select: { id: true, name: true, position: true, subject: true, bio: true, photo: true },
  });
}
