import { describe, expect, it } from "vitest";
import { ORDER_STATUSES } from "./domain";
import { TRANSISI, bolehPindah, mengembalikanStok, pilihanStatus } from "./status";
import { bacaKota, bacaRekening, tokoSchema, MAKS_KOTA, MAKS_REKENING } from "./pengaturan-schema";
import { csvCell, toCsv } from "./csv";
import { hitungOngkir } from "./checkout";

describe("transisi status", () => {
  it("setiap status punya entri; tak ada transisi ke diri sendiri atau ke status asing", () => {
    for (const s of ORDER_STATUSES) {
      expect(TRANSISI[s]).toBeDefined();
      for (const k of TRANSISI[s]) {
        expect(k).not.toBe(s);
        expect(ORDER_STATUSES).toContain(k);
      }
    }
  });
  it("alur maju selangkah; batal selama belum dikirim; final tidak bisa diubah", () => {
    expect(bolehPindah("MENUNGGU_BAYAR", "DIBAYAR")).toBe(true);
    expect(bolehPindah("DIBAYAR", "DIPROSES")).toBe(true);
    expect(bolehPindah("DIPROSES", "DIKIRIM")).toBe(true);
    expect(bolehPindah("DIKIRIM", "SELESAI")).toBe(true);
    for (const d of ["MENUNGGU_BAYAR", "DIBAYAR", "DIPROSES"])
      expect(bolehPindah(d, "DIBATALKAN"), d).toBe(true);
    expect(bolehPindah("DIKIRIM", "DIBATALKAN")).toBe(false); // sudah dikirim
    for (const k of ORDER_STATUSES) {
      expect(bolehPindah("SELESAI", k)).toBe(false);
      expect(bolehPindah("DIBATALKAN", k)).toBe(false);
    }
  });
  it("tidak boleh loncat/mundur; nilai asing ditolak", () => {
    expect(bolehPindah("MENUNGGU_BAYAR", "DIKIRIM")).toBe(false);
    expect(bolehPindah("MENUNGGU_BAYAR", "SELESAI")).toBe(false);
    expect(bolehPindah("DIPROSES", "DIBAYAR")).toBe(false);
    expect(bolehPindah("DIKIRIM", "DIPROSES")).toBe(false);
    for (const x of ["", "dibayar", "__proto__", "toString", "<script>"]) {
      expect(bolehPindah("MENUNGGU_BAYAR", x), x).toBe(false);
      expect(bolehPindah(x, "DIBAYAR"), x).toBe(false);
    }
    expect(pilihanStatus("apa")).toEqual([]);
  });
  it("hanya pembatalan yang mengembalikan stok", () => {
    for (const s of ORDER_STATUSES) expect(mengembalikanStok(s)).toBe(s === "DIBATALKAN");
  });
});

