import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Container } from "@tpl/ui";
import { FormKategori } from "../../../../../components/admin/FormKategori";
import { db } from "../../../../../lib/db";
import { requireAdmin } from "../../../../../lib/session";
import { simpanKategori } from "../actions";

export const metadata: Metadata = { title: "Ubah Kategori" };
export const dynamic = "force-dynamic";

export default async function KategoriUbah({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await requireAdmin("kategori", `/admin/kategori/${id}`);
  if (!/^\d{1,9}$/.test(id)) notFound();
  const k = await db().category.findUnique({ where: { id: Number(id) } });
  if (!k) notFound();
  return (
    <main id="isi" className="py-10">
      <Container className="max-w-2xl">
        <h1 className="mb-6 text-2xl font-bold text-fg">Ubah Kategori</h1>
        <FormKategori
          action={simpanKategori}
          nilai={{ id: k.id, name: k.name, sort: k.sort }}
          batal="/admin/kategori"
        />
      </Container>
    </main>
  );
}
