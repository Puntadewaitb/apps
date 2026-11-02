import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { z } from "zod";
import { blog } from "../content/blog.id";
import { teksPolos } from "./markdown";

export const BLOG_DIR = join(process.cwd(), "content", "blog");

const slugRe = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
/** Slug yang bentrok dengan rute statis /blog/kategori/... tidak boleh dipakai. */
const SLUG_TERLARANG = new Set(["kategori"]);

const frontMatterSchema = z.object({
  judul: z.string().min(5),
  tanggal: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .refine((s) => !Number.isNaN(Date.parse(`${s}T00:00:00Z`)), "tanggal tidak valid"),
  kategori: z
    .string()
    .refine((k) => blog.kategori.some((c) => c.id === k), "kategori tidak dikenal"),
  ringkas: z.string().min(20),
  penulis: z.string().min(3),
  gambar: z.string().regex(/^\/img\/[\w.-]+\.(svg|png|jpe?g|webp)$/),
});

export type Artikel = z.infer<typeof frontMatterSchema> & {
  slug: string;
  isi: string;
  bacaMenit: number;
};

/** Pisahkan front matter `---` … `---` dari isi. Format sederhana `kunci: nilai` (kutip opsional). */
export function parseFrontMatter(teks: string): { data: Record<string, string>; isi: string } {
  const norm = teks.replace(/\r\n?/g, "\n");
  const m = /^---\n([\s\S]*?)\n---\n?([\s\S]*)$/.exec(norm);
  if (!m) throw new Error("front matter tidak ditemukan (awali berkas dengan ---)");
  const data: Record<string, string> = {};
  for (const baris of m[1]!.split("\n")) {
    if (!baris.trim()) continue;
    const kv = /^([A-Za-z][\w-]*):\s*(.*)$/.exec(baris);
    if (!kv) throw new Error(`baris front matter tidak valid: "${baris}"`);
    data[kv[1]!] = kv[2]!.trim().replace(/^(["'])(.*)\1$/, "$2");
  }
  return { data, isi: m[2]!.trim() };
}

export function hitungMenitBaca(isi: string): number {
  const kata = teksPolos(isi).split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.ceil(kata / 200));
}

export function parseArtikel(slug: string, teks: string): Artikel {
  if (!slugRe.test(slug) || SLUG_TERLARANG.has(slug)) throw new Error(`slug tidak valid: ${slug}`);
  const { data, isi } = parseFrontMatter(teks);
  const fm = frontMatterSchema.parse(data);
  if (isi.length < 50) throw new Error(`isi artikel terlalu pendek: ${slug}`);
  return { ...fm, slug, isi, bacaMenit: hitungMenitBaca(isi) };
}

let cache: Artikel[] | undefined;

/** Semua artikel, terbaru dulu. Berkas yang salah format → error jelas saat build (bukan diam-diam hilang). */
export function semuaArtikel(dir: string = BLOG_DIR): Artikel[] {
  if (dir === BLOG_DIR && cache) return cache;
  // Direktori artikel memang dibaca saat build (halaman statis): jangan trace seluruh proyek.
  const daftar = readdirSync(/*turbopackIgnore: true*/ dir)
    .filter((f) => f.endsWith(".md"))
    .map((f) => {
      try {
        return parseArtikel(
          f.slice(0, -3),
          readFileSync(/*turbopackIgnore: true*/ join(/*turbopackIgnore: true*/ dir, f), "utf8"),
        );
      } catch (e) {
        throw new Error(`content/blog/${f}: ${e instanceof Error ? e.message : String(e)}`);
      }
    })
    .sort((a, b) => b.tanggal.localeCompare(a.tanggal) || a.slug.localeCompare(b.slug));
  if (dir === BLOG_DIR) cache = daftar;
  return daftar;
}

export function cariArtikel(slug: string): Artikel | undefined {
  return semuaArtikel().find((a) => a.slug === slug);
}

export function artikelPerKategori(id: string): Artikel[] {
  return semuaArtikel().filter((a) => a.kategori === id);
}

const fmt = new Intl.DateTimeFormat("id-ID", {
  day: "numeric",
  month: "long",
  year: "numeric",
  timeZone: "UTC",
});
export const formatTanggalBlog = (iso: string) => fmt.format(new Date(`${iso}T00:00:00Z`));