describe("pengaturan toko", () => {
  const dasar = {
    nama: "Toko Baru",
    tagline: "",
    alamat: "",
    catatanBayar: "",
    whatsapp: "0812-3456-7890",
    ongkirBawaan: "20000",
  };
  it("valid: WA dinormalkan ke 62…, kosong diizinkan (menonaktifkan tombol WA)", () => {
    expect(tokoSchema.parse(dasar)).toMatchObject({
      nama: "Toko Baru",
      whatsapp: "6281234567890",
      ongkirBawaan: 20000,
    });
    expect(tokoSchema.parse({ ...dasar, whatsapp: "" }).whatsapp).toBe("");
  });
  it("tidak valid: nama pendek, WA salah, ongkir negatif/pecahan/terlalu besar", () => {
    for (const o of [
      { nama: "ab" },
      { whatsapp: "12345" },
      { whatsapp: "021-555" },
      { ongkirBawaan: "-1" },
      { ongkirBawaan: "1.5" },
      { ongkirBawaan: "10000001" },
      { ongkirBawaan: "abc" },
    ])
      expect(tokoSchema.safeParse({ ...dasar, ...o }).success, JSON.stringify(o)).toBe(false);
    expect(tokoSchema.parse({ ...dasar, nama: "<b>Toko</b> X" }).nama).toBe("Toko X");
  });
  it("rekening: baris kosong dilewati; nomor/bank divalidasi; batas jumlah", () => {
    const f = {
      r_count: "3",
      r0_bank: "BCA",
      r0_nomor: "123 456-789",
      r0_atasNama: "Toko",
      r1_bank: "",
      r1_nomor: "",
      r1_atasNama: "",
      r2_bank: "BNI",
      r2_nomor: "abc",
      r2_atasNama: "",
    };
    const r = bacaRekening(f);
    expect(r.rekening).toEqual([{ bank: "BCA", nomor: "123 456-789", atasNama: "Toko" }]);
    expect(r.errors.r2_nomor).toBeTruthy();
    expect(r.errors.r2_atasNama).toBeTruthy();
    expect(bacaRekening({ r_count: String(MAKS_REKENING + 1) }).errors.rekening).toBeTruthy();
    expect(bacaRekening({ r_count: "abc" }).rekening).toEqual([]);
    expect(
      bacaRekening({
        r_count: "1",
        r0_bank: "<b>BCA</b>",
        r0_nomor: "1234",
        r0_atasNama: "T<script>x</script>oko",
      }).rekening[0],
    ).toEqual({ bank: "BCA", nomor: "1234", atasNama: "Txoko" });
  });
  it("kota: kunci dinormalkan, duplikat/nama berbahaya/tarif tak sah ditolak, baris kosong dilewati", () => {
    const ok = bacaKota({
      k_count: "3",
      k0_nama: "Kota Yogyakarta",
      k0_tarif: "10000",
      k1_nama: "",
      k1_tarif: "",
      k2_nama: "Jakarta",
      k2_tarif: "0",
    });
    expect(ok.errors).toEqual({});
    expect(ok.kota).toEqual({ yogyakarta: 10000, jakarta: 0 });
    expect(hitungOngkir("yogyakarta", { bawaan: 25000, kota: ok.kota })).toBe(10000);
    expect(
      bacaKota({
        k_count: "2",
        k0_nama: "Bandung",
        k0_tarif: "1",
        k1_nama: "kota BANDUNG",
        k1_tarif: "2",
      }).errors.k1_nama,
    ).toContain("sudah ada");
    for (const n of ["__proto__", "constructor", "toString", "hasOwnProperty", "Kota __proto__"]) {
      const r = bacaKota({ k_count: "1", k0_nama: n, k0_tarif: "1" });
      expect(
        Object.keys(r.errors).length || Object.keys(r.kota).filter((k) => k === "__proto__").length,
        n,
      ).toBeGreaterThanOrEqual(n === "Kota __proto__" ? 0 : 1);
      expect(Object.getPrototypeOf(r.kota)).toBe(Object.prototype);
    }
    for (const t of ["-1", "1.5", "abc", "10000001", ""])
      expect(
        bacaKota({ k_count: "1", k0_nama: "Solo", k0_tarif: t }).errors.k0_tarif,
        t,
      ).toBeTruthy();
    expect(
      bacaKota({ k_count: "1", k0_nama: "<script>", k0_tarif: "1" }).errors.k0_nama,
    ).toBeTruthy();
    expect(bacaKota({ k_count: String(MAKS_KOTA + 1) }).errors.kota).toBeTruthy();
  });
});

describe("csv", () => {
  it("sel berawalan = + - @ TAB CR dinetralkan; kutip/koma di-escape; BOM", () => {
    for (const x of ["=1+1", "+cmd", "-2", "@SUM(A1)", "\tx", "\rx"])
      expect(csvCell(x).replace(/^"/, "")).toMatch(/^'/);
    expect(csvCell('a,"b"')).toBe('"a,""b"""');
    expect(toCsv(["a"], [["x"]]).startsWith("﻿")).toBe(true);
  });
});
