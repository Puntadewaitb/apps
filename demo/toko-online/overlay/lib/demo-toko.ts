// OVERLAY sample statis: "backend" toko di PERAMBAN — pengganti /api/keranjang, /api/checkout/ringkasan,
// /api/pesanan, /api/lacak, /api/lacak/bukti. TIDAK ada server/DB: katalog, pengaturan, dan voucher berasal dari
// data seed yang diekspor saat build (lib/demo-data.json); pesanan hanya tersimpan di localStorage peramban ini.
//
// Aturan bisnis memakai modul ASLI app yang bebas-DB (checkout.ts: ongkir/diskon/total/WhatsApp, checkout-schema.ts:
// skema ketat, keranjang.ts, lacak.ts), sehingga angka, pesan galat, dan validasi sama dengan versi lengkap.
// Beda yang disengaja & dijelaskan ke pengunjung: stok & kuota voucher TIDAK berkurang (halaman produk statis).
import { isHoneypotTripped, phoneIdSchema, randomCode, validateUpload } from "@tpl/core";
import { z } from "zod";
import {
  MAKS_TOTAL,
  hitungDiskon,
  hitungOngkir,
  hitungTotal,
  normalisasiKode,
  pesanVoucher,
  urlWhatsApp,
  type VoucherRow,
} from "./checkout";
import { galatField, pesananSchema, ringkasanSchema, type RingkasanInput } from "./checkout-schema";
import dataMentah from "./demo-data.json";
import { hargaVarian } from "./format";
import { MAKS_BARIS, type DetailBaris } from "./keranjang";
import { galeriProduk } from "./katalog-murni";
import {
  bolehUnggahBukti,
  labelStatus,
  normalisasiKodePesanan,
  type TampilanPesanan,
} from "./lacak";
import { dariBaris, type PengaturanToko } from "./setting-murni";

type Varian = { id: number; name: string; price: number | null; stock: number };
type Produk = {
  id: number;
  slug: string;
  name: string;
  price: number;
  image: string;
  images: string;
  variants: Varian[];
};
type VoucherJson = Omit<VoucherRow, "startsAt" | "endsAt"> & {
  id: number;
  startsAt: string | null;
  endsAt: string | null;
};
const data = dataMentah as unknown as {
  produk: Produk[];
  setting: Array<{ key: string; value: string }>;
  voucher: VoucherJson[];
};

const setting: PengaturanToko = dariBaris(data.setting);
const peta = new Map<number, { v: Varian; p: Produk }>();
for (const p of data.produk) for (const v of p.variants) peta.set(v.id, { v, p });

const KEY = "demo:toko:state";

type Tersimpan = {
  code: string;
  customerName: string;
  customerPhone: string; // 62…
  city: string;
  createdAt: string;
  status: string;
  subtotal: number;
  shippingCost: number;
  discount: number;
  total: number;
  voucherCode: string;
  buktiAda: boolean;
  items: Array<{
    productName: string;
    variantName: string;
    unitPrice: number;
    qty: number;
    lineTotal: number;
  }>;
};

/** Pesanan contoh agar pengunjung dapat mencoba "Lacak Pesanan" tanpa membuat pesanan dulu. */
export const CONTOH = { kode: "TKO-K7M2XQ4P", telepon: "081234567890" } as const;
const CONTOH_PESANAN: Tersimpan = {
  code: CONTOH.kode,
  customerName: "Pembeli Contoh",
  customerPhone: "6281234567890",
  city: "Yogyakarta",
  createdAt: "2026-11-01T03:00:00.000Z",
  status: "DIKIRIM",
  subtotal: 250000,
  shippingCost: 15000,
  discount: 0,
  total: 265000,
  voucherCode: "",
  buktiAda: true,
  items: [
    {
      productName: "Contoh Produk",
      variantName: "Standar",
      unitPrice: 125000,
      qty: 2,
      lineTotal: 250000,
    },
  ],
};

type State = { pesanan: Tersimpan[]; kunci: Record<string, unknown> };
function baca(): State {
  try {
    const s = JSON.parse(window.localStorage.getItem(KEY) ?? "null") as State | null;
    if (s && Array.isArray(s.pesanan)) return s;
  } catch {
    /* abaikan */
  }
  return { pesanan: [], kunci: {} };
}
function tulis(s: State) {
  try {
    window.localStorage.setItem(KEY, JSON.stringify(s));
  } catch {
    /* penyimpanan diblokir: pesanan tetap sukses untuk sesi ini saja */
  }
}

