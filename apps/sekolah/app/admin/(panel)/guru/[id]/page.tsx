import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Container } from "@tpl/ui";
import { FormGuru } from "../../../../../components/admin/FormGuru";
import { db } from "../../../../../lib/db";
import { requireAdmin } from "../../../../../lib/session";
import { simpanGuru } from "../actions";

export const metadata: Metadata = { title: "Ubah Guru" };
export const dynamic = "force-dynamic";

export default async function GuruUbah({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await requireAdmin("guru", `/admin/guru/${id}`);
  if (!/^\d{1,9}$/.test(id)) notFound();
  const g = await db().teacher.findUnique({ where: { id: Number(id) } });
  if (!g) notFound();
  return (
    <main id="isi" className="py-10">
      <Container className="max-w-2xl">
        <h1 className="mb-6 text-2xl font-bold text-fg">Ubah Data Guru</h1>
        <FormGuru
          action={simpanGuru}
          nilai={{
            id: g.id,
            name: g.name,
            position: g.position,
            subject: g.subject,
            bio: g.bio,
            photo: g.photo,
            sort: g.sort,
            active: g.active,
          }}
        />
      </Container>
    </main>
  );
}
