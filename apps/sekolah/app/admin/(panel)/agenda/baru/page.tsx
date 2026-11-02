import type { Metadata } from "next";
import { Container } from "@tpl/ui";
import { FormAgenda } from "../../../../../components/admin/FormAgenda";
import { requireAdmin } from "../../../../../lib/session";
import { simpanAgenda } from "../actions";

export const metadata: Metadata = { title: "Kegiatan Baru" };
export const dynamic = "force-dynamic";

export default async function AgendaBaru() {
  await requireAdmin("agenda", "/admin/agenda/baru");
  return (
    <main id="isi" className="py-10">
      <Container className="max-w-2xl">
        <h1 className="mb-6 text-2xl font-bold text-fg">Kegiatan Baru</h1>
        <FormAgenda
          action={simpanAgenda}
          nilai={{ title: "", description: "", location: "", startsAt: "", endsAt: "" }}
        />
      </Container>
    </main>
  );
}
