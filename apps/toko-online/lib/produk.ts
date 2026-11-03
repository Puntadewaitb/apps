import { db } from "./db";

/** Produk aktif terbaru (beranda). Produk nonaktif TIDAK pernah publik. */
export function produkTerbaru(take = 8) {
  return db().product.findMany({
    where: { active: true },
    orderBy: [{ createdAt: "desc" }, { id: "desc" }],
    take,
    select: {
      id: true,
      slug: true,
      name: true,
      price: true,
      image: true,
      category: { select: { name: true } },
      variants: { where: { active: true }, select: { price: true, stock: true } },
    },
  });
}
