import { db } from "./db";

export async function daftarAlbum() {
  return db().gallery.findMany({
    orderBy: [{ createdAt: "desc" }, { id: "desc" }],
    select: {
      slug: true,
      title: true,
      description: true,
      cover: true,
      _count: { select: { images: true } },
    },
  });
}

export async function albumBySlug(slug: string) {
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) return null;
  return db().gallery.findUnique({
    where: { slug },
    select: {
      slug: true,
      title: true,
      description: true,
      images: { orderBy: [{ sort: "asc" }, { id: "asc" }], select: { src: true, caption: true } },
    },
  });
}
