import { z } from "zod";
import { db } from "./db";
import { hargaVarian } from "./format";
import { MAKS_BARIS, type DetailBaris } from "./keranjang";
import { galeriProduk } from "./katalog";

/** Hanya ID varian yang diterima — jumlah/harga tidak ada di permintaan (tak ada yang bisa dimanipulasi). */
export const permintaanSchema = z
  .object({ ids: z.array(z.number().int().positive().max(2_147_483_647)).max(MAKS_BARIS) })
  .strict();

/**
 * Detail terkini dari DB untuk daftar ID varian. Produk/varian nonaktif atau tidak ada → `tersedia:false`
 * TANPA nama/harga (produk nonaktif tidak boleh bocor lewat endpoint ini).
 */
export async function detailKeranjang(ids: number[]): Promise<DetailBaris[]> {
  const unik = [...new Set(ids)];
  if (unik.length === 0) return [];
  const rows = await db().variant.findMany({
    where: { id: { in: unik }, active: true, product: { active: true } },
    select: {
      id: true,
      name: true,
      price: true,
      stock: true,
      product: { select: { name: true, slug: true, price: true, image: true, images: true } },
    },
  });
  const peta = new Map(rows.map((r) => [r.id, r]));
  return unik.map((id): DetailBaris => {
    const r = peta.get(id);
    if (!r) return { varianId: id, tersedia: false };
    return {
      varianId: id,
      tersedia: true,
      produkNama: r.product.name,
      slug: r.product.slug,
      varianNama: r.name,
      gambar: galeriProduk(r.product.image, r.product.images)[0] ?? "/img/produk-1.svg",
      harga: hargaVarian(r.product, r),
      stok: Math.max(0, r.stock),
    };
  });
}
