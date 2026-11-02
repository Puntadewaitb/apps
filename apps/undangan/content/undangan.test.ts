import { existsSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { undangan } from "./undangan";

const publik = (src: string) => join(__dirname, "..", "public", src);

describe("konten undangan", () => {
  it("setiap foto galeri: berkas ada di public/, alt tidak kosong, src unik", () => {
    const { foto } = undangan.galeri;
    expect(foto.length).toBeGreaterThanOrEqual(4);
    for (const f of foto) {
      expect(existsSync(publik(f.src)), f.src).toBe(true);
      expect(f.alt.trim().length).toBeGreaterThan(0);
    }
    expect(new Set(foto.map((f) => f.src)).size).toBe(foto.length);
  });

  it("cerita: lengkap & berurutan menurut waktu", () => {
    const { peristiwa } = undangan.cerita;
    expect(peristiwa.length).toBeGreaterThanOrEqual(3);
    for (const p of peristiwa) {
      expect(p.waktu && p.judul && p.teks).toBeTruthy();
    }
    const tahun = peristiwa.map((p) => Number(p.waktu));
    expect(tahun).toEqual([...tahun].sort((a, b) => a - b));
  });
});

describe("amplop digital", () => {
  const { amplop } = undangan;

  it("rekening: id unik, nomor hanya digit, nama & atas nama terisi", () => {
    expect(amplop.rekening.length).toBeGreaterThanOrEqual(1);
    expect(new Set(amplop.rekening.map((r) => r.id)).size).toBe(amplop.rekening.length);
    for (const r of amplop.rekening) {
      expect(r.nomor).toMatch(/^\d{6,20}$/);
      expect(r.nama.trim() && r.atasNama.trim()).toBeTruthy();
    }
  });

  it("data demo jelas ditandai fiktif/contoh", () => {
    for (const r of amplop.rekening) expect(r.nama.toLowerCase()).toContain("contoh");
    expect(amplop.hadiah.alamat.toLowerCase()).toContain("fiktif");
    expect(amplop.qris.alt.toLowerCase()).toContain("placeholder");
  });

  it("gambar QRIS placeholder ada di public/", () => {
    expect(existsSync(publik(amplop.qris.src))).toBe(true);
  });
});
