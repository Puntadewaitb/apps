import { describe, expect, it } from "vitest";
import { parseRupiah, persen } from "./rupiah";

describe("parseRupiah", () => {
  it("menerima angka polos, titik ribuan, spasi ribuan, awalan Rp", () => {
    for (const [v, n] of [
      ["150000", 150000],
      ["150.000", 150000],
      ["Rp 1.500.000", 1500000],
      ["rp.2.500.000", 2500000],
      ["1 500 000", 1500000],
      ["  10000  ", 10000],
      ["1000000000", 1000000000],
    ] as const) {
      expect(parseRupiah(v), v).toEqual({ ok: true, nilai: n });
    }
  });
  it("menolak desimal, huruf/satuan, negatif, kosong, pemisah ganjil, notasi ilmiah", () => {
    for (const v of [
      "",
      "  ",
      "abc",
      "1,5 juta",
      "150.000,50",
      "150,000",
      "-150000",
      "+150000",
      "1e6",
      "0x10",
      "15.00",
      "1..000",
      ".500",
      "1.5",
      "１５００００",
      "150000 rupiah",
      "Rp",
      "Rp.",
      "1.000.00",
    ]) {
      expect(parseRupiah(v).ok, v).toBe(false);
    }
  });
  it("batas minimal & maksimal (dengan pesan jelas)", () => {
    const kecil = parseRupiah("9999");
    expect(kecil.ok).toBe(false);
    if (!kecil.ok) expect(kecil.pesan).toContain("minimal Rp 10.000");
    const besar = parseRupiah("1.000.000.001");
    expect(besar.ok).toBe(false);
    if (!besar.ok) expect(besar.pesan).toContain("maksimal");
    expect(parseRupiah("0").ok).toBe(false);
    expect(parseRupiah("99999999999999999999").ok).toBe(false); // melampaui integer aman
  });
  it("batas kustom (target program)", () => {
    expect(parseRupiah("100000", 100_000, 1_000_000).ok).toBe(true);
    expect(parseRupiah("99999", 100_000, 1_000_000).ok).toBe(false);
  });
});

describe("persen", () => {
  it("dipotong ke bawah; tidak dibatasi 100; nol bila target/terkumpul tidak valid", () => {
    expect(persen(0, 100)).toBe(0);
    expect(persen(1, 3)).toBe(33);
    expect(persen(99, 100)).toBe(99);
    expect(persen(100, 100)).toBe(100);
    expect(persen(150, 100)).toBe(150);
    for (const [a, b] of [
      [10, 0],
      [10, -5],
      [-10, 100],
      [NaN, 100],
      [10, NaN],
    ] as const)
      expect(persen(a, b), `${a}/${b}`).toBe(0);
  });
});
