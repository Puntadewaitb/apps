import { describe, expect, it } from "vitest";
import { PER_HALAMAN, paginasi, parseHalaman, parseJenis } from "./berita";

describe("parseJenis", () => {
  it("terima berita/pengumuman (tak peka kapitalisasi); selain itu undefined", () => {
    expect(parseJenis("berita")).toBe("BERITA");
    expect(parseJenis("PENGUMUMAN")).toBe("PENGUMUMAN");
    expect(parseJenis(["Berita", "x"])).toBe("BERITA");
    for (const v of [
      undefined,
      "",
      "semua",
      "constructor",
      "__proto__",
      "<script>",
      "berita ",
      "BERITA'--",
    ]) {
      expect(parseJenis(v), String(v)).toBeUndefined();
    }
  });
});

describe("parseHalaman", () => {
  it("bilangan bulat positif; selainnya 1", () => {
    expect(parseHalaman("3")).toBe(3);
    expect(parseHalaman(["2"])).toBe(2);
    for (const v of [undefined, "", "0", "-1", "1.5", "abc", "1e3", "9999999", " 2", "2 ", "２"]) {
      expect(parseHalaman(v), String(v)).toBe(1);
    }
  });
});

describe("paginasi", () => {
  it("menghitung jumlah halaman & memepatkan halaman di luar rentang", () => {
    expect(paginasi(0, 1)).toEqual({ jumlahHalaman: 1, halaman: 1 });
    expect(paginasi(PER_HALAMAN, 1)).toEqual({ jumlahHalaman: 1, halaman: 1 });
    expect(paginasi(PER_HALAMAN + 1, 2)).toEqual({ jumlahHalaman: 2, halaman: 2 });
    expect(paginasi(25, 99)).toEqual({ jumlahHalaman: 5, halaman: 5 });
    expect(paginasi(25, 0)).toEqual({ jumlahHalaman: 5, halaman: 1 });
    expect(paginasi(25, -3)).toEqual({ jumlahHalaman: 5, halaman: 1 });
  });
});
