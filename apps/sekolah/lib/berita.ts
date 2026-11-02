import { db } from "./db";
import { isOneOf, POST_KINDS, type PostKind } from "./domain";

export const PER_HALAMAN = 6;

/** Hanya yang sudah terbit dan waktunya sudah lewat. Draf & terjadwal TIDAK pernah publik. */
const terbit = () => ({ published: true, publishedAt: { lte: new Date() } });

const pilih = {
  id: true,
  slug: true,
  kind: true,
  title: true,
  excerpt: true,
  image: true,
  publishedAt: true,
} as const;

/** ?jenis=berita|pengumuman → "BERITA"|"PENGUMUMAN"; selain itu undefined (semua). */
export function parseJenis(v: string | string[] | undefined): PostKind | undefined {
  const s = (Array.isArray(v) ? v[0] : v)?.toUpperCase();
  return isOneOf(POST_KINDS, s) ? s : undefined;
}

/** ?halaman=N → bilangan bulat ≥ 1 (nilai aneh → 1). */
export function parseHalaman(v: string | string[] | undefined): number {
  const s = Array.isArray(v) ? v[0] : v;
  const n = /^\d{1,6}$/.test(s ?? "") ? Number(s) : 1;
  return Math.max(1, n);
}

/** Hitung jumlah halaman & halaman efektif (permintaan di luar rentang dipepatkan ke halaman terakhir). */
export function paginasi(total: number, halaman: number, perHalaman = PER_HALAMAN) {
  const jumlahHalaman = Math.max(1, Math.ceil(total / perHalaman));
  return { jumlahHalaman, halaman: Math.min(Math.max(1, halaman), jumlahHalaman) };
}

export async function daftarBerita(opts: { kind?: PostKind; halaman: number }) {
  const where = { ...terbit(), ...(opts.kind ? { kind: opts.kind } : {}) };
  const total = await db().post.count({ where });
  const { jumlahHalaman, halaman } = paginasi(total, opts.halaman);
  const items = await db().post.findMany({
    where,
    orderBy: [{ publishedAt: "desc" }, { id: "desc" }],
    skip: (halaman - 1) * PER_HALAMAN,
    take: PER_HALAMAN,
    select: pilih,
  });
  return { items, total, halaman, jumlahHalaman };
}

export async function beritaBySlug(slug: string) {
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) return null;
  return db().post.findFirst({
    where: { slug, ...terbit() },
    select: { ...pilih, body: true, author: { select: { name: true } } },
  });
}

export async function beritaTerkait(slug: string, kind: string, take = 2) {
  return db().post.findMany({
    where: { ...terbit(), kind, slug: { not: slug } },
    orderBy: { publishedAt: "desc" },
    take,
    select: pilih,
  });
}
