import { existsSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { konten } from "../content/id";
import { cariLayanan, getKonten, resolveHref, semuaLayanan } from "./konten";
import { kontenSchema } from "./konten-schema";

describe("konten website", () => {
  it("lolos validasi skema", () => {
    const r = kontenSchema.safeParse(konten);
    expect(r.success, r.success ? "" : JSON.stringify(r.error.issues, null, 1)).toBe(true);
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
    expect(hrefs).toEqual(expect.arrayContaining(["/", "/tentang", "/layanan"]));
  });
});
