import { describe, expect, it } from "vitest";
import { BAWAAN, dariBaris, parseOngkir, parseRekening } from "./setting";

describe("parseRekening", () => {
  it("menerima entri lengkap; membuang entri tak lengkap/bentuk salah", () => {
    expect(
      parseRekening('[{"bank":"BCA","nomor":"123","atasNama":"Toko"},{"bank":"BNI"},"x",null,5]'),
    ).toEqual([{ bank: "BCA", nomor: "123", atasNama: "Toko" }]);
  });
  it("JSON rusak/bukan array → []", () => {
    for (const x of [undefined, "", "{rusak", '{"a":1}', "null", '"str"'])
      expect(parseRekening(x)).toEqual([]);
  });
  it("memotong string panjang", () => {
    const r = parseRekening(JSON.stringify([{ bank: "B".repeat(500), nomor: "1", atasNama: "A" }]));
    expect(r[0]!.bank.length).toBe(60);
  });
});

describe("parseOngkir", () => {
  it("nilai sah dipertahankan, kunci kota dinormalkan huruf kecil", () => {
    expect(parseOngkir('{"bawaan":25000,"kota":{" Jakarta ":9000,"BANDUNG":12000}}')).toEqual({
      bawaan: 25000,
      kota: { jakarta: 9000, bandung: 12000 },
    });
  });
  it("nilai negatif/pecahan/teks/terlalu besar dibuang (bukan diterima sebagai ongkir)", () => {
    expect(
      parseOngkir('{"bawaan":-1,"kota":{"a":-5,"b":1.5,"c":"100","d":99999999999,"e":null,"f":0}}'),
    ).toEqual({
      bawaan: 0,
      kota: { f: 0 },
    });
  });
  it("JSON rusak/tipe salah → bawaan aman", () => {
    for (const x of [undefined, "", "{rusak", "[]", "5", "null"])
      expect(parseOngkir(x)).toEqual({ bawaan: 0, kota: {} });
  });
});

describe("dariBaris", () => {
  it("tanpa data → bawaan; nomor WA tidak valid dikosongkan", () => {
    expect(dariBaris([])).toEqual(BAWAAN);
    expect(dariBaris([{ key: "toko.whatsapp", value: "0812-xxx" }]).whatsapp).toBe("");
    expect(dariBaris([{ key: "toko.whatsapp", value: "6281234567890" }]).whatsapp).toBe(
      "6281234567890",
    );
  });
  it("nama kosong → nama bawaan", () => {
    expect(dariBaris([{ key: "toko.nama", value: "" }]).nama).toBe(BAWAAN.nama);
    expect(dariBaris([{ key: "toko.nama", value: "Toko Baru" }]).nama).toBe("Toko Baru");
  });
});
