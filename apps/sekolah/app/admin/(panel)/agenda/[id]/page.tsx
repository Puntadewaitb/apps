import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Container } from "@tpl/ui";
import { FormAgenda } from "../../../../../components/admin/FormAgenda";
import { db } from "../../../../../lib/db";
import { requireAdmin } from "../../../../../lib/session";
import { formatWaktuWib } from "../../../../../lib/waktu";
import { simpanAgenda } from "../actions";

export const metadata: Metadata = { title: "Ubah Kegiatan" };
export const dynamic = "force-dynamic";

export default async function AgendaUbah({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await requireAdmin("agenda", `/admin/agenda/${id}`);
  if (!/^\d{1,9}$/.test(id)) notFound();
  const a = await db().agenda.findUnique({ where: { id: Number(id) } });
  if (!a) notFound();
  return (
    <main id="isi" className="py-10">
      <Container className="max-w-2xl">
        <h1 className="mb-6 text-2xl font-bold text-fg">Ubah Kegiatan</h1>
        <FormAgenda
          action={simpanAgenda}
          nilai={{
            id: a.id,
            title: a.title,
            description: a.description,
            location: a.location,
            startsAt: formatWaktuWib(a.startsAt),
            endsAt: formatWaktuWib(a.endsAt),
          }}
        />
      </Container>
    </main>
  );
}
