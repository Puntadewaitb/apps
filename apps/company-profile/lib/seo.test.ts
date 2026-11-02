import { describe, expect, it } from "vitest";
import { semuaArtikel } from "./blog";
import { LANGS } from "./i18n";
import { getBlog, getKonten, getUi } from "./konten";
import {
  absUrl,
  artikelLd,
  jsonLd,
  layananLd,
  organizationLd,
  pageMeta,
  semuaRute,
  siteUrl,
} from "./seo";

describe("paritas ID ↔ EN", () => {
  it("slug layanan, proyek, kategori portofolio & blog identik", () => {
    const id = getKonten("id");
    const en = getKonten("en");
    expect(en.layanan.map((l) => l.slug)).toEqual(id.layanan.map((l) => l.slug));
    expect(en.layanan.map((l) => l.terkait)).toEqual(id.layanan.map((l) => l.terkait));
    expect(en.layanan.map((l) => l.faq.map((f) => f.id))).toEqual(
      id.layanan.map((l) => l.faq.map((f) => f.id)),
    );
    expect(en.portofolio.proyek.map((p) => [p.slug, p.kategori, p.tahun])).toEqual(
      id.portofolio.proyek.map((p) => [p.slug, p.kategori, p.tahun]),
    );
    expect(en.portofolio.kategori.map((c) => [c.id, c.layanan])).toEqual(
      id.portofolio.kategori.map((c) => [c.id, c.layanan]),
    );
    expect(getBlog("en").kategori.map((c) => c.id)).toEqual(
      getBlog("id").kategori.map((c) => c.id),
    );
    expect(en.nav.map((n) => n.href)).toEqual(id.nav.map((n) => n.href));
    expect(en.kontak.email).toBe(id.kontak.email);
    expect(en.kontak.whatsapp).toBe(id.kontak.whatsapp);
  });

  it("artikel blog: slug, kategori, tanggal sama di kedua bahasa; judul berbeda", () => {
    const id = semuaArtikel("id");
    const en = semuaArtikel("en");
    expect(en.map((a) => [a.slug, a.kategori, a.tanggal])).toEqual(
      id.map((a) => [a.slug, a.kategori, a.tanggal]),
    );
    for (const a of en) {
      const asal = id.find((x) => x.slug === a.slug)!;
      expect(a.judul, a.slug).not.toBe(asal.judul);
    }
  });

  it("tautan internal di artikel EN memakai awalan /en/ dan menunjuk rute yang ada", () => {
    const rute = new Set(semuaRute("en").map((r) => r.path));
    for (const a of semuaArtikel("en")) {
      for (const m of a.isi.matchAll(/\]\((\/[^)\s]*)\)/g)) {
        const href = m[1]!;
        expect(href.startsWith("/en/"), `${a.slug}: ${href}`).toBe(true);
        expect(rute.has(href.slice(3)), `${a.slug}: ${href}`).toBe(true);
      }
    }
    for (const a of semuaArtikel("id")) {
      for (const m of a.isi.matchAll(/\]\((\/[^)\s]*)\)/g)) {
        expect(m[1]!.startsWith("/en"), `${a.slug}: ${m[1]}`).toBe(false);
      }
    }
  });

  it("kunci kamus UI sama persis (rekursif)", () => {
    const keys = (o: unknown, p = ""): string[] =>
      typeof o === "object" && o !== null
        ? Object.entries(o).flatMap(([k, v]) => keys(v, `${p}${k}.`))
        : [p];
    expect(keys(getUi("en")).sort()).toEqual(keys(getUi("id")).sort());
  });

  it("teks EN tidak sama dengan ID (kecuali nama/angka) → benar-benar diterjemahkan", () => {
    const id = getKonten("id");
    const en = getKonten("en");
    expect(en.hero.judul).not.toBe(id.hero.judul);
    expect(en.tentang.pengantar).not.toBe(id.tentang.pengantar);
    expect(en.layanan[0]!.ringkas).not.toBe(id.layanan[0]!.ringkas);
    expect(en.layananHalaman.judul).toBe("Services");
  });
});

describe("seo", () => {
  it("pageMeta: canonical per bahasa + hreflang id/en/x-default", () => {
    const m = pageMeta({
      lang: "en",
      path: "/layanan",
      title: "Services",
      description: "x".repeat(30),
    });
    expect(m.alternates?.canonical).toBe("/en/layanan");
    expect(m.alternates?.languages).toEqual({
      id: "/layanan",
      en: "/en/layanan",
      "x-default": "/layanan",
    });
    expect(m.openGraph).toMatchObject({
      locale: "en_US",
      alternateLocale: ["id_ID"],
      url: "/en/layanan",
    });
    const mid = pageMeta({ lang: "id", path: "/", title: "Beranda", description: "x".repeat(30) });
    expect(mid.alternates?.canonical).toBe("/");
    expect(mid.alternates?.languages).toMatchObject({ en: "/en" });
  });

  it("absUrl memakai NEXT_PUBLIC_SITE_URL tanpa trailing slash", () => {
    const prev = process.env.NEXT_PUBLIC_SITE_URL;
    process.env.NEXT_PUBLIC_SITE_URL = "https://contoh.example///";
    try {
      expect(siteUrl()).toBe("https://contoh.example");
      expect(absUrl("en", "/blog")).toBe("https://contoh.example/en/blog");
      expect(absUrl("id", "/")).toBe("https://contoh.example");
      expect(absUrl("en", "/")).toBe("https://contoh.example/en");
    } finally {
      if (prev === undefined) delete process.env.NEXT_PUBLIC_SITE_URL;
      else process.env.NEXT_PUBLIC_SITE_URL = prev;
    }
  });

  it("JSON-LD Organization: tipe LocalBusiness, alamat & jam buka terstruktur", () => {
    for (const lang of LANGS) {
      const o = organizationLd(lang);
      expect(o["@type"]).toBe("ProfessionalService");
      expect(o.address.addressCountry).toBe("ID");
      expect(o.address.postalCode).toMatch(/^\d{5}$/);
      expect(o.openingHoursSpecification[0]!.dayOfWeek).toContain("Monday");
      expect(o.makesOffer).toHaveLength(getKonten(lang).layanan.length);
      expect(o.inLanguage).toBe(lang);
    }
  });

  it("JSON-LD layanan/artikel: ada untuk slug valid, null untuk yang tidak", () => {
    expect(layananLd("en", "analitik-data")?.["@type"]).toBe("Service");
    expect(layananLd("en", "tidak-ada")).toBeNull();
    const a = semuaArtikel("en")[0]!;
    expect(artikelLd("en", a.slug)).toMatchObject({
      "@type": "BlogPosting",
      inLanguage: "en",
      headline: a.judul,
    });
    expect(artikelLd("en", "__proto__")).toBeNull();
  });

  it("jsonLd meng-escape '<' sehingga tidak bisa menutup <script>", () => {
    const s = jsonLd({ x: "</script><script>alert(1)</script>", y: "a b" });
    expect(s).not.toContain("<");
    expect(s).not.toContain(" ");
    expect(JSON.parse(s)).toEqual({ x: "</script><script>alert(1)</script>", y: "a b" });
  });

  it("semuaRute: himpunan path sama untuk id & en, tanpa duplikat", () => {
    const id = semuaRute("id").map((r) => r.path);
    const en = semuaRute("en").map((r) => r.path);
    expect(en).toEqual(id);
    expect(new Set(id).size).toBe(id.length);
    expect(id).toContain("/");
    expect(id).toContain("/blog/kategori/tips");
  });
});