const json = (status: number, body: unknown) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
const galat = (status: number, pesan: string, extra: Record<string, unknown> = {}) =>
  json(status, { ok: false, galat: pesan, ...extra });

function badanJson(init?: RequestInit): unknown {
  try {
    return JSON.parse(String(init?.body ?? ""));
  } catch {
    return undefined;
  }
}

// ---------- keranjang ----------
const permintaanSchema = z
  .object({ ids: z.array(z.number().int().positive().max(2_147_483_647)).max(MAKS_BARIS) })
  .strict();

function detailKeranjang(ids: number[]): DetailBaris[] {
  return [...new Set(ids)].map((id): DetailBaris => {
    const r = peta.get(id);
    if (!r) return { varianId: id, tersedia: false };
    return {
      varianId: id,
      tersedia: true,
      produkNama: r.p.name,
      slug: r.p.slug,
      varianNama: r.v.name,
      gambar: galeriProduk(r.p.image, r.p.images)[0] ?? "/img/produk-1.svg",
      harga: hargaVarian(r.p, r.v),
      stok: Math.max(0, r.v.stock),
    };
  });
}

// ---------- ringkasan (cerminan hitungRingkasan di lib/checkout-server.ts) ----------
type StatusBaris = "ok" | "tidak-tersedia" | "stok-kurang";
type Baris = {
  varianId: number;
  produkId: number;
  produkNama: string;
  varianNama: string;
  gambar: string;
  harga: number;
  qty: number;
  stok: number;
  jumlah: number;
  status: StatusBaris;
};
type VoucherHasil = { kode: string; ok: boolean; pesan?: string } | null;

function hitungRingkasan(
  input: Pick<RingkasanInput, "items" | "kota" | "voucher">,
  now = new Date(),
) {
  const masalah: string[] = [];
  const baris: Baris[] = input.items.map(({ varianId, qty }) => {
    const r = peta.get(varianId);
    if (!r)
      return {
        varianId,
        produkId: 0,
        produkNama: "",
        varianNama: "",
        gambar: "",
        harga: 0,
        qty,
        stok: 0,
        jumlah: 0,
        status: "tidak-tersedia",
      };
    const harga = hargaVarian(r.p, r.v);
    const stok = Math.max(0, r.v.stock);
    const status: StatusBaris = qty > stok ? "stok-kurang" : "ok";
    if (status === "stok-kurang")
      masalah.push(
        stok === 0
          ? `${r.p.name} (${r.v.name}) stok habis.`
          : `${r.p.name} (${r.v.name}) stok tersisa ${stok}.`,
      );
    return {
      varianId,
      produkId: r.p.id,
      produkNama: r.p.name,
      varianNama: r.v.name,
      gambar: galeriProduk(r.p.image, r.p.images)[0] ?? "/img/produk-1.svg",
      harga,
      qty,
      stok,
      jumlah: harga * qty,
      status,
    };
  });
  if (baris.some((b) => b.status === "tidak-tersedia"))
    masalah.push("Ada produk di keranjang yang sudah tidak tersedia.");

  const valid = baris.filter((b) => b.status === "ok");
  const subtotal = valid.reduce((a, b) => a + b.jumlah, 0);
  const ongkir = valid.length ? hitungOngkir(input.kota, setting.ongkir) : 0;

  let diskon = 0;
  let voucher: VoucherHasil = null;
  const kode = normalisasiKode(input.voucher);
  if (input.voucher.trim() !== "") {
    if (!kode)
      voucher = {
        kode: input.voucher.trim().slice(0, 32),
        ok: false,
        pesan: pesanVoucher("tidak-valid"),
      };
    else {
      const j = data.voucher.find((v) => v.code === kode);
      const row: VoucherRow | null = j
        ? {
            ...j,
            startsAt: j.startsAt ? new Date(j.startsAt) : null,
            endsAt: j.endsAt ? new Date(j.endsAt) : null,
          }
        : null;
      const h = hitungDiskon(row, subtotal, now);
      if (h.ok) {
        diskon = h.diskon;
        voucher = { kode, ok: true };
      } else voucher = { kode, ok: false, pesan: pesanVoucher(h.alasan, h.minSubtotal) };
    }
  }
  const total = hitungTotal(subtotal, ongkir, diskon);
  if (total > MAKS_TOTAL) masalah.push("Total pesanan terlalu besar.");
  if (voucher && !voucher.ok) masalah.push(voucher.pesan!);
  return {
    baris,
    subtotal,
    ongkir,
    diskon,
    total,
    voucher,
    masalah,
    bisaPesan: valid.length === baris.length && baris.length > 0 && masalah.length === 0,
  };
}

