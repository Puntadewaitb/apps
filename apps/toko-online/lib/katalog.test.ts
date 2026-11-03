import { describe, expect, it } from "vitest";
import {
  cocokKata,
  daftarHalaman,
  galeriProduk,
  habis,
  hargaBervariasi,
  hargaMulai,
  jsonLd,
  paginasi,
  parseHalaman,
  parseQ,
  parseSlug,
  parseUrut,
  stokTotal,
  urlKatalog,
  urutkan,
  type ItemUrut,
} from "./katalog";

const item = (
  id: number,
  name: string,
  price: number,
  t: number,
  variants: ItemUrut["variants"] = [],
): ItemUrut => ({
  id,
  name,
  price,
  createdAt: new Date(t),
  variants,
});

describe("parse query string (nilai aneh tidak pernah menjadi error)", () => {
  it("urut: hanya nilai sah, selain itu 'terbaru'", () => {
    expect(parseUrut("termurah")).toBe("termurah");
    expect(parseUrut(["nama", "termurah"])).toBe("nama");
    for (const x of [undefined, "", "harga; DROP TABLE", "TERMURAH", "__proto__"])
      expect(parseUrut(x)).toBe("terbaru");
  });
  it("halaman: bilangan bulat ≥ 1, selain itu 1", () => {
    expect(parseHalaman("3")).toBe(3);
    for (const x of [undefined, "0", "-2", "1.5", "abc", "1e3", "9999999", " 2", "２"])
      expect(parseHalaman(x)).toBe(1);
  });
  it("kategori: hanya slug sah", () => {
    expect(parseSlug("kopi-teh")).toBe("kopi-teh");
    for (const x of [
      undefined,
      "",
      "Kopi",
      "a_b",
      "../etc",
      "a--b",
      "-a",
      "x".repeat(81),
      "kopi teh",
    ])
      expect(parseSlug(x)).toBeUndefined();
  });
  it("q: tag/kontrol dibersihkan, panjang dibatasi", () => {
    expect(parseQ("  kopi   gayo ")).toBe("kopi gayo");
    expect(parseQ("<script>alert(1)</script>kopi")).not.toContain("<");
    expect(parseQ("a".repeat(500)).length).toBeLessThanOrEqual(60);
    expect(parseQ(undefined)).toBe("");
  });
});

describe("harga & stok dari varian aktif", () => {
  const p = {
    price: 100,
    variants: [
      { price: null, stock: 0 },
      { price: 150, stock: 2 },
    ],
  };
  it("hargaMulai = termurah di antara varian aktif; varian nonaktif diabaikan", () => {
    expect(hargaMulai(p)).toBe(100);
    expect(
      hargaMulai({
        price: 100,
        variants: [
          { price: 80, stock: 1, active: false },
          { price: 150, stock: 1 },
        ],
      }),
    ).toBe(150);
  });
  it("tanpa varian aktif → harga produk; bervariasi hanya bila harga efektif berbeda", () => {
    expect(hargaMulai({ price: 70, variants: [] })).toBe(70);
    expect(hargaBervariasi(p)).toBe(true);
    expect(
      hargaBervariasi({
        price: 100,
        variants: [
          { price: null, stock: 1 },
          { price: 100, stock: 1 },
        ],
      }),
    ).toBe(false);
  });
  it("stok total & habis (stok negatif tidak mengurangi)", () => {
    expect(stokTotal(p)).toBe(2);
    expect(habis(p)).toBe(false);
    expect(
      habis({
        price: 1,
        variants: [
          { price: null, stock: 0 },
          { price: null, stock: -5 },
        ],
      }),
    ).toBe(true);
    expect(habis({ price: 1, variants: [] })).toBe(true);
    expect(habis({ price: 1, variants: [{ price: null, stock: 9, active: false }] })).toBe(true);
  });
});

describe("urutkan", () => {
  const a = item(1, "Beta", 50, 1000);
  const b = item(2, "alfa", 30, 2000);
  const c = item(3, "Cakra", 30, 3000);
  const d = item(4, "Delta", 90, 3000);
  const semua = [a, b, c, d];
  it("terbaru: createdAt turun, id turun sebagai pemecah seri", () => {
    expect(urutkan(semua, "terbaru").map((x) => x.id)).toEqual([4, 3, 2, 1]);
  });
  it("termurah/termahal memakai harga efektif varian; seri → terbaru dulu", () => {
    expect(urutkan(semua, "termurah").map((x) => x.id)).toEqual([3, 2, 1, 4]);
    expect(urutkan(semua, "termahal").map((x) => x.id)).toEqual([4, 1, 3, 2]);
    const v = item(5, "Varian", 500, 10, [{ price: 10, stock: 1 }]);
    expect(urutkan([a, v], "termurah")[0]).toBe(v);
  });
  it("nama: tanpa membedakan huruf besar/kecil", () => {
    expect(urutkan(semua, "nama").map((x) => x.name)).toEqual(["alfa", "Beta", "Cakra", "Delta"]);
  });
  it("tidak memutasi input", () => {
    const salin = [...semua];
    urutkan(semua, "nama");
    expect(semua).toEqual(salin);
  });
});

