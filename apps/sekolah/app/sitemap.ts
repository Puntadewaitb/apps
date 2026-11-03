import type { MetadataRoute } from "next";
import { db } from "../lib/db";
import { siteUrl } from "../lib/env";

// Memuat slug dari database → dirender per-request.
export const dynamic = "force-dynamic";

const STATIS = [
  "/",
  "/profil",
  "/guru",
  "/program",
  "/berita",
  "/agenda",
  "/galeri",
  "/ppdb",
  "/donasi",
];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = siteUrl();
  const [posts, album, programs] = await Promise.all([
    db().post.findMany({
      where: { published: true, publishedAt: { lte: new Date() } },
      select: { slug: true, publishedAt: true },
    }),
    db().gallery.findMany({ select: { slug: true } }),
    db().donationProgram.findMany({ where: { active: true }, select: { slug: true } }),
  ]);
  return [
    ...STATIS.map((p) => ({ url: p === "/" ? base : `${base}${p}` })),
    ...posts.map((p) => ({
      url: `${base}/berita/${p.slug}`,
      ...(p.publishedAt ? { lastModified: p.publishedAt } : {}),
    })),
    ...album.map((a) => ({ url: `${base}/galeri/${a.slug}` })),
    ...programs.map((p) => ({ url: `${base}/donasi/${p.slug}` })),
  ];
}
