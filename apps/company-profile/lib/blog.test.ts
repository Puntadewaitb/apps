import { existsSync, mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { blog } from "../content/blog.id";
import {
  artikelPerKategori,
  cariArtikel,
  formatTanggalBlog,
  hitungMenitBaca,
  parseArtikel,
  parseFrontMatter,
  semuaArtikel,
} from "./blog";
import { parseMarkdown } from "./markdown";

const FM = (o: Record<string, string> = {}) =>
  Object.entries({
    judul: "Judul Artikel Contoh",
    tanggal: "2026-01-02",
    kategori: "tips",
    ringkas: "Ringkasan artikel contoh yang cukup panjang.",
    penulis: "Penulis Contoh",
    gambar: "/img/proyek-1.svg",
    ...o,
  })
    .map(([k, v]) => `${k}: ${v}`)
    .join("\n");
const ISI = "Isi artikel contoh yang cukup panjang untuk lolos validasi panjang minimum isi.";

describe("front matter", () => {
  it("parse kunci: nilai, kutip dibuang, isi dipisah", () => {
    const r = parseFrontMatter(`---\njudul: "Halo: dunia"\npenulis: 'A'\n---\n\nIsi`);
    expect(r.data).toEqual({ judul: "Halo: dunia", penulis: "A" });
    expect(r.isi).toBe("Isi");
  });
  it("menolak tanpa front matter atau baris rusak", () => {
    expect(() => parseFrontMatter("tanpa front matter")).toThrow(/front matter/);
    expect(() => parseFrontMatter("---\nbukan valid\n---\nisi")).toThrow(/tidak valid/);
  });
});

describe("parseArtikel", () => {
  it("valid → bacaMenit & field lengkap", () => {
    const a = parseArtikel("artikel-contoh", `---\n${FM()}\n---\n${ISI}`);
    expect(a).toMatchObject({ slug: "artikel-contoh", kategori: "tips", bacaMenit: 1 });
  });
  it("menolak: slug buruk/terlarang, kategori & tanggal tidak valid, gambar luar, isi pendek", () => {
    const ok = `---\n${FM()}\n---\n${ISI}`;
    expect(() => parseArtikel("Slug Buruk", ok)).toThrow();
    expect(() => parseArtikel("kategori", ok)).toThrow(/slug/);
    expect(() => parseArtikel("a", `---\n${FM({ kategori: "xyz" })}\n---\n${ISI}`)).toThrow();
    expect(() => parseArtikel("a", `---\n${FM({ tanggal: "2026-13-45" })}\n---\n${ISI}`)).toThrow();
    expect(() => parseArtikel("a", `---\n${FM({ tanggal: "kemarin" })}\n---\n${ISI}`)).toThrow();
    expect(() =>
      parseArtikel("a", `---\n${FM({ gambar: "https://evil.example/x.png" })}\n---\n${ISI}`),
    ).toThrow();
    expect(() => parseArtikel("a", `---\n${FM()}\n---\npendek`)).toThrow(/pendek/);
  });
  it("hitungMenitBaca: 200 kata/menit, minimal 1", () => {
    expect(hitungMenitBaca("kata ".repeat(10))).toBe(1);
    expect(hitungMenitBaca("kata ".repeat(450))).toBe(3);
  });
});

describe("artikel di content/blog", () => {
  it("semua berkas valid, slug unik, terurut terbaru dulu", () => {
    const a = semuaArtikel();
    expect(a.length).toBeGreaterThanOrEqual(4);
    expect(new Set(a.map((x) => x.slug)).size).toBe(a.length);
    const t = a.map((x) => x.tanggal);
    expect(t).toEqual([...t].sort().reverse());
  });

  it("gambar ada; tautan internal di isi menunjuk halaman yang ada; tanpa tautan/gambar berbahaya", () => {
    const slugLayanan = new Set([
      "konsultasi-proses-bisnis",
      "pengembangan-sistem",
      "analitik-data",
      "pelatihan-sdm",
    ]);
    for (const a of semuaArtikel()) {
      expect(existsSync(join(process.cwd(), "public", a.gambar)), a.slug).toBe(true);
      for (const b of parseMarkdown(a.isi)) {
        const inline =
          b.t === "p" || b.t === "quote" || b.t === "heading"
            ? b.children
            : b.t === "ul" || b.t === "ol"
              ? b.items.flat()
              : [];
        for (const n of inline) {
          if (n.t === "link" && n.href.startsWith("/layanan/"))
            expect(slugLayanan, `${a.slug} → ${n.href}`).toContain(n.href.split("/")[2]);
        }
      }
    }
  });

  it("setiap kategori punya ≥ 1 artikel; cariArtikel & perKategori", () => {
    for (const k of blog.kategori) expect(artikelPerKategori(k.id).length, k.id).toBeGreaterThan(0);
    expect(cariArtikel("tidak-ada")).toBeUndefined();
    expect(cariArtikel("__proto__")).toBeUndefined();
  });

  it("berkas rusak di direktori → error menyebut nama berkas", () => {
    const dir = mkdtempSync(join(tmpdir(), "blog-"));
    writeFileSync(join(dir, "rusak.md"), "tanpa front matter");
    expect(() => semuaArtikel(dir)).toThrow(/rusak\.md/);
  });

  it("formatTanggalBlog: format Indonesia", () => {
    expect(formatTanggalBlog("2026-09-12")).toBe("12 September 2026");
  });
});
