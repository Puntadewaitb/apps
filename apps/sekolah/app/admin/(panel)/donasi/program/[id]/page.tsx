import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Container } from "@tpl/ui";
import { FormProgram } from "../../../../../../components/admin/FormProgram";
import { db } from "../../../../../../lib/db";
import { hariWib } from "../../../../../../lib/format";
import { requireAdmin } from "../../../../../../lib/session";
import { simpanProgram } from "../../actions";

export const metadata: Metadata = { title: "Ubah Program Donasi" };
export const dynamic = "force-dynamic";

export default async function ProgramUbah({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await requireAdmin("donasi", `/admin/donasi/program/${id}`);
  if (!/^\d{1,9}$/.test(id)) notFound();
  const p = await db().donationProgram.findUnique({ where: { id: Number(id) } });
  if (!p) notFound();
  return (
    <main id="isi" className="py-10">
      <Container className="max-w-2xl">
        <h1 className="mb-6 text-2xl font-bold text-fg">Ubah Program Donasi</h1>
        <FormProgram
          action={simpanProgram}
          nilai={{
            id: p.id,
            title: p.title,
            description: p.description,
            target: String(p.target),
            deadline: p.deadline ? hariWib(p.deadline) : "",
            active: p.active,
            image: p.image,
          }}
        />
      </Container>
    </main>
  );
}
