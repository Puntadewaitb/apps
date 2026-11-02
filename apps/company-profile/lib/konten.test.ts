import { existsSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { konten } from "../content/id";
import { getKonten, resolveHref } from "./konten";
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