// ---------- pesanan ----------
function buatPesanan(d: z.infer<typeof pesananSchema>) {
  const sebelumnya = baca();
  const ulang = sebelumnya.kunci[d.kunci];
  if (ulang) return json(200, ulang); // idempotensi: kunci sama → hasil yang sama, tidak membuat pesanan baru

  const r = hitungRingkasan(d);
  if (!r.bisaPesan)
    return json(422, {
      ok: false,
      jenis: "tidak-bisa",
      pesan: r.masalah[0] ?? "Pesanan tidak dapat diproses.",
      ringkasan: r,
    });
  if (r.total !== d.totalPreview)
    return json(409, {
      ok: false,
      jenis: "harga-berubah",
      pesan:
        "Harga atau ongkir berubah sejak Anda melihat ringkasan. Periksa total terbaru lalu kirim ulang.",
      ringkasan: r,
    });

  const kode = `TKO-${randomCode(8)}`;
  const baris = r.baris.map((b) => ({
    produkNama: b.produkNama,
    varianNama: b.varianNama,
    qty: b.qty,
    harga: b.harga,
    jumlah: b.jumlah,
  }));
  const sukses = {
    ok: true as const,
    kode,
    subtotal: r.subtotal,
    ongkir: r.ongkir,
    diskon: r.diskon,
    total: r.total,
    baris,
    rekening: setting.rekening,
    catatanBayar: setting.catatanBayar,
    qris: setting.qris,
    waUrl: urlWhatsApp({
      toko: setting.nama,
      whatsapp: setting.whatsapp,
      kode,
      nama: d.nama,
      alamat: d.alamat,
      kota: d.kota,
      baris,
      subtotal: r.subtotal,
      ongkir: r.ongkir,
      diskon: r.diskon,
      voucher: r.voucher?.ok ? r.voucher.kode : "",
      total: r.total,
      catatan: d.catatan,
      rekening: setting.rekening,
    }),
  };
  tulis({
    pesanan: [
      ...sebelumnya.pesanan,
      {
        code: kode,
        customerName: d.nama,
        customerPhone: d.telepon,
        city: d.kota,
        createdAt: new Date().toISOString(),
        status: "MENUNGGU_BAYAR",
        subtotal: r.subtotal,
        shippingCost: r.ongkir,
        discount: r.diskon,
        total: r.total,
        voucherCode: r.voucher?.ok ? r.voucher.kode : "",
        buktiAda: false,
        items: r.baris.map((b) => ({
          productName: b.produkNama,
          variantName: b.varianNama,
          unitPrice: b.harga,
          qty: b.qty,
          lineTotal: b.jumlah,
        })),
      },
    ],
    kunci: { ...sebelumnya.kunci, [d.kunci]: sukses },
  });
  return json(200, sukses);
}

// ---------- lacak ----------
const PESAN_TAK_COCOK = "Kode pesanan atau nomor HP tidak cocok.";

function cariMilik(kodeInput: string, teleponInput: string) {
  const kode = normalisasiKodePesanan(kodeInput);
  const hp = phoneIdSchema.safeParse(teleponInput);
  if (!kode || !hp.success) return null;
  return (
    [CONTOH_PESANAN, ...baca().pesanan].find(
      (o) => o.code === kode && o.customerPhone === hp.data,
    ) ?? null
  );
}

