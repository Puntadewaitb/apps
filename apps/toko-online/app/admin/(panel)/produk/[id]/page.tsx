import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Container } from "@tpl/ui";
import { FormProduk } from "../../../../../components/admin/FormProduk";
import { db } from "../../../../../lib/db";
import { galeriProduk } from "../../../../../lib/katalog";
import { requireAdmin } from "../../../../../lib/session";
import { simpanProduk } from "../actions";

export const metadata: Metadata = { title: "Ubah Produk" };
export const dynamic = "force-dynamic";

export default async function ProdukUbah({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await requireAdmin("produk", `/admin/produk/${id}`);
  if (!/^\d{1,9}$/.test(id)) notFound();
  const [p, kategori] = await Promise.all([
    db().product.findUnique({
      where: { id: Number(id) },
      include: { variants: { orderBy: { id: "asc" } } },
    }),
    db().category.findMany({
      orderBy: [{ sort: "asc" }, { id: "asc" }],
      select: { id: true, name: true },
    }),
  ]);
  if (!p) notFound();
  return (
    <main id="isi" className="py-10">
      <Container className="max-w-3xl">
        <h1 className="mb-6 text-2xl font-bold text-fg">Ubah Produk</h1>
        <FormProduk
          action={simpanProduk}
          kategori={kategori}
          nilai={{
            id: p.id,
            name: p.name,
            categoryId: String(p.categoryId),
            description: p.description,
            price: String(p.price),
            active: p.active,
            image: p.image,
            galeri: galeriProduk("/img/produk-placeholder.svg", p.images).slice(1),
            varian: p.variants.map((v) => ({
              id: v.id,
              name: v.name,
              sku: v.sku,
              price: v.price === null ? "" : String(v.price),
              stock: String(v.stock),
              active: v.active,
            })),
          }}
        />
      </Container>
    </main>
  );
}
