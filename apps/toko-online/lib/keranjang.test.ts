import { describe, expect, it } from "vitest";
import {
  MAKS_BARIS,
  MAKS_QTY,
  hapus,
  hitungSubtotal,
  jumlahItem,
  parseKeranjang,
  qtyEfektif,
  serialisasi,
  tambah,
  ubahQty,
  type DetailBaris,
} from "./keranjang";

describe("parseKeranjang (isi localStorage = input tidak tepercaya)", () => {
  it("membaca hasil serialisasi apa adanya", () => {
    const b = [
      { varianId: 3, qty: 2 },
      { varianId: 9, qty: 1 },
    ];
    expect(parseKeranjang(serialisasi(b))).toEqual(b);
  });
  it("JSON rusak/bukan array/kosong → []", () => {
    for (const x of [null, undefined, "", "{rusak", "{}", "null", '"x"', "5", "true"])
      expect(parseKeranjang(x)).toEqual([]);
  });
  it("membuang baris tak sah: id/qty bukan bilangan bulat positif, bukan angka, objek salah", () => {
    const kotor = [
      { varianId: 1, qty: 0 },
      { varianId: 1, qty: -3 },
      { varianId: 1, qty: 1.5 },
      { varianId: 1, qty: "2" },
      { varianId: "1", qty: 2 },
      { varianId: 0, qty: 2 },
      { varianId: -1, qty: 2 },
      { varianId: 1.2, qty: 2 },
      { varianId: 99999999999, qty: 2 },
      { varianId: null, qty: 2 },
      { qty: 2 },
      null,
      5,
      "x",
      [],
      { varianId: 7, qty: 4 },
    ];
    expect(parseKeranjang(JSON.stringify(kotor))).toEqual([{ varianId: 7, qty: 4 }]);
  });
  it("menggabungkan duplikat dan menjepit qty ke MAKS_QTY; properti tambahan (mis. harga) dibuang", () => {
    const r = parseKeranjang(
      JSON.stringify([
        { varianId: 1, qty: 60, harga: 1 },
        { varianId: 1, qty: 60 },
        { varianId: 2, qty: 9_999_999 },
      ]),
    );
    expect(r).toEqual([
      { varianId: 1, qty: MAKS_QTY },
      { varianId: 2, qty: MAKS_QTY },
    ]);
    expect(Object.keys(r[0]!).sort()).toEqual(["qty", "varianId"]);
  });
  it("membatasi jumlah baris dan ukuran masukan", () => {
    const banyak = Array.from({ length: 500 }, (_, i) => ({ varianId: i + 1, qty: 1 }));
    expect(parseKeranjang(JSON.stringify(banyak))).toHaveLength(MAKS_BARIS);
    expect(parseKeranjang(`[${" ".repeat(30_000)}]`)).toEqual([]);
  });
  it("kunci prototipe berbahaya tidak berpengaruh", () => {
    expect(parseKeranjang('[{"__proto__":{"x":1},"varianId":1,"qty":1}]')).toEqual([
      { varianId: 1, qty: 1 },
    ]);
    expect(({} as Record<string, unknown>).x).toBeUndefined();
  });
});

