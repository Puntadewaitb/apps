import { describe, expect, it } from "vitest";
import { slugUnik, slugify } from "./slug";

describe("slugify", () => {
  it("huruf kecil, tanda hubung, tanpa diakritik/simbol", () => {
    expect(slugify("Pendaftaran Siswa Baru 2027!")).toBe("pendaftaran-siswa-baru-2027");
    expect(slugify("  Tim Sains & Teknologi  ")).toBe("tim-sains-dan-teknologi");
    expect(slugify("Café Résumé Ünïcode")).toBe("cafe-resume-unicode");
    expect(slugify("a---b___c")).toBe("a-b-c");
  });
  it("hasil selalu cocok pola slug rute; kosong → fallback; dibatasi 80 karakter", () => {
    for (const t of [
      "",
      "   ",
      "!!!",
      "日本語",
      "../../etc/passwd",
      "<script>alert(1)</script>",
      "a".repeat(300),
      "%2e%2e",
    ]) {
      const s = slugify(t);
      expect(s, JSON.stringify(t)).toMatch(/^[a-z0-9]+(?:-[a-z0-9]+)*$/);
      expect(s.length).toBeLessThanOrEqual(80);
    }
    expect(slugify("")).toBe("tulisan");
    expect(slugify("!!!", "album")).toBe("album");
    expect(slugify("../../etc/passwd")).toBe("etc-passwd");
  });
});

describe("slugUnik", () => {
  it("menambah sufiks angka bila bentrok", async () => {
    const dipakai = new Set(["berita", "berita-2", "berita-3"]);
    expect(await slugUnik("berita", async (s) => dipakai.has(s))).toBe("berita-4");
    expect(await slugUnik("baru", async (s) => dipakai.has(s))).toBe("baru");
  });
  it("menyerah (error) bila semua bentrok — tidak loop selamanya", async () => {
    await expect(slugUnik("x", async () => true)).rejects.toThrow();
  });
  it("sufiks tidak melampaui panjang maksimum", async () => {
    const dasar = "a".repeat(80);
    const s = await slugUnik(dasar, async (x) => x === dasar);
    expect(s.length).toBeLessThanOrEqual(80);
    expect(s.endsWith("-2")).toBe(true);
  });
});
