import { describe, expect, it } from "vitest";
import {
  MAKS_TOTAL,
  hitungDiskon,
  hitungOngkir,
  hitungTotal,
  kunciKota,
  normalisasiKode,
  pesanVoucher,
  pesanWhatsApp,
  urlWhatsApp,
  type DataWhatsApp,
  type VoucherRow,
} from "./checkout";
import { galatField, pesananSchema, ringkasanSchema } from "./checkout-schema";
import { sekali } from "./idempotensi";

const ongkir = { bawaan: 25_000, kota: { yogyakarta: 10_000, jakarta: 18_000 } };
const NOW = new Date("2026-06-15T05:00:00Z");
const v = (o: Partial<VoucherRow> = {}): VoucherRow => ({
  code: "X",
  type: "PERSEN",
  value: 10,
  minSubtotal: 0,
  maxDiscount: null,
  quota: null,
  used: 0,
  startsAt: null,
  endsAt: null,
  active: true,
  ...o,
});

describe("ongkir", () => {
  it("kunciKota: huruf kecil, spasi dirapikan, awalan kota/kab dibuang", () => {
    expect(kunciKota("  Kota   Yogyakarta ")).toBe("yogyakarta");
    expect(kunciKota("Kab. Sleman")).toBe("sleman");
    expect(kunciKota("KABUPATEN Bantul")).toBe("bantul");
    expect(kunciKota("Kotamobagu")).toBe("kotamobagu"); // bukan awalan "kota "
  });
  it("tarif kota terdaftar; kota lain → bawaan", () => {
    expect(hitungOngkir("Kota Yogyakarta", ongkir)).toBe(10_000);
    expect(hitungOngkir("JAKARTA", ongkir)).toBe(18_000);
    expect(hitungOngkir("Medan", ongkir)).toBe(25_000);
    expect(hitungOngkir("", ongkir)).toBe(25_000);
  });
  it("kunci prototipe tidak dianggap tarif kota", () => {
    for (const k of ["constructor", "__proto__", "toString", "hasOwnProperty"])
      expect(hitungOngkir(k, ongkir), k).toBe(25_000);
  });
  it("tarif 0 (gratis ongkir) sah, bukan 'tidak ada'", () => {
    expect(hitungOngkir("Bandung", { bawaan: 9, kota: { bandung: 0 } })).toBe(0);
  });
});

describe("normalisasiKode", () => {
  it("huruf besar & hanya karakter aman; selain itu kosong", () => {
    expect(normalisasiKode(" hemat10 ")).toBe("HEMAT10");
    for (const x of [
      "",
      "  ",
      "a b",
      "x'--",
      "<script>",
      "A".repeat(33),
      "kode.titik",
      undefined,
      null,
    ])
      expect(normalisasiKode(x), String(x)).toBe("");
  });
});

describe("hitungDiskon", () => {
  it("PERSEN dibulatkan ke bawah; dibatasi maxDiscount", () => {
    expect(hitungDiskon(v({ value: 10 }), 99_999, NOW)).toEqual({ ok: true, diskon: 9_999 });
    expect(hitungDiskon(v({ value: 10, maxDiscount: 5_000 }), 100_000, NOW)).toEqual({
      ok: true,
      diskon: 5_000,
    });
    expect(hitungDiskon(v({ value: 100 }), 12_345, NOW)).toEqual({ ok: true, diskon: 12_345 });
  });
  it("NOMINAL tetap, tidak pernah melebihi subtotal (total tak negatif)", () => {
    expect(hitungDiskon(v({ type: "NOMINAL", value: 25_000 }), 200_000, NOW)).toEqual({
      ok: true,
      diskon: 25_000,
    });
    expect(hitungDiskon(v({ type: "NOMINAL", value: 25_000 }), 10_000, NOW)).toEqual({
      ok: true,
      diskon: 10_000,
    });
  });
  it("minimal belanja: tepat di batas lolos, kurang 1 rupiah ditolak", () => {
    const x = v({ minSubtotal: 100_000 });
    expect(hitungDiskon(x, 100_000, NOW).ok).toBe(true);
    expect(hitungDiskon(x, 99_999, NOW)).toEqual({
      ok: false,
      alasan: "minimal",
      minSubtotal: 100_000,
    });
  });
  it("masa berlaku: batas awal & akhir inklusif", () => {
    const x = v({
      startsAt: new Date("2026-06-15T05:00:00Z"),
      endsAt: new Date("2026-06-15T05:00:00Z"),
    });
    expect(hitungDiskon(x, 1000, NOW).ok).toBe(true);
    expect(hitungDiskon(x, 1000, new Date(NOW.getTime() - 1))).toMatchObject({
      ok: false,
      alasan: "belum-mulai",
    });
    expect(hitungDiskon(x, 1000, new Date(NOW.getTime() + 1))).toMatchObject({
      ok: false,
      alasan: "kedaluwarsa",
    });
  });
  it("kuota: used == quota → habis; used < quota lolos; null = tanpa batas", () => {
    expect(hitungDiskon(v({ quota: 5, used: 5 }), 1000, NOW)).toMatchObject({ alasan: "habis" });
    expect(hitungDiskon(v({ quota: 5, used: 4 }), 1000, NOW).ok).toBe(true);
    expect(hitungDiskon(v({ quota: null, used: 9999 }), 1000, NOW).ok).toBe(true);
  });
  it("nonaktif / tidak ada / data rusak ditolak", () => {
    expect(hitungDiskon(v({ active: false }), 1000, NOW)).toMatchObject({ alasan: "nonaktif" });
    expect(hitungDiskon(null, 1000, NOW)).toMatchObject({ alasan: "tidak-ada" });
    for (const bad of [
      v({ value: 0 }),
      v({ value: 101 }),
      v({ value: -5 }),
      v({ value: 1.5 }),
      v({ type: "LAIN" }),
      v({ type: "NOMINAL", value: -1 }),
    ])
      expect(hitungDiskon(bad, 1000, NOW), JSON.stringify(bad)).toMatchObject({
        ok: false,
        alasan: "tidak-valid",
      });
  });
  it("pesan voucher generik untuk kode yang tak bisa dipakai; spesifik hanya minimal/kuota", () => {
    const g = pesanVoucher("tidak-ada");
    for (const a of ["nonaktif", "belum-mulai", "kedaluwarsa", "tidak-valid"] as const)
      expect(pesanVoucher(a)).toBe(g);
    expect(pesanVoucher("minimal", 100_000)).toContain("100.000");
  });
  it("hitungTotal", () => {
    expect(hitungTotal(100_000, 10_000, 5_000)).toBe(105_000);
    expect(MAKS_TOTAL).toBeLessThan(2 ** 31);
  });
});

