import { describe, expect, it } from "vitest";
import { normalizeBase, withBase } from "./base";

describe("normalizeBase", () => {
  it("menormalkan input", () => {
    expect(normalizeBase(undefined)).toBe("");
    expect(normalizeBase("")).toBe("");
    expect(normalizeBase("/")).toBe("");
    expect(normalizeBase("apps/toko")).toBe("/apps/toko");
    expect(normalizeBase("/apps/toko///")).toBe("/apps/toko");
  });
});

describe("withBase", () => {
  const B = "/apps/toko";
  it("menambahkan base ke URL root-relatif", () => {
    expect(withBase("/produk/kaos", B)).toBe("/apps/toko/produk/kaos");
    expect(withBase("/", B)).toBe("/apps/toko/");
    expect(withBase("/img/a.svg?v=1#x", B)).toBe("/apps/toko/img/a.svg?v=1#x");
  });
  it("tidak mengubah URL lain", () => {
    for (const u of [
      "https://wa.me/62811",
      "http://x.id/a",
      "mailto:a@b.id",
      "tel:+62811",
      "data:image/png;base64,AAA",
      "blob:abc",
      "//cdn.example/x.js",
      "#fitur",
      "?q=1",
      "produk/kaos",
      "",
    ])
      expect(withBase(u, B), u).toBe(u);
  });
  it("idempoten: tidak menggandakan base yang sudah ada", () => {
    expect(withBase("/apps/toko/produk", B)).toBe("/apps/toko/produk");
    expect(withBase("/apps/toko", B)).toBe("/apps/toko");
    expect(withBase("/apps/toko?x=1", B)).toBe("/apps/toko?x=1");
    // awalan serupa BUKAN base → tetap diberi base
    expect(withBase("/apps/tokoku", B)).toBe("/apps/toko/apps/tokoku");
  });
  it("undefined/null lolos; base kosong = no-op", () => {
    expect(withBase(undefined, B)).toBeUndefined();
    expect(withBase(null, B)).toBeNull();
    expect(withBase("/produk", "")).toBe("/produk");
  });
});
