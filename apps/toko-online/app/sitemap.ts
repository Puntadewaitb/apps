import type { MetadataRoute } from "next";
import { db } from "../lib/db";
import { siteUrl } from "../lib/env";

// Memuat slug dari database → dirender per-request.
export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = siteUrl();
  const [produk, kategori] = await Promise.all([
    db().product.findMany({ where: { active: true }, select: { slug: true, updatedAt: true } }),
    db().category.findMany({ select: { slug: true } }),
  ]);
  return [
    { url: `${base}/` },
    { url: `${base}/produk` },
    ...kategori.map((k) => ({ url: `${base}/produk?kategori=${k.slug}` })),
    ...produk.map((p) => ({ url: `${base}/produk/${p.slug}`, lastModified: p.updatedAt })),
  ];
}
