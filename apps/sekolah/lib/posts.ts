import { db } from "./db";

/** Berita/pengumuman terbit terbaru. Draf (published=false) TIDAK pernah ikut. */
export async function postTerbaru(take = 3) {
  return db().post.findMany({
    where: { published: true, publishedAt: { lte: new Date() } },
    orderBy: { publishedAt: "desc" },
    take,
    select: { slug: true, kind: true, title: true, excerpt: true, publishedAt: true, image: true },
  });
}
