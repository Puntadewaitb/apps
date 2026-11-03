import { existsSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { categories, products, settings, users, vouchers } from "../prisma/seed-data";
import { ROLES, VOUCHER_TYPES, isOneOf } from "./domain";

const publik = (p: string) => existsSync(join(__dirname, "..", "public", p));
const unik = (a: unknown[]) => new Set(a).size === a.length;
const slugRe = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

describe("data seed demo", () => {
  it("user: peran valid, email unik & .example, TANPA password/hash di data", () => {
    expect(unik(users.map((u) => u.email))).toBe(true);
    for (const u of users) {
      expect(isOneOf(ROLES, u.role)).toBe(true);
      expect(u.email).toMatch(/\.example$/);
      expect(Object.keys(u).sort()).toEqual(["email", "name", "role"]);
    }
  });

  it("kategori: slug valid & unik; tiap kategori punya ≥ 1 produk", () => {
    expect(unik(categories.map((c) => c.slug))).toBe(true);
    for (const c of categories) {
      expect(c.slug).toMatch(slugRe);
      expect(
        products.some((p) => p.kategori === c.slug),
        c.slug,
      ).toBe(true);
    }
  });

  it("20 produk: slug unik, kategori ada, harga bulat positif, gambar ada, deskripsi memadai", () => {
    expect(products).toHaveLength(20);
    expect(unik(products.map((p) => p.slug))).toBe(true);
    const kat = new Set(categories.map((c) => c.slug));
    products.forEach((p, i) => {
      expect(p.slug).toMatch(slugRe);
      expect(kat.has(p.kategori), p.slug).toBe(true);
      expect(Number.isInteger(p.price) && p.price > 0, p.slug).toBe(true);
      expect(p.deskripsi.length, p.slug).toBeGreaterThan(30);
      expect(publik(`/img/produk-${i + 1}.svg`), `gambar produk ${i + 1}`).toBe(true);
    });
  });

  it("varian: ≥ 1 per produk; SKU unik global; stok bulat ≥ 0; harga varian (bila ada) bulat positif; nama varian unik per produk", () => {
    const sku = products.flatMap((p) => p.varian.map((v) => v.sku));
    expect(unik(sku)).toBe(true);
    for (const p of products) {
      expect(p.varian.length, p.slug).toBeGreaterThanOrEqual(1);
      expect(unik(p.varian.map((v) => v.name)), p.slug).toBe(true);
      for (const v of p.varian) {
        expect(Number.isInteger(v.stock) && v.stock >= 0, v.sku).toBe(true);
        if (v.price !== undefined)
          expect(Number.isInteger(v.price) && v.price > 0, v.sku).toBe(true);
        expect(v.sku).toMatch(/^[A-Z0-9-]+$/);
      }
    }
  });

  it("ada contoh stok habis & contoh produk multi-varian dengan harga varian berbeda (untuk uji tampilan)", () => {
    expect(products.some((p) => p.varian.every((v) => v.stock === 0))).toBe(true);
    expect(
      products.some((p) => p.varian.some((v) => v.price !== undefined && v.price !== p.price)),
    ).toBe(true);
    expect(products.some((p) => p.varian.length >= 3)).toBe(true);
  });

  it("voucher: kode huruf besar unik, tipe valid, nilai masuk akal; ada contoh kedaluwarsa/habis/nonaktif", () => {
    expect(unik(vouchers.map((v) => v.code))).toBe(true);
    for (const v of vouchers) {
      expect(v.code).toMatch(/^[A-Z0-9]{4,20}$/);
      expect(isOneOf(VOUCHER_TYPES, v.type)).toBe(true);
      expect(Number.isInteger(v.value) && v.value > 0).toBe(true);
      if (v.type === "PERSEN") expect(v.value).toBeLessThanOrEqual(100);
      expect(v.used).toBeLessThanOrEqual(v.quota ?? Infinity);
      expect(v.hariMulai).toBeLessThan(v.hariSelesai);
    }
    expect(vouchers.some((v) => v.hariSelesai < 0)).toBe(true);
    expect(vouchers.some((v) => v.quota !== null && v.used >= v.quota)).toBe(true);
    expect(vouchers.some((v) => !v.active)).toBe(true);
  });

  it("pengaturan: nomor WhatsApp 62…, rekening & ongkir berupa JSON valid, alamat fiktif", () => {
    expect(settings["toko.whatsapp"]).toMatch(/^62\d{8,13}$/);
    expect(settings["toko.alamat"]!.toLowerCase()).toContain("fiktif");
    const rek = JSON.parse(settings["toko.rekening"]!) as Array<{
      bank: string;
      nomor: string;
      atasNama: string;
    }>;
    expect(rek.length).toBeGreaterThan(0);
    for (const r of rek) expect(r.bank && r.nomor && r.atasNama).toBeTruthy();
    const ong = JSON.parse(settings["toko.ongkir"]!) as {
      bawaan: number;
      kota: Record<string, number>;
    };
    expect(ong.bawaan).toBeGreaterThan(0);
    for (const [k, v] of Object.entries(ong.kota)) {
      expect(k).toBe(k.toLowerCase());
      expect(Number.isInteger(v) && v >= 0).toBe(true);
    }
  });
});