describe("paginasi & daftar halaman", () => {
  it("menjepit halaman ke rentang sah", () => {
    expect(paginasi(0, 1)).toEqual({ jumlahHalaman: 1, halaman: 1 });
    expect(paginasi(25, 99)).toEqual({ jumlahHalaman: 3, halaman: 3 });
    expect(paginasi(24, 2)).toEqual({ jumlahHalaman: 2, halaman: 2 });
    expect(paginasi(25, 0).halaman).toBe(1);
  });
  it("daftarHalaman: awal, akhir, tetangga, elipsis", () => {
    expect(daftarHalaman(1, 1)).toEqual([1]);
    expect(daftarHalaman(1, 3)).toEqual([1, 2, 3]);
    expect(daftarHalaman(5, 10)).toEqual([1, null, 4, 5, 6, null, 10]);
    expect(daftarHalaman(2, 10)).toEqual([1, 2, 3, null, 10]);
  });
});

describe("urlKatalog", () => {
  it("menghilangkan nilai bawaan dan meng-encode nilai", () => {
    expect(urlKatalog({})).toBe("/produk");
    expect(urlKatalog({ urut: "terbaru", halaman: 1 })).toBe("/produk");
    expect(urlKatalog({ kategori: "kopi-teh", urut: "termurah", halaman: 2 })).toBe(
      "/produk?kategori=kopi-teh&urut=termurah&halaman=2",
    );
    expect(urlKatalog({ q: "a&b=c #x" })).toBe("/produk?q=a%26b%3Dc+%23x");
  });
});

describe("galeriProduk, jsonLd", () => {
  it("galeriProduk: hanya path gambar sah, unik; JSON rusak diabaikan", () => {
    expect(galeriProduk("/img/a.svg", '["/img/b.svg","/img/a.svg"]')).toEqual([
      "/img/a.svg",
      "/img/b.svg",
    ]);
    expect(galeriProduk("/img/a.svg", "{rusak")).toEqual(["/img/a.svg"]);
    expect(galeriProduk("/img/a.svg", '"bukan-array"')).toEqual(["/img/a.svg"]);
    const jahat = [
      "javascript:alert(1)",
      "//evil.test/x.png",
      "https://evil.test/x.png",
      "/img/../../etc/passwd",
      "/uploads/x.html",
      42,
      null,
      "/img/a.svg?x=<",
    ];
    expect(galeriProduk("/img/a.svg", JSON.stringify(jahat))).toEqual(["/img/a.svg"]);
    expect(galeriProduk("/uploads/AbCdEfGhIjKlMnOp12.png", "[]")).toEqual([
      "/uploads/AbCdEfGhIjKlMnOp12.png",
    ]);
    expect(galeriProduk("javascript:alert(1)", "[]")).toEqual([]);
  });
  it("jsonLd tidak bisa menutup tag script", () => {
    const out = jsonLd({ name: "</script><script>alert(1)</script>" });
    expect(out).not.toContain("<");
    expect(JSON.parse(out).name).toContain("</script>");
  });
});

describe("cocokKata (pencarian teks)", () => {
  it("tanpa membedakan huruf; cocok di salah satu teks; kata kosong cocok semua", () => {
    expect(cocokKata("KOPI", "Kopi Gayo", "")).toBe(true);
    expect(cocokKata("gayo", "x", "dataran tinggi Gayo")).toBe(true);
    expect(cocokKata("teh", "Kopi", "Robusta")).toBe(false);
    expect(cocokKata("  ", "apa saja")).toBe(true);
  });
  it("wildcard LIKE diperlakukan sebagai teks biasa (regresi: q=% mencocokkan semua produk)", () => {
    for (const w of ["%", "_", "%%", "\\"])
      expect(cocokKata(w, "Kopi Arabika", "Biji kopi")).toBe(false);
    expect(cocokKata("100%", "Diskon 100% asli")).toBe(true);
  });
});
