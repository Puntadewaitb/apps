import { randomCode } from "@tpl/core";
import type { PrismaClient } from "../generated/prisma/client";
import { db } from "./db";
import { hargaVarian } from "./format";
import { galeriProduk } from "./katalog";
import {
  MAKS_TOTAL,
  hitungDiskon,
  hitungOngkir,
  hitungTotal,
  normalisasiKode,
  pesanVoucher,
  urlWhatsApp,
} from "./checkout";
import type { PesananInput, RingkasanInput } from "./checkout-schema";
import { dariBaris, type PengaturanToko } from "./setting";

/** Klien Prisma biasa ATAU klien transaksi — fungsi hitung dipakai di keduanya. */
type Klien = Pick<PrismaClient, "variant" | "voucher" | "setting" | "order" | "$executeRaw">;

export type StatusBaris = "ok" | "tidak-tersedia" | "stok-kurang";
export type BarisRingkasan = {
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
export type Ringkasan = {
  baris: BarisRingkasan[];
  subtotal: number;
  ongkir: number;
  diskon: number;
  total: number;
  voucher: { kode: string; ok: boolean; pesan?: string } | null;
  masalah: string[];
  bisaPesan: boolean;
};

type Hitung = { ringkasan: Ringkasan; voucherId: number | null; setting: PengaturanToko };

/**
 * SATU-SATUNYA tempat angka pesanan dihitung. Semua dibaca dari DB (harga produk/varian, tarif ongkir, aturan voucher);
 * dari klien hanya ID varian, jumlah, kota, dan kode voucher.
 */
export async function hitungRingkasan(
  c: Klien,
  input: Pick<RingkasanInput, "items" | "kota" | "voucher">,
  now = new Date(),
): Promise<Hitung> {
  const ids = input.items.map((i) => i.varianId);
  const [rows, setRows] = await Promise.all([
    c.variant.findMany({
      where: { id: { in: ids }, active: true, product: { active: true } },
      select: {
        id: true,
        name: true,
        price: true,
        stock: true,
        product: { select: { id: true, name: true, price: true, image: true, images: true } },
      },
    }),
    c.setting.findMany(),
  ]);
  const setting = dariBaris(setRows);
  const peta = new Map(rows.map((r) => [r.id, r]));
  const masalah: string[] = [];
  const baris: BarisRingkasan[] = input.items.map(({ varianId, qty }) => {
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
    const harga = hargaVarian(r.product, r);
    const stok = Math.max(0, r.stock);
    const status: StatusBaris = qty > stok ? "stok-kurang" : "ok";
    if (status === "stok-kurang")
      masalah.push(
        stok === 0
          ? `${r.product.name} (${r.name}) stok habis.`
          : `${r.product.name} (${r.name}) stok tersisa ${stok}.`,
      );
    return {
      varianId,
      produkId: r.product.id,
      produkNama: r.product.name,
      varianNama: r.name,
      gambar: galeriProduk(r.product.image, r.product.images)[0] ?? "/img/produk-1.svg",
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
  let voucher: Ringkasan["voucher"] = null;
  let voucherId: number | null = null;
  const kode = normalisasiKode(input.voucher);
  if (input.voucher.trim() !== "") {
    if (!kode)
      voucher = {
        kode: input.voucher.trim().slice(0, 32),
        ok: false,
        pesan: pesanVoucher("tidak-valid"),
      };
    else {
      const row = await c.voucher.findUnique({ where: { code: kode } });
      const h = hitungDiskon(row, subtotal, now);
      if (h.ok) {
        diskon = h.diskon;
        voucher = { kode, ok: true };
        voucherId = row!.id;
      } else voucher = { kode, ok: false, pesan: pesanVoucher(h.alasan, h.minSubtotal) };
    }
  }
  const total = hitungTotal(subtotal, ongkir, diskon);
  if (total > MAKS_TOTAL) masalah.push("Total pesanan terlalu besar.");
  if (voucher && !voucher.ok) masalah.push(voucher.pesan!);
  return {
    ringkasan: {
      baris,
      subtotal,
      ongkir,
      diskon,
      total,
      voucher,
      masalah,
      bisaPesan: valid.length === baris.length && baris.length > 0 && masalah.length === 0,
    },
    voucherId,
    setting,
  };
}

export class GagalPesan extends Error {
  constructor(
    public jenis: "stok" | "voucher",
    message: string,
  ) {
    super(message);
  }
}

export type Sukses = {
  ok: true;
  kode: string;
  subtotal: number;
  ongkir: number;
  diskon: number;
  total: number;
  baris: Array<{
    produkNama: string;
    varianNama: string;
    qty: number;
    harga: number;
    jumlah: number;
  }>;
  rekening: PengaturanToko["rekening"];
  catatanBayar: string;
  qris: string;
  waUrl: string;
};
export type Ditolak = {
  ok: false;
  jenis: "tidak-bisa" | "harga-berubah" | "stok" | "voucher";
  pesan: string;
  ringkasan?: Ringkasan;
};

const kodeBaru = async (c: Klien) => {
  for (let i = 0; i < 8; i++) {
    const kode = `TKO-${randomCode(8)}`;
    if (!(await c.order.findUnique({ where: { code: kode }, select: { id: true } }))) return kode;
  }
  throw new Error("Gagal membuat kode pesanan unik");
};

/**
 * Buat pesanan secara ATOMIK (satu transaksi): hitung ulang → bandingkan dengan total yang dilihat pembeli →
 * kunci stok dengan UPDATE bersyarat (stok tidak mungkin negatif walau ada pesanan bersamaan) →
 * pakai kuota voucher dengan UPDATE bersyarat → simpan pesanan + snapshot item. Gagal di mana pun → semuanya dibatalkan.
 */
export async function buatPesanan(
  input: PesananInput,
  now = new Date(),
): Promise<Sukses | Ditolak> {
  try {
    return await db().$transaction(async (tx) => {
      const { ringkasan: r, voucherId, setting } = await hitungRingkasan(tx, input, now);
      if (!r.bisaPesan)
        return {
          ok: false,
          jenis: "tidak-bisa",
          pesan: r.masalah[0] ?? "Pesanan tidak dapat diproses.",
          ringkasan: r,
        } satisfies Ditolak;
      if (r.total !== input.totalPreview)
        return {
          ok: false,
          jenis: "harga-berubah",
          pesan:
            "Harga atau ongkir berubah sejak Anda melihat ringkasan. Periksa total terbaru lalu kirim ulang.",
          ringkasan: r,
        } satisfies Ditolak;

      for (const b of r.baris) {
        // Atomik: hanya berhasil bila stok masih cukup SAAT INI.
        const u = await tx.variant.updateMany({
          where: { id: b.varianId, active: true, stock: { gte: b.qty } },
          data: { stock: { decrement: b.qty } },
        });
        if (u.count !== 1)
          throw new GagalPesan("stok", `${b.produkNama} (${b.varianNama}) stok tidak cukup.`);
      }
      if (voucherId !== null) {
        const n =
          await tx.$executeRaw`UPDATE "Voucher" SET used = used + 1 WHERE id = ${voucherId} AND active = 1 AND (quota IS NULL OR used < quota)`;
        if (n !== 1) throw new GagalPesan("voucher", "Kuota voucher baru saja habis.");
      }
      const kode = await kodeBaru(tx);
      await tx.order.create({
        data: {
          code: kode,
          customerName: input.nama,
          customerPhone: input.telepon,
          customerEmail: input.email,
          address: input.alamat,
          city: input.kota,
          note: input.catatan,
          subtotal: r.subtotal,
          shippingCost: r.ongkir,
          discount: r.diskon,
          total: r.total,
          voucherCode: r.voucher?.ok ? r.voucher.kode : "",
          items: {
            create: r.baris.map((b) => ({
              productId: b.produkId,
              variantId: b.varianId,
              productName: b.produkNama,
              variantName: b.varianNama,
              unitPrice: b.harga,
              qty: b.qty,
              lineTotal: b.jumlah,
            })),
          },
        },
      });
      const baris = r.baris.map((b) => ({
        produkNama: b.produkNama,
        varianNama: b.varianNama,
        qty: b.qty,
        harga: b.harga,
        jumlah: b.jumlah,
      }));
      return {
        ok: true,
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
          nama: input.nama,
          alamat: input.alamat,
          kota: input.kota,
          baris,
          subtotal: r.subtotal,
          ongkir: r.ongkir,
          diskon: r.diskon,
          voucher: r.voucher?.ok ? r.voucher.kode : "",
          total: r.total,
          catatan: input.catatan,
          rekening: setting.rekening,
        }),
      } satisfies Sukses;
    });
  } catch (e) {
    if (e instanceof GagalPesan)
      return {
        ok: false,
        jenis: e.jenis,
        pesan: `${e.message} Silakan periksa kembali keranjang Anda.`,
      };
    throw e;
  }
}
