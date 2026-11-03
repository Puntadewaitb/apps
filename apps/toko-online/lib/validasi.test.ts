import { describe, expect, it } from "vitest";
import { awalBulanWib, awalHariWib } from "./waktu";
import { parseRupiah } from "./rupiah";
import { slugUnik, slugify } from "./slug";
import { MAKS_STOK, PATH_GAMBAR, bacaVarian, kategoriSchema, produkSchema } from "./validasi";
import { amanCallback, can } from "./auth-core";

describe("waktu WIB", () => {
  it("awalHariWib: tengah malam WIB (= 17:00 UTC hari sebelumnya), tepat di batas", () => {
    expect(awalHariWib(new Date("2026-11-03T16:59:59Z")).toISOString()).toBe(
      "2026-11-02T17:00:00.000Z",
    );
    expect(awalHariWib(new Date("2026-11-03T17:00:00Z")).toISOString()).toBe(
      "2026-11-03T17:00:00.000Z",
    );
    expect(awalHariWib(new Date("2026-11-03T00:00:00Z")).toISOString()).toBe(
      "2026-11-02T17:00:00.000Z",
    );
  });
  it("awalBulanWib & pergantian tahun", () => {
    expect(awalBulanWib(new Date("2026-11-30T20:00:00Z")).toISOString()).toBe(
      "2026-11-30T17:00:00.000Z",
    ); // sudah 1 Des WIB
    expect(awalBulanWib(new Date("2026-11-15T00:00:00Z")).toISOString()).toBe(
      "2026-10-31T17:00:00.000Z",
    );
    expect(awalBulanWib(new Date("2026-12-31T18:00:00Z")).toISOString()).toBe(
      "2026-12-31T17:00:00.000Z",
    );
  });
});

describe("parseRupiah", () => {
  it("format umum", () => {
    for (const [i, n] of [
      ["50000", 50000],
      ["50.000", 50000],
      ["Rp 1.500.000", 1_500_000],
      ["rp.2 000", 2000],
    ] as const)
      expect(parseRupiah(i, 1)).toEqual({ ok: true, nilai: n });
  });
  it("menolak desimal, satuan, negatif, kosong, di luar batas", () => {
    for (const x of [
      "",
      " ",
      "1,5",
      "1,5 juta",
      "-5",
      "5e3",
      "abc",
      "1.5",
      "0",
      "100.000.001",
      "99999999999999999999",
    ])
      expect(parseRupiah(x).ok, x).toBe(false);
  });
});

describe("slug", () => {
  it("slugify & slugUnik", async () => {
    expect(slugify("Kopi Arabika & Teh 250g!")).toBe("kopi-arabika-dan-teh-250g");
    expect(slugify("💥💥", "produk")).toBe("produk");
    expect(slugify("x".repeat(200)).length).toBeLessThanOrEqual(80);
    const dipakai = new Set(["a", "a-2"]);
    expect(await slugUnik("a", async (s) => dipakai.has(s))).toBe("a-3");
  });
});

describe("skema produk & kategori", () => {
  it("produk valid; HTML dibuang; harga dari teks rupiah", () => {
    const r = produkSchema.parse({
      name: "Kopi <b>Gayo</b>",
      categoryId: "3",
      description: "Deskripsi produk yang cukup panjang.",
      price: "85.000",
      active: "on",
    });
    expect(r).toMatchObject({ name: "Kopi Gayo", categoryId: 3, price: 85000, active: true });
  });
  it("produk tidak valid: nama pendek, kategori kosong, harga nol/desimal/negatif/terlalu besar, deskripsi pendek", () => {
    const dasar = {
      name: "Kopi",
      categoryId: "1",
      description: "Deskripsi yang cukup.",
      price: "1000",
    };
    expect(produkSchema.safeParse(dasar).success).toBe(true);
    for (const o of [
      { name: "ab" },
      { categoryId: "" },
      { categoryId: "-1" },
      { price: "0" },
      { price: "1,5" },
      { price: "-5" },
      { price: "100.000.001" },
      { description: "pendek" },
    ])
      expect(produkSchema.safeParse({ ...dasar, ...o }).success, JSON.stringify(o)).toBe(false);
  });
  it("kategori", () => {
    expect(kategoriSchema.parse({ name: " Kopi & Teh ", sort: "2" })).toEqual({
      name: "Kopi & Teh",
      sort: 2,
    });
    expect(kategoriSchema.safeParse({ name: "x", sort: "2" }).success).toBe(false);
    expect(kategoriSchema.safeParse({ name: "Kopi", sort: "-1" }).success).toBe(false);
    expect(kategoriSchema.safeParse({ name: "Kopi", sort: "1.5" }).success).toBe(false);
  });
  it("PATH_GAMBAR hanya path lokal yang sah", () => {
    expect(PATH_GAMBAR.test("/img/produk-1.svg")).toBe(true);
    expect(PATH_GAMBAR.test("/uploads/AbCdEfGhIjKlMnOpQr12.png")).toBe(true);
    for (const x of [
      "javascript:alert(1)",
      "//evil/x.png",
      "https://evil/x.png",
      "/uploads/x.png",
      "/uploads/AbCdEfGhIjKlMnOpQr12.svg",
      "/img/../x.png",
    ])
      expect(PATH_GAMBAR.test(x), x).toBe(false);
  });
});

