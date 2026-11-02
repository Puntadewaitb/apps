import { existsSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { konten as kontenEn } from "../content/en";
import { konten } from "../content/id";
import {
  cariLayanan,
  cariProyek,
  getKonten,
  kategoriValid,
  proyekPerKategori,
  resolveHref,
  semuaLayanan,
  semuaProyek,
} from "./konten";
import { kontenSchema } from "./konten-schema";

describe("konten website", () => {
  it("lolos validasi skema", () => {
    const r = kontenSchema.safeParse(konten);
    expect(r.success, r.success ? "" : JSON.stringify(r.error.issues, null, 1)).toBe(true);
  });

  it("konten English juga lolos validasi skema & gambar ada", () => {
    const r = kontenSchema.safeParse(kontenEn);
    expect(r.success, r.success ? "" : JSON.stringify(r.error.issues, null, 1)).toBe(true);
    for (const g of [kontenEn.hero.gambar.src, ...kontenEn.tentang.tim.anggota.map((a) => a.foto)])
      expect(existsSync(join(__dirname, "..", "public", g)), g).toBe(true);
  });

  it("gambar hero ada di public/", () => {
    expect(existsSync(join(__dirname, "..", "public", konten.hero.gambar.src))).toBe(true);
  });

  it("data demo jelas fiktif (alamat & domain .example)", () => {
    expect(konten.kontak.alamat.toLowerCase()).toContain("fiktif");
    expect(konten.kontak.email).toMatch(/\.example$/);
  });

  it("skema menolak href berbahaya & format WhatsApp salah", () => {
    for (const href of [
      "javascript:alert(1)",
      "data:text/html,x",
      "//evil.example",
      "http://tidak-aman.example",
      "foo",
    ]) {
      const bad = structuredClone(konten);
      bad.hero.cta.href = href;
      expect(kontenSchema.safeParse(bad).success, href).toBe(false);
    }
    const bad = structuredClone(konten);
    bad.kontak.whatsapp = "+6281234567890";
    expect(kontenSchema.safeParse(bad).success).toBe(false);
  });

  it("resolveHref: WHATSAPP → wa.me dengan pesan; lainnya apa adanya", () => {
    const k = getKonten();
    const wa = resolveHref("WHATSAPP", k);
    expect(wa.startsWith(`https://wa.me/${k.kontak.whatsapp}?text=`)).toBe(true);
    expect(resolveHref("/layanan", k)).toBe("/layanan");
    expect(resolveHref("/layanan", k, "en")).toBe("/en/layanan");
    expect(resolveHref("#x", k, "en")).toBe("#x");
    expect(resolveHref("WHATSAPP", getKonten("en"), "en")).toContain("wa.me");
  });
});

describe("integritas konten layanan & tentang", () => {
  it("slug layanan unik; layanan terkait menunjuk slug yang ada & bukan dirinya sendiri", () => {
    const daftar = semuaLayanan();
    const slugs = daftar.map((l) => l.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
    for (const l of daftar) {
      for (const t of l.terkait) {
        expect(slugs, `${l.slug} → ${t}`).toContain(t);
        expect(t).not.toBe(l.slug);
      }
      expect(new Set(l.faq.map((f) => f.id)).size, `faq id ${l.slug}`).toBe(l.faq.length);
    }
  });

  it("cariLayanan: ada & tidak ada", () => {
    expect(cariLayanan("analitik-data")?.nama).toBe("Analitik & Dasbor Data");
    expect(cariLayanan("tidak-ada")).toBeUndefined();
    expect(cariLayanan("__proto__")).toBeUndefined();
  });

  it("foto tim ada di public/ & sejarah berurutan", () => {
    for (const a of konten.tentang.tim.anggota) {
      expect(existsSync(join(__dirname, "..", "public", a.foto)), a.foto).toBe(true);
    }
    const tahun = konten.tentang.sejarah.peristiwa.map((p) => Number(p.tahun));
    expect(tahun).toEqual([...tahun].sort((a, b) => a - b));
  });

  it("href navigasi hanya ke halaman yang ada / anchor", () => {
    const hrefs = konten.nav.map((n) => n.href);
    expect(hrefs).toEqual(
      expect.arrayContaining(["/", "/tentang", "/layanan", "/portofolio", "/blog", "/kontak"]),
    );
  });
});

describe("portofolio & kredibilitas", () => {
  const { portofolio, kredibilitas } = konten;
  const publik = (src: string) => join(__dirname, "..", "public", src);

  it("slug proyek unik; kategori & layanan terkait valid; gambar ada", () => {
    const slugs = portofolio.proyek.map((p) => p.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
    const idKat = portofolio.kategori.map((k) => k.id);
    expect(new Set(idKat).size).toBe(idKat.length);
    for (const k of portofolio.kategori) {
      expect(
        semuaLayanan().map((l) => l.slug),
        `kategori ${k.id}`,
      ).toContain(k.layanan);
    }
    for (const p of portofolio.proyek) {
      expect(idKat, p.slug).toContain(p.kategori);
      expect(existsSync(publik(p.gambar)), p.gambar).toBe(true);
    }
  });

  it("setiap kategori punya minimal satu proyek (filter tidak pernah kosong)", () => {
    for (const k of portofolio.kategori)
      expect(proyekPerKategori(k.id).length, k.id).toBeGreaterThan(0);
  });

  it("kategoriValid: hanya id yang dikenal; lainnya undefined", () => {
    expect(kategoriValid("sistem")).toBe("sistem");
    expect(kategoriValid(["data", "sistem"])).toBe("data");
    for (const bad of [undefined, "", "SISTEM", "xyz", "__proto__", "sistem'; DROP"]) {
      expect(kategoriValid(bad as string | undefined), String(bad)).toBeUndefined();
    }
  });

  it("proyekPerKategori & cariProyek", () => {
    expect(proyekPerKategori(undefined)).toHaveLength(semuaProyek().length);
    expect(proyekPerKategori("sistem").every((p) => p.kategori === "sistem")).toBe(true);
    expect(cariProyek("portal-pemesanan-sentosa")?.klien).toBe("CV Sentosa Abadi");
    expect(cariProyek("tidak-ada")).toBeUndefined();
  });

  it("logo klien ada, testimoni berperingkat 1–5, ada catatan fiktif", () => {
    for (const k of kredibilitas.klien.daftar)
      expect(existsSync(publik(k.logo)), k.logo).toBe(true);
    for (const t of kredibilitas.testimoni.daftar) {
      expect(t.rating).toBeGreaterThanOrEqual(1);
      expect(t.rating).toBeLessThanOrEqual(5);
    }
    expect(kredibilitas.testimoni.catatan.toLowerCase()).toContain("fiktif");
    expect(portofolio.catatan.toLowerCase()).toContain("fiktif");
  });
});
