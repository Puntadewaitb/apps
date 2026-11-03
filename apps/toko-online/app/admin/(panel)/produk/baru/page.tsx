import type { Metadata } from "next";
import { Container } from "@tpl/ui";
import { FormProduk } from "../../../../../components/admin/FormProduk";
import { db } from "../../../../../lib/db";
import { requireAdmin } from "../../../../../lib/session";
import { simpanProduk } from "../actions";

export const metadata: Metadata = { title: "Produk Baru" };
export const dynamic = "force-dynamic";

export default async function ProdukBaru() {
  await requireAdmin("produk", "/admin/produk/baru");
  const kategori = await db().category.findMany({
    orderBy: [{ sort: "asc" }, { id: "asc" }],
    select: { id: true, name: true },
  });
  return (
    <main id="isi" className="py-10">
      <Container className="max-w-3xl">
        <h1 className="mb-6 text-2xl font-bold text-fg">Produk Baru</h1>
        <FormProduk
          action={simpanProduk}
          kategori={kategori}
          nilai={{
            name: "",
            categoryId: "",
            description: "",
            price: "",
            active: true,
            image: "",
            galeri: [],
            varian: [{ name: "Standar", sku: "", price: "", stock: "0", active: true }],
          }}
        />
      </Container>
    </main>
  );
}