function keTampilan(o: Tersimpan): TampilanPesanan {
  const menunggu = o.status === "MENUNGGU_BAYAR";
  return {
    kode: o.code,
    status: o.status,
    statusLabel: labelStatus(o.status),
    dibuat: o.createdAt,
    nama: o.customerName,
    kota: o.city,
    baris: o.items.map((i) => ({
      produkNama: i.productName,
      varianNama: i.variantName,
      qty: i.qty,
      unitPrice: i.unitPrice,
      lineTotal: i.lineTotal,
    })),
    subtotal: o.subtotal,
    ongkir: o.shippingCost,
    diskon: o.discount,
    voucher: o.voucherCode,
    total: o.total,
    buktiAda: o.buktiAda,
    bolehUnggah: bolehUnggahBukti(o.status),
    pembayaran: menunggu
      ? { rekening: setting.rekening, catatan: setting.catatanBayar, qris: setting.qris }
      : null,
  };
}

const PESAN_BUKTI: Record<string, string> = {
  empty: "Berkas kosong.",
  too_large: "Ukuran berkas maksimal 2 MB.",
  type_not_allowed: "Format berkas harus PNG, JPG, WebP, atau PDF.",
  type_mismatch: "Isi berkas tidak sesuai dengan tipe yang dinyatakan.",
};

async function unggahBukti(fd: FormData) {
  const o = cariMilik(String(fd.get("kode") ?? ""), String(fd.get("telepon") ?? ""));
  if (!o) return galat(404, PESAN_TAK_COCOK);
  if (!bolehUnggahBukti(o.status))
    return galat(409, "Bukti bayar hanya bisa diunggah saat pesanan menunggu pembayaran.");
  const berkas = fd.get("berkas");
  if (!(berkas instanceof File)) return galat(400, "Pilih berkas bukti bayar.");
  const cek = validateUpload(new Uint8Array(await berkas.arrayBuffer()), {
    maxBytes: 2 * 1024 * 1024,
    allowed: ["image/png", "image/jpeg", "image/webp", "application/pdf"],
    declaredType: berkas.type || undefined,
  });
  if (!cek.ok) return galat(422, PESAN_BUKTI[cek.reason] ?? "Berkas tidak valid.");
  const s = baca();
  tulis({
    ...s,
    pesanan: s.pesanan.map((p) => (p.code === o.code ? { ...p, buktiAda: true } : p)),
  });
  return json(200, { ok: true, buktiAda: true });
}

// ---------- router ----------
export async function demoFetch(input: string, init?: RequestInit): Promise<Response> {
  const { pathname } = new URL(input, "http://demo.local");
  if ((init?.method ?? "GET").toUpperCase() !== "POST") return galat(405, "Metode tidak didukung.");

  if (pathname === "/api/lacak/bukti") {
    if (!(init?.body instanceof FormData))
      return galat(415, "Content-Type harus multipart/form-data.");
    return unggahBukti(init.body);
  }

  const body = badanJson(init);
  switch (pathname) {
    case "/api/keranjang": {
      const p = permintaanSchema.safeParse(body);
      if (!p.success) return galat(400, "Permintaan tidak valid.");
      return json(200, { items: detailKeranjang(p.data.ids) });
    }
    case "/api/checkout/ringkasan": {
      const p = ringkasanSchema.safeParse(body);
      if (!p.success) return galat(400, "Permintaan tidak valid.");
      return json(200, { ok: true, ringkasan: hitungRingkasan(p.data) });
    }
    case "/api/pesanan": {
      const p = pesananSchema.safeParse(body);
      if (!p.success)
        return galat(400, "Periksa kembali isian Anda.", { field: galatField(p.error) });
      if (isHoneypotTripped({ website_url: p.data.website_url }))
        return json(200, {
          ok: true,
          kode: `TKO-${randomCode(8)}`,
          subtotal: 0,
          ongkir: 0,
          diskon: 0,
          total: p.data.totalPreview,
          baris: [],
          rekening: [],
          catatanBayar: "",
          qris: "",
          waUrl: "",
        });
      return buatPesanan(p.data);
    }
    case "/api/lacak": {
      const p = z
        .object({ kode: z.string().max(40), telepon: z.string().max(30) })
        .strict()
        .safeParse(body);
      if (!p.success) return galat(400, "Permintaan tidak valid.");
      const o = cariMilik(p.data.kode, p.data.telepon);
      if (!o) return galat(404, PESAN_TAK_COCOK);
      return json(200, { ok: true, pesanan: keTampilan(o) });
    }
    default:
      return galat(404, "Tidak tersedia di versi demo.");
  }
}
