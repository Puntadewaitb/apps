import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Container } from "@tpl/ui";
import { FormBerita } from "../../../../../components/admin/FormBerita";
import { db } from "../../../../../lib/db";
import { requireAdmin } from "../../../../../lib/session";
import { formatWaktuWib } from "../../../../../lib/waktu";
import { simpanBerita } from "../actions";

export const metadata: Metadata = { title: "Ubah Tulisan" };
export const dynamic = "force-dynamic";

export default async function BeritaUbah({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await requireAdmin("berita", `/admin/berita/${id}`);
  if (!/^\d{1,9}$/.test(id)) notFound();
  const p = await db().post.findUnique({ where: { id: Number(id) } });
  if (!p) notFound();
  return (
    <main id="isi" className="py-10">
      <Container className="max-w-3xl">
        <h1 className="mb-6 text-2xl font-bold text-fg">Ubah Tulisan</h1>
        <FormBerita
          action={simpanBerita}
          nilai={{
            id: p.id,
            title: p.title,
            kind: p.kind,
            excerpt: p.excerpt,
            body: p.body,
            image: p.image,
            published: p.published,
            publishedAt: formatWaktuWib(p.publishedAt),
          }}
        />
      </Container>
    </main>
  );
}
