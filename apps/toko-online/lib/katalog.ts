import { sanitizeText } from "@tpl/core";
import { cache } from "react";
import { db } from "./db";

export const PER_HALAMAN = 12;
export const URUTAN = ["terbaru", "termurah", "termahal", "nama"] as const;
export type Urutan = (typeof URUTAN)[number];
export const LABEL_URUTAN: Record<Urutan, string> = {
  terbaru: "Terbaru",
  termurah: "Harga terendah",
  termahal: "Harga tertinggi",
  nama: "Nama A–Z",
};

/** ?urut= → nilai sah (selain itu "terbaru"). */
export function parseUrut(v: string | string[] | undefined): Urutan {
  const s = Array.isArray(v) ? v[0] : v;
  return (URUTAN as readonly string[]).includes(s ?? "") ? (s as Urutan) : "terbaru";
}

/** ?halaman= → bilangan bulat ≥ 1 (nilai aneh → 1). */
export function parseHalaman(v: string | string[] | undefined): number {
  const s = Array.isArray(v) ? v[0] : v;
  return Math.max(1, /^\d{1,6}$/.test(s ?? "") ? Number(s) : 1);
}

/** ?kategori= → slug yang cocok pola (validitas terhadap DB dicek saat query). */
export function parseSlug(v: string | string[] | undefined): string | undefined {
  const s = Array.isArray(v) ? v[0] : v;
  return s && /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(s) && s.length <= 80 ? s : undefined;
}

/** ?q= → teks pencarian bersih (tanpa tag/kontrol), maks. 60 karakter. */
export function parseQ(v: string | string[] | undefined): string {
  const s = Array.isArray(v) ? v[0] : v;
  return sanitizeText(s ?? "", { maxLength: 60 });
}

export type VarianLite = { price: number | null; stock: number; active?: boolean };
export type ProdukLite = { price: number; variants: VarianLite[] };

const aktif = (vs: VarianLite[]) => vs.filter((v) => v.active !== false);

/** Harga terendah di antara varian aktif (harga varian bila ada, selain itu harga produk). Tanpa varian aktif → harga produk. */
export function hargaMulai(p: ProdukLite): number {
  const vs = aktif(p.variants);
  if (vs.length === 0) return p.price;
  return Math.min(...vs.map((v) => v.price ?? p.price));
}

/** Ada variasi harga antar-varian aktif? (menentukan teks "mulai dari"). */
export function hargaBervariasi(p: ProdukLite): boolean {
  const vs = aktif(p.variants);
  return new Set(vs.map((v) => v.price ?? p.price)).size > 1;
}

export const stokTotal = (p: ProdukLite) =>
  aktif(p.variants).reduce((a, v) => a + Math.max(0, v.stock), 0);
export const habis = (p: ProdukLite) => stokTotal(p) <= 0;

export type ItemUrut = ProdukLite & { name: string; createdAt: Date; id: number };

/** Urutkan (stabil, deterministik): hasil sama untuk input sama. Produk habis tidak dipaksa ke bawah. */
export function urutkan<T extends ItemUrut>(items: T[], urut: Urutan): T[] {
  const tie = (a: T, b: T) => b.createdAt.getTime() - a.createdAt.getTime() || b.id - a.id;
  const salin = [...items];
  switch (urut) {
    case "termurah":
      return salin.sort((a, b) => hargaMulai(a) - hargaMulai(b) || tie(a, b));
    case "termahal":
      return salin.sort((a, b) => hargaMulai(b) - hargaMulai(a) || tie(a, b));
    case "nama":
      return salin.sort(
        (a, b) => a.name.localeCompare(b.name, "id", { sensitivity: "base" }) || tie(a, b),
      );
    default:
      return salin.sort(tie);
  }
}

export function paginasi(total: number, halaman: number, perHalaman = PER_HALAMAN) {
  const jumlahHalaman = Math.max(1, Math.ceil(total / perHalaman));
  return { jumlahHalaman, halaman: Math.min(Math.max(1, halaman), jumlahHalaman) };
}

const pilihKartu = {
  id: true,
  slug: true,
  name: true,
  price: true,
  image: true,
  createdAt: true,
  category: { select: { slug: true, name: true } },
  variants: { where: { active: true }, select: { price: true, stock: true } },
} as const;

export const semuaKategori = cache(() =>
  db().category.findMany({
    orderBy: [{ sort: "asc" }, { id: "asc" }],
    select: { id: true, slug: true, name: true },
  }),
);

/**
 * Katalog: hanya produk AKTIF. Filter kategori + pencarian (nama/deskripsi) dilakukan di DB; pengurutan berdasarkan
 * harga efektif (varian) & paginasi dilakukan di aplikasi — memadai untuk katalog skala toko kecil (≤ ribuan produk).
 */
