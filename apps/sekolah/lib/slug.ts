import { db } from "./db";

/** "Pendaftaran Siswa Baru 2027!" → "pendaftaran-siswa-baru-2027". Aman untuk URL; maksimal 80 karakter. */
export function slugify(teks: string, fallback = "tulisan"): string {
  const s = teks
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/&/g, " dan ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80)
    .replace(/-+$/g, "");
  return s || fallback;
}

/** Slug unik: tambahkan -2, -3, … bila sudah dipakai (`ada` = pemeriksa keberadaan). */
export async function slugUnik(
  dasar: string,
  ada: (slug: string) => Promise<boolean>,
): Promise<string> {
  let slug = dasar;
  for (let i = 2; await ada(slug); i++) {
    if (i > 200) throw new Error("Tidak bisa membuat slug unik.");
    slug = `${dasar.slice(0, 76)}-${i}`;
  }
  return slug;
}

export const slugPostUnik = (dasar: string, kecualiId?: number) =>
  slugUnik(dasar, async (s) => {
    const r = await db().post.findUnique({ where: { slug: s }, select: { id: true } });
    return !!r && r.id !== kecualiId;
  });

export const slugGaleriUnik = (dasar: string) =>
  slugUnik(
    dasar,
    async (s) => !!(await db().gallery.findUnique({ where: { slug: s }, select: { id: true } })),
  );