describe("pesan WhatsApp", () => {
  const d: DataWhatsApp = {
    toko: "Toko Uji",
    whatsapp: "6281234567890",
    kode: "TKO-ABCD2345",
    nama: "Budi",
    alamat: "Jl. Mawar 1",
    kota: "Yogyakarta",
    baris: [
      { produkNama: "Kopi", varianNama: "Biji", qty: 2, jumlah: 170_000 },
      { produkNama: "Teh", varianNama: "Standar", qty: 1, jumlah: 38_000 },
    ],
    subtotal: 208_000,
    ongkir: 10_000,
    diskon: 20_000,
    voucher: "HEMAT10",
    total: 198_000,
    catatan: "Bungkus rapi",
    rekening: [{ bank: "Bank A", nomor: "123", atasNama: "Toko" }],
  };
  it("memuat kode, item, rincian biaya, alamat, rekening", () => {
    const t = pesanWhatsApp(d);
    for (const s of [
      "TKO-ABCD2345",
      "Kopi (Biji) × 2",
      "Teh × 1",
      "TOTAL:",
      "HEMAT10",
      "Jl. Mawar 1",
      "Bank A 123",
      "Bungkus rapi",
    ])
      expect(t).toContain(s);
    expect(t).not.toContain("(Standar)");
  });
  it("tanpa diskon/catatan/rekening bagian itu tidak muncul; item >12 diringkas; panjang dibatasi", () => {
    const t = pesanWhatsApp({ ...d, diskon: 0, voucher: "", catatan: "", rekening: [] });
    expect(t).not.toContain("Diskon");
    expect(t).not.toContain("Catatan");
    expect(t).not.toContain("Pembayaran via transfer");
    const banyak = pesanWhatsApp({
      ...d,
      baris: Array.from({ length: 30 }, (_, i) => ({
        produkNama: `P${i}`,
        varianNama: "x",
        qty: 1,
        jumlah: 1,
      })),
    });
    expect(banyak).toContain("dan 18 item lainnya");
    expect(pesanWhatsApp({ ...d, alamat: "A".repeat(5000) }).length).toBeLessThanOrEqual(1600);
  });
  it("URL wa.me ter-encode; tanpa nomor toko → string kosong", () => {
    const u = urlWhatsApp(d);
    expect(u.startsWith("https://wa.me/6281234567890?text=")).toBe(true);
    expect(u).not.toContain("\n");
    expect(urlWhatsApp({ ...d, whatsapp: "" })).toBe("");
  });
});