/** Cocokkan kata kunci (tanpa membedakan huruf) ke kumpulan teks. Wildcard seperti "%" dan "_" dianggap teks biasa. */
export function cocokKata(q: string, ...teks: string[]): boolean {
  const k = q.trim().toLocaleLowerCase("id");
  return k === "" || teks.some((t) => t.toLocaleLowerCase("id").includes(k));
}

/**
 * Katalog: hanya produk AKTIF. Filter kategori di DB; pencarian teks (nama/deskripsi), pengurutan berdasarkan harga
 * efektif (varian) & paginasi dilakukan di aplikasi — memadai untuk katalog skala toko kecil (≤ ribuan produk).
 * Pencarian TIDAK memakai `contains` Prisma karena tidak meng-escape wildcard LIKE (q="%" akan cocok dengan semua).
 */
export async function cariProduk(o: {
  kategori?: string;
  q?: string;
  urut: Urutan;
  halaman: number;
}) {
  const q = o.q?.trim() ?? "";
  const rows = await db().product.findMany({
    where: { active: true, ...(o.kategori ? { category: { slug: o.kategori } } : {}) },
    select: { ...pilihKartu, ...(q ? { description: true } : {}) },
    take: 2000,
  });
  const cocok = q
    ? rows.filter((r) => cocokKata(q, r.name, (r as { description?: string }).description ?? ""))
    : rows;
  const urut = urutkan(cocok, o.urut);
  const { jumlahHalaman, halaman } = paginasi(urut.length, o.halaman);
  const items = urut.slice((halaman - 1) * PER_HALAMAN, halaman * PER_HALAMAN).map((r) => {
    const { description: _d, ...kartu } = r as typeof r & { description?: string };
    void _d;
    return kartu;
  });
  return { items, total: urut.length, halaman, jumlahHalaman };
}

export async function produkBySlug(slug: string) {
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug) || slug.length > 120) return null;
  return db().product.findFirst({
    where: { slug, active: true },
    include: {
      category: { select: { slug: true, name: true } },
      variants: { where: { active: true }, orderBy: { id: "asc" } },
    },
  });
}

export function produkTerkait(kategoriId: number, kecualiId: number, take = 4) {
  return db().product.findMany({
    where: { active: true, categoryId: kategoriId, id: { not: kecualiId } },
    orderBy: [{ createdAt: "desc" }, { id: "desc" }],
    take,
    select: pilihKartu,
  });
}

/** Galeri produk: gambar utama + tambahan (JSON). Entri bukan path gambar yang sah dibuang. */
export function galeriProduk(utama: string, imagesJson: string): string[] {
  const sah = (x: unknown): x is string =>
    typeof x === "string" &&
    /^\/(?:img\/[\w.-]+\.(?:svg|png|jpe?g|webp)|uploads\/[A-Za-z0-9_-]{16,64}\.(?:png|jpg|webp))$/.test(
      x,
    );
  let extra: unknown[] = [];
  try {
    const j: unknown = JSON.parse(imagesJson);
    if (Array.isArray(j)) extra = j;
  } catch {
    /* abaikan JSON rusak */
  }
  return [...new Set([utama, ...extra].filter(sah))];
}

/** Produk aktif terbaru (beranda). Produk nonaktif TIDAK pernah publik. */
export function produkTerbaru(take = 8) {
  return db().product.findMany({
    where: { active: true },
    orderBy: [{ createdAt: "desc" }, { id: "desc" }],
    take,
    select: pilihKartu,
  });
}

/** Susun URL katalog dari filter. Nilai default (urut=terbaru, halaman=1) dihilangkan agar URL kanonik. */
export function urlKatalog(f: {
  kategori?: string;
  q?: string;
  urut?: Urutan;
  halaman?: number;
}): string {
  const p = new URLSearchParams();
  if (f.q) p.set("q", f.q);
  if (f.kategori) p.set("kategori", f.kategori);
  if (f.urut && f.urut !== "terbaru") p.set("urut", f.urut);
  if (f.halaman && f.halaman > 1) p.set("halaman", String(f.halaman));
  const s = p.toString();
  return s ? `/produk?${s}` : "/produk";
}

/** Nomor halaman yang ditampilkan: awal, akhir, dan sekitar halaman aktif; `null` = elipsis. */
export function daftarHalaman(halaman: number, jumlah: number): Array<number | null> {
  const set = new Set<number>([1, jumlah, halaman - 1, halaman, halaman + 1]);
  const nomor = [...set].filter((n) => n >= 1 && n <= jumlah).sort((a, b) => a - b);
  const out: Array<number | null> = [];
  nomor.forEach((n, i) => {
    if (i > 0 && n - nomor[i - 1]! > 1) out.push(null);
    out.push(n);
  });
  return out;
}

/** JSON untuk <script type="application/ld+json">: karakter "<" di-escape agar tak bisa menutup tag script. */
export const jsonLd = (o: unknown) => JSON.stringify(o).replace(/</g, "\\u003c");