describe("tambah / ubahQty / hapus", () => {
  it("tambah baris baru dan menggabungkan ke baris yang ada", () => {
    const a = tambah([], 5, 2, 10);
    expect(a).toMatchObject({
      baris: [{ varianId: 5, qty: 2 }],
      qtyAkhir: 2,
      terpotong: false,
      ditambah: 2,
    });
    const b = tambah(a.baris, 5, 3, 10);
    expect(b.baris).toEqual([{ varianId: 5, qty: 5 }]);
    expect(b.ditambah).toBe(3);
  });
  it("dijepit oleh stok: terpotong=true dan hanya selisih yang masuk", () => {
    const a = tambah([{ varianId: 5, qty: 4 }], 5, 3, 6);
    expect(a).toMatchObject({ qtyAkhir: 6, terpotong: true, ditambah: 2 });
    const penuh = tambah(a.baris, 5, 1, 6);
    expect(penuh).toMatchObject({ qtyAkhir: 6, terpotong: true, ditambah: 0 });
    expect(penuh.baris).toBe(a.baris); // tidak berubah
  });
  it("stok 0 / qty tak sah tidak menambah apa pun", () => {
    expect(tambah([], 1, 2, 0).baris).toEqual([]);
    for (const q of [0, -5, Number.NaN, 0.4])
      expect(tambah([], 1, q, 9).baris, String(q)).toEqual([]);
  });
  it("tanpa info stok tetap dijepit MAKS_QTY; baris baru ditolak bila sudah MAKS_BARIS", () => {
    expect(tambah([], 1, 500).qtyAkhir).toBe(MAKS_QTY);
    const penuh = Array.from({ length: MAKS_BARIS }, (_, i) => ({ varianId: i + 1, qty: 1 }));
    const r = tambah(penuh, 9999, 1, 5);
    expect(r.baris).toBe(penuh);
    expect(r.ditambah).toBe(0);
    expect(tambah(penuh, 3, 1, 5).baris[2]!.qty).toBe(2); // baris yang ada tetap bisa ditambah
  });
  it("ubahQty menjepit 1..min(stok, MAKS_QTY), qty aneh → 1, id yang tak ada diabaikan", () => {
    const b = [{ varianId: 1, qty: 2 }];
    expect(ubahQty(b, 1, 5, 10)[0]!.qty).toBe(5);
    expect(ubahQty(b, 1, 50, 10)[0]!.qty).toBe(10);
    expect(ubahQty(b, 1, 0, 10)[0]!.qty).toBe(1);
    expect(ubahQty(b, 1, -4, 10)[0]!.qty).toBe(1);
    expect(ubahQty(b, 1, Number.NaN, 10)[0]!.qty).toBe(1);
    expect(ubahQty(b, 1, 500)[0]!.qty).toBe(MAKS_QTY);
    expect(ubahQty(b, 77, 3)).toEqual(b);
  });
  it("hapus & jumlahItem", () => {
    const b = [
      { varianId: 1, qty: 2 },
      { varianId: 2, qty: 3 },
    ];
    expect(hapus(b, 1)).toEqual([{ varianId: 2, qty: 3 }]);
    expect(hapus(b, 99)).toEqual(b);
    expect(jumlahItem(b)).toBe(5);
    expect(jumlahItem([])).toBe(0);
  });
});

describe("hitungSubtotal & qtyEfektif — harga HANYA dari data server", () => {
  const ada = (varianId: number, harga: number, stok: number): DetailBaris => ({
    varianId,
    tersedia: true,
    produkNama: "P",
    slug: "p",
    varianNama: "V",
    gambar: "/img/produk-1.svg",
    harga,
    stok,
  });
  it("qtyEfektif tidak melebihi stok/MAKS_QTY dan tidak negatif", () => {
    expect(qtyEfektif(5, 3)).toBe(3);
    expect(qtyEfektif(2, 10)).toBe(2);
    expect(qtyEfektif(500, 1000)).toBe(MAKS_QTY);
    expect(qtyEfektif(4, 0)).toBe(0);
    expect(qtyEfektif(4, -2)).toBe(0);
  });
  it("menjumlah harga × qty efektif; baris habis/tak tersedia/tak dikenal tidak dihitung", () => {
    const d = new Map<number, DetailBaris>([
      [1, ada(1, 10_000, 5)],
      [2, ada(2, 2_500, 1)],
      [3, ada(3, 99_000, 0)],
      [4, { varianId: 4, tersedia: false }],
    ]);
    const b = [
      { varianId: 1, qty: 3 },
      { varianId: 2, qty: 4 }, // dijepit ke stok 1
      { varianId: 3, qty: 2 },
      { varianId: 4, qty: 2 },
      { varianId: 5, qty: 9 }, // tak ada di server
    ];
    expect(hitungSubtotal(b, d)).toEqual({ subtotal: 3 * 10_000 + 1 * 2_500, item: 4 });
    expect(hitungSubtotal([], d)).toEqual({ subtotal: 0, item: 0 });
  });
});