describe("skema permintaan: hanya data yang boleh datang dari klien", () => {
  const dasar = {
    kunci: "a".repeat(32),
    items: [{ varianId: 1, qty: 2 }],
    nama: "Budi Santoso",
    telepon: "0812-3456-7890",
    alamat: "Jl. Mawar No. 1, Sleman",
    kota: "Yogyakarta",
    totalPreview: 100_000,
  };
  it("sah: telepon dinormalkan, opsional diberi bawaan", () => {
    const r = pesananSchema.parse(dasar);
    expect(r.telepon).toBe("6281234567890");
    expect(r.email).toBe("");
    expect(r.catatan).toBe("");
    expect(r.voucher).toBe("");
  });
  it("properti asing (harga, total, ongkir, diskon, stok, role) ditolak, bukan diabaikan", () => {
    for (const k of [
      "harga",
      "total",
      "ongkir",
      "diskon",
      "subtotal",
      "stok",
      "status",
      "role",
      "shippingCost",
    ])
      expect(pesananSchema.safeParse({ ...dasar, [k]: 1 }).success, k).toBe(false);
    expect(
      pesananSchema.safeParse({ ...dasar, items: [{ varianId: 1, qty: 1, harga: 1 }] }).success,
    ).toBe(false);
    expect(ringkasanSchema.safeParse({ items: dasar.items, harga: 1 }).success).toBe(false);
  });
  it("item: qty/id tidak sah, kosong, kebanyakan ditolak; duplikat digabung & dijepit 99", () => {
    for (const items of [
      [],
      [{ varianId: 1, qty: 0 }],
      [{ varianId: 1, qty: -1 }],
      [{ varianId: 1, qty: 100 }],
      [{ varianId: 1.5, qty: 1 }],
      [{ varianId: "1", qty: 1 }],
      Array.from({ length: 51 }, (_, i) => ({ varianId: i + 1, qty: 1 })),
    ])
      expect(
        pesananSchema.safeParse({ ...dasar, items }).success,
        JSON.stringify(items).slice(0, 40),
      ).toBe(false);
    const g = pesananSchema.parse({
      ...dasar,
      items: [
        { varianId: 3, qty: 60 },
        { varianId: 3, qty: 60 },
        { varianId: 4, qty: 1 },
      ],
    });
    expect(g.items).toEqual([
      { varianId: 3, qty: 99 },
      { varianId: 4, qty: 1 },
    ]);
  });
  it("data pembeli: HTML dibuang/ditolak, telepon & kota & kunci divalidasi", () => {
    expect(pesananSchema.safeParse({ ...dasar, nama: "<b>x</b>" }).success).toBe(false);
    expect(pesananSchema.safeParse({ ...dasar, telepon: "12345" }).success).toBe(false);
    expect(pesananSchema.safeParse({ ...dasar, telepon: "021-5551234" }).success).toBe(false);
    expect(pesananSchema.safeParse({ ...dasar, kota: "x" }).success).toBe(false);
    expect(pesananSchema.safeParse({ ...dasar, kota: "Kota;DROP" }).success).toBe(false);
    expect(pesananSchema.safeParse({ ...dasar, alamat: "pendek" }).success).toBe(false);
    expect(pesananSchema.safeParse({ ...dasar, kunci: "pendek" }).success).toBe(false);
    expect(pesananSchema.safeParse({ ...dasar, email: "bukan-email" }).success).toBe(false);
    expect(pesananSchema.safeParse({ ...dasar, totalPreview: -1 }).success).toBe(false);
    expect(pesananSchema.safeParse({ ...dasar, totalPreview: 1.5 }).success).toBe(false);
    const ok = pesananSchema.parse({
      ...dasar,
      alamat: "Jl. Mawar <script>alert(1)</script> No. 1",
      catatan: "<img src=x onerror=1>hati-hati",
    });
    expect(ok.alamat).not.toContain("<");
    expect(ok.catatan).not.toContain("<");
  });
  it("galatField: satu pesan per field", () => {
    const r = pesananSchema.safeParse({ ...dasar, nama: "", telepon: "1" });
    expect(r.success).toBe(false);
    if (!r.success) expect(Object.keys(galatField(r.error)).sort()).toEqual(["nama", "telepon"]);
  });
});

describe("idempotensi (sekali)", () => {
  it("kunci sama bersamaan/berurutan → fungsi dijalankan sekali, hasil sama", async () => {
    let n = 0;
    const fn = async () => ({ ok: true, n: ++n });
    const k = `uji-${Math.random()}`;
    const [a, b] = await Promise.all([sekali(k, fn), sekali(k, fn)]);
    expect(a).toBe(b);
    expect(await sekali(k, fn)).toBe(a);
    expect(n).toBe(1);
  });
  it("hasil gagal (simpanBila=false) atau exception tidak disimpan → boleh diulang", async () => {
    let n = 0;
    const k = `gagal-${Math.random()}`;
    const fn = async () => ({ ok: ++n > 1 });
    const o = { simpanBila: (h: { ok: boolean }) => h.ok };
    expect((await sekali(k, fn, o)).ok).toBe(false);
    await new Promise((r) => setTimeout(r, 0));
    expect((await sekali(k, fn, o)).ok).toBe(true);
    const k2 = `err-${Math.random()}`;
    await expect(sekali(k2, async () => Promise.reject(new Error("x")))).rejects.toThrow("x");
    await new Promise((r) => setTimeout(r, 0));
    expect(await sekali(k2, async () => "pulih")).toBe("pulih");
  });
  it("kedaluwarsa setelah TTL", async () => {
    let n = 0;
    const k = `ttl-${Math.random()}`;
    await sekali(k, async () => ++n, { now: 1_000 });
    await sekali(k, async () => ++n, { now: 1_000 + 16 * 60_000 });
    expect(n).toBe(2);
  });
});