describe("bacaVarian", () => {
  const f = (o: Record<string, string>) => ({
    v_count: "1",
    v0_name: "Standar",
    v0_sku: "kop-01",
    v0_price: "",
    v0_stock: "5",
    v0_active: "on",
    ...o,
  });
  it("valid: SKU huruf besar, harga kosong = null, id opsional", () => {
    const { varian, errors } = bacaVarian(f({ v0_id: "7" }));
    expect(errors).toEqual({});
    expect(varian).toEqual([
      { id: 7, name: "Standar", sku: "KOP-01", price: null, stock: 5, active: true },
    ]);
  });
  it("tanpa varian / terlalu banyak / v_count aneh → galat", () => {
    for (const c of ["0", "", "abc", "-1", "99", "21"])
      expect(bacaVarian(f({ v_count: c })).errors.varian, c).toBeTruthy();
  });
  it("SKU/stok/harga tak sah dan SKU ganda terdeteksi per-field", () => {
    expect(bacaVarian(f({ v0_sku: "a b" })).errors.v0_sku).toBeTruthy();
    expect(bacaVarian(f({ v0_sku: "<x>" })).errors.v0_sku).toBeTruthy();
    expect(bacaVarian(f({ v0_stock: "-1" })).errors.v0_stock).toBeTruthy();
    expect(bacaVarian(f({ v0_stock: "1.5" })).errors.v0_stock).toBeTruthy();
    expect(bacaVarian(f({ v0_stock: String(MAKS_STOK + 1) })).errors.v0_stock).toBeTruthy();
    expect(bacaVarian(f({ v0_price: "abc" })).errors.v0_price).toBeTruthy();
    expect(bacaVarian(f({ v0_name: "" })).errors.v0_name).toBeTruthy();
    const dua = bacaVarian({
      ...f({}),
      v_count: "2",
      v1_name: "B",
      v1_sku: "KOP-01",
      v1_stock: "1",
    });
    expect(dua.errors.v1_sku).toContain("dipakai");
  });
  it("active hanya true bila 'on'", () => {
    expect(bacaVarian(f({ v0_active: "true" })).varian[0]!.active).toBe(false);
    expect(bacaVarian(f({ v0_active: "on" })).varian[0]!.active).toBe(true);
  });
});

describe("hak akses (least privilege)", () => {
  it("ADMIN semua; STAFF hanya ringkasan/stok/pesanan; peran lain/kosong ditolak", () => {
    for (const a of ["ringkasan", "stok", "pesanan", "produk", "kategori", "pengaturan"] as const)
      expect(can("ADMIN", a)).toBe(true);
    for (const a of ["ringkasan", "stok", "pesanan"] as const) expect(can("STAFF", a)).toBe(true);
    for (const a of ["produk", "kategori", "pengaturan"] as const)
      expect(can("STAFF", a), a).toBe(false);
    for (const r of [undefined, "", "admin", "EDITOR", "SUPERADMIN", "__proto__"])
      expect(can(r, "ringkasan"), String(r)).toBe(false);
  });
  it("amanCallback: hanya /admin internal", () => {
    expect(amanCallback("/admin/produk?x=1")).toBe("/admin/produk?x=1");
    for (const x of [
      "//evil.com",
      "/\\evil.com",
      "https://evil.com",
      "javascript:alert(1)",
      "/",
      "/produk",
      "/admin/../x\n",
      "",
      null,
      undefined,
    ])
      expect(amanCallback(x as string), String(x)).toBe("/admin");
  });
});
