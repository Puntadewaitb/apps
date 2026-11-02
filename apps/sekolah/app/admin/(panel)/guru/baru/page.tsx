import type { Metadata } from "next";
import { Container } from "@tpl/ui";
import { FormGuru } from "../../../../../components/admin/FormGuru";
import { db } from "../../../../../lib/db";
import { requireAdmin } from "../../../../../lib/session";
import { simpanGuru } from "../actions";

export const metadata: Metadata = { title: "Guru Baru" };
export const dynamic = "force-dynamic";

export default async function GuruBaru() {
  await requireAdmin("guru", "/admin/guru/baru");
  const maks = await db().teacher.aggregate({ _max: { sort: true } });
  return (
    <main id="isi" className="py-10">
      <Container className="max-w-2xl">
        <h1 className="mb-6 text-2xl font-bold text-fg">Guru Baru</h1>
        <FormGuru
          action={simpanGuru}
          nilai={{
            name: "",
            position: "",
            subject: "",
            bio: "",
            photo: "",
            sort: (maks._max.sort ?? 0) + 1,
            active: true,
          }}
        />
      </Container>
    </main>
  );
}
